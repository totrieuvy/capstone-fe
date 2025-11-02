import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Button, Spin, Table, Tag, Modal } from "antd";
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

type OrderStatus = "PENDING" | "PAID" | "PENDING_DELIVERY" | "DELIVERED" | "REFUNDED";

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
  paymentMethod: string;
  items: OrderItem[];
  customerProfile: CustomerProfile;
}

function ManageOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [printVisible, setPrintVisible] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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

  const handleUpdateStatus = async (newStatus: "PENDING_DELIVERY" | "DELIVERED"): Promise<void> => {
    if (!orderId) return;
    setUpdating(true);
    try {
      const res = await api.patch<{ code: number; message: string }>(`/api/order/${orderId}`, {
        status: newStatus,
      });
      if (res.data.code === 200) {
        toast.success("Cập nhật trạng thái thành công!");
        await fetchOrderDetail();
      } else toast.error(res.data.message);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    const printWindow = window.open("", "_blank");
    if (printWindow && printContents) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Đơn hàng #${order?.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h2 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              th { background-color: #f4f4f4; }
              .summary { margin-top: 20px; text-align: right; }
            </style>
          </head>
          <body>
            ${printContents}
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const statusMap: Record<OrderStatus, { color: string; text: string }> = {
    PENDING: { color: "orange", text: "Chờ thanh toán" },
    PAID: { color: "blue", text: "Đã thanh toán" },
    PENDING_DELIVERY: { color: "cyan", text: "Đang giao hàng" },
    DELIVERED: { color: "green", text: "Đã giao" },
    REFUNDED: { color: "purple", text: "Đã hoàn tiền" },
  };

  const renderStatusTag = (status: OrderStatus) => <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>;

  useEffect(() => {
    document.title = "Chi tiết đơn hàng";
    fetchOrderDetail();
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
        {order.invoiceUrl && (
          <Button type="primary" onClick={() => window.open(order.invoiceUrl, "_blank")}>
            🖨️ In đơn hàng
          </Button>
        )}
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
              {order.status === "PAID" && (
                <Button type="primary" loading={updating} onClick={() => handleUpdateStatus("PENDING_DELIVERY")} block>
                  Xác nhận đơn hàng
                </Button>
              )}
              {order.status === "PENDING_DELIVERY" && (
                <Button type="primary" loading={updating} onClick={() => handleUpdateStatus("DELIVERED")} block>
                  Đã giao
                </Button>
              )}
            </div>
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

      {/* Modal In Đơn Hàng */}
      <Modal
        open={printVisible}
        title="Xem trước đơn hàng"
        onCancel={() => setPrintVisible(false)}
        onOk={handlePrint}
        okText="In ngay"
        width={800}
      >
        <div ref={printRef}>
          <h2>Đơn hàng #{order.id}</h2>
          <p>
            <b>Khách hàng:</b> {order.customerProfile.fullName}
          </p>
          <p>
            <b>Ngày đặt:</b> {order.orderDate}
          </p>
          <p>
            <b>Địa chỉ giao hàng:</b> {order.deliveryAddress}
          </p>

          <table>
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unitPrice.toLocaleString("vi-VN")} đ</td>
                  <td>{(item.unitPrice * item.quantity).toLocaleString("vi-VN")} đ</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="summary">
            <p>Tổng tiền hàng: {order.totalAmount.toLocaleString("vi-VN")} đ</p>
            <p>Phí vận chuyển: {order.shippingFee.toLocaleString("vi-VN")} đ</p>
            <p>Giảm giá: {order.discountPercent}%</p>
            <h3>Tổng cộng: {order.finalAmount.toLocaleString("vi-VN")} đ</h3>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ManageOrderDetail;
