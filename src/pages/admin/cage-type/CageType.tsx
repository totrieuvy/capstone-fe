import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  message,
  Image,
  Upload,
  Spin,
  Select,
  type UploadFile,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import cageTypeService from "../../../services/CageTypeService";
import type { CageTypeResponse, CreateCageTypeReq } from "../../../services/CageTypeService";
import { getFormattedPrice } from "../../../utils/formatPrice";
import { storage } from "../../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import api from "../../../config/axios";
import "./CageType.scss";
import { toast } from "react-toastify";

const { Option } = Select;

interface CageTypeFormValues {
  id?: string;
  typeName: string;
  description: string;
  sizeDimensions: string;
  price: number;
  material: string;
  isActive: boolean;
  imageUrl: UploadFile[];
  iotDeviceId: string;
  section: string;
}

interface IotDevice {
  id: string;
  deviceType: string;
  name: string;
  rtspUrl: string;
  temperature: number | null;
  humidity: number | null;
  status: string;
}

const CageType: React.FC = () => {
  const [cageTypes, setCageTypes] = useState<CageTypeResponse[]>([]);
  const [iotDevices, setIotDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CageTypeResponse | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  // Fetch cage types
  const fetchCageTypes = async () => {
    setLoading(true);
    try {
      const data = await cageTypeService.getCageTypes();
      setCageTypes(data);
    } catch {
      message.error("Không thể tải danh sách loại chuồng");
    } finally {
      setLoading(false);
    }
  };

  // Fetch IoT devices
  const fetchIotDevices = async () => {
    try {
      const response = await api.get("/api/iot-devices");
      const data: IotDevice[] = response.data.data || [];
      const filtered = data.filter((device: IotDevice) => device.deviceType === "CAMERA");
      setIotDevices(filtered);
    } catch {
      message.error("Không thể tải danh sách thiết bị IoT");
    }
  };

  useEffect(() => {
    document.title = "Quản lý loại chuồng";
    fetchCageTypes();
    fetchIotDevices();
  }, []);

  // Handle create/update
  const handleSubmit = async (values: CageTypeFormValues) => {
    setSubmitLoading(true);
    try {
      let imageUrl = "";

      const newFile = values.imageUrl?.[0]?.originFileObj as File | undefined;
      if (newFile) {
        const storageRef = ref(storage, `cage-types/${Date.now()}_${newFile.name}`);
        await uploadBytes(storageRef, newFile);
        imageUrl = await getDownloadURL(storageRef);
      } else {
        if (isUpdate && editingRecord?.imageUrl) {
          imageUrl = editingRecord.imageUrl;
        } else if (!isUpdate) {
          message.error("Vui lòng chọn ảnh cho loại chuồng!");
          setSubmitLoading(false);
          return;
        }
      }

      const payload: CreateCageTypeReq = {
        typeName: values.typeName,
        description: values.description,
        sizeDimensions: values.sizeDimensions,
        price: values.price,
        material: values.material,
        isActive: values.isActive,
        imageUrl: imageUrl,
        iotDeviceId: values.iotDeviceId,
        section: values.section,
      };

      if (isUpdate && values.id) {
        await cageTypeService.updateCageType(values.id, payload);
        toast.success("Cập nhật loại chuồng thành công!");
      } else {
        await cageTypeService.createCageType(payload);
        toast.success("Thêm loại chuồng thành công!");
      }

      fetchCageTypes();
      handleCancel();
    } catch (error) {
      message.error("Thao tác thất bại: " + String(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsUpdate(false);
    setEditingRecord(null);
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
  };

  const handleOpenEdit = (record: CageTypeResponse) => {
    setIsUpdate(true);
    setEditingRecord(record);
    setIsModalVisible(true);
    form.setFieldsValue({
      ...record,
      imageUrl: record.imageUrl
        ? [
            {
              uid: "-1",
              name: "image.png",
              status: "done",
              url: record.imageUrl,
            },
          ]
        : [],
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
    setIsUpdate(false);
  };

  const filteredData = cageTypes.filter((item) =>
    Object.values(item).some((val) => String(val).toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns: ColumnsType<CageTypeResponse> = [
    {
      title: "Hình ảnh",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 100,
      render: (imageUrl: string) => (
        <Image
          src={imageUrl}
          alt="Cage"
          width={60}
          height={60}
          style={{ objectFit: "cover", borderRadius: "8px" }}
          fallback="https://via.placeholder.com/60"
        />
      ),
    },
    {
      title: "Tên loại",
      dataIndex: "typeName",
      key: "typeName",
      sorter: (a, b) => a.typeName.localeCompare(b.typeName),
    },
    {
      title: "Kích thước",
      dataIndex: "sizeDimensions",
      key: "sizeDimensions",
    },
    {
      title: "Chất liệu",
      dataIndex: "material",
      key: "material",
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price: number) => getFormattedPrice(price),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? "#52c41a" : "#ff4d4f" }}>{isActive ? "Hoạt động" : "Không hoạt động"}</span>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleOpenEdit(record)}>
            Cập nhật
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="CageType">
      <h1>Quản lý loại chuồng</h1>

      <div className="search-box">
        <Space style={{ marginBottom: 16, width: "100%" }}>
          <Input
            placeholder="Tìm kiếm loại chuồng..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd} style={{ marginLeft: "auto" }}>
            Thêm loại chuồng mới
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} loại chuồng`,
        }}
      />

      <Modal
        title={isUpdate ? "Cập nhật loại chuồng" : "Thêm loại chuồng mới"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Spin spinning={submitLoading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ isActive: true }}>
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="typeName"
              label="Tên loại chuồng"
              rules={[{ required: true, message: "Vui lòng nhập tên loại chuồng!" }]}
            >
              <Input placeholder="Nhập tên loại chuồng" />
            </Form.Item>

            <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}>
              <Input.TextArea rows={3} placeholder="Nhập mô tả loại chuồng" />
            </Form.Item>

            <Form.Item
              name="sizeDimensions"
              label="Kích thước"
              rules={[{ required: true, message: "Vui lòng nhập kích thước!" }]}
            >
              <Input placeholder="VD: 60x40x40 cm" />
            </Form.Item>

            <Form.Item
              name="material"
              label="Chất liệu"
              rules={[{ required: true, message: "Vui lòng nhập chất liệu!" }]}
            >
              <Input placeholder="VD: Nhựa mica" />
            </Form.Item>

            <Form.Item
              name="price"
              label="Giá (VND)"
              rules={[
                { required: true, message: "Vui lòng nhập giá!" },
                {
                  type: "number",
                  min: 1,
                  max: 999999999,
                  message: "Giá phải từ 1 đến 999,999,999!",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={999999999}
                step={1000}
                style={{ width: "100%" }}
                placeholder="Nhập giá"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value: string | undefined): number => {
                  if (!value) return 0;
                  const cleaned = value.replace(/\$\s?|(,*)/g, "");
                  const parsed = parseFloat(cleaned);
                  return isNaN(parsed) ? 0 : parsed;
                }}
                addonAfter="đ"
              />
            </Form.Item>

            <Form.Item
              name="iotDeviceId"
              label="Thiết bị IoT (Camera)"
              rules={[{ required: true, message: "Vui lòng chọn thiết bị IoT!" }]}
            >
              <Select placeholder="Chọn thiết bị IoT">
                {iotDevices.map((device) => (
                  <Option key={device.id} value={device.id}>
                    {device.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="section"
              label="Khu vực (Section)"
              rules={[{ required: true, message: "Vui lòng nhập khu vực!" }]}
            >
              <Input placeholder="VD: A1, B2, C3..." />
            </Form.Item>

            <Form.Item
              label="Hình ảnh"
              name="imageUrl"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              rules={[{ required: !isUpdate, message: "Vui lòng chọn ảnh!" }]}
            >
              <Upload listType="picture-card" beforeUpload={() => false} maxCount={1} accept="image/*">
                <div>Chọn ảnh</div>
              </Upload>
            </Form.Item>

            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {isUpdate ? "Cập nhật" : "Thêm loại chuồng"}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default CageType;
