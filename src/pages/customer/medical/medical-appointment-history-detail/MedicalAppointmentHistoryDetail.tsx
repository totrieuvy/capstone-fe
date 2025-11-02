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
  Avatar,
  Space,
  Modal,
  Image,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  CameraOutlined,
  FileImageOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { toast } from 'react-toastify';
import { 
  getAppointmentById, 
  cancelAppointment,
  type AppointmentDetail,
  type AppointmentItemDetail,
  type MedicalRecord
} from '../../../../services/MedicalService';
import './MedicalAppointmentHistoryDetail.scss';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

const ManageAppointmentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Cancel modal states
  const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  
  // Image preview modal states
  const [imagePreviewVisible, setImagePreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Medical record modal states
  const [medicalRecordModalVisible, setMedicalRecordModalVisible] = useState<boolean>(false);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<MedicalRecord | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string>('');

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
      case 'NO-SHOW':
        return 'volcano';
      case 'cancelled':
        return 'red';
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
      case 'NO-SHOW':
        return 'Không đến';
      case 'CANCELLED':
        return 'Đã hủy';
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

  // Handle image preview
  const handleImagePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl);
    setPreviewTitle(title);
    setImagePreviewVisible(true);
  };

  // Handle medical record modal
  const handleMedicalRecordClick = (item: AppointmentItemDetail) => {
    if (item.medicalRecord) {
      setSelectedMedicalRecord(item.medicalRecord);
      setSelectedServiceName(item.serviceName);
      setMedicalRecordModalVisible(true);
    } else {
      message.info('Dịch vụ này chưa có hồ sơ bệnh án');
    }
  };

  // Handle cancel appointment
  const handleCancel = async () => {
    if (!appointmentId) {
      message.error('Không tìm thấy ID cuộc hẹn!');
      return;
    }

    setCancelLoading(true);
    try {
      await cancelAppointment(appointmentId);
      toast.success('Hủy thành công');
      setCancelModalVisible(false);
      
      // Refresh appointment data
      await fetchAppointmentDetails();
    } catch (error) {
      message.error('Hủy thất bại! Vui lòng thử lại.');
      console.error('Error cancelling appointment:', error);
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="appointment-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="appointment-detail-error">
        <Card>
          <Title level={4}>Không tìm thấy thông tin cuộc hẹn</Title>
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/lich-su-kham')}
          >
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="appointment-detail">
      <Card className="appointment-detail-container">
        {/* Header */}
        <div className="detail-header">
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/lich-su-kham')}
                >
                  Quay lại
                </Button>
                <Title level={2} style={{ margin: 0 }}>
                  Chi tiết cuộc hẹn khám
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

          {/* Veterinarian Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <MedicineBoxOutlined />
                  <span>Thông tin bác sĩ thú y</span>
                </Space>
              }
              className="info-card"
            >
              {appointment.veterinarian ? (
                <div className="veterinarian-info">
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div className="vet-header">
                      <Space>
                        <Avatar size="large" icon={<UserOutlined />} />
                        <div>
                          <Text strong style={{ fontSize: '16px' }}>
                            {appointment.veterinarian.name}
                          </Text>
                          <br />
                          <Text type="secondary">
                            {appointment.veterinarian.gender === 'MALE' ? 'Nam' : 'Nữ'}
                          </Text>
                        </div>
                      </Space>
                    </div>
                    
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Kinh nghiệm">
                        {appointment.veterinarian.experienceYears} năm
                      </Descriptions.Item>
                      <Descriptions.Item label="Chuyên môn">
                        {appointment.veterinarian.specialization}
                      </Descriptions.Item>
                      <Descriptions.Item label="Dịch vụ tốt nhất">
                        <div className="best-services">
                          {appointment.veterinarian.bestServices.map((service, index) => (
                            <Tag key={index} color="blue">
                              {service}
                            </Tag>
                          ))}
                        </div>
                      </Descriptions.Item>
                    </Descriptions>
                  </Space>
                </div>
              ) : (
                <Text type="secondary">Chưa được phân công bác sĩ</Text>
              )}
            </Card>
          </Col>

          {/* Payment Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>Thông tin thanh toán</span>
                </Space>
              }
              className="info-card"
            >
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Tổng tiền ban đầu">
                  <Text strong style={{ color: '#1890ff' }}>
                    {formatPrice(appointment.totalAmount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền sau giảm giá">
                  <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                    {formatPrice(appointment.totalAmountAfter)}
                  </Text>
                </Descriptions.Item>
                {appointment.additionalAmount && (
                  <Descriptions.Item label="Phụ phí">
                    <Text style={{ color: '#faad14' }}>
                      {formatPrice(appointment.additionalAmount)}
                    </Text>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Phương thức thanh toán">
                  <Tag color={appointment.paymentMethod === 'PAID_AFTER' ? 'orange' : 'green'}>
                    {appointment.paymentMethod === 'PAID_AFTER' ? 'Thanh toán sau' : 'Đã thanh toán'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian giao dịch">
                  {appointment.transactionTime}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Check-in and Check-out Images */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <CameraOutlined />
                  <span>Hình ảnh check-in</span>
                </Space>
              }
              className="info-card"
            >
              {appointment.checkInImage ? (
                <div 
                  className="image-container clickable-image"
                  onClick={() => handleImagePreview(appointment.checkInImage!, 'Hình ảnh check-in')}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={appointment.checkInImage}
                    alt="Check-in"
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  />
                  <div className="image-overlay">
                    <Text style={{ color: 'white', fontSize: '14px' }}>
                      Nhấn để xem chi tiết
                    </Text>
                  </div>
                </div>
              ) : (
                <div className="no-image-placeholder">
                  <Space direction="vertical" style={{ textAlign: 'center', width: '100%' }}>
                    <FileImageOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                    <Text type="secondary">Chưa có hình ảnh check-in</Text>
                  </Space>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <CameraOutlined />
                  <span>Hình ảnh check-out</span>
                </Space>
              }
              className="info-card"
            >
              {appointment.checkoutImage ? (
                <div 
                  className="image-container clickable-image"
                  onClick={() => handleImagePreview(appointment.checkoutImage!, 'Hình ảnh check-out')}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={appointment.checkoutImage}
                    alt="Check-out"
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  />
                  <div className="image-overlay">
                    <Text style={{ color: 'white', fontSize: '14px' }}>
                      Nhấn để xem chi tiết
                    </Text>
                  </div>
                </div>
              ) : (
                <div className="no-image-placeholder">
                  <Space direction="vertical" style={{ textAlign: 'center', width: '100%' }}>
                    <FileImageOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                    <Text type="secondary">Chưa có hình ảnh check-out</Text>
                  </Space>
                </div>
              )}
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
                    <Card 
                      size="small" 
                      className="service-item"
                      hoverable={!!item.medicalRecord}
                      onClick={() => handleMedicalRecordClick(item)}
                      style={{ 
                        cursor: item.medicalRecord ? 'pointer' : 'default',
                        border: item.medicalRecord ? '2px solid #52c41a' : '2px solid #f0f0f0'
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text strong style={{ fontSize: '16px', flex: 1 }}>
                            {item.serviceName}
                          </Text>
                          {item.medicalRecord && (
                            <Tag color="green" icon={<FileTextOutlined />}>
                              Có hồ sơ
                            </Tag>
                          )}
                        </div>
                        <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                          {formatPrice(item.price)}
                        </Text>
                        {item.serviceComboName && (
                          <Tag color="purple">Combo: {item.serviceComboName}</Tag>
                        )}
                        {item.medicalRecord && (
                          <div style={{ marginTop: '8px' }}>
                            <Space>
                              <EyeOutlined style={{ color: '#1890ff' }} />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Nhấn để xem hồ sơ bệnh án
                              </Text>
                            </Space>
                          </div>
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
              <Card title="Ghi chú" className="notes-card">
                <Text>{appointment.notes}</Text>
              </Card>
            </Col>
          )}

          {/* Cancel Button */}
          {(appointment.status === 'BOOKED') && (
            <Col span={24}>
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button
                  type="primary"
                  size="large"
                  danger
                  onClick={() => setCancelModalVisible(true)}
                  style={{
                    fontSize: '16px',
                    height: '48px',
                    padding: '0 32px',
                  }}
                >
                  Hủy cuộc hẹn
                </Button>
              </div>
            </Col>
          )}
        </Row>

        {/* Cancel Confirmation Modal */}
        <Modal
          title="Xác nhận hủy cuộc hẹn"
          open={cancelModalVisible}
          onCancel={() => setCancelModalVisible(false)}
          footer={[
            <Button
              key="cancel"
              onClick={() => setCancelModalVisible(false)}
            >
              Không
            </Button>,
            <Button
              key="confirm"
              type="primary"
              danger
              loading={cancelLoading}
              onClick={handleCancel}
            >
              Có, hủy cuộc hẹn
            </Button>,
          ]}
          centered
        >
          <p>Bạn có chắc chắn muốn hủy cuộc hẹn này không?</p>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Hành động này không thể hoàn tác.
          </p>
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          open={imagePreviewVisible}
          title={previewTitle}
          footer={null}
          onCancel={() => setImagePreviewVisible(false)}
          width="80%"
          centered
          style={{ maxWidth: '800px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewImage}
              alt={previewTitle}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>
        </Modal>

        {/* Medical Record Modal */}
        <Modal
          open={medicalRecordModalVisible}
          title={
            <Space>
              <FileTextOutlined style={{ color: '#52c41a' }} />
              <span>Hồ sơ bệnh án - {selectedServiceName}</span>
            </Space>
          }
          footer={[
            <Button
              key="close"
              type="primary"
              onClick={() => setMedicalRecordModalVisible(false)}
            >
              Đóng
            </Button>
          ]}
          onCancel={() => setMedicalRecordModalVisible(false)}
          width={800}
          className="medical-record-modal"
        >
          {selectedMedicalRecord && (
            <div style={{ padding: '16px 0' }}>
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <MedicineBoxOutlined style={{ color: '#1890ff' }} />
                        <span>Thông tin chẩn đoán</span>
                      </Space>
                    }
                    style={{ marginBottom: '16px' }}
                  >
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Triệu chứng">
                        <Text>{selectedMedicalRecord.symptom || 'Không có thông tin'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Chẩn đoán">
                        <Text strong style={{ color: '#fa8c16' }}>
                          {selectedMedicalRecord.diagnosis || 'Chưa có chẩn đoán'}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Tình trạng sức khỏe">
                        <Tag 
                          color={
                            selectedMedicalRecord.healthStatus === 'Good' ? 'green' :
                            selectedMedicalRecord.healthStatus === 'Normal' ? 'blue' :
                            selectedMedicalRecord.healthStatus === 'Poor' ? 'red' : 'default'
                          }
                          style={{ fontSize: '14px', padding: '4px 8px' }}
                        >
                          {selectedMedicalRecord.healthStatus || 'Chưa xác định'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                {selectedMedicalRecord.linkResult && (
                  <Col span={24}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <FileImageOutlined style={{ color: '#722ed1' }} />
                          <span>Hình ảnh kết quả</span>
                        </Space>
                      }
                    >
                      <div style={{ textAlign: 'center' }}>
                        <Image
                          src={selectedMedicalRecord.linkResult}
                          alt="Kết quả xét nghiệm"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '400px',
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9'
                          }}
                          preview={{
                            mask: (
                              <div style={{ textAlign: 'center' }}>
                                <EyeOutlined style={{ fontSize: '20px', marginBottom: '8px' }} />
                                <div>Xem ảnh phóng to</div>
                              </div>
                            )
                          }}
                        />
                      </div>
                    </Card>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default ManageAppointmentDetail;
