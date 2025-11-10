import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Radio,
  Upload,
  message,
  Row,
  Col,
  Spin,
  Badge,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";
import api from "../../../config/axios";
import "./ProfileHamster.scss";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../config/firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // ⬅️ thêm import này
import { EyeOutlined } from "@ant-design/icons"; // ⬅️ thêm icon xem lịch sử
import type { UploadChangeParam } from "antd/es/upload";

const { Option } = Select;

interface HamsterProfile {
  id: string;
  name: string;
  color: string;
  dob: string;
  species: string;
  speciesId: string;
  gender: "Male" | "Female";
  weight: number;
  profilePicture: string;
  healthNote: string;
}

interface Species {
  id: string;
  speciesName: string;
}

// Giữ nguyên interface này cho cả 2 form
interface FormValues {
  name: string;
  color: string;
  dob: dayjs.Dayjs;
  gender: "Male" | "Female";
  weight: string;
  speciesId: string;
  profilePicture: UploadFile[];
  healthNote: string;
}

type UpdatePayload = {
  name: string;
  color: string;
  dob: string;
  gender: "Male" | "Female";
  weight: number;
  healthNote: string;
  profilePicture?: string;
};

function ProfileHamster() {
  const [profiles, setProfiles] = useState<HamsterProfile[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<HamsterProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [createForm] = Form.useForm<FormValues>();
  const [updateForm] = Form.useForm<FormValues>();
  const navigate = useNavigate();

  const fetchProfiles = async () => {
    setFetchLoading(true);
    try {
      const { data } = await api.get("/api/hamster/profile-list");
      if (data.code === 200) setProfiles(data.data);
    } catch {
      message.error("Không thể tải danh sách hamster");
    } finally {
      setFetchLoading(false);
    }
  };

  // --- Upload ảnh lên Firebase Storage ---
  const uploadImageToFirebase = async (file: File): Promise<string> => {
    const imageRef = ref(storage, `images/${Date.now()}_${file.name}`);
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  };

  const fetchSpecies = async () => {
    try {
      const { data } = await api.get("/api/species");
      if (data.code === 200) setSpecies(data.data);
    } catch {
      message.error("Không thể tải danh sách loài");
    }
  };

  useEffect(() => {
    document.title = "Hồ sơ Hamster";
    fetchProfiles();
    fetchSpecies();
  }, []);

  const showUpdateModal = (hamster: HamsterProfile) => {
    setEditingProfile(hamster);
    updateForm.setFieldsValue({
      ...hamster,
      dob: dayjs(hamster.dob, "DD-MM-YYYY"),
      weight: String(hamster.weight),
      profilePicture: [
        {
          uid: "-1",
          name: "image.png",
          status: "done",
          url: hamster.profilePicture,
        },
      ],
    });
    setUpdateModalVisible(true);
  };

  const handleCreateFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      const fileObj = values.profilePicture?.[0]?.originFileObj as File;
      if (!fileObj) {
        message.error("Chưa chọn ảnh");
        setLoading(false);
        return;
      }

      // 🚀 Upload ảnh lên Firebase
      const downloadURL = await uploadImageToFirebase(fileObj);

      const payload = {
        name: values.name,
        color: values.color,
        dob: dayjs(values.dob).format("DD-MM-YYYY"),
        gender: values.gender,
        weight: parseFloat(values.weight),
        speciesId: values.speciesId,
        profilePicture: downloadURL, // ✅ link Firebase
        healthNote: values.healthNote?.trim() || "Không có",
      };

      const { data } = await api.post("/api/hamster", payload);
      if (data.code === 200) {
        toast.success("Tạo hồ sơ hamster thành công");
        setCreateModalVisible(false);
        createForm.resetFields();
        fetchProfiles();
      } else {
        toast.error(data.message || "Không thể tạo hồ sơ hamster");
      }
    } catch (error) {
      toast.error("Lỗi khi tạo hồ sơ hamster" + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFinish = async (values: FormValues) => {
    if (!editingProfile) return;
    setLoading(true);

    try {
      // 1. Tạo payload cơ bản không chứa ảnh
      const payload: UpdatePayload = {
        name: values.name,
        color: values.color,
        dob: dayjs(values.dob).format("DD-MM-YYYY"),
        gender: values.gender,
        weight: parseFloat(values.weight),
        healthNote: values.healthNote?.trim() || "Không có",
      };

      // 2. Kiểm tra xem có file ảnh mới không
      const newFile = values.profilePicture?.[0]?.originFileObj as File | undefined;
      if (newFile) {
        // 3. Nếu có, tải ảnh lên và thêm vào payload
        const formData = new FormData();
        formData.append("file", newFile);
        const { data: uploadRes } = await api.post("/api/file/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (uploadRes.code === 200) {
          payload.profilePicture = uploadRes.data;
        } else {
          throw new Error("Upload ảnh mới thất bại");
        }
      }
      // Nếu không có file mới, payload sẽ không có trường `profilePicture`

      // 4. Gửi request PUT
      const { data } = await api.put(`/api/hamster/${editingProfile.id}`, payload);
      if (data.code === 200) {
        toast.success("Cập nhật hồ sơ thành công");
        setUpdateModalVisible(false);
        setEditingProfile(null);
        fetchProfiles();
      } else {
        toast.error(data.message || "Không thể cập nhật hồ sơ");
      }
    } catch {
      toast.error("Lỗi khi cập nhật hồ sơ hamster");
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e: UploadChangeParam<UploadFile>) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  return (
    <div className="hamster-container">
      <Spin spinning={fetchLoading} size="large" tip="Đang tải dữ liệu...">
        <div className="hamster__header">
          <h2 style={{ color: "#ff6f61", textShadow: "1px 1px 2px rgba(0, 0, 0, 0.2)" }}>🐹 Hồ sơ Hamster</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            style={{
              background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
              border: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            }}
          >
            Thêm hồ sơ
          </Button>
        </div>

        <Row gutter={[24, 24]}>
          {profiles.length === 0 && !fetchLoading ? (
            <Col span={24}>
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#ff6f61",
                  fontSize: "18px",
                  fontWeight: 500,
                }}
              >
                🐹 Chưa có hồ sơ hamster nào
              </div>
            </Col>
          ) : (
            profiles.map((hamster) => (
              <Col xs={24} sm={12} md={8} lg={6} key={hamster.id}>
                <Badge.Ribbon text={hamster.species} color="#ff6f61">
                  <Card
                    hoverable
                    className="hamster__card"
                    cover={<img src={hamster.profilePicture} alt={hamster.name} className="hamster__card-img" />}
                    style={{ animation: "fadeIn 0.5s ease-in-out" }}
                    actions={[
                      <EditOutlined key="edit" onClick={() => showUpdateModal(hamster)} style={{ color: "#ff6f61" }} />,
                      <EyeOutlined
                        key="view"
                        onClick={() => navigate(`/profile/your-hamster/medical/${hamster.id}`)}
                        style={{ color: "#ffcc5c" }}
                      />,
                    ]}
                  >
                    <div className="hamster__card-name">{hamster.name}</div>
                    <div className="hamster__info">
                      <p>
                        <b style={{ color: "#ff6f61" }}>Màu sắc:</b> {hamster.color}
                      </p>
                      <p>
                        <b style={{ color: "#ff6f61" }}>Ngày sinh:</b> {hamster.dob}
                      </p>
                      <p>
                        <b style={{ color: "#ff6f61" }}>Giới tính:</b> {hamster.gender}
                      </p>
                      <p>
                        <b style={{ color: "#ff6f61" }}>Cân nặng:</b> {hamster.weight} g
                      </p>
                      <p>
                        <b style={{ color: "#ff6f61" }}>Ghi chú:</b> {hamster.healthNote || "Không có"}
                      </p>
                    </div>
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))
          )}
        </Row>
      </Spin>

      {/* Create Modal */}
      <Modal
        title="Tạo hồ sơ Hamster"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        destroyOnClose
        style={{ borderRadius: 12 }}
        bodyStyle={{
          background: "linear-gradient(135deg, #fff5e6, #ffe6cc)",
          padding: 24,
        }}
      >
        <Spin spinning={loading}>
          <Form form={createForm} layout="vertical" onFinish={handleCreateFinish}>
            <Form.Item label="Tên" name="name" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
              <Input placeholder="Tên hamster" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label="Màu sắc" name="color" rules={[{ required: true, message: "Vui lòng nhập màu" }]}>
              <Input placeholder="Màu sắc" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label="Ngày sinh" name="dob" rules={[{ required: true, message: "Vui lòng chọn ngày" }]}>
              <DatePicker
                format="DD-MM-YYYY"
                style={{ width: "100%", borderRadius: 8 }}
                disabledDate={(current) =>
                  !!current && current.startOf("day").valueOf() >= dayjs().startOf("day").valueOf()
                }
              />
            </Form.Item>
            <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: "Chọn giới tính" }]}>
              <Radio.Group style={{ display: "flex", gap: 16 }}>
                <Radio value="Male" style={{ color: "#ff6f61" }}>
                  Đực
                </Radio>
                <Radio value="Female" style={{ color: "#ff6f61" }}>
                  Cái
                </Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="Cân nặng (gram)" name="weight" rules={[{ required: true, message: "Nhập cân nặng" }]}>
              <Input type="number" placeholder="Ví dụ: 120" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label="Loài" name="speciesId" rules={[{ required: true, message: "Chọn loài hamster" }]}>
              <Select placeholder="Chọn loài" style={{ borderRadius: 8 }}>
                {species.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.speciesName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Ảnh đại diện"
              name="profilePicture"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[{ required: true, message: "Vui lòng chọn ảnh" }]}
            >
              <Upload listType="picture-card" beforeUpload={() => false} maxCount={1} accept="image/*">
                <div style={{ color: "#ff6f61" }}>Chọn ảnh</div>
              </Upload>
            </Form.Item>
            <Form.Item label="Ghi chú sức khoẻ" name="healthNote" initialValue="Không có">
              <Input.TextArea placeholder="Ví dụ: Đã tiêm đầy đủ" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
                  border: "none",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                }}
              >
                Tạo hồ sơ
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* Update Modal */}
      <Modal
        title="Cập nhật hồ sơ Hamster"
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
        destroyOnClose
        style={{ borderRadius: 12 }}
        bodyStyle={{
          background: "linear-gradient(135deg, #fff5e6, #ffe6cc)",
          padding: 24,
        }}
      >
        <Spin spinning={loading}>
          <Form form={updateForm} layout="vertical" onFinish={handleUpdateFinish}>
            <Form.Item label="Tên" name="name" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
              <Input placeholder="Tên hamster" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label="Màu sắc" name="color" rules={[{ required: true, message: "Vui lòng nhập màu" }]}>
              <Input placeholder="Màu sắc" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label="Ngày sinh" name="dob" rules={[{ required: true, message: "Vui lòng chọn ngày" }]}>
              <DatePicker
                format="DD-MM-YYYY"
                style={{ width: "100%", borderRadius: 8 }}
                disabledDate={(current) => current && current > dayjs().endOf("day")}
              />
            </Form.Item>
            <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: "Chọn giới tính" }]}>
              <Radio.Group style={{ display: "flex", gap: 16 }}>
                <Radio value="Male" style={{ color: "#ff6f61" }}>
                  Đực
                </Radio>
                <Radio value="Female" style={{ color: "#ff6f61" }}>
                  Cái
                </Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="Cân nặng (gram)" name="weight" rules={[{ required: true, message: "Nhập cân nặng" }]}>
              <Input type="number" placeholder="Ví dụ: 120" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label="Loài (không thể thay đổi)" name="speciesId">
              <Select placeholder="Chọn loài" style={{ borderRadius: 8 }} disabled>
                {species.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.speciesName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Ảnh đại diện (chọn ảnh mới để thay đổi)"
              name="profilePicture"
              valuePropName="fileList"
              getValueFromEvent={normFile}
            >
              <Upload listType="picture-card" beforeUpload={() => false} maxCount={1} accept="image/*">
                <div style={{ color: "#ff6f61" }}>Đổi ảnh</div>
              </Upload>
            </Form.Item>
            <Form.Item label="Ghi chú sức khoẻ" name="healthNote">
              <Input.TextArea placeholder="Ví dụ: Đã tiêm đầy đủ" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
                  border: "none",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                }}
              >
                Cập nhật
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}

export default ProfileHamster;
