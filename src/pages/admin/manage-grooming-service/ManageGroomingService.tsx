import { useEffect, useState } from "react";
import { Table, Input, Button, Modal, Form, InputNumber, Select, Tag, Popconfirm, Spin, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import "./ManageGroomingService.scss";
import { Link } from "react-router-dom";

const { Search } = Input;
const { Option } = Select;

interface SpeciesPrice {
  speciesId: string;
  speciesName?: string;
  price: number;
}

interface GroomingService {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
  speciesPrices: SpeciesPrice[];
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
}

interface ServiceFormValues {
  id?: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  speciesPrices: { priceId?: string; speciesId: string; price: number }[];
}

function ManageGroomingService() {
  const [services, setServices] = useState<GroomingService[]>([]);
  const [filteredServices, setFilteredServices] = useState<GroomingService[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [form] = Form.useForm<ServiceFormValues>();

  // 📦 Lấy danh sách dịch vụ grooming
  const fetchServices = async (): Promise<void> => {
    try {
      const response = await api.get("/api/services/type/GROOMING");
      setServices(response.data.data);
      setFilteredServices(response.data.data);
    } catch (error) {
      toast.error("Lấy danh sách dịch vụ thất bại!" + error);
    }
  };

  const fetchServiceDetail = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.get<{ data: ServiceDetailResponse }>(`/api/services/${id}`);
      const data = response.data.data;

      const speciesPrices = data.prices.map((p) => ({
        priceId: p.priceId,
        speciesId: p.speciesId,
        price: p.price,
      }));

      form.setFieldsValue({
        id: data.id,
        serviceName: data.serviceName,
        description: data.description,
        durationMinutes: data.durationMinutes,
        speciesPrices,
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
      if (response.data.code === 200) {
        setSpecies(response.data.data);
      }
    } catch (error) {
      toast.error("Lấy danh sách loài thất bại!" + error);
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
        speciesPrices: values.speciesPrices.map((sp) => ({
          priceId: sp.priceId,
          speciesId: sp.speciesId,
          price: sp.price,
        })),
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
    } catch {
      message.error("Thao tác thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleOpenAdd = (): void => {
    setIsUpdate(false);
    setIsModalVisible(true);
    form.resetFields();
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
      render: (text: string, record: GroomingService) => (
        <Link
          to={`/ADMIN/quan-li-dich-vu-grooming/grooming-le/${record.id}`}
          style={{ color: "#1890ff", fontWeight: "500" }}
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Thời lượng (phút)",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Không hoạt động"}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <>
          <Button type="primary" style={{ marginRight: 8 }} onClick={() => fetchServiceDetail(record.id)}>
            Cập nhật
          </Button>

          <Popconfirm
            title="Xóa dịch vụ?"
            description="Bạn có chắc muốn xóa dịch vụ này?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div className="ManageGroomingService">
      <h1>Quản lí dịch vụ Grooming</h1>

      <div className="toolbar">
        <Search
          placeholder="Tìm kiếm dịch vụ..."
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
          Thêm dịch vụ
        </Button>
      </div>

      <Table dataSource={filteredServices} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />

      <Modal
        open={isModalVisible}
        title={isUpdate ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}
        onCancel={handleCancel}
        footer={null}
      >
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

            <Form.List name="speciesPrices" initialValue={[{} as SpeciesPrice]}>
              {(fields, { add, remove }) => (
                <>
                  <h4>Giá theo loài</h4>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="species-price-row">
                      <Form.Item
                        {...restField}
                        name={[name, "speciesId"]}
                        style={{ flex: 2 }}
                        rules={[{ required: true, message: "Chọn loài!" }]}
                      >
                        <Select placeholder="Chọn loài hamster">
                          {species.map((sp) => (
                            <Option key={sp.id} value={sp.id}>
                              {sp.speciesName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, "price"]}
                        style={{ flex: 2 }}
                        rules={[{ required: true, message: "Nhập giá!" }]}
                      >
                        <InputNumber placeholder="Giá" min={0} style={{ width: "100%" }} />
                      </Form.Item>

                      <Button danger onClick={() => remove(name)} style={{ flex: 1 }}>
                        Xóa
                      </Button>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    + Thêm loài
                  </Button>
                </>
              )}
            </Form.List>

            <Form.Item style={{ marginTop: 20 }}>
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
