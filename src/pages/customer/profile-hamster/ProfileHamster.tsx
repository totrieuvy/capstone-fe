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
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";
import api from "../../../config/axios";
import "./ProfileHamster.scss";

const { Option } = Select;

interface HamsterProfile {
  id: string;
  name: string;
  color: string;
  dob: string;
  species: string;
  gender: "Male" | "Female";
  weight: number;
  profilePicture: string;
  healthNote: string;
}

interface Species {
  id: string;
  speciesName: string;
}

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

function ProfileHamster() {
  const [profiles, setProfiles] = useState<HamsterProfile[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const fetchProfiles = async () => {
    try {
      const { data } = await api.get("/api/hamster/profile-list");
      if (data.code === 200) setProfiles(data.data);
    } catch {
      message.error("Không thể tải danh sách hamster");
    }
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

  const handleFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      const fileObj = values.profilePicture?.[0]?.originFileObj as File;
      if (!fileObj) {
        message.error("Chưa chọn ảnh");
        return;
      }

      const formData = new FormData();
      formData.append("file", fileObj);
      const { data: uploadRes } = await api.post("/api/file/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (uploadRes.code !== 200) throw new Error("Upload failed");

      const payload = {
        name: values.name,
        color: values.color,
        dob: dayjs(values.dob).format("DD-MM-YYYY"),
        gender: values.gender,
        weight: parseFloat(values.weight),
        speciesId: values.speciesId,
        profilePicture: uploadRes.data,
        healthNote: values.healthNote?.trim() || "Không có",
      };

      const { data } = await api.post("/api/hamster", payload);
      if (data.code === 200) {
        message.success("Tạo hồ sơ hamster thành công");
        setVisible(false);
        form.resetFields();
        fetchProfiles();
      } else {
        message.error("Không thể tạo hồ sơ hamster");
      }
    } catch {
      message.error("Lỗi khi tạo hồ sơ hamster");
    } finally {
      setLoading(false);
      setVisible(false);
      form.resetFields();
      fetchProfiles();
    }
  };

  return (
    <div className="hamster-container">
      <div className="hamster__header">
        <h2>🐹 Hồ sơ Hamster</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setVisible(true)}>
          Thêm hồ sơ
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {profiles.length === 0 ? (
          <Col span={24}>
            <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>🐹 Chưa có hồ sơ hamster nào</div>
          </Col>
        ) : (
          profiles.map((hamster) => (
            <Col xs={24} sm={12} md={8} lg={6} key={hamster.id}>
              <Badge.Ribbon text={hamster.species} color="volcano">
                <Card
                  hoverable
                  className="hamster__card"
                  cover={<img src={hamster.profilePicture} alt={hamster.name} className="hamster__card-img" />}
                >
                  <div className="hamster__card-name">{hamster.name}</div>
                  <div className="hamster__info">
                    <p>
                      <b>Màu sắc:</b> {hamster.color}
                    </p>
                    <p>
                      <b>Ngày sinh:</b> {hamster.dob}
                    </p>
                    <p>
                      <b>Giới tính:</b> {hamster.gender}
                    </p>
                    <p>
                      <b>Cân nặng:</b> {hamster.weight} g
                    </p>
                    <p>
                      <b>Ghi chú:</b> {hamster.healthNote || "Không có"}
                    </p>
                  </div>
                </Card>
              </Badge.Ribbon>
            </Col>
          ))
        )}
      </Row>

      <Modal title="Tạo hồ sơ Hamster" open={visible} onCancel={() => setVisible(false)} footer={null}>
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item label="Tên" name="name" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
              <Input placeholder="Tên hamster" />
            </Form.Item>
            <Form.Item label="Màu sắc" name="color" rules={[{ required: true, message: "Vui lòng nhập màu" }]}>
              <Input placeholder="Màu sắc" />
            </Form.Item>
            <Form.Item label="Ngày sinh" name="dob" rules={[{ required: true, message: "Vui lòng chọn ngày" }]}>
              <DatePicker
                format="DD-MM-YYYY"
                style={{ width: "100%" }}
                disabledDate={(current) => current && current > dayjs().endOf("day")}
              />
            </Form.Item>

            <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: "Chọn giới tính" }]}>
              <Radio.Group>
                <Radio value="Male">Đực</Radio>
                <Radio value="Female">Cái</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="Cân nặng (gram)" name="weight" rules={[{ required: true, message: "Nhập cân nặng" }]}>
              <Input type="number" placeholder="Ví dụ: 120" />
            </Form.Item>
            <Form.Item label="Loài" name="speciesId" rules={[{ required: true, message: "Chọn loài hamster" }]}>
              <Select placeholder="Chọn loài">
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
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              rules={[{ required: true, message: "Vui lòng chọn ảnh" }]}
            >
              <Upload listType="picture-card" beforeUpload={() => false} maxCount={1} accept="image/*">
                <div>Chọn ảnh</div>
              </Upload>
            </Form.Item>
            <Form.Item
              label="Ghi chú sức khoẻ (bình thường thì nhập `Không có`)`"
              name="healthNote"
              rules={[{ required: true, message: "Vui lòng nhập ghi chú" }]}
            >
              <Input.TextArea placeholder="Ví dụ: Đã tiêm đầy đủ" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Tạo hồ sơ
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}

export default ProfileHamster;
