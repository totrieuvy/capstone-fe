import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Button, Spin, Table, Tag } from "antd";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import api from "../../../../config/axios";
import "./ManageOrderDetail.scss";

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface CustomerProfile {
  fullName: string;
  email: string;
  address: string;
  citizenId: string;
}

type OrderStatus = "PENDING" | "PAID" | "PREPARED" | "DELIVERED" | "CANCELED";

interface OrderDetail {
  id: string;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  discountPercent: number;
  finalAmount: number;
  shippingFee: number;
  invoiceUrl: string;
  deliveryAddress: string;
  deliveredAt: string | null;
  deliveryUrl: string | null;
  items: OrderItem[];
  customerProfile: CustomerProfile;
}

function ManageOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updatingCancel, setUpdatingCancel] = useState(false);

  const fetchOrderDetail = async (): Promise<void> => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await api.get<{ code: number; message: string; data: OrderDetail }>(`/api/order/${orderId}`);
      if (res.data.code === 200) setOrder(res.data.data);
      else toast.error(res.data.message);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "PREPARED" | "DELIVERED"): Promise<void> => {
    if (!orderId) return;
    setUpdating(true);
    try {
      const res = await api.patch<{ code: number; message: string }>(`/api/order/${orderId}`, { status: newStatus });
      if (res.data.code === 200) {
        toast.success("Cập nhật trạng thái thành công!");
        void fetchOrderDetail();
      } else toast.error(res.data.message);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async (): Promise<void> => {
    if (!orderId) return;
    setUpdatingCancel(true);
    try {
      const res = await api.patch<{ code: number; message: string }>(`/api/order/${orderId}`, { status: "CANCELED" });
      if (res.data.code === 200) {
        toast.success("Đã hủy đơn hàng!");
        void fetchOrderDetail();
      } else toast.error(res.data.message);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setUpdatingCancel(false);
    }
  };

  const statusMap: Record<OrderStatus, { color: string; text: string }> = {
    PENDING: { color: "orange", text: "Chờ thanh toán" },
    PAID: { color: "blue", text: "Đã thanh toán" },
    PREPARED: { color: "cyan", text: "Đang chuẩn bị" },
    DELIVERED: { color: "green", text: "Đã giao" },
    CANCELED: { color: "red", text: "Đã hủy" },
  };

  const renderStatusTag = (status: OrderStatus) => <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>;

  const renderStatusHistory = () => {
    if (!order) return <></>;
    const history: { text: string; time: string }[] = [];
    history.push({
      text: "Đặt hàng thành công",
      time: dayjs(order.orderDate, "DD-MM-YYYY HH:mm:ss").add(7, "hour").format("HH:mm DD/MM/YYYY"),
    });
    if (order.deliveredAt && order.status === "DELIVERED") {
      history.push({
        text: "Giao hàng thành công",
        time: dayjs(order.deliveredAt).add(7, "hour").format("HH:mm DD/MM/YYYY"),
      });
    }
    return (
      <div className="status-history">
        <h4>Lịch sử trạng thái</h4>
        {history.map((h, i) => (
          <div className="history-item" key={i}>
            <span>{h.text}</span>
            <span>{h.time}</span>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    document.title = "Chi tiết đơn hàng";
    void fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading || !order)
    return (
      <div className="manage-order-detail__loading">
        <Spin size="large" tip="Đang tải chi tiết đơn hàng..." />
      </div>
    );

  return (
    <div className="ManageOrderDetail">
      <div className="header-row">
        <Button onClick={() => navigate(-1)} className="back-btn">
          ← Quay lại
        </Button>
      </div>

      <h1 className="main-title">Chi tiết đơn hàng #{order.id}</h1>

      <div className="top-section">
        <div className="left-info">
          <Card title="Thông tin chung" className="order-card">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã đơn hàng">{order.id}</Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">
                {dayjs(order.orderDate, "DD-MM-YYYY HH:mm:ss").add(7, "hour").format("HH:mm DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ giao hàng" span={2}>
                {order.deliveryAddress}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">{order.customerProfile.fullName}</Descriptions.Item>
              <Descriptions.Item label="Email">{order.customerProfile.email}</Descriptions.Item>
              <Descriptions.Item label="CMND/CCCD">{order.customerProfile.citizenId}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ KH">{order.customerProfile.address}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        <div className="right-status">
          <Card
            title={<div className="status-title">Trạng thái {renderStatusTag(order.status)}</div>}
            className="status-card"
          >
            <div className="status-actions">
              {order.status === "PENDING" && (
                <Button danger block loading={updatingCancel} onClick={() => void handleCancel()}>
                  Hủy đơn
                </Button>
              )}
              {order.status === "PAID" && (
                <>
                  <Button danger loading={updatingCancel} onClick={() => void handleCancel()}>
                    Hủy đơn
                  </Button>
                  <Button type="primary" loading={updating} onClick={() => void handleUpdateStatus("PREPARED")}>
                    Xác nhận
                  </Button>
                </>
              )}
              {order.status === "PREPARED" && (
                <>
                  <Button danger loading={updatingCancel} onClick={() => void handleCancel()}>
                    Hủy đơn
                  </Button>
                  <Button type="primary" loading={updating} onClick={() => void handleUpdateStatus("DELIVERED")}>
                    Đã giao
                  </Button>
                </>
              )}
            </div>
            {renderStatusHistory()}
          </Card>
        </div>
      </div>

      <div className="bottom-section">
        <Card title="Chi tiết sản phẩm" className="order-card">
          <Table<OrderItem>
            dataSource={order.items}
            rowKey="productId"
            pagination={false}
            columns={[
              { title: "Tên sản phẩm", dataIndex: "name" },
              { title: "Số lượng", dataIndex: "quantity", align: "center" },
              {
                title: "Đơn giá",
                dataIndex: "unitPrice",
                align: "right",
                render: (price: number) => `${price.toLocaleString("vi-VN")} đ`,
              },
              {
                title: "Thành tiền",
                align: "right",
                render: (_, r) => `${(r.quantity * r.unitPrice).toLocaleString("vi-VN")} đ`,
              },
            ]}
          />
          <div className="order-summary">
            <div className="summary-row">
              <span className="summary-label">Tổng tiền hàng:</span>
              <span className="summary-value">{order.totalAmount.toLocaleString("vi-VN")} đ</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Phí vận chuyển:</span>
              <span className="summary-value">{order.shippingFee.toLocaleString("vi-VN")} đ</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Giảm giá:</span>
              <span className="summary-value">{order.discountPercent}%</span>
            </div>
            <div className="summary-row total">
              <span className="summary-label">Tổng:</span>
              <span className="summary-value">{order.finalAmount.toLocaleString("vi-VN")} đ</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ManageOrderDetail;
