import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Alert, Button, Tag, Descriptions, Avatar } from 'antd';
import { ArrowLeftOutlined, UserOutlined, CalendarOutlined, ShoppingOutlined } from '@ant-design/icons';
import { boardingService, type BookingDetail } from '../../../services/BoardingService';
import './BoardingDetail.scss';

const BoardingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      'CHECKED_IN': 'blue',
      'CHECKED_OUT': 'orange',
      'CANCELLED': 'red',
      'PENDING': 'gold'
    };
    return statusColors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      'PAID': 'Đã thanh toán',
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
      </div>
    </div>
  );
};

export default BoardingDetail;
