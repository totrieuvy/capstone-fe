import { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  InputNumber,
  Tag,
  Popconfirm,
  Spin,
  message,
  Space,
  Divider,
  Typography,
  Card,
  Switch,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import "./ManageGroomingService.scss";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const { Search } = Input;
const { Text, Title } = Typography;

interface Price {
  priceId?: string;
  speciesId: string;
  speciesName?: string;
  price: number;
  priceAfter?: number; // Thêm trường priceAfter để dùng trong Form
}

interface GroomingService {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
  prices: Price[];
}

interface Species {
  id: string;
  speciesName: string;
}

interface ServiceDetailResponse {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  prices: {
    priceId: string;
    speciesId: string;
    speciesName: string;
    price: number;
  }[];
  displayPrice?: number;
}

interface ServiceFormValues {
  id?: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  prices: Price[];
  isActive?: boolean; // Thêm isActive vào FormValues
}

function ManageGroomingService() {
  const [services, setServices] = useState<GroomingService[]>([]);
  const [filteredServices, setFilteredServices] = useState<GroomingService[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [form] = Form.useForm<ServiceFormValues>();
  const [serviceDetail, setServiceDetail] = useState<ServiceDetailResponse | null>(null);

  const fetchServices = async (): Promise<void> => {
    try {
      const response = await api.get("/api/services/type/GROOMING");
      setServices(response.data.data);
      setFilteredServices(response.data.data);
    } catch {
      toast.error("Lấy danh sách dịch vụ thất bại!");
    }
  };

  const fetchServiceDetail = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.get<{ data: ServiceDetailResponse }>(`/api/services/${id}`);
      const data = response.data.data;
      setServiceDetail(data);

      // Tạo map giá hiện tại
      const currentPricesMap = new Map(data.prices.map((p) => [p.speciesId, p]));

      // Tạo array prices cho form bằng cách lặp qua species và gán giá hiện tại (nếu có)
      const formPrices = species.map((sp) => {
        const existingPrice = currentPricesMap.get(sp.id);
        return {
          // Nếu có giá cũ, dùng priceId, nếu không thì để undefined (khi người dùng thêm loài mới)
          priceId: existingPrice?.priceId,
          speciesId: sp.id,
          priceAfter: existingPrice?.price || 0,
        };
      });

      form.setFieldsValue({
        id: data.id,
        serviceName: data.serviceName,
        description: data.description,
        durationMinutes: data.durationMinutes,
        prices: formPrices,
        isActive: data.isActive, // Load trạng thái hoạt động
      });

      setIsUpdate(true);
      setIsModalVisible(true);
    } catch {
      toast.error("Lấy chi tiết dịch vụ thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecies = async (): Promise<void> => {
    try {
      const response = await api.get("/api/species");
      if (response.data.code === 200) setSpecies(response.data.data);
    } catch {
      toast.error("Lấy danh sách loài thất bại!");
    }
  };

  useEffect(() => {
    document.title = "Quản lí dịch vụ Grooming";
    fetchServices();
    fetchSpecies();
  }, []);

  const handleSearch = (value: string): void => {
    const filtered = services.filter((item) => item.serviceName.toLowerCase().includes(value.toLowerCase()));
    setFilteredServices(filtered);
  };

  const handleSubmit = async (values: ServiceFormValues): Promise<void> => {
    setLoading(true);
    try {
      const payload = {
        serviceType: "GROOMING",
        serviceName: values.serviceName,
        description: values.description,
        durationMinutes: values.durationMinutes,

        prices: values.prices
          .filter((p) => (p.priceAfter ?? 0) > 0)
          .map((p) => ({
            priceId: p.priceId,
            speciesId: p.speciesId,
            price: p.priceAfter,
          })),

        isActive: values.isActive ?? true,
      };

      if (isUpdate && values.id) {
        await api.put(`/api/services/grooming-medical/${values.id}`, payload);
        toast.success("Cập nhật dịch vụ thành công!");
      } else {
        await api.post("/api/services/grooming-medical", payload);
        toast.success("Thêm dịch vụ thành công!");
      }

      fetchServices();
      handleCancel();
    } catch (error) {
      message.error("Thao tác thất bại!");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    setIsModalVisible(false);
    form.resetFields();
    setIsUpdate(false);
    setServiceDetail(null);
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/services/${id}`);
      toast.success("Xóa dịch vụ thành công!");
      fetchServices();
    } catch {
      toast.error("Xóa thất bại!");
    }
  };

  const columns: TableColumnsType<GroomingService> = [
    {
      title: "Tên dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      sorter: (a, b) => a.serviceName.localeCompare(b.serviceName),
      width: 250,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 350,
    },
    {
      title: "Thời lượng (phút)",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
      align: "center",
      width: 150,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Không hoạt động"}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      width: 150,
      render: (_, record) => (
        <Space className="action-buttons">
          <Button type="primary" icon={<FiEdit />} size="small" onClick={() => fetchServiceDetail(record.id)} />
          <Popconfirm
            title="Xóa dịch vụ?"
            description={`Bạn có chắc muốn xóa dịch vụ "${record.serviceName}"?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Button type="primary" danger icon={<FiTrash2 />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="ManageGroomingService">
      <h1>Quản lí dịch vụ làm đẹp</h1>

      <div className="toolbar">
        <Search
          placeholder="Tìm kiếm dịch vụ..."
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setIsUpdate(false);
            setIsModalVisible(true);
            form.resetFields();
            // Thiết lập giá trị mặc định cho Create
            form.setFieldsValue({
              prices: species.map((sp) => ({ speciesId: sp.id, priceAfter: 0 })),
              isActive: true,
            });
          }}
        >
          Thêm dịch vụ
        </Button>
      </div>

      <Table
        dataSource={filteredServices}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        open={isModalVisible}
        title={isUpdate ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ isActive: true }}>
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              label="Tên dịch vụ"
              name="serviceName"
              rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ!" }]}
            >
              <Input placeholder="Nhập tên dịch vụ" />
            </Form.Item>

            <Form.Item label="Mô tả" name="description" rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}>
              <Input.TextArea rows={3} placeholder="Nhập mô tả dịch vụ" />
            </Form.Item>

            <Form.Item
              label="Thời lượng (phút)"
              name="durationMinutes"
              rules={[{ required: true, message: "Vui lòng nhập thời lượng!" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} addonAfter="phút" />
            </Form.Item>

            <Divider />
            <Title level={5}>Giá dịch vụ theo loài hamster</Title>

            <Card size="small" style={{ background: "#f9f9f9" }}>
              {species.map((spec, index) => (
                <div key={spec.id} className="combo-price-row">
                  {/* Hidden speciesId: nằm ngoài flex */}
                  <Form.Item name={["prices", index, "speciesId"]} hidden initialValue={spec.id}>
                    <Input />
                  </Form.Item>

                  {/* Tên loài */}
                  <Text strong className="combo-species-name">
                    {spec.speciesName}
                  </Text>

                  {/* Input giá sau giảm (không dùng label để không phá layout) */}
                  <Form.Item
                    name={["prices", index, "priceAfter"]}
                    rules={[
                      { required: true, message: `Vui lòng nhập giá sau giảm cho ${spec.speciesName}!` },
                      { type: "number", min: 0, message: "Giá không thể âm!" },
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      step={1000}
                      style={{ width: 200 }}
                      placeholder="Nhập giá"
                      addonAfter="VND"
                      formatter={(value: string | undefined) =>
                        value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0"
                      }
                      parser={(value: string | undefined) => (value ? value.replace(/,/g, "") : "")}
                    />
                  </Form.Item>
                </div>
              ))}
            </Card>

            {/* Hiển thị giá hiển thị chung (chỉ trong chế độ Update) */}
            {isUpdate && serviceDetail && (
              <Text
                type="secondary"
                style={{ fontSize: "12px", marginTop: "8px", display: "block", textAlign: "right" }}
              >
                Giá hiển thị trung bình: {new Intl.NumberFormat("vi-VN").format(serviceDetail.displayPrice || 0)} VND
              </Text>
            )}
            <Divider />

            {/* Active status field - Show in both Create and Update */}
            <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {isUpdate ? "Cập nhật" : "Thêm dịch vụ"}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}

export default ManageGroomingService;
