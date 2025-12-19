import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Spin,
  Alert,
  Button,
  Tag,
  Descriptions,
  Avatar,
  Modal,
  Upload,
  message,
  List,
  Radio,
  Row,
  Col,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  UploadOutlined,
  CameraOutlined,
  HomeOutlined,
  EditOutlined,
  LogoutOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  FireOutlined,
  CloudOutlined,
} from "@ant-design/icons";
import { boardingService, type BookingDetail, type AvailableCage } from "../../../services/BoardingService";
import { getTemperature } from "../../../services/IotService";
import type { TemperatureData } from "../../../services/IotService";
import { storage } from "../../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { UploadProps } from "antd/es/upload/interface";
import { toast } from "react-toastify";
import "./StaffBoardingDetail.scss";

import Hls from "hls.js";
import { VideoCameraOutlined } from "@ant-design/icons";
import api from "../../../config/axios";

const BoardingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInModalVisible, setCheckInModalVisible] = useState<boolean>(false);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Cage assignment states (now part of check-in process)
  const [availableCages, setAvailableCages] = useState<AvailableCage[]>([]);
  const [selectedCageId, setSelectedCageId] = useState<string>("");
  const [cageLoading, setCageLoading] = useState<boolean>(false);
  const [healthNote, setHealthNote] = useState<string>("");

  // Check-out states
  const [checkOutModalVisible, setCheckOutModalVisible] = useState<boolean>(false);
  const [checkOutLoading, setCheckOutLoading] = useState<boolean>(false);
  const [checkOutImageFile, setCheckOutImageFile] = useState<File | null>(null);
  const [checkOutImagePreview, setCheckOutImagePreview] = useState<string>("");
  const [checkOutPaymentMethod, setCheckOutPaymentMethod] = useState<"WALLET" | "VNPAY" | "PAYOS">("VNPAY");

  // Exception handling states
  const [exceptionLoading, setExceptionLoading] = useState<boolean>(false);
  const [reportIncidentModalVisible, setReportIncidentModalVisible] = useState<boolean>(false);
  const [incidentNote, setIncidentNote] = useState<string>("");

  // Cancel booking states
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState<boolean>(false);

  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Temperature monitoring state
  const [temperatureData, setTemperatureData] = useState<TemperatureData | null>(null);
  const [temperatureLoading, setTemperatureLoading] = useState(false);
  const temperatureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);

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
      setError("Không thể tải thông tin chi tiết booking. Vui lòng thử lại.");
      console.error("Error fetching booking detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemperature = useCallback(async () => {
    if (!bookingDetail?.iotId) return;

    try {
      const tempData = await getTemperature(bookingDetail.iotId);
      setTemperatureData(tempData);
    } catch (err) {
      console.warn("Failed to fetch temperature data:", err);
    }
  }, [bookingDetail?.iotId]);

  // Update temperature data every 2 seconds
  useEffect(() => {
    if (bookingDetail?.iotId && bookingDetail?.status === "IN_PROGRESS") {
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
  }, [bookingDetail?.iotId, bookingDetail?.status, fetchTemperature]);

  const handleOpenCamera = async () => {
    if (!bookingDetail?.cameraId) {
      toast.warning("Chưa gắn camera!");
      return;
    }

    setIsModalLoading(true);
    setIsVideoModalVisible(true);

    try {
      const response = await api.get(`/api/camera/play?cameraId=${bookingDetail.cameraId}`);

      const result = response.data;

      if (result.code === 200 && result.data?.url) {
        setHlsUrl(result.data.url);
      } else {
        throw new Error("Invalid camera response");
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể mở camera");
      setIsVideoModalVisible(false);
    } finally {
      setIsModalLoading(false);
    }
  };

  useEffect(() => {
    if (hlsUrl && videoRef.current) {
      const video = videoRef.current;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsInstanceRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        video.play().catch(() => {});
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

  // Handle booking exception confirmation
  const handleShowReportIncidentModal = () => {
    setReportIncidentModalVisible(true);
  };

  // Handle booking exception
  const handleBookingException = async () => {
    if (!bookingId) return;

    // Validate incident note
    if (!incidentNote.trim()) {
      toast.error("Vui lòng nhập mô tả sự cố", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setExceptionLoading(true);
      await boardingService.handleBookingException(bookingId, { incidentNote: incidentNote.trim() });

      // Show success toast
      toast.success("Đã gửi báo cáo sự cố", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Close the modal and reset incident note
      setReportIncidentModalVisible(false);
      setIncidentNote("");

      // Re-fetch booking details to update the UI
      await fetchBookingDetail(bookingId);
    } catch (err) {
      console.error("Error handling booking exception:", err);
      toast.error("Có lỗi xảy ra khi báo cáo sự cố. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setExceptionLoading(false);
    }
  };

  // Handle cancel booking (update status to NO_SHOW)
  const handleCancelBooking = () => {
    setIsCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingId) return;

    try {
      setCancelLoading(true);
      await boardingService.updateBookingStatus(bookingId, "NO_SHOW");

      // Show success toast
      toast.success("Hủy lịch thành công", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Close modal
      setIsCancelModalVisible(false);

      // Re-fetch booking details to update the UI
      await fetchBookingDetail(bookingId);
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.error("Có lỗi xảy ra khi hủy lịch. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalVisible(false);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      BOOKED: "cyan",
      IN_PROGRESS: "blue",
      CHECK_OUT: "green",
      CANCELLED: "red",
      NO_SHOW: "red",
      INCIDENT: "red",
    };
    return statusColors[status] || "default";
  };

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      BOOKED: "Đã đặt",
      IN_PROGRESS: "Đang thực hiện",
      CHECK_OUT: "Hoàn tất",
      CANCELLED: "Đã hủy",
      NO_SHOW: "Không tới",
      INCIDENT: "Có sự cố",
    };
    return statusTexts[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Handle image file selection for check-in
  const handleImageUpload: UploadProps["customRequest"] = ({ file, onSuccess, onError }) => {
    if (file instanceof File) {
      // Validate file type
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("Chỉ được phép tải lên file hình ảnh!");
        onError?.(new Error("Invalid file type"));
        return;
      }

      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Kích thước file phải nhỏ hơn 5MB!");
        onError?.(new Error("File too large"));
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
  const handleCheckOutImageUpload: UploadProps["customRequest"] = ({ file, onSuccess, onError }) => {
    if (file instanceof File) {
      // Validate file type
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("Chỉ được phép tải lên file hình ảnh!");
        onError?.(new Error("Invalid file type"));
        return;
      }

      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Kích thước file phải nhỏ hơn 5MB!");
        onError?.(new Error("File too large"));
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
      message.error("Vui lòng chọn hình ảnh check-in!");
      return;
    }

    if (!selectedCageId) {
      message.error("Vui lòng chọn chuồng!");
      return;
    }

    if (!healthNote.trim()) {
      message.error("Vui lòng nhập trạng thái sức khỏe!");
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
        cageId: selectedCageId,
        healthNote: healthNote,
      });

      // Show toast success notification
      toast.success("Check in và phân chuồng thành công!", {
        position: "top-right",
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
      setImagePreview("");
      setSelectedCageId("");
      setAvailableCages([]);
      setHealthNote("");
    } catch (error) {
      console.error("Check-in error:", error);
      message.error("Có lỗi xảy ra khi check-in. Vui lòng thử lại!");
    } finally {
      setCheckInLoading(false);
    }
  };

  // Reset modal state when closing
  const handleModalCancel = () => {
    setCheckInModalVisible(false);
    setImageFile(null);
    setImagePreview("");
    setSelectedCageId("");
    setAvailableCages([]);
    setHealthNote("");
  };

  // Fetch available cages for the booking's cage type and date range
  const fetchAvailableCages = async () => {
    if (!bookingDetail) return;

    try {
      setCageLoading(true);
      const response = await boardingService.getAvailableCagesByType({
        cageTypeId: bookingDetail.cageTypeId,
        startDate: bookingDetail.startDate,
        endDate: bookingDetail.endDate,
      });

      setAvailableCages(response);

      if (response.length === 0) {
        message.warning("Không có chuồng trống cho loại chuồng này trong khoảng thời gian đã chọn!");
      }
    } catch (error) {
      console.error("Error fetching available cages:", error);
      message.error("Không thể tải danh sách chuồng. Vui lòng thử lại!");
    } finally {
      setCageLoading(false);
    }
  };

  // Handle check-in modal opening (now includes cage fetching)
  const handleOpenCheckInModal = () => {
    setCheckInModalVisible(true);
    setImageFile(null);
    setImagePreview("");
    setSelectedCageId("");
    fetchAvailableCages();
  };

  // Handle check-out process
  const handleCheckOut = async () => {
    if (!checkOutImageFile || !bookingId) {
      message.error("Vui lòng chọn hình ảnh check-out!");
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
        paymentMethod: checkOutPaymentMethod,
      });

      // Show success message
      toast.success("Check out thành công!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setCheckOutModalVisible(false);

      // Navigate to checkout page with the response data
      navigate("/STAFF/checkout", {
        state: {
          checkOutData: checkOutResponse,
        },
      });
    } catch (error) {
      console.error("Check-out error:", error);
      message.error("Có lỗi xảy ra khi check-out. Vui lòng thử lại!");
    } finally {
      setCheckOutLoading(false);
    }
  };

  // Handle check-out modal opening
  const handleOpenCheckOutModal = () => {
    setCheckOutModalVisible(true);
    setCheckOutImageFile(null);
    setCheckOutImagePreview("");
    setCheckOutPaymentMethod("VNPAY");
  };

  // Reset check-out modal state when closing
  const handleCheckOutModalCancel = () => {
    setCheckOutModalVisible(false);
    setCheckOutImageFile(null);
    setCheckOutImagePreview("");
    setCheckOutPaymentMethod("VNPAY");
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
            description={error || "Không tìm thấy thông tin booking"}
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
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="back-button">
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
                <Descriptions.Item label="Số điện thoại">{bookingDetail.phoneNumber}</Descriptions.Item>
                <Descriptions.Item label="Email">{bookingDetail.customerMail}</Descriptions.Item>
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
                  <Avatar size={80} src={bookingDetail.hamsterProfilePicture} alt={bookingDetail.hamsterName} />
                </div>
                <div className="hamster-details">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Tên Hamster">
                      <strong>{bookingDetail.hamsterName}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Loài">{bookingDetail.species}</Descriptions.Item>
                    <Descriptions.Item label="Ngày sinh">{formatDate(bookingDetail.dob)}</Descriptions.Item>
                    <Descriptions.Item label="Cân nặng">{bookingDetail.hamsterWeight}g</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú sức khỏe">
                      {bookingDetail.healthNote || "Không có"}
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
                  <div className="cage-transfer-indicator">
                    <span className="original-value">{bookingDetail.cageTypeName}</span>
                    {bookingDetail.newCageTypeName && bookingDetail.newCageTypeName !== bookingDetail.cageTypeName && (
                      <>
                        <span className="transfer-arrow">→</span>
                        <span className="new-value cage-type">{bookingDetail.newCageTypeName}</span>
                        {/* <Tag color="blue" className="transfer-tag">Chuyển loại chuồng</Tag> */}
                      </>
                    )}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Tên chuồng">
                  <div className="cage-transfer-indicator">
                    <span className="original-value">{bookingDetail.cageName || "Chưa phân chuồng"}</span>
                    {bookingDetail.newCageName && bookingDetail.newCageName !== bookingDetail.cageName && (
                      <>
                        <span className="transfer-arrow">→</span>
                        <span className="new-value cage-name">{bookingDetail.newCageName}</span>
                        {/* <Tag color="green" className="transfer-tag">Chuyển chuồng</Tag> */}
                      </>
                    )}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getStatusColor(bookingDetail.status)}>{getStatusText(bookingDetail.status)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày bắt đầu">
                  <strong>{formatDate(bookingDetail.startDate)}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày kết thúc">
                  <strong>{formatDate(bookingDetail.endDate)}</strong>
                </Descriptions.Item>
                {bookingDetail.newEndDate &&
                  (bookingDetail.status === "IN_PROGRESS" ||
                    bookingDetail.status === "CHECK_OUT" ||
                    bookingDetail.status === "CHECK_IN") && (
                    <Descriptions.Item label="Ngày kết thúc mới (Gia hạn)">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                          minWidth: 0,
                        }}
                      >
                        <strong
                          style={{
                            color: "#52c41a",
                            whiteSpace: "nowrap",
                            fontSize: "14px",
                          }}
                        >
                          {formatDate(bookingDetail.newEndDate)}
                        </strong>
                        <Tag
                          color="orange"
                          style={{
                            margin: 0,
                            flexShrink: 0,
                          }}
                        >
                          Đã gia hạn
                        </Tag>
                      </div>
                    </Descriptions.Item>
                  )}
                {/* <Descriptions.Item label="Tổng tiền đã thanh toán">
                  <strong className="total-amount">
                    {formatPrice(bookingDetail.totalAmount)}
                  </strong>
                </Descriptions.Item> */}
                {/* <Descriptions.Item label="Phí bổ sung (đã giảm giá)">
                  <strong className="final-amount">
                    {formatPrice(bookingDetail.totalAmountAfter - bookingDetail.totalAmount)}
                  </strong>
                </Descriptions.Item> */}
                <Descriptions.Item label="Ngày tạo" span={2}>
                  {bookingDetail.createdAt ? new Date(bookingDetail.createdAt).toLocaleString("vi-VN") : "N/A"}
                </Descriptions.Item>
                {/* {bookingDetail.notes && (
                  <Descriptions.Item label="Ghi chú" span={2}>
                    <div className="notes-text">{bookingDetail.notes}</div>
                  </Descriptions.Item>
                )} */}
                {/* {bookingDetail.healthNote && (
                  <Descriptions.Item label="Ghi chú sức khỏe" span={2}>
                    <div className="health-note">
                      {bookingDetail.healthNote}
                    </div>
                  </Descriptions.Item>
                )} */}
              </Descriptions>
            </div>

            {/* Check-in and Check-out Images Section - Side by side */}
            {(bookingDetail.checkInImage || bookingDetail.checkOutImage) && (
              <div
                className="images-section"
                style={{
                  marginTop: "24px",
                  paddingTop: "20px",
                  borderTop: "1px solid #f0f0f0",
                  width: "100%",
                }}
              >
                <Row gutter={[24, 24]}>
                  {/* Check-in Image */}
                  {bookingDetail.checkInImage && (
                    <Col xs={24} md={12}>
                      <div className="checkin-image-section">
                        <h4
                          style={{
                            marginBottom: "12px",
                            color: "#262626",
                            fontWeight: 600,
                            fontSize: "16px",
                          }}
                        >
                          Hình ảnh check-in
                        </h4>
                        <div className="checkin-image-container" style={{ width: "100%" }}>
                          <img
                            src={bookingDetail.checkInImage}
                            alt="Check-in"
                            style={{
                              width: "100%",
                              height: "280px",
                              borderRadius: "8px",
                              border: "1px solid #d9d9d9",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                              display: "block",
                              objectFit: "cover",
                            }}
                            onClick={() => {
                              // Open image in a modal for better viewing
                              Modal.info({
                                title: "Hình ảnh check-in",
                                icon: null,
                                content: (
                                  <img
                                    src={bookingDetail.checkInImage}
                                    alt="Check-in"
                                    style={{ width: "100%", maxWidth: "500px" }}
                                  />
                                ),
                                width: 600,
                                okText: "Đóng",
                              });
                            }}
                          />
                        </div>
                      </div>
                    </Col>
                  )}

                  {/* Check-out Image */}
                  {bookingDetail.checkOutImage && (
                    <Col xs={24} md={12}>
                      <div className="checkout-image-section">
                        <h4
                          style={{
                            marginBottom: "12px",
                            color: "#262626",
                            fontWeight: 600,
                            fontSize: "16px",
                          }}
                        >
                          Hình ảnh check-out
                        </h4>
                        <div className="checkout-image-container" style={{ width: "100%" }}>
                          <img
                            src={bookingDetail.checkOutImage}
                            alt="Check-out"
                            style={{
                              width: "100%",
                              height: "280px",
                              borderRadius: "8px",
                              border: "1px solid #d9d9d9",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                              display: "block",
                              objectFit: "cover",
                            }}
                            onClick={() => {
                              // Open image in a modal for better viewing
                              Modal.info({
                                title: "Hình ảnh check-out",
                                icon: null,
                                content: (
                                  <img
                                    src={bookingDetail.checkOutImage}
                                    alt="Check-out"
                                    style={{ width: "100%", maxWidth: "500px" }}
                                  />
                                ),
                                width: 600,
                                okText: "Đóng",
                              });
                            }}
                          />
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            )}

            {/* Extension Information Section - Show for bookings with newEndDate */}
            {bookingDetail.newEndDate &&
              (bookingDetail.status === "IN_PROGRESS" ||
                bookingDetail.status === "CHECK_OUT" ||
                bookingDetail.status === "CHECK_IN") && (
                <div
                  className="extension-section"
                  style={{
                    marginTop: "24px",
                    paddingTop: "20px",
                    borderTop: "1px solid #f0f0f0",
                    width: "100%",
                  }}
                >
                  <h4
                    style={{
                      marginBottom: "16px",
                      color: "#262626",
                      fontWeight: 600,
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <CalendarOutlined style={{ color: "#52c41a" }} />
                    Thông tin gia hạn
                  </h4>
                  <div
                    className="extension-info"
                    style={{
                      backgroundColor: "#f6ffed",
                      border: "1px solid #b7eb8f",
                      borderRadius: "8px",
                      padding: "16px",
                    }}
                  >
                    <Descriptions column={2} size="small">
                      <Descriptions.Item label="Ngày kết thúc ban đầu">
                        <strong>{formatDate(bookingDetail.endDate)}</strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày kết thúc mới">
                        <strong style={{ color: "#52c41a" }}>{formatDate(bookingDetail.newEndDate)}</strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="Số ngày gia hạn" span={2}>
                        <strong style={{ color: "#fa8c16" }}>
                          {(() => {
                            const originalEnd = new Date(bookingDetail.endDate);
                            const newEnd = new Date(bookingDetail.newEndDate);
                            const diffTime = newEnd.getTime() - originalEnd.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return `${diffDays} ngày`;
                          })()}
                        </strong>
                      </Descriptions.Item>
                    </Descriptions>

                    {/* Cage Transfer Information */}
                    {(bookingDetail.newCageTypeName && bookingDetail.newCageTypeName !== bookingDetail.cageTypeName) ||
                    (bookingDetail.newCageName && bookingDetail.newCageName !== bookingDetail.cageName) ? (
                      <div className="cage-transfer-history">
                        <h5 className="transfer-title">
                          <HomeOutlined />
                          Chi tiết chuyển chuồng
                        </h5>
                        <div className="transfer-details">
                          {bookingDetail.newCageTypeName &&
                            bookingDetail.newCageTypeName !== bookingDetail.cageTypeName && (
                              <div className="transfer-item">
                                <span className="transfer-label">Loại chuồng:</span>
                                <span className="transfer-from">{bookingDetail.cageTypeName}</span>
                                <span className="transfer-arrow">→</span>
                                <span className="transfer-to type-change">{bookingDetail.newCageTypeName}</span>
                              </div>
                            )}
                          {bookingDetail.newCageName && bookingDetail.newCageName !== bookingDetail.cageName && (
                            <div className="transfer-item">
                              <span className="transfer-label">Tên chuồng:</span>
                              <span className="transfer-from">{bookingDetail.cageName || "Chưa phân chuồng"}</span>
                              <span className="transfer-arrow">→</span>
                              <span className="transfer-to name-change">{bookingDetail.newCageName}</span>
                            </div>
                          )}
                        </div>
                        {/* <div className="transfer-warning">
                        <p>
                          ⚠️ Hamster đã được chuyển sang chuồng mới trong quá trình gia hạn
                        </p>
                      </div> */}
                      </div>
                    ) : null}

                    <div
                      style={{
                        marginTop: "12px",
                        padding: "8px 12px",
                        backgroundColor: "#fff",
                        borderRadius: "6px",
                        border: "1px solid #d9f7be",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#389e0d",
                          fontWeight: 500,
                        }}
                      >
                        Booking đã được gia hạn thành công
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </Card>
        </div>

        {/* Services and Temperature Monitoring Section - Side by Side */}
        <div className="info-section">
          <div className="info-row">
            {/* Left Column: Additional Services */}
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
                      <div className="service-price">{formatPrice(service.price)}</div>
                    </div>
                  ))}
                  {/* <div className="services-total">
                    <strong>
                      Tổng dịch vụ: {formatPrice(
                        bookingDetail.services.reduce((sum, service) => sum + service.price, 0)
                      )}
                    </strong>
                  </div> */}
                </div>
              ) : (
                <div className="no-services">
                  <p>Không có dịch vụ bổ sung nào</p>
                </div>
              )}
            </Card>

            {/* Right Column: Temperature and Humidity Monitoring */}
            <Card
              title={
                <div className="section-title">
                  <FireOutlined />
                  <span>Theo dõi nhiệt độ & độ ẩm</span>
                </div>
              }
              className="info-card staff-temperature-card"
            >
              {bookingDetail.status === "IN_PROGRESS" && bookingDetail.iotId ? (
                <div className="staff-temperature-container">
                  {temperatureLoading && !temperatureData ? (
                    <div className="staff-temperature-loading">
                      <Spin size="large" />
                      <p style={{ marginTop: 16, color: "#666" }}>Đang tải dữ liệu cảm biến...</p>
                    </div>
                  ) : temperatureData ? (
                    <>
                      <div className="staff-temperature-metrics">
                        <div className="staff-temperature-metric-card">
                          <div className="staff-metric-icon staff-temperature-icon">
                            <FireOutlined />
                          </div>
                          <div className="staff-metric-content">
                            <div className="staff-metric-label">Nhiệt độ</div>
                            <div className="staff-metric-value staff-temperature-value">
                              {temperatureData.temperature}°C
                            </div>
                          </div>
                        </div>
                        <div className="staff-temperature-metric-card">
                          <div className="staff-metric-icon staff-humidity-icon">
                            <CloudOutlined />
                          </div>
                          <div className="staff-metric-content">
                            <div className="staff-metric-label">Độ ẩm</div>
                            <div className="staff-metric-value staff-humidity-value">
                              {temperatureData.humidity}%
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="staff-temperature-info">
                        <div className="staff-info-item">
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          <span>Cảm biến IoT: <strong>{bookingDetail.iotId}</strong></span>
                        </div>
                        {/* <div className="info-item">
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          <span>Cập nhật tự động mỗi 2 giây</span>
                        </div> */}
                      </div>
                    </>
                  ) : (
                    <div className="staff-temperature-placeholder">
                      <CloudOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                      <p>Không thể tải dữ liệu cảm biến</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="staff-temperature-disabled">
                  <div className="staff-temperature-placeholder">
                    <CloudOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                    <p>
                      {bookingDetail.status !== "IN_PROGRESS" 
                        ? "Theo dõi nhiệt độ & độ ẩm chỉ khả dụng khi booking đang thực hiện" 
                        : "Không có cảm biến IoT cho booking này"}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Payment Details Section */}
        <div className="info-section">
          <Card
            title={
              <div className="section-title">
                <DollarOutlined />
                <span>Chi tiết thanh toán</span>
              </div>
            }
            className="info-card payment-details-card"
          >
            <div className="payment-details-simple">
              {/* Main Payment */}
              <div className="payment-row main">
                <span className="payment-label">Tổng tiền đã thanh toán</span>
                <span className="payment-value primary">{formatPrice(bookingDetail.totalAmount)}</span>
              </div>

              {/* Grooming Services Sub-section */}
              {bookingDetail.serviceTotalPrice > 0 && (
                <div className="payment-subsection grooming-subsection">
                  <div className="subsection-header">
                    <h5>Dịch vụ làm đẹp</h5>
                  </div>
                  <div className="payment-row original">
                    <span className="payment-label">Giá gốc</span>
                    <span className="payment-value strikethrough">{formatPrice(bookingDetail.serviceTotalPrice)}</span>
                  </div>
                  <div className="payment-row final">
                    <span className="payment-label">
                      Tổng tiền dịch vụ làm đẹp ({bookingDetail.serviceDiscountPercent}% giảm giá)
                    </span>
                    <span className="payment-value success">{formatPrice(bookingDetail.serviceTotalPriceAfter)}</span>
                  </div>
                </div>
              )}

              {/* Extension Sub-section */}
              {bookingDetail.extendTotalPrice > 0 && (
                <div className="payment-subsection extension-subsection">
                  <div className="subsection-header">
                    <h5>Gia hạn</h5>
                  </div>
                  <div className="payment-row original">
                    <span className="payment-label">Giá gốc</span>
                    <span className="payment-value strikethrough">{formatPrice(bookingDetail.extendTotalPrice)}</span>
                  </div>
                  <div className="payment-row final">
                    <span className="payment-label">
                      Tổng tiền gia hạn ({bookingDetail.extendDiscountPercent}% giảm giá)
                    </span>
                    <span className="payment-value success">{formatPrice(bookingDetail.extendTotalPriceAfter)}</span>
                  </div>
                </div>
              )}

              {/* Total Additional Fee */}
              <div className="payment-row total">
                <span className="payment-label">Phí bổ sung (đã giảm giá)</span>
                <span className="payment-value total-value">
                  {formatPrice(bookingDetail.totalAmountAfter - bookingDetail.totalAmount)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Fourth Section: Incident Report - Only show when there's an incident */}
        {bookingDetail.isIncident && (
          <div className="info-section">
            <Card
              title={
                <div className="section-title incident-title">
                  <WarningOutlined />
                  <span>Báo cáo sự cố</span>
                </div>
              }
              className="info-card incident-card"
            >
              <div className="incident-content">
                <div className="incident-status-grid">
                  <div className="incident-status-item">
                    <div className="incident-icon-wrapper incident-alert">
                      <ExclamationCircleOutlined className="incident-icon" />
                    </div>
                    <div className="incident-details">
                      <h4 className="incident-title-text">Trạng thái sự cố</h4>
                      <div className="incident-status-badge">
                        <Tag color="red" icon={<WarningOutlined />} className="incident-tag">
                          Có sự cố được báo cáo
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <div className="incident-status-item">
                    <div
                      className={`incident-icon-wrapper ${
                        bookingDetail.incidentSolve ? "incident-resolved" : "incident-pending"
                      }`}
                    >
                      {bookingDetail.incidentSolve ? (
                        <CheckCircleOutlined className="incident-icon" />
                      ) : (
                        <ExclamationCircleOutlined className="incident-icon" />
                      )}
                    </div>
                    <div className="incident-details">
                      <h4 className="incident-title-text">Tình trạng xử lý</h4>
                      <div className="incident-resolution-badge">
                        <Tag
                          color={bookingDetail.incidentSolve ? "green" : "orange"}
                          icon={bookingDetail.incidentSolve ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                          className="incident-resolution-tag"
                        >
                          {bookingDetail.incidentSolve ? "Đã được giải quyết" : "Đang xử lý"}
                        </Tag>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="incident-description">
                  <div className="incident-message">
                    <div className="incident-message-header">
                      <WarningOutlined className="message-icon" />
                      <h5>Thông tin sự cố</h5>
                    </div>
                    <div className="incident-message-content">
                      {bookingDetail.incidentNote && (
                        <div
                          className="incident-note-box"
                          style={{
                            marginBottom: "16px",
                            padding: "12px 16px",
                            backgroundColor: "#fff7e6",
                            border: "1px solid #ffd591",
                            borderRadius: "8px",
                          }}
                        >
                          <p
                            style={{
                              margin: "0 0 8px 0",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#d46b08",
                            }}
                          >
                            Mô tả sự cố:
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#595959",
                              lineHeight: "1.6",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {bookingDetail.incidentNote}
                          </p>
                        </div>
                      )}
                      {!bookingDetail.incidentSolve ? (
                        <div className="incident-alert-box">
                          <p className="incident-text">
                            <strong>⚠️ Sự cố đã được báo cáo:</strong>
                          </p>
                          <p className="incident-description-text">
                            Booking này đã có sự cố được báo cáo và hiện đang trong quá trình xử lý. Vui lòng theo dõi
                            và cập nhật tình trạng xử lý sự cố.
                          </p>
                          <div className="incident-action-note">
                            <p className="action-text">
                              <strong>Hành động cần thiết:</strong> Staff cần theo dõi và cập nhật trạng thái giải quyết
                              sự cố
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="incident-resolved-box">
                          <p className="incident-resolved-text">
                            <strong>✅ Sự cố đã được giải quyết thành công</strong>
                          </p>
                          <p className="incident-resolution-description">
                            Tất cả các vấn đề liên quan đến booking này đã được xử lý hoàn tất.
                          </p>
                          <div
                            style={{
                              marginTop: "12px",
                              padding: "12px 16px",
                              backgroundColor: bookingDetail.refunded ? "#f6ffed" : "#fff2e8",
                              border: `1px solid ${bookingDetail.refunded ? "#b7eb8f" : "#ffd591"}`,
                              borderRadius: "8px",
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                fontWeight: 600,
                                color: bookingDetail.refunded ? "#52c41a" : "#d46b08",
                              }}
                            >
                              {bookingDetail.refunded ? (
                                <>💰 Khách hàng đã được bồi thường</>
                              ) : (
                                <>❌ Khách hàng không được bồi thường</>
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
          </div>
        )}

        {/* Check-in Button for BOOKED bookings */}
        {bookingDetail.status === "BOOKED" && (
          <div className="info-section">
            <div
              style={{ textAlign: "center", display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}
            >
              <Button
                type="primary"
                size="large"
                icon={<CameraOutlined />}
                onClick={handleOpenCheckInModal}
                className="check-in-button"
              >
                Check In & Phân chuồng
              </Button>
              <Button
                type="primary"
                danger
                size="large"
                icon={<ExclamationCircleOutlined />}
                onClick={handleCancelBooking}
                loading={cancelLoading}
                className="cancel-booking-button"
              >
                Hủy lịch
              </Button>
            </div>
          </div>
        )}

        {/* Create Care Log Button and Check Out Button for CHECK_IN and IN_PROGRESS bookings */}
        {(bookingDetail.status === "IN_PROGRESS" || bookingDetail.status === "CHECK_IN") && (
          <div className="info-section">
            <div
              style={{ textAlign: "center", display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}
            >
              {bookingDetail.status === "IN_PROGRESS" && (
                <div className="info-section" style={{ textAlign: "center" }}>
                  <Button
                    className="camera-log-button"
                    type="primary"
                    size="large"
                    icon={<VideoCameraOutlined />}
                    onClick={handleOpenCamera}
                  >
                    Xem camera trực tiếp
                  </Button>
                </div>
              )}

              <Button
                type="primary"
                size="large"
                icon={<EditOutlined />}
                onClick={() => navigate(`/STAFF/care-log/${bookingId}`)}
                className="care-log-button"
              >
                Tạo báo cáo
              </Button>
              {bookingDetail.status === "IN_PROGRESS" && bookingDetail.isIncident === false && (
                <Button
                  type="primary"
                  danger
                  size="large"
                  onClick={handleShowReportIncidentModal}
                  icon={<WarningOutlined />}
                  className="report-incident-button"
                >
                  Báo cáo sự cố
                </Button>
              )}
              <Button
                type="primary"
                size="large"
                icon={<LogoutOutlined />}
                onClick={handleOpenCheckOutModal}
                className="check-out-button"
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
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
              disabled={!imageFile || !selectedCageId || !healthNote.trim()}
            >
              Xác nhận
            </Button>,
          ]}
          width={600}
        >
          <div className="check-in-form">
            {/* Section 1: Image Upload */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16, color: "#262626", fontWeight: 600 }}>1. Tải lên hình ảnh check-in</h4>
              <p style={{ marginBottom: 16, color: "#666" }}>
                Vui lòng tải lên hình ảnh check-in để xác nhận hamster đã được gửi vào chuồng.
              </p>

              <Upload accept="image/*" customRequest={handleImageUpload} showUploadList={false} maxCount={1}>
                <div
                  className="upload-area"
                  style={{
                    border: "2px dashed #d9d9d9",
                    borderRadius: 8,
                    padding: "40px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color 0.3s",
                    backgroundColor: "#fafafa",
                  }}
                >
                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 200,
                          marginBottom: 16,
                          borderRadius: 8,
                        }}
                      />
                      <p style={{ margin: 0, color: "#666" }}>Click để thay đổi hình ảnh</p>
                    </div>
                  ) : (
                    <div>
                      <UploadOutlined style={{ fontSize: 48, color: "#999", marginBottom: 16 }} />
                      <p style={{ margin: 0, fontSize: 16, color: "#666" }}>Click hoặc kéo thả file vào đây</p>
                      <p style={{ margin: "8px 0 0 0", fontSize: 14, color: "#999" }}>
                        Hỗ trợ: JPG, PNG, GIF (tối đa 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </Upload>
            </div>

            {/* Section 2: Health Note Input */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16, color: "#262626", fontWeight: 600 }}>
                2. Trạng thái sức khỏe <span style={{ color: "#ff4d4f" }}>*</span>
              </h4>
              <p style={{ marginBottom: 16, color: "#666" }}>
                Nhập trạng thái sức khỏe hiện tại của <strong>{bookingDetail?.hamsterName}</strong> khi check-in.
              </p>

              <Input.TextArea
                value={healthNote}
                onChange={(e) => setHealthNote(e.target.value)}
                placeholder="Nhập trạng thái sức khỏe của hamster (bắt buộc)..."
                rows={3}
                maxLength={500}
                showCount
                style={{
                  resize: "none",
                  borderRadius: 8,
                }}
              />
            </div>

            {/* Section 3: Cage Selection */}
            <div>
              <h4 style={{ marginBottom: 16, color: "#262626", fontWeight: 600 }}>3. Chọn chuồng cho hamster</h4>
              <p style={{ marginBottom: 16, color: "#666" }}>
                Chọn chuồng trống cho <strong>{bookingDetail?.hamsterName}</strong>({bookingDetail?.cageTypeName})
              </p>

              {cageLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Spin size="large" />
                  <p style={{ marginTop: 16, color: "#666" }}>Đang tải danh sách chuồng...</p>
                </div>
              ) : availableCages.length > 0 ? (
                <Radio.Group
                  value={selectedCageId}
                  onChange={(e) => setSelectedCageId(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <List
                    dataSource={availableCages}
                    renderItem={(cage) => {
                      const isInUse = cage.status === "In Use";
                      return (
                        <List.Item
                          key={cage.cageId}
                          style={{
                            padding: "12px 16px",
                            border: selectedCageId === cage.cageId ? "2px solid #1890ff" : "1px solid #f0f0f0",
                            borderRadius: 8,
                            marginBottom: 8,
                            backgroundColor: isInUse
                              ? "#fff1f0"
                              : selectedCageId === cage.cageId
                              ? "#f6ffed"
                              : "#fafafa",
                            cursor: isInUse ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease",
                            opacity: isInUse ? 0.6 : 1,
                          }}
                          onClick={() => !isInUse && setSelectedCageId(cage.cageId)}
                        >
                          <List.Item.Meta
                            avatar={<Radio value={cage.cageId} disabled={isInUse} />}
                            title={
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <HomeOutlined style={{ color: isInUse ? "#ff4d4f" : "#1890ff" }} />
                                <span style={{ color: isInUse ? "#ff4d4f" : "inherit" }}>{cage.cageName}</span>
                              </div>
                            }
                            description={
                              <Tag color={isInUse ? "red" : "green"}>
                                {cage.status === "Available" ? "Trống" : isInUse ? "Hết chỗ" : cage.status}
                              </Tag>
                            }
                          />
                        </List.Item>
                      );
                    }}
                  />
                </Radio.Group>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <HomeOutlined style={{ fontSize: 48, color: "#ccc", marginBottom: 16 }} />
                  <p style={{ color: "#666", margin: 0 }}>Không có chuồng trống cho loại chuồng này</p>
                  <p style={{ color: "#999", margin: "8px 0 0 0", fontSize: 14 }}>Thử lại sau hoặc chọn ngày khác</p>
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
              Xác nhận
            </Button>,
          ]}
          width={600}
        >
          <div className="check-out-form">
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16, color: "#262626", fontWeight: 600 }}>1. Tải lên hình ảnh check-out</h4>
              <p style={{ marginBottom: 16, color: "#666" }}>
                Vui lòng tải lên hình ảnh check-out để xác nhận hamster đã được trả về cho khách hàng.
              </p>

              <Upload accept="image/*" customRequest={handleCheckOutImageUpload} showUploadList={false} maxCount={1}>
                <div
                  className="upload-area"
                  style={{
                    border: "2px dashed #d9d9d9",
                    borderRadius: 8,
                    padding: "40px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color 0.3s",
                    backgroundColor: "#fafafa",
                  }}
                >
                  {checkOutImagePreview ? (
                    <div>
                      <img
                        src={checkOutImagePreview}
                        alt="Check-out Preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 200,
                          marginBottom: 16,
                          borderRadius: 8,
                        }}
                      />
                      <p style={{ margin: 0, color: "#666" }}>Click để thay đổi hình ảnh</p>
                    </div>
                  ) : (
                    <div>
                      <UploadOutlined style={{ fontSize: 48, color: "#999", marginBottom: 16 }} />
                      <p style={{ margin: 0, fontSize: 16, color: "#666" }}>Click hoặc kéo thả file vào đây</p>
                      <p style={{ margin: "8px 0 0 0", fontSize: 14, color: "#999" }}>
                        Hỗ trợ: JPG, PNG, GIF (tối đa 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </Upload>
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16, color: "#262626", fontWeight: 600 }}>2. Chọn phương thức thanh toán</h4>
              <p style={{ marginBottom: 16, color: "#666" }}>
                Chọn phương thức thanh toán cho khách hàng (nếu có phụ thu).
              </p>

              <Card style={{ backgroundColor: "#fafafa" }}>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <Card
                      hoverable
                      className={`payment-method-card ${checkOutPaymentMethod === "VNPAY" ? "selected" : ""}`}
                      onClick={() => setCheckOutPaymentMethod("VNPAY")}
                      style={{
                        borderRadius: 12,
                        border: checkOutPaymentMethod === "VNPAY" ? "2px solid #1890ff" : "1px solid #f0f0f0",
                        cursor: "pointer",
                        textAlign: "center",
                        height: 100,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                      }}
                      bodyStyle={{ padding: 12 }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: "#f0f0f0",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 8,
                          fontSize: 20,
                        }}
                      >
                        🏦
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#333" }}>VNPay</p>
                      {checkOutPaymentMethod === "VNPAY" && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "#1890ff",
                            color: "white",
                            borderRadius: "50%",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card
                      hoverable
                      className={`payment-method-card ${checkOutPaymentMethod === "PAYOS" ? "selected" : ""}`}
                      onClick={() => setCheckOutPaymentMethod("PAYOS")}
                      style={{
                        borderRadius: 12,
                        border: checkOutPaymentMethod === "PAYOS" ? "2px solid #1890ff" : "1px solid #f0f0f0",
                        cursor: "pointer",
                        textAlign: "center",
                        height: 100,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                      }}
                      bodyStyle={{ padding: 12 }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: "#f0f0f0",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 8,
                          fontSize: 20,
                        }}
                      >
                        💳
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#333" }}>PayOS</p>
                      {checkOutPaymentMethod === "PAYOS" && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "#1890ff",
                            color: "white",
                            borderRadius: "50%",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
              </Card>
            </div>
          </div>
        </Modal>

        {/* Report Incident Confirmation Modal */}
        <Modal
          title={
            <div className="modal-title">
              <WarningOutlined style={{ color: "#ff4d4f" }} />
              <span style={{ marginLeft: 8 }}>Xác nhận báo cáo sự cố</span>
            </div>
          }
          open={reportIncidentModalVisible}
          onCancel={() => setReportIncidentModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setReportIncidentModalVisible(false)}>
              Hủy
            </Button>,
            <Button
              key="confirm"
              type="primary"
              danger
              loading={exceptionLoading}
              onClick={handleBookingException}
              icon={<WarningOutlined />}
            >
              Xác nhận báo cáo
            </Button>,
          ]}
          width={500}
          centered
        >
          <div style={{ padding: "20px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
                padding: "16px",
                backgroundColor: "#fff2f0",
                border: "1px solid #ffccc7",
                borderRadius: "8px",
              }}
            >
              <ExclamationCircleOutlined
                style={{
                  fontSize: "24px",
                  color: "#ff4d4f",
                }}
              />
              <div>
                <h4
                  style={{
                    margin: "0 0 8px 0",
                    color: "#cf1322",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  Cảnh báo quan trọng
                </h4>
                <p
                  style={{
                    margin: 0,
                    color: "#8c8c8c",
                    fontSize: "14px",
                  }}
                >
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "16px",
                  color: "#262626",
                  fontWeight: 500,
                }}
              >
                Bạn có chắc chắn muốn báo cáo sự cố cho booking này?
              </p>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#595959",
                }}
              >
                <strong>Booking ID:</strong> {bookingDetail?.bookingId}
              </p>
              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "14px",
                  color: "#595959",
                }}
              >
                <strong>Hamster:</strong> {bookingDetail?.hamsterName}
              </p>

              <div style={{ marginTop: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#262626",
                  }}
                >
                  Mô tả sự cố <span style={{ color: "#ff4d4f" }}>*</span>
                </label>
                <Input.TextArea
                  value={incidentNote}
                  onChange={(e) => setIncidentNote(e.target.value)}
                  placeholder="Nhập mô tả chi tiết về sự cố..."
                  rows={4}
                  maxLength={500}
                  showCount
                  style={{
                    resize: "none",
                  }}
                />
              </div>
            </div>
            <br />
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fff7e6",
                border: "1px solid #ffd591",
                borderRadius: "6px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#d46b08",
                  lineHeight: "1.5",
                }}
              >
                <strong>Lưu ý:</strong> Sau khi báo cáo sự cố, booking sẽ được đánh dấu là có sự cố và sẽ cần được xử lý
                bởi quản lý. Vui lòng đảm bảo rằng thực sự có sự cố xảy ra trước khi xác nhận.
              </p>
            </div>
          </div>
        </Modal>

        {/* Cancel Booking Confirmation Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: 20 }} />
              <span>Xác nhận hủy lịch</span>
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
            <p style={{ fontSize: 16, marginBottom: 16 }}>Bạn có chắc chắn muốn hủy lịch booking này không?</p>
            <div
              style={{
                backgroundColor: "#fff2e8",
                padding: 16,
                borderRadius: 8,
                border: "1px solid #ffd591",
              }}
            >
              <p style={{ margin: 0, color: "#d46b08", fontWeight: 500 }}>
                ⚠️ Hành động này sẽ đánh dấu booking là "Không tới" và không thể hoàn tác.
              </p>
            </div>
          </div>
        </Modal>

        <Modal
          open={isVideoModalVisible}
          title="Camera trực tiếp"
          footer={null}
          onCancel={() => {
            setIsVideoModalVisible(false);
            setHlsUrl(null);
          }}
          width={800}
        >
          {isModalLoading ? <Spin /> : <video ref={videoRef} controls style={{ width: "100%", borderRadius: 8 }} />}
        </Modal>
      </div>
    </div>
  );
};

export default BoardingDetail;
