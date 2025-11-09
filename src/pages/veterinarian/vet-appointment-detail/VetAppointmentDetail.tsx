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
  Select,
  Form,
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
  PlayCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { 
  getAppointmentById, 
  checkInAppointment,
  updateAppointmentStatus,
  type AppointmentDetail,
  type AppointmentItemDetail,
  type MedicalRecord
} from '../../../services/MedicalService';
import ProfileHamsterService, { type Species } from '../../../services/ProfileHamsterService';
import { toast } from 'react-toastify';
import { storage } from '../../../config/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './VetAppointmentDetail.scss';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

const VetAppointmentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Check-in modal states
  const [checkInModalVisible, setCheckInModalVisible] = useState<boolean>(false);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Tiến hành button loading state
  const [progressLoading, setProgressLoading] = useState<boolean>(false);
  
  // Image preview modal states
  const [imagePreviewVisible, setImagePreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Medical record modal states
  const [medicalRecordModalVisible, setMedicalRecordModalVisible] = useState<boolean>(false);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<MedicalRecord | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string>('');

  // Species update modal states
  const [speciesUpdateModalVisible, setSpeciesUpdateModalVisible] = useState<boolean>(false);
  const [speciesLoading, setSpeciesLoading] = useState<boolean>(false);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('');
  const [updateHamsterLoading, setUpdateHamsterLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

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

  // Fetch species list
  const fetchSpeciesList = async () => {
    setSpeciesLoading(true);
    try {
      const species = await ProfileHamsterService.getSpecies();
      setSpeciesList(species);
    } catch (error) {
      message.error('Không thể tải danh sách loài. Vui lòng thử lại.');
      console.error('Error fetching species:', error);
    } finally {
      setSpeciesLoading(false);
    }
  };

  // Open species update modal
  const openSpeciesUpdateModal = () => {
    if (!appointment) return;
    
    // Find current species name from the species list or get it from appointment
    fetchSpeciesList();
    setSelectedSpeciesId(appointment.speciesId);
    setSpeciesUpdateModalVisible(true);
  };

  // Handle species update
  const handleSpeciesUpdate = async () => {
    if (!appointment || !selectedSpeciesId) {
      message.error('Vui lòng chọn loài hamster!');
      return;
    }

    setUpdateHamsterLoading(true);
    try {
      // Use the specific change species API
      await ProfileHamsterService.changeSpecies({
        hamsterId: appointment.hamsterId,
        speciesId: selectedSpeciesId,
      });
      
      toast.success('Cập nhật loài hamster thành công!');
      setSpeciesUpdateModalVisible(false);
      
      // Refresh appointment data to get updated species
      await fetchAppointmentDetails();
      
    } catch (error) {
      message.error('Cập nhật thất bại! Vui lòng thử lại.');
      console.error('Error updating hamster species:', error);
    } finally {
      setUpdateHamsterLoading(false);
    }
  };

  // Get species name by ID
  const getSpeciesNameById = (speciesId: string) => {
    const species = speciesList.find(s => s.id === speciesId);
    return species ? species.speciesName : 'Chưa xác định';
  };

  // Handle progress status update and redirect to examination
  const handleProgress = async () => {
    if (!appointmentId) {
      message.error('Không tìm thấy ID cuộc hẹn!');
      return;
    }

    setProgressLoading(true);
    try {
      // If status is already IN_PROGRESS, just redirect without API call
      if (appointment?.status === 'IN_PROGRESS') {
        message.success('Chuyển đến trang thực hiện khám bệnh!');
        navigate(`/VET/examination/${appointmentId}`);
      } else {
        // If status is CHECK_IN or CHECKED_IN, update to IN_PROGRESS first
        await updateAppointmentStatus(appointmentId, 'IN_PROGRESS');
        message.success('Đã chuyển trạng thái sang đang thực hiện!');
        
        // Redirect to examination page
        navigate(`/VET/examination/${appointmentId}`);
      }
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại! Vui lòng thử lại.');
      console.error('Error updating appointment status:', error);
    } finally {
      setProgressLoading(false);
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
    fetchSpeciesList();
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
            onClick={() => navigate('/VET/lich-kham-hom-nay')}
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
                  onClick={() => navigate('/VET/lich-kham-hom-nay')}
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
                <Descriptions.Item label="Loài hamster">
                  <Space>
                    <Text strong>{getSpeciesNameById(appointment.speciesId)}</Text>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={openSpeciesUpdateModal}
                      style={{ padding: 0 }}
                    >
                      Chỉnh sửa
                    </Button>
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
                  <>
                    <Descriptions.Item label="Phụ phí">
                      <Text style={{ color: '#faad14' }}>
                        {formatPrice(appointment.additionalAmount)}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={`Phụ phí sau giảm (${appointment.discountPercent}%)`}>
                      <Text style={{ color: '#52c41a' }}>
                        {formatPrice(appointment.additionalAmount * (1 - appointment.discountPercent / 100))}
                      </Text>
                    </Descriptions.Item>
                  </>
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

          {/* Action Buttons */}
          {appointment.status !== 'COMPLETED' && (
            <Col span={24}>
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Space size="large">
                  {/* Check-in Button - Only show if not checked in yet */}
                  {!appointment.checkInImage && (
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
                  )}
                  
                  {/* Tiến hành Button - Show for CHECK_IN, CHECKED_IN and IN_PROGRESS status */}
                  {(appointment.status === 'CHECK_IN' || appointment.status === 'CHECKED_IN' || appointment.status === 'IN_PROGRESS') && (
                    <Button
                      type="primary"
                      size="large"
                      icon={<PlayCircleOutlined />}
                      loading={progressLoading}
                      onClick={handleProgress}
                      style={{
                        backgroundColor: '#1890ff',
                        borderColor: '#1890ff',
                        fontSize: '16px',
                        height: '48px',
                        padding: '0 32px',
                      }}
                    >
                      Tiến hành
                    </Button>
                  )}
                </Space>
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

        {/* Species Update Modal */}
        <Modal
          title="Cập nhật loài hamster"
          open={speciesUpdateModalVisible}
          onOk={handleSpeciesUpdate}
          onCancel={() => setSpeciesUpdateModalVisible(false)}
          confirmLoading={updateHamsterLoading}
          okText="Cập nhật"
          cancelText="Hủy"
          okButtonProps={{ 
            disabled: !selectedSpeciesId || selectedSpeciesId === appointment?.speciesId 
          }}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Loài hamster hiện tại">
              <Text strong>{getSpeciesNameById(appointment?.speciesId || '')}</Text>
            </Form.Item>
            <Form.Item label="Chọn loài mới" required>
              <Select
                value={selectedSpeciesId}
                onChange={setSelectedSpeciesId}
                placeholder="Chọn loài hamster"
                loading={speciesLoading}
                style={{ width: '100%' }}
              >
                {speciesList.map((species) => (
                  <Select.Option key={species.id} value={species.id}>
                    {species.speciesName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default VetAppointmentDetail;
