import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Alert, Button, Tag, Descriptions, Avatar, Modal, Upload, message, List, Radio } from 'antd';
import { ArrowLeftOutlined, UserOutlined, CalendarOutlined, ShoppingOutlined, UploadOutlined, CameraOutlined, HomeOutlined, EditOutlined, LogoutOutlined, BarChartOutlined } from '@ant-design/icons';
import { boardingService, type BookingDetail } from '../../../services/BoardingService';
import { cageService, type Cage } from '../../../services/CageService';
import { storage } from '../../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { UploadProps } from 'antd/es/upload/interface';
import { toast } from 'react-toastify';
import './StaffBoardingDetail.scss';

const BoardingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInModalVisible, setCheckInModalVisible] = useState<boolean>(false);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // Cage assignment states (now part of check-in process)
  const [availableCages, setAvailableCages] = useState<Cage[]>([]);
  const [selectedCageId, setSelectedCageId] = useState<string>('');
  const [cageLoading, setCageLoading] = useState<boolean>(false);

  // Check-out states
  const [checkOutModalVisible, setCheckOutModalVisible] = useState<boolean>(false);
  const [checkOutLoading, setCheckOutLoading] = useState<boolean>(false);
  const [checkOutImageFile, setCheckOutImageFile] = useState<File | null>(null);
  const [checkOutImagePreview, setCheckOutImagePreview] = useState<string>('');

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetail(bookingId);
    }
  }, [bookingId]);

  const fetchBookingDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardingService.getBookingDetails(id);
      setBookingDetail(data);
    } catch (err) {
      setError('Không thể tải thông tin chi tiết booking. Vui lòng thử lại.');
      console.error('Error fetching booking detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'PAID': 'green',
      'CONFIRMED': 'cyan',
      'CHECK_IN': 'blue',
      'CHECKED_OUT': 'orange',
      'CANCELLED': 'red',
      'PENDING': 'gold',
      'IN_PROGRESS': 'purple'
    };
    return statusColors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      'PAID': 'Đã thanh toán',
      'CONFIRMED': 'Đã xác nhận',
      'CHECK_IN': 'Đã check-in',
      'CHECKED_IN': 'Đã check-in',
      'CHECKED_OUT': 'Đã check-out',
      'CANCELLED': 'Đã hủy',
      'PENDING': 'Chờ xử lý'
    };
    return statusTexts[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Handle image file selection for check-in
  const handleImageUpload: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    if (file instanceof File) {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ được phép tải lên file hình ảnh!');
        onError?.(new Error('Invalid file type'));
        return;
      }

      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Kích thước file phải nhỏ hơn 5MB!');
        onError?.(new Error('File too large'));
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      onSuccess?.(file);
    }
  };

  // Handle image file selection for check-out
  const handleCheckOutImageUpload: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    if (file instanceof File) {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ được phép tải lên file hình ảnh!');
        onError?.(new Error('Invalid file type'));
        return;
      }

      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Kích thước file phải nhỏ hơn 5MB!');
        onError?.(new Error('File too large'));
        return;
      }

      setCheckOutImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCheckOutImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      onSuccess?.(file);
    }
  };

  // Handle check-in process (now includes cage assignment)
  const handleCheckIn = async () => {
    if (!imageFile || !bookingId) {
      message.error('Vui lòng chọn hình ảnh check-in!');
      return;
    }

    if (!selectedCageId) {
      message.error('Vui lòng chọn chuồng!');
      return;
    }

    try {
      setCheckInLoading(true);

      // Upload image to Firebase Storage
      const timestamp = Date.now();
      const storageRef = ref(storage, `check-in-images/${bookingId}_${timestamp}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(snapshot.ref);

      // Call combined check-in and cage assignment API
      await boardingService.checkInBooking({
        bookingId: bookingId,
        checkInImage: imageUrl,
        cageId: selectedCageId
      });

      // Show toast success notification
      toast.success('Check in và phân chuồng thành công!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setCheckInModalVisible(false);
      
      // Refresh booking details
      await fetchBookingDetail(bookingId);
      
      // Reset form
      setImageFile(null);
      setImagePreview('');
      setSelectedCageId('');
      setAvailableCages([]);
    } catch (error) {
      console.error('Check-in error:', error);
      message.error('Có lỗi xảy ra khi check-in. Vui lòng thử lại!');
    } finally {
      setCheckInLoading(false);
    }
  };

  // Reset modal state when closing
  const handleModalCancel = () => {
    setCheckInModalVisible(false);
    setImageFile(null);
    setImagePreview('');
    setSelectedCageId('');
    setAvailableCages([]);
  };

  // Fetch available cages for the booking's cage type and start date
  const fetchAvailableCages = async () => {
    if (!bookingDetail) return;
    
    try {
      setCageLoading(true);
      const response = await cageService.getCagesByTypeAndDate({
        cageTypeId: bookingDetail.cageTypeId,
        date: bookingDetail.startDate
      });
      
      // Filter only available cages
      const availableCages = response.cages.filter(cage => cage.status === 'Available');
      setAvailableCages(availableCages);
      
      if (availableCages.length === 0) {
        message.warning('Không có chuồng trống cho loại chuồng này trong ngày bắt đầu!');
      }
    } catch (error) {
      console.error('Error fetching available cages:', error);
      message.error('Không thể tải danh sách chuồng. Vui lòng thử lại!');
    } finally {
      setCageLoading(false);
    }
  };

  // Handle check-in modal opening (now includes cage fetching)
  const handleOpenCheckInModal = () => {
    setCheckInModalVisible(true);
    setImageFile(null);
    setImagePreview('');
    setSelectedCageId('');
    fetchAvailableCages();
  };

  // Handle check-out process
  const handleCheckOut = async () => {
    if (!checkOutImageFile || !bookingId) {
      message.error('Vui lòng chọn hình ảnh check-out!');
      return;
    }

    try {
      setCheckOutLoading(true);

      // Upload image to Firebase Storage
      const timestamp = Date.now();
      const storageRef = ref(storage, `check-out-images/${bookingId}_${timestamp}`);
      const snapshot = await uploadBytes(storageRef, checkOutImageFile);
      const imageUrl = await getDownloadURL(snapshot.ref);

      // Call check-out API
      const checkOutResponse = await boardingService.checkOutBooking({
        bookingId: bookingId,
        checkOutImage: imageUrl,
        paymentMethod: 'VNPAY'
      });

      // Show success message
      toast.success('Check out thành công!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setCheckOutModalVisible(false);
      
      // Navigate to checkout page with the response data
      navigate('/STAFF/checkout', {
        state: {
          checkOutData: checkOutResponse
        }
      });
      
    } catch (error) {
      console.error('Check-out error:', error);
      message.error('Có lỗi xảy ra khi check-out. Vui lòng thử lại!');
    } finally {
      setCheckOutLoading(false);
    }
  };

  // Handle check-out modal opening
  const handleOpenCheckOutModal = () => {
    setCheckOutModalVisible(true);
    setCheckOutImageFile(null);
    setCheckOutImagePreview('');
  };

  // Reset check-out modal state when closing
  const handleCheckOutModalCancel = () => {
    setCheckOutModalVisible(false);
    setCheckOutImageFile(null);
    setCheckOutImagePreview('');
  };

  if (loading) {
    return (
      <div className="boarding-detail">
        <div className="boarding-detail-container">
          <div className="loading-container">
            <Spin size="large" />
            <p>Đang tải thông tin chi tiết...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bookingDetail) {
    return (
      <div className="boarding-detail">
        <div className="boarding-detail-container">
          <Alert
            message="Lỗi"
            description={error || 'Không tìm thấy thông tin booking'}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => bookingId && fetchBookingDetail(bookingId)}>
                Thử lại
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="boarding-detail">
      <div className="boarding-detail-container">
        {/* Header */}
        <div className="detail-header">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            className="back-button"
          >
            Quay lại
          </Button>
          <div className="header-content">
            <h1 className="page-title">Chi tiết Booking</h1>
            <p className="booking-id">ID: {bookingDetail.bookingId}</p>
          </div>
        </div>

        {/* First Section: Customer & Hamster Information */}
        <div className="info-section">
          <div className="info-row">
            {/* Customer Information */}
            <Card
              title={
                <div className="section-title">
                  <UserOutlined />
                  <span>Thông tin khách hàng</span>
                </div>
              }
              className="info-card customer-card"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Tên khách hàng">
                  <strong>{bookingDetail.customerName}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {bookingDetail.phoneNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {bookingDetail.customerMail}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Hamster Information */}
            <Card
              title={
                <div className="section-title">
                  <span>🐹</span>
                  <span>Thông tin Hamster</span>
                </div>
              }
              className="info-card hamster-card"
            >
              <div className="hamster-info">
                <div className="hamster-avatar">
                  <Avatar
                    size={80}
                    src={bookingDetail.hamsterProfilePicture}
                    alt={bookingDetail.hamsterName}
                  />
                </div>
                <div className="hamster-details">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Tên Hamster">
                      <strong>{bookingDetail.hamsterName}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Loài">
                      {bookingDetail.species}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày sinh">
                      {formatDate(bookingDetail.dob)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cân nặng">
                      {bookingDetail.hamsterWeight}g
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Second Section: Boarding Information */}
        <div className="info-section">
          <Card
            title={
              <div className="section-title">
                <CalendarOutlined />
                <span>Thông tin ký gửi</span>
              </div>
            }
            className="info-card boarding-card"
          >
            <div className="boarding-info">
              <Descriptions column={2} size="middle">
                <Descriptions.Item label="Loại chuồng">
                  <strong>{bookingDetail.cageTypeName}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Tên chuồng">
                  <strong>{bookingDetail.cageName || 'Chưa phân chuồng'}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getStatusColor(bookingDetail.status)}>
                    {getStatusText(bookingDetail.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày bắt đầu">
                  <strong>{formatDate(bookingDetail.startDate)}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày kết thúc">
                  <strong>{formatDate(bookingDetail.endDate)}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền">
                  <strong className="total-amount">
                    {formatPrice(bookingDetail.totalAmount)}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Thành tiền">
                  <strong className="final-amount">
                    {formatPrice(bookingDetail.totalAmountAfter)}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo" span={2}>
                  {new Date(bookingDetail.createdAt).toLocaleString('vi-VN')}
                </Descriptions.Item>
                {bookingDetail.notes && (
                  <Descriptions.Item label="Ghi chú" span={2}>
                    <div className="notes-text">{bookingDetail.notes}</div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
            
            {/* Check-in Image Section - Below the descriptions but inside the same card */}
            {bookingDetail.checkInImage && (
              <div className="checkin-image-section" style={{ 
                marginTop: '24px', 
                paddingTop: '20px', 
                borderTop: '1px solid #f0f0f0',
                width: '100%'
              }}>
                <h4 style={{ 
                  marginBottom: '12px', 
                  color: '#262626', 
                  fontWeight: 600,
                  fontSize: '16px'
                }}>
                  Hình ảnh check-in
                </h4>
                <div className="checkin-image-container" style={{ width: '100%' }}>
                  <img 
                    src={bookingDetail.checkInImage} 
                    alt="Check-in" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      display: 'block'
                    }}
                    onClick={() => {
                      // Open image in a modal for better viewing
                      Modal.info({
                        title: 'Hình ảnh check-in',
                        icon: null,
                        content: (
                          <img 
                            src={bookingDetail.checkInImage} 
                            alt="Check-in" 
                            style={{ width: '100%', maxWidth: '500px' }}
                          />
                        ),
                        width: 600,
                        okText: 'Đóng'
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Third Section: Additional Services */}
        <div className="info-section">
          <Card
            title={
              <div className="section-title">
                <ShoppingOutlined />
                <span>Dịch vụ bổ sung</span>
              </div>
            }
            className="info-card services-card"
          >
            {bookingDetail.services && bookingDetail.services.length > 0 ? (
              <div className="services-list">
                {bookingDetail.services.map((service) => (
                  <div key={service.serviceId} className="service-item">
                    <div className="service-info">
                      <h4 className="service-name">{service.serviceName}</h4>
                      <p className="service-type">{service.serviceType}</p>
                    </div>
                    <div className="service-price">
                      {formatPrice(service.price)}
                    </div>
                  </div>
                ))}
                <div className="services-total">
                  <strong>
                    Tổng dịch vụ: {formatPrice(
                      bookingDetail.services.reduce((sum, service) => sum + service.price, 0)
                    )}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="no-services">
                <p>Không có dịch vụ bổ sung nào</p>
              </div>
            )}
          </Card>
        </div>

        {/* Check-in Button for CONFIRMED and PAID bookings */}
        {(bookingDetail.status === 'CONFIRMED' || bookingDetail.status === 'PAID') && (
          <div className="info-section">
            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                icon={<CameraOutlined />}
                onClick={handleOpenCheckInModal}
                className="check-in-button"
              >
                Check In & Phân chuồng
              </Button>
            </div>
          </div>
        )}

        {/* Create Care Log Button and Check Out Button for IN_PROGRESS bookings */}
        {bookingDetail.status === 'IN_PROGRESS' && (
          <div className="info-section">
            <div style={{ textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Button
                type="default"
                size="large"
                icon={<BarChartOutlined />}
                onClick={() => {
                  navigate('/STAFF/thong-so-iot');
                }}
                className="statistics-button"
              >
                Thông số
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<EditOutlined />}
                onClick={() => navigate(`/STAFF/care-log/${bookingId}`)}
                className="care-log-button"
              >
                Tạo báo cáo
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<LogoutOutlined />}
                onClick={handleOpenCheckOutModal}
                className="check-out-button"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Check Out
              </Button>
            </div>
          </div>
        )}

        {/* Check-in Modal (now includes cage assignment) */}
        <Modal
          title={
            <div className="modal-title">
              <CameraOutlined />
              <span style={{ marginLeft: 8 }}>Check-in & Phân chuồng</span>
            </div>
          }
          open={checkInModalVisible}
          onCancel={handleModalCancel}
          footer={[
            <Button key="cancel" onClick={handleModalCancel}>
              Hủy
            </Button>,
            <Button
              key="checkin"
              type="primary"
              loading={checkInLoading}
              onClick={handleCheckIn}
              disabled={!imageFile || !selectedCageId}
            >
              Xác nhận Check-in & Phân chuồng
            </Button>
          ]}
          width={600}
        >
          <div className="check-in-form">
            {/* Section 1: Image Upload */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16, color: '#262626', fontWeight: 600 }}>
                1. Tải lên hình ảnh check-in
              </h4>
              <p style={{ marginBottom: 16, color: '#666' }}>
                Vui lòng tải lên hình ảnh check-in để xác nhận hamster đã được gửi vào chuồng.
              </p>
              
              <Upload
                accept="image/*"
                customRequest={handleImageUpload}
                showUploadList={false}
                maxCount={1}
              >
                <div className="upload-area" style={{
                  border: '2px dashed #d9d9d9',
                  borderRadius: 8,
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s',
                  backgroundColor: '#fafafa'
                }}>
                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="Preview"
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
                      <UploadOutlined style={{ fontSize: 48, color: '#999', marginBottom: 16 }} />
                      <p style={{ margin: 0, fontSize: 16, color: '#666' }}>
                        Click hoặc kéo thả file vào đây
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#999' }}>
                        Hỗ trợ: JPG, PNG, GIF (tối đa 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </Upload>
            </div>

            {/* Section 2: Cage Selection */}
            <div>
              <h4 style={{ marginBottom: 16, color: '#262626', fontWeight: 600 }}>
                2. Chọn chuồng cho hamster
              </h4>
              <p style={{ marginBottom: 16, color: '#666' }}>
                Chọn chuồng trống cho <strong>{bookingDetail?.hamsterName}</strong> 
                ({bookingDetail?.cageTypeName})
              </p>
              
              {cageLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" />
                  <p style={{ marginTop: 16, color: '#666' }}>Đang tải danh sách chuồng...</p>
                </div>
              ) : availableCages.length > 0 ? (
                <Radio.Group
                  value={selectedCageId}
                  onChange={(e) => setSelectedCageId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <List
                    dataSource={availableCages}
                    renderItem={(cage) => (
                      <List.Item
                        key={cage.cageId}
                        style={{
                          padding: '12px 16px',
                          border: selectedCageId === cage.cageId ? '2px solid #1890ff' : '1px solid #f0f0f0',
                          borderRadius: 8,
                          marginBottom: 8,
                          backgroundColor: selectedCageId === cage.cageId ? '#f6ffed' : '#fafafa',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => setSelectedCageId(cage.cageId)}
                      >
                        <List.Item.Meta
                          avatar={
                            <Radio value={cage.cageId} />
                          }
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <HomeOutlined style={{ color: '#1890ff' }} />
                              <span>Chuồng {cage.cageId}</span>
                            </div>
                          }
                          description={
                            <Tag color="green">
                              {cage.status === 'Available' ? 'Trống' : cage.status}
                            </Tag>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Radio.Group>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <HomeOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                  <p style={{ color: '#666', margin: 0 }}>
                    Không có chuồng trống cho loại chuồng này
                  </p>
                  <p style={{ color: '#999', margin: '8px 0 0 0', fontSize: 14 }}>
                    Thử lại sau hoặc chọn ngày khác
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* Check-out Modal */}
        <Modal
          title={
            <div className="modal-title">
              <LogoutOutlined />
              <span style={{ marginLeft: 8 }}>Check-out</span>
            </div>
          }
          open={checkOutModalVisible}
          onCancel={handleCheckOutModalCancel}
          footer={[
            <Button key="cancel" onClick={handleCheckOutModalCancel}>
              Hủy
            </Button>,
            <Button
              key="checkout"
              type="primary"
              loading={checkOutLoading}
              onClick={handleCheckOut}
              disabled={!checkOutImageFile}
            >
              Xác nhận Check-out
            </Button>
          ]}
          width={600}
        >
          <div className="check-out-form">
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16, color: '#262626', fontWeight: 600 }}>
                Tải lên hình ảnh check-out
              </h4>
              <p style={{ marginBottom: 16, color: '#666' }}>
                Vui lòng tải lên hình ảnh check-out để xác nhận hamster đã được trả về cho khách hàng.
              </p>
              
              <Upload
                accept="image/*"
                customRequest={handleCheckOutImageUpload}
                showUploadList={false}
                maxCount={1}
              >
                <div className="upload-area" style={{
                  border: '2px dashed #d9d9d9',
                  borderRadius: 8,
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s',
                  backgroundColor: '#fafafa'
                }}>
                  {checkOutImagePreview ? (
                    <div>
                      <img
                        src={checkOutImagePreview}
                        alt="Check-out Preview"
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
                      <UploadOutlined style={{ fontSize: 48, color: '#999', marginBottom: 16 }} />
                      <p style={{ margin: 0, fontSize: 16, color: '#666' }}>
                        Click hoặc kéo thả file vào đây
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#999' }}>
                        Hỗ trợ: JPG, PNG, GIF (tối đa 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </Upload>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default BoardingDetail;
