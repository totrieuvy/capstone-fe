// TrackGroomingDetail.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Spin, Button, Tag, Card, Descriptions, Image, Typography, Row, Col, Divider } from "antd";
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ScissorOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import api from "../../../../../config/axios";
import dayjs from "dayjs";
import { getFormattedPrice } from "../../../../../utils/formatPrice";
import "./TrackGroomingDetail.scss";

const { Title, Text } = Typography;

interface Staff {
  id: string;
  fullName: string;
}

interface ServiceItem {
  id: string;
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
  items: ServiceItem[];
}

const TrackGroomingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<GroomingDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/api/appointment/${id}`);
      if (res.data.code === 200) {
        setDetail(res.data.data);
      } else {
        message.error(res.data.message || "Không tìm thấy lịch Grooming");
      }
    } catch {
      message.error("Lỗi tải dữ liệu Grooming");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    document.title = "Chi tiết Grooming";
    fetchDetail();
  }, [fetchDetail]);

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
    return <Tag color={colorMap[status] || "default"}>{textMap[status] || status}</Tag>;
  };

  if (loading)
    return (
      <div className="tgd-loading">
        <Spin size="large" tip="Đang tải chi tiết Grooming..." />
      </div>
    );

  if (!detail)
    return (
      <div className="tgd-empty">
        <Card>
          <Title level={4} style={{ color: "#ff4d4f" }}>
            Không tìm thấy lịch Grooming
          </Title>
          <Button onClick={() => navigate(-1)}>Quay lại</Button>
        </Card>
      </div>
    );

  const totalServicePrice = detail.items.reduce((sum, it) => sum + it.price, 0);
  const totalPay = (detail.totalAmountAfter || 0) + (detail.additionalAmount || 0);

  return (
    <div className="track-grooming-detail-page">
      <div className="tgd-container">
        <div className="tgd-header">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="tgd-back-btn">
            Quay lại
          </Button>
          <div className="tgd-title">
            <Title level={3} className="tgd-page-title">
              <ScissorOutlined /> Chi tiết Lịch Grooming
            </Title>
            <Text className="tgd-id">Mã: {detail.id}</Text>
          </div>
          <div className="tgd-status">{getStatusTag(detail.status)}</div>
        </div>

        <Row gutter={[24, 24]}>
          {/* LEFT COLUMN */}
          <Col xs={24} md={14}>
            <Card className="tgd-card">
              <Descriptions
                title={
                  <>
                    <IdcardOutlined /> Thông tin lịch hẹn
                  </>
                }
                bordered
                column={1}
              >
                <Descriptions.Item label="Khách hàng">{detail.customerName}</Descriptions.Item>
                <Descriptions.Item label="Hamster">{detail.hamsterName}</Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn">
                  {dayjs(detail.appointmentTime).format("DD/MM/YYYY")}
                </Descriptions.Item>
                {detail.slotStart && (
                  <Descriptions.Item label="Khung giờ">
                    {detail.slotStart} - {detail.slotEnd}
                  </Descriptions.Item>
                )}
                {detail.staff && <Descriptions.Item label="Nhân viên">{detail.staff.fullName}</Descriptions.Item>}
                <Descriptions.Item label="Ghi chú">
                  {detail.notes || <Text type="secondary">Không có</Text>}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="tgd-card" style={{ marginTop: 16 }}>
              <Title level={4}>
                <ScissorOutlined /> Dịch vụ Grooming
              </Title>
              {detail.items.length === 0 ? (
                <Text type="secondary">Không có dịch vụ.</Text>
              ) : (
                detail.items.map((it) => (
                  <div className="tgd-service-item" key={it.id}>
                    <Text strong>{it.serviceName || it.serviceComboName}</Text>
                    <Text>{getFormattedPrice(it.price)}</Text>
                  </div>
                ))
              )}
              <Divider />
              <div className="tgd-service-summary">
                <div>Tổng tiền dịch vụ:</div>
                <div className="tgd-bold">{getFormattedPrice(totalServicePrice)}</div>
              </div>
            </Card>
          </Col>

          {/* RIGHT COLUMN */}
          <Col xs={24} md={10}>
            <Card className="tgd-card">
              <Title level={4}>
                <DollarOutlined /> Thanh toán
              </Title>
              <Descriptions column={1}>
                <Descriptions.Item label="Tiền ban đầu (đã giảm)">
                  {getFormattedPrice(detail.totalAmountAfter)}
                </Descriptions.Item>
                {detail.additionalAmount ? (
                  <Descriptions.Item label="Dịch vụ bổ sung">
                    {getFormattedPrice(detail.additionalAmount)}
                  </Descriptions.Item>
                ) : null}
                <Descriptions.Item label="Tổng thanh toán">
                  <Text strong>{getFormattedPrice(totalPay)}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Check-in */}
            {detail.checkInImage && (
              <Card className="tgd-card" style={{ marginTop: 16 }}>
                <Title level={4}>
                  <ClockCircleOutlined /> Ảnh Check-in
                </Title>
                <Image src={detail.checkInImage} width="100%" />
              </Card>
            )}

            {/* Check-out */}
            {detail.checkoutImage && (
              <Card className="tgd-card" style={{ marginTop: 16 }}>
                <Title level={4}>
                  <CheckCircleOutlined /> Ảnh Check-out
                </Title>
                <Image src={detail.checkoutImage} width="100%" />
              </Card>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default TrackGroomingDetail;
