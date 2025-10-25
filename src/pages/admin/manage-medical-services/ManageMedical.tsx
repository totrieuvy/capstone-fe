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
  Spin,
  Divider,
  Typography,
  Card,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import type { ColumnsType } from "antd/es/table";
import { 
  getMedicalServices, 
  deleteService, 
  getServiceById,
  createService,
  type Service, 
  type ServiceResponse,
  type ServiceDetail,
  type ServicePrice,
  type CreateServiceRequest 
} from "../../../services/MedicalService";
import { ProfileHamsterService, type Species } from "../../../services/ProfileHamsterService";
import "./ManageMedical.scss";

interface MedicalServiceFormValues {
  id?: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
  speciesPrices: Array<{
    speciesId: string;
    price: number;
  }>;
}

// interface SpeciesPriceForm {
//   speciesId: string;
//   speciesName: string;
//   price: number;
// }

const ManageMedical: React.FC = () => {
  const [medicalServices, setMedicalServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(null);
  const [species, setSpecies] = useState<Species[]>([]);
  const [speciesLoading, setSpeciesLoading] = useState(false);
  const [speciesPrices, setSpeciesPrices] = useState<{[key: string]: number}>({});
  const [form] = Form.useForm();

  const { Text, Title } = Typography;

  // Fetch all medical services
  const fetchMedicalServices = async () => {
    setLoading(true);
    try {
      const response: ServiceResponse = await getMedicalServices();
      if (response.code === 200) {
        setMedicalServices(response.data);
      } else {
        message.error(response.message || "Failed to fetch medical services");
      }
    } catch (error) {
      message.error("Failed to fetch medical services");
      console.error("Error fetching medical services:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch species data
  const fetchSpecies = async () => {
    setSpeciesLoading(true);
    try {
      const speciesData = await ProfileHamsterService.getSpecies();
      setSpecies(speciesData);
      
      // Initialize species prices with default value
      const initialPrices: {[key: string]: number} = {};
      speciesData.forEach(species => {
        initialPrices[species.id] = 100000; // Default price
      });
      setSpeciesPrices(initialPrices);
    } catch (error) {
      message.error("Failed to fetch species data");
      console.error("Error fetching species:", error);
    } finally {
      setSpeciesLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lý dịch vụ y tế";
    fetchMedicalServices();
    fetchSpecies();
  }, []);

  // Handle create/update
  const handleSubmit = async (values: MedicalServiceFormValues) => {
    setSubmitLoading(true);
    try {
      if (isUpdate && values.id) {
        // TODO: Implement update service logic here
        message.success("Cập nhật dịch vụ y tế thành công!");
      } else {
        // Create service logic - build species prices from form data
        const speciesPricesArray = Object.entries(speciesPrices).map(([speciesId, price]) => ({
          speciesId,
          price
        }));

        const createServiceData: CreateServiceRequest = {
          serviceType: "MEDICAL",
          serviceName: values.serviceName,
          description: values.description,
          durationMinutes: values.durationMinutes,
          displayPrice: 0, // Will be calculated based on species prices
          speciesPrices: speciesPricesArray
        };

        const response = await createService(createServiceData);
        if (response.code === 201) {
          message.success("Thêm dịch vụ y tế thành công!");
        } else {
          message.error(response.message || "Thêm dịch vụ thất bại!");
        }
      }

      fetchMedicalServices();
      handleCancel();
    } catch (error) {
      message.error("Thao tác thất bại: " + error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Open modal for create
  const handleOpenAdd = () => {
    setIsUpdate(false);
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    
    // Reset species prices to default values
    const initialPrices: {[key: string]: number} = {};
    species.forEach(spec => {
      initialPrices[spec.id] = 100000; // Default price
    });
    setSpeciesPrices(initialPrices);
  };

  // Open modal for edit
  const handleOpenEdit = async (record: Service) => {
    setIsUpdate(true);
    setIsModalVisible(true);
    setDetailLoading(true);
    
    try {
      // Fetch detailed service information
      const response = await getServiceById(record.id);
      if (response.code === 200) {
        setServiceDetail(response.data);
        form.setFieldsValue({
          ...response.data,
        });
      } else {
        message.error(response.message || "Failed to fetch service details");
        // Fallback to basic data
        form.setFieldsValue({
          ...record,
        });
      }
    } catch (error) {
      message.error("Failed to fetch service details");
      console.error("Error fetching service details:", error);
      // Fallback to basic data
      form.setFieldsValue({
        ...record,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle delete
  const handleDelete = (record: Service) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa dịch vụ "${record.serviceName}"?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await deleteService(record.id);
          if (response.code === 200) {
            message.success("Xóa dịch vụ y tế thành công!");
            fetchMedicalServices();
          } else {
            message.error(response.message || "Xóa dịch vụ thất bại!");
          }
        } catch (error) {
          message.error("Xóa dịch vụ thất bại: " + error);
          console.error("Error deleting service:", error);
        }
      },
    });
  };

  // Close modal
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setIsUpdate(false);
    setServiceDetail(null);
    
    // Reset species prices to default values
    const initialPrices: {[key: string]: number} = {};
    species.forEach(spec => {
      initialPrices[spec.id] = 100000; // Default price
    });
    setSpeciesPrices(initialPrices);
  };

  // Handle species price change
  const handleSpeciesPriceChange = (speciesId: string, price: number) => {
    setSpeciesPrices(prev => ({
      ...prev,
      [speciesId]: price || 0
    }));
  };

  // Filter data based on search
  const filteredData = medicalServices.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  // Table columns
  const columns: ColumnsType<Service> = [
    {
      title: "Tên dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      sorter: (a, b) => a.serviceName.localeCompare(b.serviceName),
      width: 200,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 300,
    },
    {
      title: "Thời gian (phút)",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
      sorter: (a, b) => a.durationMinutes - b.durationMinutes,
      width: 120,
      align: "center",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      align: "center",
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? "#52c41a" : "#ff4d4f" }}>
          {isActive ? "Hoạt động" : "Không hoạt động"}
        </span>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<FiEdit />}
            onClick={() => handleOpenEdit(record)}
            size="small"
            style={{ display: "flex", alignItems: "center" }}
          />
          <Button
            type="primary"
            danger
            icon={<FiTrash2 />}
            onClick={() => handleDelete(record)}
            size="small"
            style={{ display: "flex", alignItems: "center" }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="ManageMedical">
      <h1>Quản lý dịch vụ y tế</h1>

      <div className="search-box">
        <Space style={{ marginBottom: 16, width: "100%" }}>
          <Input
            placeholder="Tìm kiếm dịch vụ y tế..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAdd}
            style={{ marginLeft: "auto" }}
          >
            Thêm dịch vụ y tế
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
          showTotal: (total) => `Total ${total} items`,
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={isUpdate ? "Cập nhật dịch vụ y tế" : "Thêm dịch vụ y tế mới"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Spin spinning={submitLoading || detailLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ isActive: true }}
          >
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="serviceName"
              label="Tên dịch vụ"
              rules={[
                { required: true, message: "Vui lòng nhập tên dịch vụ!" },
              ]}
            >
              <Input placeholder="Nhập tên dịch vụ y tế" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
              rules={[
                { required: true, message: "Vui lòng nhập mô tả!" },
              ]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Nhập mô tả dịch vụ"
              />
            </Form.Item>

            <Form.Item
              name="durationMinutes"
              label="Thời gian thực hiện (phút)"
              rules={[
                { required: true, message: "Vui lòng nhập thời gian!" },
                { type: "number", min: 1, max: 600, message: "Thời gian phải từ 1 đến 600 phút!" },
              ]}
            >
              <InputNumber
                min={1}
                max={600}
                style={{ width: "100%" }}
                placeholder="Nhập thời gian (phút)"
                addonAfter="phút"
              />
            </Form.Item>

            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
            </Form.Item>

            {/* Species pricing section for create mode */}
            {!isUpdate && (
              <>
                <Divider />
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>Giá dịch vụ theo loài hamster</Title>
                  <Spin spinning={speciesLoading}>
                    <Card size="small" style={{ background: '#f9f9f9' }}>
                      {species.map((spec, index) => (
                        <div key={spec.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 0',
                          borderBottom: index < species.length - 1 ? '1px solid #e0e0e0' : 'none'
                        }}>
                          <Text strong style={{ minWidth: '120px' }}>{spec.speciesName}</Text>
                          <InputNumber
                            value={speciesPrices[spec.id] || 0}
                            onChange={(value) => handleSpeciesPriceChange(spec.id, value || 0)}
                            min={0}
                            step={1000}
                            style={{ width: '200px' }}
                            placeholder="Nhập giá"
                            addonAfter="VND"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0}
                          />
                        </div>
                      ))}
                    </Card>
                  </Spin>
                </div>
                <Divider />
              </>
            )}

            {/* Display service prices in edit mode */}
            {isUpdate && serviceDetail && serviceDetail.prices && serviceDetail.prices.length > 0 && (
              <>
                <Divider />
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>Giá dịch vụ theo loài hamster</Title>
                  <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
                    {serviceDetail.prices.map((price: ServicePrice, index: number) => (
                      <div key={price.priceId} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: index < serviceDetail.prices.length - 1 ? '1px solid #e0e0e0' : 'none'
                      }}>
                        <Text strong>{price.speciesName}</Text>
                        <Text style={{ color: '#1890ff', fontSize: '16px', fontWeight: 'bold' }}>
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(price.price)}
                        </Text>
                      </div>
                    ))}
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                    Giá hiển thị: {serviceDetail.displayPrice} VND
                  </Text>
                </div>
                <Divider />
              </>
            )}

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
};

export default ManageMedical;
