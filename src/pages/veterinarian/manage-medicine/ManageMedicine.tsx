import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Typography, Card, Space, Row, Col } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, MedicineBoxOutlined, PlusOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import MedicineService from "../../../services/MedicineService";
import type { Medicine, UpdateMedicineRequest, CreateMedicineRequest } from "../../../types/medicine";
import "./ManageMedicine.scss";

const { Title } = Typography;
const { TextArea } = Input;

interface MedicineTableData {
  key: string;
  id: string;
  medicationName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const ManageMedicine: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  // Fetch medicines on component mount
  useEffect(() => {
    document.title = "Quản lí thuốc";
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await MedicineService.getMedicines();
      setMedicines(
        response.data.map((medicine: any) => ({
          ...medicine,
          description: medicine.description ?? "",
        }))
      );
    } catch (error) {
      toast.error("Không thể tải danh sách thuốc");
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    form.setFieldsValue({
      medicationName: medicine.medicationName,
      description: medicine.description,
    });
    setModalVisible(true);
  };

  const handleUpdate = async (values: UpdateMedicineRequest) => {
    if (!editingMedicine) return;

    setLoading(true);
    try {
      await MedicineService.updateMedicine(editingMedicine.id, values);
      toast.success("Cập nhật thuốc thành công");
      setModalVisible(false);
      setEditingMedicine(null);
      form.resetFields();
      await fetchMedicines(); // Refresh the list
    } catch (error) {
      toast.error("Không thể cập nhật thuốc");
      console.error("Error updating medicine:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingMedicine(null);
    form.resetFields();
  };

  const handleCreate = async (values: CreateMedicineRequest) => {
    setLoading(true);
    try {
      await MedicineService.createMedicine(values);
      toast.success("Thêm thuốc thành công");
      setCreateModalVisible(false);
      createForm.resetFields();
      await fetchMedicines(); // Refresh the list
    } catch (error) {
      toast.error("Không thể thêm thuốc");
      console.error("Error creating medicine:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCancel = () => {
    setCreateModalVisible(false);
    createForm.resetFields();
  };

  const columns: ColumnsType<MedicineTableData> = [
    {
      title: "STT",
      key: "index",
      width: 80,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tên thuốc",
      dataIndex: "medicationName",
      key: "medicationName",
      width: 250,
      render: (text) => <span className="medicine-name">{text}</span>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => <span className="medicine-description">{text}</span>,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => handleEdit({
            id: record.id,
            medicationName: record.medicationName,
            description: record.description,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          })}
          className="update-button"
        >
          Cập nhật
        </Button>
      ),
    },
  ];

  // Sort medicines by updatedAt descending (latest updated first), then by createdAt descending
  const sortedMedicines = [...medicines].sort((a, b) => {
    const updatedAtDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (updatedAtDiff !== 0) {
      return updatedAtDiff;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const tableData: MedicineTableData[] = sortedMedicines.map((medicine) => ({
    key: medicine.id,
    id: medicine.id,
    medicationName: medicine.medicationName,
    description: medicine.description,
    createdAt: medicine.createdAt,
    updatedAt: medicine.updatedAt,
  }));

  return (
    <div className="manage-medicine">
      <div className="manage-medicine-container"> 
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card className="header-card">
              <Space align="center" size="middle">
                <MedicineBoxOutlined className="header-icon" />
                <Title level={2} className="page-title">
                  Quản lí thuốc
                </Title>
              </Space>
            </Card>
          </Col>

          <Col span={24}>
            <Card className="table-card">
              <div className="table-header">
                <Title level={4} className="table-title">
                  Danh sách thuốc
                </Title>
              </div>

              <div className="table-actions">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                  size="large"
                  className="add-button"
                >
                  Thêm thuốc
                </Button>
              </div>

              <Table
                columns={columns}
                dataSource={tableData}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `Tổng ${total} thuốc`,
                  className: "custom-pagination",
                }}
                className="medicine-table"
                bordered
                scroll={{ x: 600 }}
              />
            </Card>
          </Col>
        </Row>

        <Modal
          title={
            <Space align="center">
              <EditOutlined />
              <span>Cập nhật thông tin thuốc</span>
            </Space>
          }
          open={modalVisible}
          onCancel={handleCancel}
          footer={null}
          width={500}
          className="update-modal"
        >
          <Form form={form} layout="vertical" onFinish={handleUpdate} className="update-form">
            <Form.Item
              label="Tên thuốc"
              name="medicationName"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên thuốc",
                },
                {
                  min: 2,
                  message: "Tên thuốc phải có ít nhất 2 ký tự",
                },
              ]}
            >
              <Input placeholder="Nhập tên thuốc" size="large" className="medicine-input" />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mô tả",
                },
                {
                  min: 5,
                  message: "Mô tả phải có ít nhất 5 ký tự",
                },
              ]}
            >
              <TextArea 
                placeholder="Nhập mô tả thuốc" 
                size="large" 
                className="medicine-input"
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item className="form-buttons">
              <Space size="middle">
                <Button onClick={handleCancel} size="large">
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={loading} size="large" className="submit-button">
                  Cập nhật
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={
            <Space align="center">
              <PlusOutlined />
              <span>Thêm thuốc mới</span>
            </Space>
          }
          open={createModalVisible}
          onCancel={handleCreateCancel}
          footer={null}
          width={500}
          className="update-modal"
        >
          <Form form={createForm} layout="vertical" onFinish={handleCreate} className="update-form">
            <Form.Item
              label="Tên thuốc"
              name="medicationName"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên thuốc",
                },
                {
                  min: 2,
                  message: "Tên thuốc phải có ít nhất 2 ký tự",
                },
              ]}
            >
              <Input placeholder="Nhập tên thuốc" size="large" className="medicine-input" />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mô tả",
                },
                {
                  min: 5,
                  message: "Mô tả phải có ít nhất 5 ký tự",
                },
              ]}
            >
              <TextArea 
                placeholder="Nhập mô tả thuốc" 
                size="large" 
                className="medicine-input"
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item className="form-buttons">
              <Space size="middle">
                <Button onClick={handleCreateCancel} size="large">
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={loading} size="large" className="submit-button">
                  Thêm
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ManageMedicine;