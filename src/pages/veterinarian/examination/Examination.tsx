import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Tag,
  Spin,
  message,
  Descriptions,
  Divider,
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { 
  getAppointmentById,
  type AppointmentDetail 
} from '../../../services/MedicalService';
import './Examination.scss';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

const Examination: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch appointment details
  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;
    
    setLoading(true);
    try {
      const response = await getAppointmentById(appointmentId);
      setAppointment(response.data);
    } catch (error) {
      message.error('Không thể tải thông tin cuộc hẹn. Vui lòng thử lại.');
      console.error('Error fetching appointment details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'booked':
        return 'blue';
      case 'checked_in':
      case 'check_in':
        return 'cyan';
      case 'in_progress':
        return 'orange';
      case 'check_out':
      case 'checked_out':
        return 'green';
      case 'completed':
        return 'green';
      default:
        return 'default';
    }
  };

  // Get status text in Vietnamese
  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'BOOKED':
        return 'Đã đặt';
      case 'CHECKED_IN':
      case 'CHECK_IN':
        return 'Đã check-in';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'CHECK_OUT':
      case 'CHECKED_OUT':
        return 'Đã check-out';
      case 'COMPLETED':
        return 'Hoàn thành';
      default:
        return status.replace('_', ' ');
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="examination-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="examination-error">
        <Card>
          <Title level={4}>Không tìm thấy thông tin cuộc hẹn</Title>
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/VET/lich-kham-hom-nay')}
          >
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="examination">
      <Card className="examination-container">
        {/* Header */}
        <div className="examination-header">
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/VET/lich-kham-hom-nay')}
                >
                  Quay lại
                </Button>
                <Title level={2} style={{ margin: 0 }}>
                  Thực hiện khám bệnh
                </Title>
              </Space>
            </Col>
            <Col>
              <Tag color={getStatusColor(appointment.status)} className="status-tag-large">
                {getStatusText(appointment.status)}
              </Tag>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* Main Content */}
        <Row gutter={[24, 24]}>
          {/* Customer & Hamster Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Thông tin khách hàng & thú cưng</span>
                </Space>
              }
              className="info-card"
            >
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Tên khách hàng">
                  <Text strong>{appointment.customerName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tên hamster">
                  <Space>
                    <Text strong>{appointment.hamsterName}</Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Appointment Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  <span>Thông tin cuộc hẹn</span>
                </Space>
              }
              className="info-card"
            >
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Ngày hẹn">
                  <Text strong>
                    {dayjs(appointment.appointmentTime).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Giờ hẹn">
                  <Text strong>
                    {appointment.slotStart} - {appointment.slotEnd}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian tạo">
                  {dayjs(appointment.createdAt).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Services Information */}
          <Col span={24}>
            <Card
              title={
                <Space>
                  <MedicineBoxOutlined />
                  <span>Dịch vụ đã đăng ký</span>
                </Space>
              }
              className="services-card"
            >
              <Row gutter={[16, 16]}>
                {appointment.items.map((item) => (
                  <Col xs={24} md={12} lg={8} key={item.id}>
                    <Card size="small" className="service-item">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong style={{ fontSize: '16px' }}>
                          {item.serviceName}
                        </Text>
                        <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                          {formatPrice(item.price)}
                        </Text>
                        {item.serviceComboName && (
                          <Tag color="purple">Combo: {item.serviceComboName}</Tag>
                        )}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* Notes */}
          {appointment.notes && (
            <Col span={24}>
              <Card title="Ghi chú từ khách hàng" className="notes-card">
                <Text>{appointment.notes}</Text>
              </Card>
            </Col>
          )}

          {/* Examination Area - This would be expanded in future development */}
          <Col span={24}>
            <Card title="Khu vực thực hiện khám bệnh" className="examination-area">
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: '#f5f5f5',
                borderRadius: '8px',
                border: '2px dashed #d9d9d9'
              }}>
                <MedicineBoxOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <Title level={4} style={{ color: '#666', margin: 0 }}>
                  Khu vực khám bệnh
                </Title>
                <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                  Tính năng này sẽ được phát triển trong tương lai
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Examination;
