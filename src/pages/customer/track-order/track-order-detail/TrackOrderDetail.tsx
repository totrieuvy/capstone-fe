import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Spin, Button, Popconfirm, Tag } from "antd";
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

interface OrderDetail {
  id: string;
  orderDate: string;
  status: "PENDING" | "PAID" | "PENDING_DELIVERY" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  totalAmount: number;
  discountPercent: number;
  shippingFee: number;
  finalAmount: number;
  items: OrderItem[];
  deliveryAddress?: string;
  paymentMethod?: string;
  deliveredAt: string | null;
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
      // ✅ Convert đúng sang giờ Việt Nam
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
    } catch {
      console.warn("Không thể tải feedbacks cho sản phẩm:", productId);
    }
  };

  const fetchOrderDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ code: number; data: OrderDetail }>(`/api/order/${id}`);
      if (res.data.code === 200 && res.data.data) {
        setOrder(res.data.data);
      } else {
        message.error("Không thể tải chi tiết đơn hàng!");
        setOrder(null);
      }
    } catch {
      message.error("Lỗi kết nối hoặc đơn hàng không tồn tại!");
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
        message.success("Đã hủy đơn hàng. 75% giá trị sẽ được hoàn vào ví của bạn.");
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

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: "gold",
      PAID: "blue",
      PENDING_DELIVERY: "cyan",
      DELIVERED: "green",
      CANCELLED: "red",
      REFUNDED: "purple",
    };
    const textMap: Record<string, string> = {
      PENDING: "Chờ thanh toán",
      PAID: "Đã thanh toán",
      PENDING_DELIVERY: "Đang giao hàng",
      DELIVERED: "Đã giao",
      CANCELLED: "Đã hủy",
      REFUNDED: "Đã hoàn tiền",
    };
    return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
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
        message.success("Cảm ơn bạn đã đánh giá sản phẩm!");
        setIsFeedbackModalOpen(false);
        fetchFeedbacks(selectedProductId);
      } else {
        message.error(data.message || "Không thể gửi đánh giá.");
      }
    } catch {
      message.error("Lỗi khi gửi đánh giá.");
    }
  };

  const discountValue = order ? (order.totalAmount * order.discountPercent) / 100 : 0;

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

  return (
    <div className="track-order-detail-page">
      <div className="container">
        <div className="order-header">
          <div>
            <h2>Chi tiết đơn hàng</h2>
            <p className="order-id">Mã đơn: {order.id}</p>
            <p className="order-date">
              Ngày đặt:{" "}
              {dayjs.utc(order.orderDate, "DD-MM-YYYY HH:mm:ss").tz("Asia/Ho_Chi_Minh").format("HH:mm DD/MM/YYYY")}
            </p>
          </div>
          {getStatusTag(order.status)}
        </div>

        {/* Items */}
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

                {/* {hasFeedback && (
                  <div className="feedback-display">
                    {fb.map((f) => (
                      <div key={f.feedbackId} className="feedback-card">
                        <div className="feedback-header">
                          <strong>{f.customerName}</strong>
                          <Rate disabled value={f.rating} />
                        </div>
                        <p className="comment">“{f.comment}”</p>
                        <span className="date">
                          {dayjs(f.createdAt).tz("Asia/Ho_Chi_Minh").format("HH:mm DD/MM/YYYY")}
                        </span>
                      </div>
                    ))}
                  </div>
                )} */}
              </div>
            );
          })}
        </div>

        {/* Shipping & Payment */}
        <div className="shipping-info">
          <h3>Thông tin giao hàng & Thanh toán</h3>
          <p>
            <strong>Địa chỉ:</strong> {order.deliveryAddress || "Chưa cập nhật"}
          </p>
          <p className="payment-method">
            <strong>Phương thức:</strong>{" "}
            {order.paymentMethod === "VNPAY" ? (
              <>
                <img
                  src="https://itviec.com/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6NDAzODMzMCwicHVyIjoiYmxvYl9pZCJ9fQ==--d01b1b407f49d33d4ea19b9218e10da4dc7f231d/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlszMDAsMzAwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--e1d036817a0840c585f202e70291f5cdd058753d/logo%20d%E1%BB%8Dc.png"
                  alt="VNPAY"
                  className="payment-logo"
                />
              </>
            ) : order.paymentMethod === "PAYOS" ? (
              <>
                <img
                  src="https://media.zenfs.com/en/globenewswire.com/d572fcc587598e58786c3856ba2bc978"
                  alt="PAYOS"
                  className="payment-logo"
                />
              </>
            ) : (
              order.paymentMethod || "Chưa cập nhật"
            )}
          </p>

          {order.deliveredAt && (
            <p>
              <strong>Ngày giao:</strong>{" "}
              {dayjs.utc(order.deliveredAt, "DD-MM-YYYY HH:mm:ss").tz("Asia/Ho_Chi_Minh").format("HH:mm DD/MM/YYYY")}
            </p>
          )}
        </div>

        {/* Payment Summary */}
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

        {/* Actions */}
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
