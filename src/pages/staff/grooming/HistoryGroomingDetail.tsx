import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  message,
  Spin,
  Button,
  Tag,
  Upload,
  Card,
  Descriptions,
  Image,
  Typography,
  Row,
  Col,
  Divider,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  UploadOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ScissorOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import api from "../../../config/axios";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../config/firebase";
import "./HistoryGroomingDetail.scss";
import dayjs from "dayjs";
import { getFormattedPrice } from "../../../utils/formatPrice";

const { Title, Text } = Typography;
const { Option } = Select;

interface Staff {
  id: string;
  fullName?: string;
}

interface ServiceItem {
  id: string;
  serviceId?: string;
  serviceName?: string;
  serviceComboName?: string;
  price: number;
}

interface GroomingDetail {
  id: string;
  customerName: string;
  hamsterName: string;
  appointmentTime: string;
  status: string;
  totalAmount: number;
  totalAmountAfter: number;
  additionalAmount?: number;
  notes?: string;
  checkInImage?: string;
  checkoutImage?: string;
  slotStart?: string;
  slotEnd?: string;
  createdAt: string;
  staff?: Staff;
  speciesId?: string;
  items: ServiceItem[];
}

interface Service {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  displayPrice: string;
  isActive: boolean;
}

const HistoryGroomingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<GroomingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [checkoutUploading, setCheckoutUploading] = useState(false);
  const [groomingServices, setGroomingServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [, setCheckOutImageUrl] = useState<string | null>(null);

  // ======================= FETCH =======================
  const fetchServicesBySpecies = useCallback(async (speciesId: string) => {
    try {
      const res = await api.get(`/api/services/species/${speciesId}`);
      if (res.data.code === 200) {
        const filtered = res.data.data.filter((s: Service) => s.serviceType === "GROOMING");
        setGroomingServices(filtered);
      }
    } catch {
      message.error("Không thể tải danh sách dịch vụ theo loài!");
    }
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/api/appointment/${id}`);
      if (res.data.code === 200) {
        const data: GroomingDetail = res.data.data;
        setDetail(data);
        if (data.speciesId) fetchServicesBySpecies(data.speciesId);
      } else message.error(res.data.message);
    } catch {
      message.error("Lỗi khi tải chi tiết grooming!");
    } finally {
      setLoading(false);
    }
  }, [id, fetchServicesBySpecies]);

  useEffect(() => {
    document.title = "Chi tiết Grooming";
    fetchDetail();
  }, [fetchDetail]);

  // ======================= STATUS =======================
  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      BOOKED: "gold",
      CHECKED_IN: "processing",
      IN_PROGRESS: "cyan",
      CHECKOUT: "success",
      CANCELLED: "error",
    };
    const textMap: Record<string, string> = {
      BOOKED: "Đã đặt",
      CHECKED_IN: "Đã check-in",
      IN_PROGRESS: "Đang thực hiện",
      CHECKOUT: "Hoàn tất",
      CANCELLED: "Đã hủy",
    };
    return (
      <Tag color={colorMap[status] || "default"} style={{ fontWeight: 600, fontSize: "14px" }}>
        {textMap[status] || status}
      </Tag>
    );
  };

  // ======================= CHECK-IN =======================
  const handleUploadCheckIn = async (file: File) => {
    if (!id) return;
    setUploading(true);
    try {
      const fileRef = ref(storage, `checkin/${id}-${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await api.post(`/api/appointment/check-in`, {
        appointmentId: id,
        checkInImage: url,
      });
      message.success("Check-in thành công!");
      fetchDetail();
    } catch {
      message.error("Lỗi khi upload ảnh check-in!");
    } finally {
      setUploading(false);
    }
  };

  // ======================= IN PROGRESS =======================
  const handleSetInProgress = async () => {
    if (!id) return;
    try {
      await api.patch(`/api/appointment/${id}`, { status: "IN_PROGRESS" });
      message.success("Cập nhật trạng thái: Đang thực hiện!");
      fetchDetail();
    } catch {
      message.error("Không thể cập nhật trạng thái!");
    }
  };

  // ======================= ADD SERVICE =======================
  const handleAddServices = async () => {
    if (!id || selectedServices.length === 0) return;

    const selectedItems = groomingServices
      .filter((s) => selectedServices.includes(s.id))
      .map((s) => ({
        serviceId: s.id,
        price: parseFloat(s.displayPrice),
      }));

    const additionalAmount = selectedItems.reduce((sum, item) => sum + item.price, 0);

    try {
      await api.post("/api/appointment/add-service", {
        appointmentId: id,
        additionalAmount,
        items: selectedItems,
      });
      message.success("Đã thêm dịch vụ thành công!");
      setSelectedServices([]);
      fetchDetail();
    } catch {
      message.error("Không thể thêm dịch vụ!");
    }
  };

  // ======================= CHECK-OUT =======================
  const handleUploadCheckOut = async (file: File) => {
    if (!id || !detail) return;
    setCheckoutUploading(true);
    try {
      const fileRef = ref(storage, `checkout/${id}-${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setCheckOutImageUrl(url);

      // Tính additionalAmount (nếu có)
      const additionalAmount = detail.additionalAmount || 0;

      // Gọi API mới /appointment/check-out
      const res = await api.post("/api/appointment/check-out", {
        appointmentId: id,
        checkOutImage: url,
        paymentMethod: "PAYOS",
        additionalAmount,
      });

      if (res.data.code === 200 && res.data.data?.paymentUrl) {
        message.success("Tạo link thanh toán thành công!");
        window.location.href = res.data.data.paymentUrl;
        fetchDetail();
      } else {
        message.success("Check-out thành công!");
        fetchDetail();
      }
    } catch {
      message.error("Không thể thực hiện check-out!");
    } finally {
      setCheckoutUploading(false);
    }
  };

  // ======================= UI =======================
  if (loading)
    return (
      <div className="loading-spinner-container">
        <Spin size="large" tip="Đang tải chi tiết..." />
      </div>
    );

  if (!detail)
    return (
      <div className="history-grooming-detail-page">
        <div className="container error-container">
          <Title level={3} style={{ color: "#ff4d4f" }}>
            Không tìm thấy lịch hẹn
          </Title>
          <Button onClick={() => navigate("/STAFF/lich-dat-grooming")}>Quay lại</Button>
        </div>
      </div>
    );

  const totalPrice = (detail.totalAmountAfter || 0) + (detail.additionalAmount || 0);

  // ======================= RETURN =======================
  return (
    <div className="history-grooming-detail-page">
      <div className="container">
        <div className="detail-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/STAFF/lich-dat-grooming")}
            className="back-button"
          >
            Quay lại danh sách
          </Button>
          <div className="header-content">
            <Title level={2} className="page-title">
              <ScissorOutlined /> Chi tiết Lịch Grooming
            </Title>
            <Text className="booking-id">ID: {detail.id}</Text>
          </div>
          <div className="header-status">{getStatusTag(detail.status)}</div>
        </div>

        <Row gutter={[24, 24]}>
          {/* ---- Thông tin ---- */}
          <Col xs={24} md={14}>
            <Card bordered={false} className="info-card section-card">
              <Descriptions
                title={
                  <>
                    <IdcardOutlined /> Thông tin Lịch hẹn
                  </>
                }
                bordered
                column={1}
                size="middle"
              >
                <Descriptions.Item label="Khách hàng">{detail.customerName}</Descriptions.Item>
                <Descriptions.Item label="Hamster">{detail.hamsterName}</Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn">
                  {dayjs(detail.appointmentTime).format("DD/MM/YYYY")}
                </Descriptions.Item>
                {detail.slotStart && (
                  <Descriptions.Item label="Khung giờ">
                    <Tag color="blue">
                      {detail.slotStart} - {detail.slotEnd}
                    </Tag>
                  </Descriptions.Item>
                )}
                {detail.staff && <Descriptions.Item label="Nhân viên">{detail.staff.fullName}</Descriptions.Item>}
              </Descriptions>
            </Card>

            {/* ---- Dịch vụ ---- */}
            <Card className="services-card section-card" bordered={false}>
              <Title level={4}>
                <ScissorOutlined /> Dịch vụ đã chọn
              </Title>
              {detail.items.map((item) => (
                <div key={item.id} className="service-item">
                  <Text strong>{item.serviceName}</Text>
                  <Text className="service-price">{getFormattedPrice(item.price)}</Text>
                </div>
              ))}
              <Divider />
              <Title level={5}>Chọn thêm dịch vụ Grooming</Title>
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="Chọn dịch vụ Grooming"
                value={selectedServices}
                onChange={setSelectedServices}
              >
                {groomingServices.map((service) => (
                  <Option key={service.id} value={service.id}>
                    {service.serviceName} ({getFormattedPrice(service.displayPrice)})
                  </Option>
                ))}
              </Select>
              <Button
                type="primary"
                style={{ marginTop: 12 }}
                disabled={selectedServices.length === 0}
                onClick={handleAddServices}
              >
                Thêm dịch vụ đã chọn
              </Button>
            </Card>
          </Col>

          {/* ---- Thanh toán & Hình ảnh ---- */}
          <Col xs={24} md={10}>
            <Card className="payment-card section-card" bordered={false}>
              <Title level={4}>
                <DollarOutlined /> Thanh toán
              </Title>
              <Descriptions column={1}>
                <Descriptions.Item label="Tiền ban đầu (đã giảm)">
                  {getFormattedPrice(detail.totalAmountAfter)}
                </Descriptions.Item>
                <Descriptions.Item label="Dịch vụ bổ sung">
                  {getFormattedPrice(detail.additionalAmount || 0)}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng thanh toán">
                  <Text strong>{getFormattedPrice(totalPrice)}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* ---- Check-in ---- */}
            <Card className="image-card section-card" bordered={false}>
              <Title level={4}>
                <ClockCircleOutlined /> Check-in
              </Title>
              {detail.checkInImage ? (
                <Image src={detail.checkInImage} width="100%" />
              ) : detail.status === "BOOKED" ? (
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleUploadCheckIn(file);
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />} type="primary" block loading={uploading}>
                    Tải ảnh Check-in
                  </Button>
                </Upload>
              ) : (
                <Text type="secondary" italic>
                  Chưa có ảnh check-in.
                </Text>
              )}

              {detail.status === "CHECKED_IN" && (
                <Button type="primary" block onClick={handleSetInProgress} style={{ marginTop: 12 }}>
                  Đang thực hiện
                </Button>
              )}
            </Card>

            {/* ---- Check-out ---- */}
            {detail.status === "IN_PROGRESS" ? (
              <Card className="image-card section-card" bordered={false}>
                <Title level={4}>
                  <CheckCircleOutlined /> Check-out
                </Title>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleUploadCheckOut(file);
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />} type="primary" block size="large" loading={checkoutUploading}>
                    Tải ảnh Check-out & Thanh toán
                  </Button>
                </Upload>
                <Text type="secondary" style={{ display: "block", textAlign: "center", marginTop: 8 }}>
                  (Chụp ảnh hamster sau khi hoàn tất dịch vụ)
                </Text>
              </Card>
            ) : (
              detail.checkoutImage && (
                <Card className="image-card section-card" bordered={false}>
                  <Title level={4}>
                    <CheckCircleOutlined /> Check-out
                  </Title>
                  <Image src={detail.checkoutImage} width="100%" />
                </Card>
              )
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HistoryGroomingDetail;
