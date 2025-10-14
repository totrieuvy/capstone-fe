import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Typography,
  Spin,
  Alert,
  Row,
  Col,
  Button,
  Divider,
  Timeline,
  Image,
  Modal,
  Avatar
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  HomeOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingHistoryDetails } from '../../../../services/BoardingService';
import type { BookingHistoryItem } from '../../../../services/BoardingService';
import { getFormattedPrice } from '../../../../utils/formatPrice';
import './BoardingDetail.scss';

const { Title, Text } = Typography;

interface DailyReport {
  date: string;
  description: string;
  image: string;
}

const BoardingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  // Mock daily reports data
  const [dailyReports] = useState<DailyReport[]>([
    {
      date: '2024-02-01',
      description: 'Hamster Ti đã thích nghi tốt với môi trường mới',
      image: '/api/placeholder/300/200'
    },
    {
      date: '2024-02-02', 
      description: 'Chơi với đồ chơi gỗ và tích trữ thức ăn',
      image: '/api/placeholder/300/200'
    }
  ]);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await getBookingHistoryDetails(bookingId!);
      setBooking(details);
    } catch (err) {
      setError('Failed to fetch booking details. Please try again.');
      console.error('Error fetching booking details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      'CONFIRMED': 'success',
      'PENDING': 'warning', 
      'CANCELLED': 'error',
      'FAILED': 'error',
      'COMPLETED': 'blue',
      'IN_PROGRESS': 'processing'
    };
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      'CONFIRMED': 'Đã xác nhận',
      'PENDING': 'Đang chờ',
      'CANCELLED': 'Đã hủy',
      'FAILED': 'Thất bại',
      'COMPLETED': 'Hoàn thành',
      'IN_PROGRESS': 'Đang thực hiện'
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleBookService = () => {
    // Navigate to service booking page
    console.log('Navigate to service booking');
  };

  if (loading) {
    return (
      <div className="boarding-detail-loading">
        <Spin size="large" />
        <p>Đang tải thông tin chi tiết...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="boarding-detail-error">
        <Alert
          message="Lỗi"
          description={error || 'Không tìm thấy thông tin đặt phòng'}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate(-1)}>
              Quay về
            </Button>
          }
        />
      </div>
    );
  }

  const numberOfDays = calculateDays(booking.startDate, booking.endDate);

  return (
    <div className="boarding-detail">
      {/* Header */}
      <div className="boarding-detail-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="back-button"
        >
          Quay về
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Booking Information */}
        <Col xs={24} lg={12}>
          {/* Hamster Information */}
          <Card className="hamster-info-card">
            <div className="hamster-header">
              <Avatar size={64} className="hamster-avatar">
                {booking.hamsterName.charAt(0)}
              </Avatar>
              <div className="hamster-details">
                <Title level={3} className="hamster-name">
                  {booking.hamsterName}
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    Đang theo dõi
                  </Tag>
                </Title>
                <Text type="secondary">Chuồng tại chuồn cho hamster</Text>
              </div>
            </div>
          </Card>

          {/* Booking Details */}
          <Card title="Thông tin đặt chỗ" className="booking-info-card">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="info-item">
                  <Text type="secondary">Ngày vào</Text>
                  <div className="info-value">
                    <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    {new Date(booking.startDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <Text type="secondary">Ngày ra</Text>
                  <div className="info-value">
                    <CalendarOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                    {new Date(booking.endDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <Text type="secondary">Số ngày</Text>
                  <div className="info-value">{numberOfDays} ngày</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <Text type="secondary">Trạng thái</Text>
                  <div className="info-value">
                    <Tag color={getStatusColor(booking.status)} className="status-tag">
                      {getStatusText(booking.status)}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>

            <Divider />

            <div className="service-info">
              <Text type="secondary">Dịch vụ đã chọn</Text>
              <div className="service-item">
                <HomeOutlined style={{ marginRight: 8 }} />
                <span>Snack hạt mix</span>
                <span className="service-price">20.000đ</span>
              </div>
              <div className="service-item">
                <HomeOutlined style={{ marginRight: 8 }} />
                <span>Đồ chơi</span>
                <span className="service-price">20.000đ</span>
              </div>
            </div>
          </Card>

          {/* Payment Summary */}
          <Card title="Chi tiết thanh toán" className="payment-card">
            <div className="payment-item">
              <Text>Tiền giữ</Text>
              <Text strong>4 ngày</Text>
            </div>
            <div className="payment-item">
              <Text>Chi phí theo ngày</Text>
              <Text>40.000đ</Text>
            </div>
            <div className="payment-item">
              <Text>Dịch vụ</Text>
              <Text>160.000đ</Text>
            </div>
            <div className="payment-item">
              <Text>Tiền/ngày</Text>
              <Text>200.000đ</Text>
            </div>
            <Divider />
            <div className="payment-item total">
              <Text strong>Tổng tiền (thành tiền)</Text>
              <Text strong className="total-amount">
                {getFormattedPrice(booking.totalAmountAfter)}
              </Text>
            </div>
            <div className="payment-item discount">
              <Text>Giảm giá (10%)</Text>
              <Text className="discount-amount">100.000đ</Text>
            </div>
            <Divider />
            <div className="payment-item final-total">
              <Title level={4}>Tổng cộng</Title>
              <Title level={4} className="final-amount">
                {getFormattedPrice(booking.totalAmount)}
              </Title>
            </div>
          </Card>

          {/* Live Camera */}
          <Card title="Camera trực tiếp" className="camera-card">
            <div className="camera-container">
              <div className="camera-placeholder">
                <VideoCameraOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <Text type="secondary">Nhấn để xem camera trực tiếp</Text>
              </div>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                className="camera-button"
                onClick={() => setIsVideoModalVisible(true)}
              >
                Bật camera
              </Button>
            </div>
            <div className="camera-info">
              <Text type="secondary">
                Camera hoạt động 24/7 trong thời gian gửi gài
              </Text>
              <br />
              <Text type="secondary">
                Chỉ người sở hữu mới đăng nhập thành công.
              </Text>
              <br />
              <Text type="secondary">
                Chế động có thể xem thống tin thời gian thực.
              </Text>
              <br />
              <Text type="secondary">
                Bấm phát để xem hamster của bạn sẽ đang hoạt động.
              </Text>
            </div>
          </Card>

          <Button 
            type="primary" 
            size="large" 
            className="book-service-button"
            onClick={handleBookService}
          >
            Đặt dịch vụ làm đẹp
          </Button>
        </Col>

        {/* Right Column - Daily Reports */}
        <Col xs={24} lg={12}>
          <Card title="Báo cáo hàng ngày từ nhân viên" className="daily-reports-card">
            <Timeline className="daily-timeline">
              {dailyReports.map((report, index) => (
                <Timeline.Item
                  key={index}
                  dot={<StarOutlined style={{ fontSize: 16 }} />}
                  className="timeline-item"
                >
                  <div className="report-date">
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    {new Date(report.date).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="report-content">
                    <Text>{report.description}</Text>
                  </div>
                  <div className="report-image">
                    <Image
                      width={300}
                      height={200}
                      src={report.image}
                      alt={`Daily report ${report.date}`}
                      style={{ borderRadius: 8 }}
                      placeholder={
                        <div style={{ 
                          width: 300, 
                          height: 200, 
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 8
                        }}>
                          <EyeOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
                        </div>
                      }
                    />
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Video Modal */}
      <Modal
        title="Camera trực tiếp"
        open={isVideoModalVisible}
        onCancel={() => setIsVideoModalVisible(false)}
        width={800}
        footer={null}
        className="video-modal"
      >
        <div className="video-container">
          <div className="video-placeholder">
            <VideoCameraOutlined style={{ fontSize: 80, color: '#d9d9d9' }} />
            <Title level={4} type="secondary">Camera đang kết nối...</Title>
            <Text type="secondary">Vui lòng đợi trong giây lát</Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BoardingDetail;