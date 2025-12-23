import React, { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";
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
  Avatar,
  List,
  Checkbox,
  DatePicker,
  message,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  StarOutlined,
  ScissorOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FireOutlined,
  CloudOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { boardingService } from "../../../../services/BoardingService";
import type { BookingDetail, CareLogItem } from "../../../../services/BoardingService";
import { getTemperature } from "../../../../services/IotService";
import type { TemperatureData } from "../../../../services/IotService";
import { getServicesBySpeciesAndType, ServiceType } from "../../../../services/AdditionService";
import type { Service } from "../../../../services/AdditionService";
import { ProfileHamsterService } from "../../../../services/ProfileHamsterService";
import type { Species } from "../../../../services/ProfileHamsterService";
import { getPoliciesByServiceType } from "../../../../services/PolicyService";
import { getFormattedPrice } from "../../../../utils/formatPrice";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import "./BoardingDetail.scss";
import api from "../../../../config/axios";
import type { Dayjs } from "dayjs";
import { BiCategory } from "react-icons/bi";
import { GiCage } from "react-icons/gi";

const { Title, Text } = Typography;

const BoardingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Care logs state
  const [careLogs, setCareLogs] = useState<CareLogItem[]>([]);
  const [careLogsLoading, setCareLogsLoading] = useState(false);
  const [careLogsError, setCareLogsError] = useState<string | null>(null);

  // Temperature monitoring state
  const [temperatureData, setTemperatureData] = useState<TemperatureData | null>(null);
  const [temperatureLoading, setTemperatureLoading] = useState(false);
  const temperatureIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          console.log(event);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        videoRef.current.src = "";
      }
    };
  }, [hlsUrl]);

  const handleOpenCamera = async () => {
    if (!booking?.cameraId) {
      message.warning("Không tìm thấy camera cho booking này.");
      return;
    }

    setIsModalLoading(true);
    setIsVideoModalVisible(true);

    try {
      const response = await api.get(`/api/camera/play?cameraId=${booking.cameraId}`);

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

  // Grooming service modal states
  const [isGroomingModalVisible, setIsGroomingModalVisible] = useState(false);
  const [groomingServices, setGroomingServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [groomingLoading, setGroomingLoading] = useState(false);
  const [addingService, setAddingService] = useState(false);

  // Species state for service filtering
  const [speciesList, setSpeciesList] = useState<Species[]>([]);

  // Cancel booking modal states
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Cancellation policy state
  const [cancellationPolicy, setCancellationPolicy] = useState<{
    description: string;
    refundPercentage: number;
    timesBeforeCheckin: number;
  } | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
      fetchCareLogs();
      fetchSpeciesList();
      fetchCancellationPolicy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const fetchCancellationPolicy = async () => {
    try {
      const response = await getPoliciesByServiceType("BOOKING");
      const cancelPolicy = response.data.find(
        (policy) => policy.category === "CANCELLED" && policy.status === "ACTIVE"
      );
      
      if (cancelPolicy) {
        setCancellationPolicy({
          description: cancelPolicy.description,
          refundPercentage: cancelPolicy.refundPercentage,
          timesBeforeCheckin: cancelPolicy.timesBeforeCheckin,
        });
      }
    } catch (error) {
      console.error("Error fetching cancellation policy:", error);
    }
  };

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

  const fetchCareLogs = async () => {
    if (!bookingId) return;

    try {
      setCareLogsLoading(true);
      setCareLogsError(null);
      const logs = await boardingService.getCareLogsByBookingId(bookingId);
      setCareLogs(logs);
    } catch (err) {
      setCareLogsError("Failed to fetch care logs. Please try again.");
      console.error("Error fetching care logs:", err);
    } finally {
      setCareLogsLoading(false);
    }
  };

  const fetchTemperature = useCallback(async () => {
    if (!booking?.iotId) return;

    try {
      const tempData = await getTemperature(booking.iotId);
      setTemperatureData(tempData);
    } catch (err) {
      console.warn("Failed to fetch temperature data:", err);
    }
  }, [booking?.iotId]);

  // Update temperature data every 2 seconds
  useEffect(() => {
    if (booking?.iotId && booking?.status === "IN_PROGRESS") {
      setTemperatureLoading(true);
      fetchTemperature().finally(() => setTemperatureLoading(false));
      
      temperatureIntervalRef.current = setInterval(() => {
        fetchTemperature();
      }, 2000);
    }

    return () => {
      if (temperatureIntervalRef.current) {
        clearInterval(temperatureIntervalRef.current);
        temperatureIntervalRef.current = null;
      }
    };
  }, [booking?.iotId, booking?.status, fetchTemperature]);

  const fetchSpeciesList = async () => {
    try {
      const species = await ProfileHamsterService.getSpecies();
      setSpeciesList(species);
    } catch (err) {
      console.error("Error fetching species list:", err);
    }
  };

  const getSpeciesIdByName = (speciesName: string): string | null => {
    const species = speciesList.find(s => s.speciesName === speciesName);
    return species ? species.id : null;
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      BOOKED: "cyan",
      PENDING: "orange",
      CANCELLED: "red",
      FAILED: "red",
      COMPLETED: "green",
      IN_PROGRESS: "blue",
      CHECK_OUT: "green",
      INCIDENT: "red",
      NO_SHOW: "red",
    };
    return statusColors[status as keyof typeof statusColors] || "default";
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      BOOKED: "Đã đặt",
      PENDING: "Đang chờ",
      CANCELLED: "Đã hủy",
      FAILED: "Thanh toán thất bại",
      COMPLETED: "Hoàn thành",
      IN_PROGRESS: "Đang thực hiện",
      CHECK_OUT: "Hoàn tất",
      INCIDENT: "Có sự cố",
      NO_SHOW: "Không tới",
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  const handleBookService = async () => {
    if (!booking) {
      message.error("Không tìm thấy thông tin booking.");
      return;
    }

    const speciesId = getSpeciesIdByName(booking.species);
    if (!speciesId) {
      message.error("Không tìm thấy thông tin loài hamster. Vui lòng thử lại.");
      return;
    }

    try {
      setGroomingLoading(true);
      const response = await getServicesBySpeciesAndType(speciesId, ServiceType.GROOMING);

      // Filter out services that are already added to the booking
      const existingServiceIds = booking.services ? booking.services.map(service => service.serviceId) : [];
      const availableServices = response.data.filter(service => !existingServiceIds.includes(service.id));

      setGroomingServices(availableServices);
      setIsGroomingModalVisible(true);
    } catch (error) {
      message.error("Không thể tải danh sách dịch vụ. Vui lòng thử lại.");
      console.error("Error fetching grooming services:", error);
    } finally {
      setGroomingLoading(false);
    }
  };

  const handleAddServiceToBooking = async () => {
    if (selectedServiceIds.length === 0 || !selectedDate) {
      message.warning("Vui lòng chọn ít nhất một dịch vụ và ngày thực hiện.");
      return;
    }

    try {
      setAddingService(true);
      await boardingService.addServiceToBooking({
        bookingId: bookingId!,
        serviceDate: selectedDate,
        serviceIds: selectedServiceIds,
      });

      toast.success(`Thêm ${selectedServiceIds.length} dịch vụ thành công`);

      // Refresh booking details
      await fetchBookingDetails();

      // Reset modal state
      setIsGroomingModalVisible(false);
      setSelectedServiceIds([]);
      setSelectedDate("");
    } catch (error) {
      message.error("Không thể thêm dịch vụ. Vui lòng thử lại.");
      console.error("Error adding service to booking:", error);
    } finally {
      setAddingService(false);
    }
  };

  const handleCloseGroomingModal = () => {
    setIsGroomingModalVisible(false);
    setSelectedServiceIds([]);
    setSelectedDate("");
  };

  // Cancel booking functions
  const handleCancelBooking = () => {
    setIsCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingId) return;

    try {
      setCancelLoading(true);
      await boardingService.cancelBooking(bookingId);

      // Show success message
      toast.success("Hủy booking thành công");

      // Refresh booking details to show updated status
      await fetchBookingDetails();

      // Close modal
      setIsCancelModalVisible(false);
    } catch (error) {
      message.error("Không thể hủy booking. Vui lòng thử lại.");
      console.error("Error cancelling booking:", error);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalVisible(false);
  };

  // Calculate refund information preview
  const getRefundInfo = () => {
    if (!booking || !cancellationPolicy) return null;

    const startDate = dayjs(booking.startDate);
    const today = dayjs();
    const hoursBeforeCheckIn = startDate.diff(today, "hour");
    const daysBeforeCheckIn = startDate.diff(today, "day");

    // Check if cancellation is within the policy time frame
    const isEligibleForRefund = hoursBeforeCheckIn >= cancellationPolicy.timesBeforeCheckin;

    if (isEligibleForRefund) {
      const refundAmount = Math.round(booking.totalAmountAfter * cancellationPolicy.refundPercentage);
      return {
        isRefunded: true,
        refundPercentage: cancellationPolicy.refundPercentage * 100,
        refundAmount,
        daysBeforeCheckIn,
        hoursBeforeCheckIn,
        policyDescription: cancellationPolicy.description,
      };
    } else {
      return {
        isRefunded: false,
        refundPercentage: 0,
        refundAmount: 0,
        daysBeforeCheckIn,
        hoursBeforeCheckIn,
        policyDescription: cancellationPolicy.description,
      };
    }
  };

  const getDateRange = () => {
    if (!booking) return { start: null, end: null };

    const startDate = dayjs(booking.startDate);
    const endDate = dayjs(booking.endDate);

    return { start: startDate, end: endDate };
  };

  const disabledDate = (current: Dayjs | null): boolean => {
    const { start, end } = getDateRange();
    if (!start || !end) return true;

    // Disable dates outside the booking period
    return !!(current && (current.isBefore(start.startOf("day")) || current.isAfter(end.endOf("day"))));
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
          <br />
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
                    <BiCategory style={{ marginRight: 8, color: "#fa8c16" }} />
                    {booking.cageTypeName}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <Text type="secondary">Tên chuồng</Text>
                  <div className="info-value">
                    <GiCage style={{ marginRight: 8, color: "#fa8c16" }} />
                    {booking.cageName || "Chưa phân chuồng"}
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

            {/* Extension Information Section */}
            {(booking.newEndDate || booking.newCageTypeName || booking.newCageName) && (
              <div className="extension-section">
                <div className="extension-title">
                  <Text style={{ fontSize: '16px', fontWeight: 600, color: '#1890ff' }}>
                    Thông tin gia hạn
                  </Text>
                </div>
                <Row gutter={[16, 12]}>
                  {booking.newEndDate && (
                    <Col span={12}>
                      <div className="info-item extension-item">
                        <Text type="secondary">Ngày ra mới</Text>
                        <div className="info-value">
                          <CalendarOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                          <Text strong style={{ color: '#52c41a' }}>
                            {new Date(booking.newEndDate).toLocaleDateString("vi-VN")}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  )}
                  {booking.newCageTypeName && (
                    <Col span={12}>
                      <div className="info-item extension-item">
                        <Text type="secondary">Loại chuồng mới</Text>
                        <div className="info-value">
                          <BiCategory style={{ marginRight: 8, color: "#fa8c16" }} />
                          <Text strong style={{ color: '#fa8c16' }}>
                            {booking.newCageTypeName}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  )}
                  {booking.newCageName && (
                    <Col span={12}>
                      <div className="info-item extension-item">
                        <Text type="secondary">Tên chuồng mới</Text>
                        <div className="info-value">
                          <GiCage style={{ marginRight: 8, color: "#fa8c16" }} />
                          <Text strong style={{ color: '#fa8c16' }}>
                            {booking.newCageName}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            )}

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

            {/* Services Section - Always show if booking is not cancelled/completed */}
            {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
              <>
                <Divider />

                {/* Current Services */}
                {booking.services && booking.services.length > 0 && (
                  <div className="service-info">
                    <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
                      Dịch vụ đã đặt:
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      {booking.services.map((service) => (
                        <div key={service.serviceId} className="service-item" style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: '#f6f8fa',
                          borderRadius: '6px',
                          marginBottom: '6px',
                          border: '1px solid #e1e5e9'
                        }}>
                          <span style={{ fontWeight: 500 }}>{service.serviceName}</span>
                          <Tag color="blue">{getFormattedPrice(service.price)}</Tag>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Service Button - Hidden for BOOKED and CHECK_OUT statuses */}
                {booking.status !== "BOOKED" && booking.status !== "CHECK_OUT" && (
                  <div style={{ marginTop: booking.services && booking.services.length > 0 ? 16 : 8, textAlign: "center" }}>
                    <Button
                      type="primary"
                      size="middle"
                      className="book-service-button"
                      onClick={handleBookService}
                      icon={<ScissorOutlined />}
                      style={{
                        backgroundColor: '#ff7a45',
                        borderColor: '#ff7a45',
                        fontWeight: 500
                      }}
                    >
                      Thêm dịch vụ làm đẹp
                    </Button>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Dịch vụ spa, cắt tỉa lông, vệ sinh chuyên dụng cho {booking.species}
                      </Text>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Show services for completed/cancelled bookings (read-only) */}
            {(booking.status === "CANCELLED" || booking.status === "COMPLETED") &&
              booking.services && booking.services.length > 0 && (
                <>
                  <Divider />
                  <div className="service-info">
                    <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
                      Dịch vụ đã đặt:
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      {booking.services.map((service) => (
                        <div key={service.serviceId} className="service-item" style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: '#f6f8fa',
                          borderRadius: '6px',
                          marginBottom: '6px',
                          border: '1px solid #e1e5e9'
                        }}>
                          <span style={{ fontWeight: 500 }}>{service.serviceName}</span>
                          <Tag color="blue">{getFormattedPrice(service.price)}</Tag>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
          </Card>
          {/* Payment Summary */}
          <Card title="Chi tiết thanh toán" className="payment-card">
            <div className="payment-item">
              <Text>Ngày tạo</Text>
              <Text>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("vi-VN") : "N/A"}</Text>
            </div>
            <Divider />
            <div className="payment-item total">
              <Text strong>Tổng tiền đã thanh toán</Text>
              <Text strong className="total-amount">
                {getFormattedPrice(booking.totalAmount)}
              </Text>
            </div>
            <Divider />
            {/* Additional Services (Grooming) Section */}
            {booking.serviceTotalPrice > 0 && (
              <div className="extension-pricing-section">
                <div className="payment-item">
                  <Text strong>Tổng tiền dịch vụ làm đẹp (giá gốc)</Text>
                  <Text strong className="original-price" style={{ textDecoration: 'line-through', color: '#999' }}>
                    {getFormattedPrice(booking.serviceTotalPrice)}
                  </Text>
                </div>
                <div className="payment-item total">
                  <Text strong>Tổng tiền dịch vụ làm đẹp ({booking.serviceDiscountPercent}% giảm giá)</Text>
                  <Text strong className="total-amount" style={{ color: '#52c41a', fontSize: '20px' }}>
                    {getFormattedPrice(booking.serviceTotalPriceAfter)}
                  </Text>
                </div>
              </div>
            )}
            {/* Extension Pricing Section - Only show if there's extension */}
            {booking.extendTotalPrice > 0 && (
              <>
                <Divider />
                <div className="extension-pricing-section">
                  <div className="payment-item">
                    <Text strong>Tổng tiền gia hạn (giá gốc)</Text>
                    <Text strong className="original-price" style={{ textDecoration: 'line-through', color: '#999' }}>
                      {getFormattedPrice(booking.extendTotalPrice)}
                    </Text>
                  </div>
                  <div className="payment-item total">
                    <Text strong>Tổng tiền gia hạn ({booking.extendDiscountPercent}% giảm giá)</Text>
                    <Text strong className="total-amount" style={{ color: '#52c41a', fontSize: '20px' }}>
                      {getFormattedPrice(booking.extendTotalPriceAfter)}
                    </Text>
                  </div>
                </div>
              </>
            )}
            <Divider />
            <div className="payment-item final-total">
              <Title level={4}>Phí bổ sung (đã giảm giá)</Title>
              <Title level={4} className="final-amount">
                {getFormattedPrice(booking.totalAmountAfter - booking.totalAmount)}
              </Title>
            </div>
          </Card>
        </Col>

        {/* Right Column - Camera and Daily Reports */}
        <Col xs={24} lg={12}>
          {/* Incident Report Section - Only show when there's an incident */}
          {booking.isIncident && (
            <Card title="Báo cáo sự cố" className="customer-incident-card">
              <div className="customer-incident-content">
                <div className="customer-incident-status-grid">
                  <div className="customer-incident-status-item">
                    <div className="customer-incident-icon-wrapper customer-incident-alert">
                      <ExclamationCircleOutlined className="customer-incident-icon" />
                    </div>
                    <div className="customer-incident-details">
                      <h4 className="customer-incident-title-text">Trạng thái sự cố</h4>
                      <div className="customer-incident-status-badge">
                        <Tag 
                          color="red" 
                          icon={<WarningOutlined />} 
                          className="customer-incident-tag"
                        >
                          Có sự cố được báo cáo
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <div className="customer-incident-status-item">
                    <div className={`customer-incident-icon-wrapper ${booking.incidentSolve ? 'customer-incident-resolved' : 'customer-incident-pending'}`}>
                      {booking.incidentSolve ? (
                        <CheckCircleOutlined className="customer-incident-icon" />
                      ) : (
                        <ExclamationCircleOutlined className="customer-incident-icon" />
                      )}
                    </div>
                    <div className="customer-incident-details">
                      <h4 className="customer-incident-title-text">Tình trạng xử lý</h4>
                      <div className="customer-incident-resolution-badge">
                        <Tag 
                          color={booking.incidentSolve ? 'green' : 'orange'}
                          icon={booking.incidentSolve ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                          className="customer-incident-resolution-tag"
                        >
                          {booking.incidentSolve ? 'Đã được giải quyết' : 'Đang xử lý'}
                        </Tag>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="customer-incident-description">
                  <div className="customer-incident-message">
                    <div className="customer-incident-message-content">
                      {booking.incidentNote && (
                        <div className="customer-incident-note-box" style={{
                          marginBottom: '16px',
                          padding: '12px 16px',
                          backgroundColor: '#fff7e6',
                          border: '1px solid #ffd591',
                          borderRadius: '8px'
                        }}>
                          <p style={{
                            margin: '0 0 8px 0',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#d46b08'
                          }}>
                            Mô tả sự cố:
                          </p>
                          <p style={{
                            margin: 0,
                            fontSize: '14px',
                            color: '#595959',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {booking.incidentNote}
                          </p>
                        </div>
                      )}
                      {!booking.incidentSolve ? (
                        <div className="customer-incident-alert-box">
                          <p className="customer-incident-text">
                            <strong>⚠️ Sự cố đã được báo cáo:</strong>
                          </p>
                          <p className="customer-incident-description-text">
                            Booking này đã có sự cố được báo cáo và hiện đang trong quá trình xử lý. 
                            Vui lòng liên hệ với nhân viên để biết thêm thông tin chi tiết.
                          </p>
                        </div>
                      ) : (
                        <div className="customer-incident-resolved-box">
                          <p className="customer-incident-resolved-text">
                            <strong>✅ Sự cố đã được giải quyết thành công</strong>
                          </p>
                          <p className="customer-incident-resolution-description">
                            Tất cả các vấn đề liên quan đến booking này đã được xử lý hoàn tất.
                          </p>
                          <div style={{
                            marginTop: '12px',
                            padding: '12px 16px',
                            backgroundColor: booking.refunded ? '#f6ffed' : '#fff2e8',
                            border: `1px solid ${booking.refunded ? '#b7eb8f' : '#ffd591'}`,
                            borderRadius: '8px'
                          }}>
                            <p style={{
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: booking.refunded ? '#52c41a' : '#d46b08'
                            }}>
                              {booking.refunded ? (
                                <>💰 Bạn đã được bồi thường</>
                              ) : (
                                <>❌ Không được bồi thường</>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Live Camera */}
          <Card title="Camera trực tiếp" className="camera-card">
            <div className="camera-container">
              <div className="camera-placeholder">
                <VideoCameraOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                <Text type="secondary">
                  {booking?.status === "IN_PROGRESS" 
                    ? "Nhấn để xem camera trực tiếp" 
                    : "Camera chỉ khả dụng khi booking đang thực hiện"}
                </Text>
              </div>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                className="camera-button"
                disabled={booking?.status !== "IN_PROGRESS"}
                style={{
                  backgroundColor: booking?.status !== "IN_PROGRESS" ? "#d9d9d9" : undefined,
                  borderColor: booking?.status !== "IN_PROGRESS" ? "#d9d9d9" : undefined,
                  color: booking?.status !== "IN_PROGRESS" ? "#ffffff" : undefined,
                  cursor: booking?.status !== "IN_PROGRESS" ? "not-allowed" : undefined
                }}
                onClick={booking?.status === "IN_PROGRESS" ? handleOpenCamera : undefined}
              >
                Bật camera
              </Button>
            </div>
            {/* <div className="camera-info">
              <Text type="secondary">Camera hoạt động 24/7 trong thời gian gửi gài</Text>
              <br />
              <Text type="secondary">Chỉ người sở hữu mới đăng nhập thành công.</Text>
              <br />
              <Text type="secondary">Chế động có thể xem thống tin thời gian thực.</Text>
              <br />
              <Text type="secondary">Bấm phát để xem hamster của bạn sẽ đang hoạt động.</Text>
            </div> */}
          </Card>

          {/* Temperature and Humidity Monitoring */}
          <Card title="Theo dõi nhiệt độ & độ ẩm" className="temperature-card">
            {booking?.status === "IN_PROGRESS" && booking?.iotId ? (
              <div className="temperature-container">
                {temperatureLoading && !temperatureData ? (
                  <div className="temperature-loading">
                    <Spin size="large" />
                    <Text type="secondary" style={{ marginTop: 16 }}>Đang tải dữ liệu cảm biến...</Text>
                  </div>
                ) : temperatureData ? (
                  <>
                    <div className="temperature-metrics">
                      <div className="temperature-metric-card">
                        <div className="metric-icon temperature-icon">
                          <FireOutlined />
                        </div>
                        <div className="metric-content">
                          <Text className="metric-label">Nhiệt độ</Text>
                          <Title level={2} className="metric-value temperature-value">
                            {temperatureData.temperature}°C
                          </Title>
                        </div>
                      </div>
                      <div className="temperature-metric-card">
                        <div className="metric-icon humidity-icon">
                          <CloudOutlined />
                        </div>
                        <div className="metric-content">
                          <Text className="metric-label">Độ ẩm</Text>
                          <Title level={2} className="metric-value humidity-value">
                            {temperatureData.humidity}%
                          </Title>
                        </div>
                      </div>
                    </div>
                    <div className="temperature-info">
                      <div className="info-item">
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text type="secondary">
                          Cảm biến IoT: <strong>{booking.iotId}</strong>
                        </Text>
                      </div>
                      {/* <div className="info-item">
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text type="secondary">
                          Cập nhật tự động mỗi 2 giây
                        </Text>
                      </div> */}
                    </div>
                  </>
                ) : (
                  <div className="temperature-placeholder">
                    <CloudOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                    <Text type="secondary">Không thể tải dữ liệu cảm biến</Text>
                  </div>
                )}
              </div>
            ) : (
              <div className="temperature-disabled">
                <div className="temperature-placeholder">
                  <CloudOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                  <Text type="secondary">
                    {booking?.status !== "IN_PROGRESS" 
                      ? "Theo dõi nhiệt độ & độ ẩm chỉ khả dụng khi booking đang thực hiện" 
                      : "Không có cảm biến IoT cho booking này"}
                  </Text>
                </div>
              </div>
            )}
          </Card>

          {/* Daily Reports */}
          <Card title="Báo cáo hàng ngày từ nhân viên" className="daily-reports-card">
            {careLogsLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Đang tải báo cáo...</p>
              </div>
            ) : careLogsError ? (
              <Alert message="Lỗi" description={careLogsError} type="error" showIcon style={{ marginBottom: 16 }} />
            ) : careLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Text type="secondary">Chưa có báo cáo nào từ nhân viên</Text>
              </div>
            ) : (
              <Timeline className="daily-timeline">
                {careLogs.map((log) => (
                  <Timeline.Item
                    key={log.logId}
                    dot={<StarOutlined style={{ fontSize: 16 }} />}
                    className="timeline-item"
                  >
                    <div className="report-date">
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      {new Date(log.logDate).toLocaleDateString("vi-VN")} - {log.logTime.slice(0, 8)}
                    </div>
                    <div className="report-content">
                      <Text>{log.report}</Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Nhân viên: {log.staffName} | Chuồng: {log.cageName}
                      </Text>
                    </div>
                    {log.photoUrl && (
                      <div className="report-image" style={{ marginTop: 12 }}>
                        <Image
                          width={300}
                          height={200}
                          src={log.photoUrl}
                          alt={`Care log ${log.logDate}`}
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
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </Card>
            <br/>
          {/* Check-in Image Section */}
          {booking.checkInImage && (
            <Card title="Hình ảnh check-in" className="checkin-image-card">
              <div className="checkin-image-container">
                <Image
                  width="100%"
                  height={300}
                  src={booking.checkInImage}
                  alt="Check-in"
                  style={{
                    borderRadius: 8,
                    objectFit: "cover",
                  }}
                  placeholder={
                    <div
                      style={{
                        width: "100%",
                        height: 300,
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
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <Text type="secondary">Hình ảnh được chụp khi hamster check-in vào chuồng</Text>
                </div>
              </div>
            </Card>
          )}
            <br/>
          {/* Check-out Image Section */}
          {booking.checkOutImage && (
            <Card title="Hình ảnh check-out" className="checkout-image-card">
              <div className="checkout-image-container">
                <Image
                  width="100%"
                  height={300}
                  src={booking.checkOutImage}
                  alt="Check-out"
                  style={{
                    borderRadius: 8,
                    objectFit: "cover",
                  }}
                  placeholder={
                    <div
                      style={{
                        width: "100%",
                        height: 300,
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
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <Text type="secondary">Hình ảnh được chụp khi hamster check-out khỏi chuồng</Text>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* Cancel Booking Button - Only show if booking can be cancelled */}
      {booking && ["BOOKED"].includes(booking.status) && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Button
            type="primary"
            danger
            size="large"
            onClick={handleCancelBooking}
            style={{
              minWidth: 200,
              height: 48,
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            Hủy booking
          </Button>
        </div>
      )}

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
          <div className="video-container">
            <video ref={videoRef} style={{ width: "100%", height: "400px" }} controls />
          </div>
        )}
      </Modal>

      {/* Grooming Service Modal */}
      <Modal
        title={
          <Space>
            <ScissorOutlined style={{ color: "#ff7a45" }} />
            Chọn dịch vụ làm đẹp
          </Space>
        }
        open={isGroomingModalVisible}
        onCancel={handleCloseGroomingModal}
        width={600}
        footer={[
          <Button key="cancel" onClick={handleCloseGroomingModal}>
            Hủy
          </Button>,
          <Button
            key="add"
            type="primary"
            loading={addingService}
            disabled={selectedServiceIds.length === 0 || !selectedDate || groomingServices.length === 0}
            onClick={handleAddServiceToBooking}
            icon={<ScissorOutlined />}
          >
            Đặt {selectedServiceIds.length > 0 ? `${selectedServiceIds.length} ` : ""}dịch vụ
          </Button>,
        ]}
        className="grooming-modal"
      >
        <div className="grooming-modal-content">
          {groomingLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
              <p style={{ marginTop: 16 }}>Đang tải danh sách dịch vụ...</p>
            </div>
          ) : (
            <>
              <div className="service-selection">
                <Title level={5}>
                  Chọn dịch vụ làm đẹp cho {booking?.species}:
                </Title>
                <Text type="secondary" style={{ fontSize: 12, marginBottom: 16, display: "block" }}>
                  * Có thể chọn nhiều dịch vụ cùng lúc (tổng thời gian không quá 60 phút)
                </Text>
                {groomingServices.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <Text type="secondary">
                      Hiện tại không có dịch vụ làm đẹp nào dành cho loài {booking?.species}
                    </Text>
                  </div>
                ) : (
                  <Checkbox.Group
                    value={selectedServiceIds}
                    onChange={(checkedValues: string[]) => {
                      // Calculate total duration of selected services
                      const totalDuration = checkedValues.reduce((total, serviceId) => {
                        const service = groomingServices.find(s => s.id === serviceId);
                        return total + (service?.durationMinutes || 0);
                      }, 0);

                      // Check if total duration exceeds 60 minutes
                      if (totalDuration > 60) {
                        message.warning("Tổng thời gian của các dịch vụ không được vượt quá 60 phút!");
                        return;
                      }

                      setSelectedServiceIds(checkedValues);
                    }}
                    className="service-checkbox-group"
                    style={{ width: "100%" }}
                  >
                    <List
                      dataSource={groomingServices}
                      renderItem={(service) => (
                        <List.Item className="service-list-item">
                          <Checkbox value={service.id} className="service-checkbox">
                            <div className="service-info">
                              <div className="service-header">
                                <Text strong>{service.serviceName}</Text>
                                <Tag color="blue">{service.displayPrice}</Tag>
                              </div>
                              <Text type="secondary" className="service-description">
                                {service.description}
                              </Text>
                              <Text type="secondary" className="service-duration">
                                Thời gian: {service.durationMinutes} phút
                              </Text>
                            </div>
                          </Checkbox>
                        </List.Item>
                      )}
                    />
                  </Checkbox.Group>
                )}
                
                {/* Display total duration */}
                {selectedServiceIds.length > 0 && (
                  <div style={{ marginTop: 16, padding: "12px", backgroundColor: "#f0f5ff", borderRadius: "8px" }}>
                    <Text>
                      Tổng thời gian đã chọn:{" "}
                      <Text strong style={{ color: selectedServiceIds.reduce((total, id) => {
                        const service = groomingServices.find(s => s.id === id);
                        return total + (service?.durationMinutes || 0);
                      }, 0) > 60 ? "#ff4d4f" : "#1890ff" }}>
                        {selectedServiceIds.reduce((total, id) => {
                          const service = groomingServices.find(s => s.id === id);
                          return total + (service?.durationMinutes || 0);
                        }, 0)} phút
                      </Text>
                      {" / 60 phút"}
                    </Text>
                  </div>
                )}
              </div>

              <Divider />

              <div className="date-selection">
                <Title level={5}>Chọn ngày thực hiện:</Title>
                <DatePicker
                  placeholder="Chọn ngày"
                  value={selectedDate ? dayjs(selectedDate) : null}
                  onChange={(date) => setSelectedDate(date ? date.format("YYYY-MM-DD") : "")}
                  disabledDate={disabledDate}
                  style={{ width: "100%" }}
                />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
                  * Chỉ có thể chọn ngày trong khoảng thời gian gửi gài. Tất cả dịch vụ sẽ được thực hiện trong cùng một ngày.
                </Text>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Cancel Booking Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: 20 }} />
            <span>Xác nhận hủy booking</span>
          </div>
        }
        open={isCancelModalVisible}
        onCancel={handleCloseCancelModal}
        width={500}
        footer={[
          <Button key="cancel" onClick={handleCloseCancelModal}>
            Quay lại
          </Button>,
          <Button key="confirm" type="primary" danger loading={cancelLoading} onClick={handleConfirmCancel}>
            Xác nhận hủy
          </Button>,
        ]}
      >
        <div style={{ padding: "16px 0" }}>
          <p style={{ fontSize: 16, marginBottom: 16 }}>Bạn có chắc chắn muốn hủy booking này không?</p>

          {(() => {
            const refundInfo = getRefundInfo();
            if (!refundInfo) return null;

            return (
              <div
                style={{
                  backgroundColor: "#f6f8fa",
                  padding: 16,
                  borderRadius: 8,
                  border: "1px solid #e1e5e9",
                }}
              >
                <Title level={5} style={{ marginBottom: 12, color: "#1890ff" }}>
                  Thông tin hoàn tiền:
                </Title>

                {refundInfo.policyDescription && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      backgroundColor: "#e6f7ff",
                      borderRadius: 6,
                      border: "1px solid #91d5ff",
                    }}
                  >
                    <Text style={{ color: "#096dd9" }}>
                      📋 Chính sách: {refundInfo.policyDescription}
                    </Text>
                  </div>
                )}

                <div style={{ marginBottom: 8 }}>
                  <Text strong>Thời gian trước check-in: </Text>
                  <Text>{refundInfo.hoursBeforeCheckIn} giờ ({refundInfo.daysBeforeCheckIn} ngày)</Text>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <Text strong>Tổng tiền đã thanh toán: </Text>
                  <Text>{getFormattedPrice(booking?.totalAmountAfter || 0)}</Text>
                </div>

                {refundInfo.isRefunded ? (
                  <>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Phần trăm hoàn tiền: </Text>
                      <Text style={{ color: "#52c41a" }}>{refundInfo.refundPercentage}%</Text>
                    </div>
                    <div>
                      <Text strong>Số tiền hoàn lại: </Text>
                      <Text style={{ color: "#52c41a", fontSize: 16, fontWeight: 500 }}>
                        {getFormattedPrice(refundInfo.refundAmount)}
                      </Text>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: "#fff2e8",
                      borderRadius: 6,
                      border: "1px solid #ffec3d",
                    }}
                  >
                    <Text style={{ color: "#d46b08" }}>
                      ⚠️ Không đủ điều kiện hoàn tiền theo chính sách hủy booking
                    </Text>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
};

export default BoardingDetail;
