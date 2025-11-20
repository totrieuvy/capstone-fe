import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Spin, Button, Popconfirm, Tag, Timeline } from "antd";
import { StopOutlined, ClockCircleOutlined, ArrowLeftOutlined, CommentOutlined } from "@ant-design/icons";
import { Modal, Input, Rate } from "antd";

import api from "../../../../config/axios";
import "./TrackOrderDetail.scss";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface StatusHistory {
  status: string;
  changedAt: string;
  note: string | null;
}

interface OrderDetail {
  id: string;
  orderDate: string;
  status:
    | "PENDING"
    | "PAID"
    | "PREPARING"
    | "PENDING_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED"
    | "NOT_RECEIVED";
  totalAmount: number;
  discountPercent: number;
  shippingFee: number;
  finalAmount: number;
  items: OrderItem[];
  deliveryAddress?: string;
  paymentMethod?: string;
  deliveredAt: string | null;
  statusHistory?: StatusHistory[];
}

interface Feedback {
  feedbackId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const TrackOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [countdown, setCountdown] = useState<string>("");
  const [cancelDisabled, setCancelDisabled] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback[]>>({});

  const statusTextMap: Record<string, string> = {
    PENDING: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    PREPARING: "Đang chuẩn bị",
    PENDING_DELIVERY: "Đang giao hàng",
    DELIVERED: "Đã giao",
    CANCELLED: "Đã hủy",
    REFUNDED: "Đã hoàn tiền",
    NOT_RECEIVED: "Khách không nhận",
  };

  const statusColorMap: Record<string, string> = {
    PENDING: "orange",
    PAID: "blue",
    PREPARING: "orange",
    PENDING_DELIVERY: "cyan",
    DELIVERED: "green",
    CANCELLED: "red",
    REFUNDED: "purple",
    NOT_RECEIVED: "orange",
  };

  useEffect(() => {
    document.title = `Chi tiết đơn hàng #${orderId}`;
    if (orderId) fetchOrderDetail(orderId);
  }, [orderId]);

  useEffect(() => {
    if (order && order.status === "DELIVERED") {
      order.items.forEach((item) => fetchFeedbacks(item.productId));
    }
  }, [order]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (order && order.status === "PAID") {
      const orderTime = dayjs.utc(order.orderDate, "DD-MM-YYYY HH:mm:ss").tz("Asia/Ho_Chi_Minh");

      const updateCountdown = () => {
        const deadline = orderTime.add(12, "hour");
        const diff = deadline.diff(dayjs().tz("Asia/Ho_Chi_Minh"));
        if (diff > 0) {
          const dur = dayjs.duration(diff);
          setCountdown(
            `${Math.floor(dur.asHours()).toString().padStart(2, "0")}:${dur.minutes().toString().padStart(2, "0")}:${dur
              .seconds()
              .toString()
              .padStart(2, "0")}`
          );
          setCancelDisabled(false);
        } else {
          setCountdown("Hết thời gian hủy");
          setCancelDisabled(true);
          if (interval) clearInterval(interval);
        }
      };

      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [order]);

  const fetchFeedbacks = async (productId: string) => {
    try {
      const { data } = await api.get(`/api/feedbacks/${productId}`);
      if (data.code === 200) {
        setFeedbacks((prev) => ({ ...prev, [productId]: data.data }));
      }
    } catch {}
  };

  const fetchOrderDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ code: number; data: OrderDetail }>(`/api/order/${id}`);
      if (res.data.code === 200) {
        setOrder(res.data.data);
      } else {
        message.error("Không thể tải chi tiết đơn hàng!");
        setOrder(null);
      }
    } catch {
      message.error("Lỗi tải dữ liệu!");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const { data } = await api.patch(`/api/order/cancel/${order.id}`);
      if (data.code === 200) {
        message.success("Đã hủy đơn hàng.");
        fetchOrderDetail(order.id);
      } else {
        message.error(data.message || "Không thể hủy đơn hàng.");
      }
    } catch {
      message.error("Lỗi khi hủy đơn hàng.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedProductId) return;
    try {
      const { data } = await api.post("/api/feedbacks", {
        productId: selectedProductId,
        rating,
        comment,
      });
      if (data.code === 200) {
        message.success("Đã gửi đánh giá!");
        setIsFeedbackModalOpen(false);
        fetchFeedbacks(selectedProductId);
      }
    } catch {
      message.error("Lỗi gửi đánh giá.");
    }
  };

  if (loading)
    return (
      <div className="loading-spinner">
        <Spin size="large" tip="Đang tải chi tiết đơn hàng..." />
      </div>
    );

  if (!order)
    return (
      <div className="track-order-detail-page">
        <div className="container">
          <div className="order-header error">
            <h2>Lỗi</h2>
            <p>Không tìm thấy đơn hàng hoặc đã bị xóa.</p>
            <Button onClick={() => navigate("/your-orders")}>Quay lại</Button>
          </div>
        </div>
      </div>
    );

  const discountValue = (order.totalAmount * order.discountPercent) / 100;

  return (
    <div className="track-order-detail-page">
      <div className="container">
        {/* HEADER */}
        <div className="order-header">
          <div>
            <h2>Chi tiết đơn hàng</h2>
            <p className="order-id">Mã đơn: {order.id}</p>
            <p className="order-date">
              Ngày đặt:{" "}
              {dayjs.utc(order.orderDate, "DD-MM-YYYY HH:mm:ss").tz("Asia/Ho_Chi_Minh").format("HH:mm DD/MM/YYYY")}
            </p>
          </div>
          <Tag color={statusColorMap[order.status]} className="big-status">
            {statusTextMap[order.status]}
          </Tag>
        </div>

        {/* TIMELINE STATUS */}
        {order.statusHistory && (
          <div className="status-timeline">
            <h3>Tiến trình đơn hàng</h3>

            <Timeline
              items={order.statusHistory.map((item) => ({
                color: "orange",
                children: (
                  <div className="timeline-item">
                    <b>{statusTextMap[item.status]}</b>
                    <div>
                      {dayjs
                        .utc(item.changedAt, "DD-MM-YYYY HH:mm:ss")
                        .tz("Asia/Ho_Chi_Minh")
                        .format("HH:mm DD/MM/YYYY")}
                    </div>
                    {item.note && <i>Ghi chú: {item.note}</i>}
                  </div>
                ),
              }))}
            />
          </div>
        )}

        {/* ITEMS */}
        <div className="order-items">
          <h3>Sản phẩm ({order.items.length})</h3>
          {order.items.map((item) => {
            const fb = feedbacks[item.productId];
            const hasFeedback = fb && fb.length > 0;
            return (
              <div key={item.productId} className="item">
                <div className="item-info">
                  <p className="name">{item.name}</p>
                  <p className="quantity">Số lượng: {item.quantity}</p>
                </div>
                <div className="item-price">
                  <p className="unit-price">{item.unitPrice.toLocaleString()}đ</p>
                  <p className="total">{(item.unitPrice * item.quantity).toLocaleString()}đ</p>
                </div>

                {order.status === "DELIVERED" &&
                  (hasFeedback ? (
                    <Tag color="blue" className="feedback-tag">
                      Đã đánh giá
                    </Tag>
                  ) : (
                    <Button
                      icon={<CommentOutlined />}
                      type="primary"
                      className="feedback-btn"
                      onClick={() => {
                        setSelectedProductId(item.productId);
                        setIsFeedbackModalOpen(true);
                      }}
                    >
                      Gửi đánh giá
                    </Button>
                  ))}
              </div>
            );
          })}
        </div>

        {/* SHIPPING + PAYMENT */}
        <div className="shipping-info">
          <h3>Thông tin giao hàng & Thanh toán</h3>
          <p>
            <strong>Địa chỉ:</strong> {order.deliveryAddress || "Chưa cập nhật"}
          </p>
          <div className="payment-method">
            <span className="label">Phương thức:</span>

            <div className="method-box">
              {order.paymentMethod === "VNPAY" && (
                <>
                  <img
                    src="https://itviec.com/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6NDAzODMzMCwicHVyIjoiYmxvYl9pZCJ9fQ==--d01b1b407f49d33d4ea19b9218e10da4dc7f231d/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlszMDAsMzAwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--e1d036817a0840c585f202e70291f5cdd058753d/logo%20d%E1%BB%8Dc.png"
                    alt="VNPAY"
                    className="payment-logo"
                  />
                </>
              )}

              {order.paymentMethod === "PAYOS" && (
                <>
                  <img
                    src="https://media.zenfs.com/en/globenewswire.com/d572fcc587598e58786c3856ba2bc978"
                    alt="PAYOS"
                    className="payment-logo"
                  />
                </>
              )}

              {order.paymentMethod === "WALLET" && (
                <>
                  <img src="https://i.pinimg.com/...jpg" alt="WALLET" className="payment-logo" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* PAYMENT SUMMARY */}
        <div className="payment-summary">
          <h3>Tổng thanh toán</h3>

          <div className="summary-line">
            <span>Tạm tính</span>
            <span>{order.totalAmount.toLocaleString()}đ</span>
          </div>

          <div className="summary-line">
            <span>Phí vận chuyển</span>
            <span>{order.shippingFee.toLocaleString()}đ</span>
          </div>

          {order.discountPercent > 0 && (
            <div className="summary-line discount">
              <span>Giảm giá ({order.discountPercent}%)</span>
              <span>- {discountValue.toLocaleString()}đ</span>
            </div>
          )}

          <div className="summary-line total">
            <span>Tổng cộng</span>
            <span>{order.finalAmount.toLocaleString()}đ</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="order-actions">
          <Button className="back-btn" onClick={() => navigate("/your-orders")} icon={<ArrowLeftOutlined />}>
            Quay lại danh sách
          </Button>

          {order.status === "PAID" && (
            <>
              <Popconfirm
                title="Xác nhận hủy đơn?"
                description="Bạn sẽ được hoàn 75% giá trị đơn hàng vào ví."
                onConfirm={handleCancelOrder}
                okText="Xác nhận hủy"
                cancelText="Không"
                disabled={cancelDisabled || isCancelling}
              >
                <Button danger icon={<StopOutlined />} disabled={cancelDisabled || isCancelling}>
                  {cancelDisabled ? "Hết thời gian hủy" : isCancelling ? "Đang hủy..." : "Hủy đơn hàng"}
                </Button>
              </Popconfirm>

              {!cancelDisabled && (
                <div className="countdown-timer">
                  <ClockCircleOutlined /> Thời gian hủy còn: {countdown}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL FEEDBACK */}
      <Modal
        title="Đánh giá sản phẩm"
        open={isFeedbackModalOpen}
        onCancel={() => setIsFeedbackModalOpen(false)}
        onOk={handleSubmitFeedback}
        okText="Gửi đánh giá"
        cancelText="Hủy"
      >
        <p>Chấm sao:</p>
        <Rate value={rating} onChange={(v) => setRating(v)} />

        <p>Bình luận:</p>
        <Input.TextArea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn..."
        />
      </Modal>
    </div>
  );
};

export default TrackOrderDetail;
