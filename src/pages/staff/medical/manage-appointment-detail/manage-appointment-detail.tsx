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
  Upload,
  Image,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  CameraOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  FileTextOutlined,
  EyeOutlined,
  ExperimentOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { 
  getAppointmentById, 
  checkInAppointment,
  checkOutAppointment,
  type AppointmentDetail,
  type AppointmentItemDetail,
  type MedicalRecord,
  type CheckOutAppointmentRequest
} from '../../../../services/MedicalService';
import { storage } from '../../../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import './manage-appointment-detail.scss';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

const ManageAppointmentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Check-in modal states
  const [checkInModalVisible, setCheckInModalVisible] = useState<boolean>(false);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Image preview modal states
  const [imagePreviewVisible, setImagePreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Medical record modal states
  const [medicalRecordModalVisible, setMedicalRecordModalVisible] = useState<boolean>(false);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<MedicalRecord | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string>('');

  // Checkout modal states
  const [checkoutModalVisible, setCheckoutModalVisible] = useState<boolean>(false);
  const [checkoutImage, setCheckoutImage] = useState<string>('');
  const [uploadingCheckoutImage, setUploadingCheckoutImage] = useState<boolean>(false);
  const [submittingCheckout, setSubmittingCheckout] = useState<boolean>(false);

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
      case 'CONFIRMED':
        return 'Đã xác nhận';
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

  // Check if appointment has any medical records
  const hasExistingMedicalRecords = () => {
    if (!appointment?.items) return false;
    return appointment.items.some((item: AppointmentItemDetail) => item.medicalRecord);
  };

  // Handle file upload to Firebase
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `check-in-images/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file to Firebase
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
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

  // Handle upload change
  const handleImageUpload: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    if (file instanceof File) {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ được phép tải lên file hình ảnh!');
        onError?.(new Error('Invalid file type'));
        return;
      }

      // Validate file size (max 10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('Kích thước file phải nhỏ hơn 10MB!');
        onError?.(new Error('File too large'));
        return;
      }

      // Create preview and upload to Firebase
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          message.loading('Đang tải lên hình ảnh...', 0);
          const imageUrl = await handleFileUpload(file);
          setUploadedImage(imageUrl);
          message.destroy();
          message.success('Tải lên hình ảnh thành công!');
          onSuccess?.(file);
        } catch (error) {
          message.destroy();
          message.error('Tải lên hình ảnh thất bại!');
          onError?.(error as Error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle check-in appointment
  const handleCheckIn = async () => {
    if (!uploadedImage) {
      message.error('Vui lòng tải lên hình ảnh check-in!');
      return;
    }

    if (!appointment?.veterinarian?.id) {
      message.error('Không tìm thấy thông tin bác sĩ thú y!');
      return;
    }

    if (!appointmentId) {
      message.error('Không tìm thấy ID cuộc hẹn!');
      return;
    }

    setCheckInLoading(true);
    try {
      await checkInAppointment({
        appointmentId: appointmentId,
        checkInImage: uploadedImage,
        veterinarianId: appointment.veterinarian.id,
        staffId: null, // Default to null as requested
      });

      message.success('Check-in thành công!');
      setCheckInModalVisible(false);
      
      // Refresh appointment data
      await fetchAppointmentDetails();
      
      // Reset form
      setUploadedImage(null);
    } catch (error) {
      message.error('Check-in thất bại! Vui lòng thử lại.');
      console.error('Error checking in appointment:', error);
    } finally {
      setCheckInLoading(false);
    }
  };

  // Handle checkout image upload
  const handleCheckoutImageUpload = async (file: File) => {
    setUploadingCheckoutImage(true);
    try {
      const timestamp = Date.now();
      const fileName = `checkout-images/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file to Firebase
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      setCheckoutImage(downloadURL);
      
      toast.success('Tải lên hình ảnh thành công!');
    } catch (error) {
      console.error('Error uploading checkout image:', error);
      toast.error('Lỗi khi tải lên hình ảnh. Vui lòng thử lại.');
    } finally {
      setUploadingCheckoutImage(false);
    }
  };

  // Handle checkout appointment
  const handleCheckoutAppointment = async () => {
    if (!appointment) return;
    
    setSubmittingCheckout(true);
    try {
      const checkoutRequest: CheckOutAppointmentRequest = {
        appointmentId: appointment.id,
        checkOutImage: checkoutImage,
        additionalAmount: appointment.additionalAmount || 0
      };

      const response = await checkOutAppointment(checkoutRequest);
      
      if (response.data?.paymentUrl) {
        toast.success('Tạo liên kết thanh toán thành công! Đang chuyển hướng...');
        setTimeout(() => {
          window.open(response.data.paymentUrl, '_blank');
        }, 1000);
      } else {
        toast.success('Check-out thành công!');
      }
      
      await fetchAppointmentDetails();
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Checkout thất bại! Vui lòng thử lại.');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // Upload props
  const uploadProps = {
    accept: 'image/*',
    customRequest: handleImageUpload,
    showUploadList: false,
    maxCount: 1,
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
            onClick={() => navigate('/STAFF/lich-dat-kham')}
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
                  onClick={() => navigate('/STAFF/lich-dat-kham')}
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

          {/* Prescription Section */}
          {appointment.prescription && appointment.prescription.medicines.length > 0 && (
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <ExperimentOutlined style={{ color: '#722ed1' }} />
                    <span>Đơn thuốc</span>
                  </Space>
                }
                className="prescription-card"
              >
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">
                    <InfoCircleOutlined style={{ marginRight: '8px' }} />
                    Đơn thuốc được kê cho cuộc hẹn này
                  </Text>
                </div>
                
                <Row gutter={[16, 16]}>
                  {appointment.prescription.medicines.map((medicine, index) => (
                    <Col xs={24} md={12} lg={8} key={medicine.id}>
                      <Card 
                        size="small" 
                        className="medicine-item"
                        style={{ 
                          border: '2px solid #f0f2ff',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #fafbff 0%, #f0f2ff 100%)'
                        }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div 
                              style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                background: '#722ed1', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                marginRight: '12px'
                              }}
                            >
                              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                                {index + 1}
                              </Text>
                            </div>
                            <Text strong style={{ fontSize: '16px', color: '#262626' }}>
                              {medicine.medicineName}
                            </Text>
                          </div>
                          
                          <Descriptions size="small" column={1}>
                            <Descriptions.Item 
                              label={
                                <Text style={{ fontWeight: 600, color: '#595959' }}>
                                  Liều dùng
                                </Text>
                              }
                            >
                              <Text style={{ color: '#1890ff', fontWeight: 500 }}>
                                {medicine.dosage}
                              </Text>
                            </Descriptions.Item>
                            
                            <Descriptions.Item 
                              label={
                                <Text style={{ fontWeight: 600, color: '#595959' }}>
                                  <ClockCircleOutlined style={{ marginRight: '4px' }} />
                                  Thời gian
                                </Text>
                              }
                            >
                              <Tag color="orange" style={{ fontSize: '12px' }}>
                                {medicine.durationDays} ngày
                              </Tag>
                            </Descriptions.Item>
                            
                            {medicine.note && (
                              <Descriptions.Item 
                                label={
                                  <Text style={{ fontWeight: 600, color: '#595959' }}>
                                    Ghi chú
                                  </Text>
                                }
                              >
                                <Text 
                                  style={{ 
                                    color: '#52c41a', 
                                    fontStyle: 'italic',
                                    fontSize: '13px'
                                  }}
                                >
                                  {medicine.note}
                                </Text>
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
                
                <div 
                  style={{ 
                    marginTop: '20px', 
                    padding: '16px', 
                    background: '#f6ffed', 
                    border: '1px solid #d9f7be',
                    borderRadius: '8px'
                  }}
                >
                  <Space align="start">
                    <InfoCircleOutlined style={{ color: '#52c41a', marginTop: '2px' }} />
                    <div>
                      <Text strong style={{ color: '#389e0d', display: 'block', marginBottom: '4px' }}>
                        Lưu ý quan trọng:
                      </Text>
                      <Text style={{ color: '#595959', fontSize: '13px' }}>
                        Vui lòng tuân thủ đúng liều dùng và thời gian dùng thuốc theo chỉ định của bác sĩ. 
                        Nếu có bất kỳ phản ứng bất thường nào, hãy liên hệ ngay với phòng khám.
                      </Text>
                    </div>
                  </Space>
                </div>
              </Card>
            </Col>
          )}

          {/* Notes */}
          {appointment.notes && (
            <Col span={24}>
              <Card title="Ghi chú" className="notes-card">
                <Text>{appointment.notes}</Text>
              </Card>
            </Col>
          )}

          {/* Check-in Button */}
          {appointment.status !== 'COMPLETED' && !appointment.checkInImage && (
            <Col span={24}>
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setCheckInModalVisible(true)}
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    fontSize: '16px',
                    height: '48px',
                    padding: '0 32px',
                  }}
                >
                  Check-in
                </Button>
              </div>
            </Col>
          )}

          {/* Checkout Button */}
          {appointment.status === 'IN_PROGRESS' && hasExistingMedicalRecords() && (
            <Col span={24}>
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<DollarOutlined />}
                  onClick={() => setCheckoutModalVisible(true)}
                  loading={submittingCheckout}
                  style={{
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff',
                    fontSize: '16px',
                    height: '48px',
                    padding: '0 32px',
                  }}
                >
                  Check out
                </Button>
              </div>
            </Col>
          )}
        </Row>

        {/* Check-in Modal */}
        <Modal
          open={checkInModalVisible}
          onCancel={() => {
            setCheckInModalVisible(false);
            setUploadedImage(null);
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setCheckInModalVisible(false);
                setUploadedImage(null);
              }}
            >
              Hủy
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={checkInLoading}
              onClick={handleCheckIn}
              disabled={!uploadedImage}
            >
              Check-in
            </Button>,
          ]}
          width={600}
          className="check-in-modal"
        >
          <div style={{ padding: '20px 0' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ fontSize: '16px', marginBottom: '8px', display: 'block' }}>
                  Tải lên hình ảnh check-in:
                </Text>
                <Text type="secondary">
                  Vui lòng chọn hình ảnh để ghi nhận thời điểm check-in của cuộc hẹn.
                </Text>
              </div>

              <Upload {...uploadProps}>
                <div style={{
                  border: '2px dashed #d9d9d9',
                  borderRadius: 8,
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s',
                  backgroundColor: '#fafafa'
                }}>
                  {uploadedImage ? (
                    <div>
                      <img
                        src={uploadedImage}
                        alt="Check-in preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          marginBottom: 16,
                          borderRadius: 8
                        }}
                      />
                      <p style={{ margin: 0, color: '#666' }}>
                        Click để thay đổi hình ảnh
                      </p>
                    </div>
                  ) : (
                    <div>
                      <PlusOutlined style={{ fontSize: 48, color: '#999', marginBottom: 16 }} />
                      <p style={{ margin: 0, fontSize: 16, color: '#666' }}>
                        Click hoặc kéo thả file vào đây
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#999' }}>
                        Hỗ trợ: JPG, PNG, GIF (tối đa 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </Upload>

              {uploadedImage && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Hình ảnh đã được tải lên thành công
                  </Text>
                </div>
              )}
            </Space>
          </div>
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

        {/* Checkout Modal */}
        <Modal
          title="Xác nhận thanh toán"
          open={checkoutModalVisible}
          onCancel={() => {
            setCheckoutModalVisible(false);
            setCheckoutImage('');
          }}
          footer={[
            <Button key="cancel" onClick={() => {
              setCheckoutModalVisible(false);
              setCheckoutImage('');
            }}>
              Hủy
            </Button>,
            <Button 
              key="confirm" 
              type="primary" 
              icon={<DollarOutlined />}
              loading={submittingCheckout}
              disabled={!checkoutImage || uploadingCheckoutImage}
              onClick={() => {
                setCheckoutModalVisible(false);
                handleCheckoutAppointment();
              }}
            >
              Xác nhận thanh toán
            </Button>
          ]}
          width={600}
          centered
        >
          <div style={{ padding: '16px 0' }}>
            <Alert
              message="Xác nhận thông tin thanh toán"
              description="Hệ thống sẽ tạo liên kết thanh toán và chuyển hướng đến trang thanh toán VNPay. Vui lòng kiểm tra lại thông tin và tải lên hình ảnh checkout trước khi tiếp tục."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* Image Upload Section */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Text strong>Hình ảnh checkout (Bắt buộc):</Text>
                </Col>
                <Col span={24}>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={async (file) => {
                      // Validate file type
                      const isImage = file.type.startsWith('image/');
                      if (!isImage) {
                        toast.error('Chỉ có thể tải lên file hình ảnh!');
                        return false;
                      }

                      // Validate file size (5MB max)
                      const isValidSize = file.size / 1024 / 1024 < 5;
                      if (!isValidSize) {
                        toast.error('Kích thước file phải nhỏ hơn 5MB!');
                        return false;
                      }

                      // Upload the file
                      await handleCheckoutImageUpload(file);
                      return false; // Prevent default upload
                    }}
                    disabled={uploadingCheckoutImage}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploadingCheckoutImage}
                      style={{ width: '100%' }}
                    >
                      {uploadingCheckoutImage ? 'Đang tải lên...' : 'Tải lên hình ảnh checkout'}
                    </Button>
                  </Upload>
                </Col>
                {checkoutImage && (
                  <Col span={24}>
                    <div style={{ textAlign: 'center' }}>
                      <Image
                        src={checkoutImage}
                        alt="Checkout Image"
                        style={{ 
                          maxWidth: '200px', 
                          maxHeight: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #d9d9d9'
                        }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Tag color="green">✓ Đã tải lên</Tag>
                        <Button 
                          type="link" 
                          size="small" 
                          onClick={() => setCheckoutImage('')}
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
            
            <Card size="small" style={{ background: '#f9f9f9' }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text strong>Khách hàng:</Text>
                  <div>{appointment?.customerName}</div>
                </Col>
                <Col span={12}>
                  <Text strong>Hamster:</Text>
                  <div>{appointment?.hamsterName}</div>
                </Col>
                <Col span={12}>
                  <Text strong>Tổng tiền gốc:</Text>
                  <div>{appointment ? formatPrice(appointment.totalAmount) : '0 đ'}</div>
                </Col>
                <Col span={12}>
                  <Text strong>Sau giảm giá:</Text>
                  <div style={{ color: '#52c41a' }}>{appointment ? formatPrice(appointment.totalAmountAfter) : '0 đ'}</div>
                </Col>
                {appointment?.additionalAmount && (
                  <>
                    <Col span={12}>
                      <Text strong>Dịch vụ bổ sung:</Text>
                      <div style={{ color: '#1890ff' }}>{formatPrice(appointment.additionalAmount)}</div>
                    </Col>
                    <Col span={12}></Col>
                  </>
                )}
                <Col span={24}>
                  <Divider style={{ margin: '8px 0' }} />
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Text strong style={{ fontSize: '16px' }}>Tổng thanh toán:</Text>
                    </Col>
                    <Col>
                      <Text strong style={{ fontSize: '18px', color: '#f5222d' }}>
                        {appointment ? formatPrice(
                          appointment.totalAmountAfter + (appointment.additionalAmount || 0)
                        ) : '0 đ'}
                      </Text>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>
          </div>
        </Modal>
      </Card>
    </div>
  );
};

export default ManageAppointmentDetail;
