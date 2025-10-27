import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Spin, Button, Tag, Upload, Card, Descriptions, Image, Typography, Row, Col, Divider } from "antd";
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

interface GroomingDetail {
  id: string;
  customerName: string;
  hamsterName: string;
  appointmentTime: string;
  status: string;
  totalAmount: number;
  totalAmountAfter: number;
  notes?: string;
  checkInImage?: string;
  checkoutImage?: string;
  slotStart?: string;
  slotEnd?: string;
  createdAt: string;
  staff?: { id: string; name: string };
  items: {
    id: string;
    serviceName?: string;
    serviceComboName?: string;
    price: number;
  }[];
}

const HistoryGroomingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<GroomingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await api.get(`/api/appointment/${id}`);
      if (res.data.code === 200) {
        setDetail(res.data.data);
      } else message.error(res.data.message);
    } catch {
      message.error("Lỗi khi tải chi tiết grooming!");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    document.title = "Chi tiết Grooming";
    if (id) fetchDetail();
  }, [id, fetchDetail]);

  const getStatusTag = (status: string) => {
    const key = String(status || "")
      .toUpperCase()
      .replace(/[-\s]/g, "_");

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
      <Tag color={colorMap[key] || "default"} style={{ fontWeight: 600, fontSize: "14px" }}>
        {textMap[key] || status || "Unknown"}
      </Tag>
    );
  };

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

  const totalServicePrice = detail.items.reduce((sum, item) => sum + item.price, 0);

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
          <Col xs={24} md={14}>
            <Card className="info-card section-card" bordered={false}>
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
                  {dayjs(detail.appointmentTime, "YYYY-MM-DD").format("DD/MM/YYYY")}
                </Descriptions.Item>
                {detail.slotStart && (
                  <Descriptions.Item label="Khung giờ">
                    <Tag color="blue">
                      {detail.slotStart} - {detail.slotEnd}
                    </Tag>
                  </Descriptions.Item>
                )}
                {detail.staff && <Descriptions.Item label="Nhân viên">{detail.staff.name}</Descriptions.Item>}
                <Descriptions.Item label="Ngày tạo">
                  {dayjs(detail.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                {detail.notes && (
                  <Descriptions.Item label="Ghi chú">
                    <Text italic>{detail.notes}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Card className="services-card section-card" bordered={false}>
              <Title level={4} style={{ marginBottom: 16 }}>
                <ScissorOutlined /> Dịch vụ đã chọn
              </Title>
              {detail.items.length === 0 ? (
                <Text type="secondary" italic>
                  Không có dịch vụ nào.
                </Text>
              ) : (
                detail.items.map((item) => (
                  <div key={item.id} className="service-item">
                    <Text strong>{item.serviceName || item.serviceComboName}</Text>
                    <Text className="service-price">{getFormattedPrice(item.price)}</Text>
                  </div>
                ))
              )}
              <Divider style={{ margin: "16px 0" }} />
              <div className="service-total">
                <Text strong>Tổng tiền dịch vụ:</Text>
                <Text strong className="total-value">
                  {getFormattedPrice(totalServicePrice)}
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={10}>
            <Card className="payment-card section-card" bordered={false}>
              <Title level={4} style={{ marginBottom: 16 }}>
                <DollarOutlined /> Thanh toán
              </Title>
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Tổng tiền gốc">{getFormattedPrice(detail.totalAmount)}</Descriptions.Item>
                <Descriptions.Item label="Thành tiền (sau giảm)">
                  <Text strong className="final-amount">
                    {getFormattedPrice(detail.totalAmountAfter)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="image-card section-card" bordered={false}>
              <Title level={4} style={{ marginBottom: 16 }}>
                <ClockCircleOutlined /> Check-in
              </Title>
              {detail.checkInImage ? (
                <Image src={detail.checkInImage} alt="Ảnh check-in" className="preview-img" width="100%" />
              ) : detail.status === "BOOKED" ? (
                <div className="checkin-upload">
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleUploadCheckIn(file);
                      return false;
                    }}
                    disabled={uploading}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading} type="primary" block size="large">
                      Tải ảnh Check-in
                    </Button>
                  </Upload>
                  <Text type="secondary" style={{ marginTop: 8, display: "block", textAlign: "center" }}>
                    (Chụp ảnh hamster khi bắt đầu thực hiện dịch vụ)
                  </Text>
                </div>
              ) : (
                <Text type="secondary" italic>
                  Chưa có ảnh check-in.
                </Text>
              )}

              {detail.status === "CHECKED_IN" && (
                <div className="in-progress-action">
                  <Button type="primary" size="large" block onClick={handleSetInProgress}>
                    Đang thực hiện
                  </Button>
                </div>
              )}
            </Card>

            {detail.status === "CHECKOUT" && detail.checkoutImage && (
              <Card className="image-card section-card" bordered={false}>
                <Title level={4} style={{ marginBottom: 16 }}>
                  <CheckCircleOutlined /> Check-out
                </Title>
                <Image src={detail.checkoutImage} alt="Ảnh check-out" className="preview-img" width="100%" />
              </Card>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HistoryGroomingDetail;
