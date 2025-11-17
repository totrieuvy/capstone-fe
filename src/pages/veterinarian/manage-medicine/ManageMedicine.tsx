import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Typography,
  Card,
  Space,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import MedicineService from '../../../services/MedicineService';
import type { Medicine, UpdateMedicineRequest } from '../../../types/medicine';
import './ManageMedicine.scss';

const { Title } = Typography;

interface MedicineTableData {
  key: string;
  id: string;
  medicationName: string;
}

const ManageMedicine: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [form] = Form.useForm();

  // Fetch medicines on component mount
  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await MedicineService.getMedicines();
      setMedicines(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách thuốc');
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    form.setFieldsValue({
      medicationName: medicine.medicationName,
    });
    setModalVisible(true);
  };

  const handleUpdate = async (values: UpdateMedicineRequest) => {
    if (!editingMedicine) return;

    setLoading(true);
    try {
      await MedicineService.updateMedicine(editingMedicine.id, values);
      toast.success('Cập nhật thuốc thành công');
      setModalVisible(false);
      setEditingMedicine(null);
      form.resetFields();
      await fetchMedicines(); // Refresh the list
    } catch (error) {
      toast.error('Không thể cập nhật thuốc');
      console.error('Error updating medicine:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingMedicine(null);
    form.resetFields();
  };

  const columns: ColumnsType<MedicineTableData> = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Tên thuốc',
      dataIndex: 'medicationName',
      key: 'medicationName',
      ellipsis: true,
      render: (text) => (
        <span className="medicine-name">{text}</span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => handleEdit({ id: record.id, medicationName: record.medicationName })}
          className="update-button"
        >
          Cập nhật
        </Button>
      ),
    },
  ];

  const tableData: MedicineTableData[] = medicines.map((medicine) => ({
    key: medicine.id,
    id: medicine.id,
    medicationName: medicine.medicationName,
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
              
              <Table
                columns={columns}
                dataSource={tableData}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `Tổng ${total} thuốc`,
                  className: 'custom-pagination',
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
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            className="update-form"
          >
            <Form.Item
              label="Tên thuốc"
              name="medicationName"
              rules={[
                {
                  required: true,
                  message: 'Vui lòng nhập tên thuốc',
                },
                {
                  min: 2,
                  message: 'Tên thuốc phải có ít nhất 2 ký tự',
                },
              ]}
            >
              <Input
                placeholder="Nhập tên thuốc"
                size="large"
                className="medicine-input"
              />
            </Form.Item>

            <Form.Item className="form-buttons">
              <Space size="middle">
                <Button onClick={handleCancel} size="large">
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  className="submit-button"
                >
                  Cập nhật
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
