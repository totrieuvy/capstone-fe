import React, { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import { Card, Tag, Typography, Spin, Alert, Row, Col, Button, Divider, Timeline, Image, Modal, Avatar } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  HomeOutlined,
  UserOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { boardingService } from "../../../../services/BoardingService";
import type { BookingDetail } from "../../../../services/BoardingService";
import { getFormattedPrice } from "../../../../utils/formatPrice";
import "./BoardingDetail.scss";
import api from "../../../../config/axios";

const { Title, Text } = Typography;

interface DailyReport {
  date: string;
  description: string;
  image: string;
}

const BoardingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (hlsUrl && videoRef.current) {
      const videoElement = videoRef.current;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsInstanceRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoElement.play().catch((e) => console.error("Autoplay bị chặn", e));
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS.js Error:", data);
        });
      } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        videoElement.src = hlsUrl; 
        videoElement.play().catch((e) => console.error("Autoplay native bị chặn", e));
      }
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    };
  }, [hlsUrl]);

  const handleOpenCamera = async () => {
    setIsModalLoading(true);
    setIsVideoModalVisible(true);
    try {
      const randomParam = Math.floor(Math.random() * 1000000);
      const response = await api.get(`/api/camera/play?url=${randomParam}`);

      const result = response.data;

      if (result.code === 200 && result.data && result.data.url) {
        setHlsUrl(result.data.url); 
      } else {
        throw new Error(result.message || "Invalid API response structure");
      }
    } catch (error) {
      console.error("Failed to fetch HLS URL:", error);
      setIsVideoModalVisible(false);
      setHlsUrl(null); 
    } finally {
      setIsModalLoading(false);
    }
  };

  // Mock daily reports data
  const [dailyReports] = useState<DailyReport[]>([
    {
      date: "2024-02-01",
      description: "Hamster Ti đã thích nghi tốt với môi trường mới",
      image: "/api/placeholder/300/200",
    },
    {
      date: "2024-02-02",
      description: "Chơi với đồ chơi gỗ và tích trữ thức ăn",
      image: "/api/placeholder/300/200",
    },
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
      const details = await boardingService.getBookingDetails(bookingId!);
      setBooking(details);
    } catch (err) {
      setError("Failed to fetch booking details. Please try again.");
      console.error("Error fetching booking details:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      CONFIRMED: "success",
      PENDING: "warning",
      CANCELLED: "error",
      FAILED: "error",
      COMPLETED: "blue",
      IN_PROGRESS: "processing",
    };
    return statusColors[status as keyof typeof statusColors] || "default";
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      CONFIRMED: "Đã xác nhận",
      PENDING: "Đang chờ",
      CANCELLED: "Đã hủy",
      FAILED: "Thất bại",
      COMPLETED: "Hoàn thành",
      IN_PROGRESS: "Đang thực hiện",
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  const handleBookService = () => {
    // Navigate to service booking page
    console.log("Navigate to service booking");
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
          description={error || "Không tìm thấy thông tin đặt phòng"}
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

  return (
    <div className="boarding-detail">
      {/* Header */}
      <div className="boarding-detail-header">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="back-button">
          Quay về
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Booking Information */}
        <Col xs={24} lg={12}>
          {/* Hamster Information */}
          <Card className="hamster-info-card">
            <div className="hamster-header">
              <Avatar size={64} src={booking.hamsterProfilePicture} className="hamster-avatar">
                {!booking.hamsterProfilePicture && booking.hamsterName.charAt(0)}
              </Avatar>
              <div className="hamster-details">
                <Title level={3} className="hamster-name">
                  {booking.hamsterName}
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {booking.species}
                  </Tag>
                </Title>
                <Text type="secondary">
                  Ngày sinh: {new Date(booking.dob).toLocaleDateString("vi-VN")} | Cân nặng: {booking.hamsterWeight}g
                </Text>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card title="Thông tin khách hàng" className="customer-info-card">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div className="info-item">
                  <Text type="secondary">Tên khách hàng</Text>
                  <div className="info-value">
                    <UserOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                    {booking.customerName}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <Text type="secondary">Số điện thoại</Text>
                  <div className="info-value">
                    <PhoneOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                    {booking.phoneNumber}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <Text type="secondary">Email</Text>
                  <div className="info-value">
                    {/* <MailOutlined style={{ marginRight: 8, color: '#ff7a45' }} /> */}
                    {booking.customerMail}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Booking Details */}
          <Card title="Thông tin đặt chỗ" className="booking-info-card">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="info-item">
                  <Text type="secondary">Ngày vào</Text>
                  <div className="info-value">
                    <CalendarOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                    {new Date(booking.startDate).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <Text type="secondary">Ngày ra</Text>
                  <div className="info-value">
                    <CalendarOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                    {new Date(booking.endDate).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <Text type="secondary">Loại chuồng</Text>
                  <div className="info-value">
                    <HomeOutlined style={{ marginRight: 8, color: "#fa8c16" }} />
                    {booking.cageTypeName}
                  </div>
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

            {booking.notes && (
              <>
                <Divider />
                <div className="info-item">
                  <Text type="secondary">Ghi chú</Text>
                  <div className="info-value">
                    <Text>{booking.notes}</Text>
                  </div>
                </div>
              </>
            )}

            {booking.services && booking.services.length > 0 && (
              <>
                <Divider />
                <div className="service-info">
                  <Text type="secondary">Dịch vụ đã chọn</Text>
                  {booking.services.map((service) => (
                    <div key={service.serviceId} className="service-item">
                      <span>{service.serviceName}</span>
                      <span className="service-price">{getFormattedPrice(service.price)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Payment Summary */}
          <Card title="Chi tiết thanh toán" className="payment-card">
            <div className="payment-item">
              <Text>Ngày tạo</Text>
              <Text>{new Date(booking.createdAt).toLocaleDateString("vi-VN")}</Text>
            </div>
            <Divider />
            <div className="payment-item total">
              <Text strong>Tổng tiền (trước giảm giá)</Text>
              <Text strong className="total-amount">
                {getFormattedPrice(booking.totalAmount)}
              </Text>
            </div>
            <div className="payment-item final-total">
              <Title level={4}>Tổng cộng</Title>
              <Title level={4} className="final-amount">
                {getFormattedPrice(booking.totalAmountAfter)}
              </Title>
            </div>
          </Card>
        </Col>

        {/* Right Column - Camera and Daily Reports */}
        <Col xs={24} lg={12}>
          {/* Live Camera */}
          <Card title="Camera trực tiếp" className="camera-card">
            <div className="camera-container">
              <div className="camera-placeholder">
                <VideoCameraOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                <Text type="secondary">Nhấn để xem camera trực tiếp</Text>
              </div>
              <Button type="primary" icon={<PlayCircleOutlined />} className="camera-button" onClick={handleOpenCamera}>
                Bật camera
              </Button>
            </div>
            <div className="camera-info">
              <Text type="secondary">Camera hoạt động 24/7 trong thời gian gửi gài</Text>
              <br />
              <Text type="secondary">Chỉ người sở hữu mới đăng nhập thành công.</Text>
              <br />
              <Text type="secondary">Chế động có thể xem thống tin thời gian thực.</Text>
              <br />
              <Text type="secondary">Bấm phát để xem hamster của bạn sẽ đang hoạt động.</Text>
            </div>
          </Card>

          <Button type="primary" size="large" className="book-service-button" onClick={handleBookService}>
            Đặt dịch vụ làm đẹp
          </Button>

          {/* Daily Reports */}
          <Card title="Báo cáo hàng ngày từ nhân viên" className="daily-reports-card">
            <Timeline className="daily-timeline">
              {dailyReports.map((report, index) => (
                <Timeline.Item key={index} dot={<StarOutlined style={{ fontSize: 16 }} />} className="timeline-item">
                  <div className="report-date">
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    {new Date(report.date).toLocaleDateString("vi-VN")}
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
                        <div
                          style={{
                            width: 300,
                            height: 200,
                            background: "#f0f0f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 8,
                          }}
                        >
                          <EyeOutlined style={{ fontSize: 32, color: "#d9d9d9" }} />
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
        onCancel={() => {
          setIsVideoModalVisible(false);
          setHlsUrl(null); // <- Thêm dòng này để kích hoạt cleanup
        }}
        width={800}
        footer={null}
        className="video-modal"
        destroyOnClose
      >
        {/* Thêm logic loading */}
        {isModalLoading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <Spin size="large" />
            <p style={{ marginTop: "10px" }}>Đang kết nối camera...</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            controls
            autoPlay
            muted
            width="100%"
            style={{ backgroundColor: "#000", borderRadius: "8px" }}
          />
        )}
      </Modal>
    </div>
  );
};

export default BoardingDetail;
