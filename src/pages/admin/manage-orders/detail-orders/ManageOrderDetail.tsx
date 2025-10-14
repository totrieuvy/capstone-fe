// src/pages/admin/manage-orders/ManageOrderDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Button, Spin, Table, Tag, message } from "antd";
import api from "../../../../config/axios";
import { toast } from "react-toastify";
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

interface OrderDetail {
  id: string;
  orderDate: string;
  status: string;
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
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/order/${orderId}`);
      if (response.data.code === 200) {
        setOrder(response.data.data);
      } else {
        toast.error(response.data.message || "Không thể tải chi tiết đơn hàng");
      }
    } catch (error) {
      toast.error("Lỗi khi tải chi tiết đơn hàng: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Chi tiết đơn hàng";
    fetchOrderDetail();
  }, [orderId]);

  const renderStatusTag = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Tag color="orange">Chờ thanh toán</Tag>;
      case "PAID":
        return <Tag color="blue">Đã thanh toán</Tag>;
      case "DELIVERING":
        return <Tag color="cyan">Đang giao</Tag>;
      case "COMPLETED":
        return <Tag color="green">Hoàn thành</Tag>;
      case "CANCELLED":
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // ✅ Hàm in hóa đơn (chỉ in file trong invoiceUrl)
  const handlePrint = () => {
    if (!order?.invoiceUrl) {
      message.error("Không có hóa đơn để in!");
      return;
    }

    // Mở file hóa đơn trong tab mới và tự động in
    const printWindow = window.open(order.invoiceUrl, "_blank");
    if (printWindow) {
      printWindow.print();
    }
  };

  if (loading || !order)
    return (
      <div className="manage-order-detail__loading">
        <Spin tip="Đang tải chi tiết đơn hàng..." size="large" />
      </div>
    );

  return (
    <div className="ManageOrderDetail">
      <div className="manage-order-detail__header">
        <Button onClick={() => navigate(-1)} className="back-btn">
          ← Quay lại
        </Button>
        <Button type="primary" onClick={handlePrint}>
          🖨️ In hóa đơn
        </Button>
      </div>

      <Card title={`Đơn hàng #${order.id}`} className="manage-order-detail__card">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Trạng thái">{renderStatusTag(order.status)}</Descriptions.Item>
          <Descriptions.Item label="Ngày đặt hàng">{order.orderDate || "Không rõ"}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ giao hàng">{order.deliveryAddress}</Descriptions.Item>
          <Descriptions.Item label="Phí vận chuyển">{order.shippingFee.toLocaleString("vi-VN")} đ</Descriptions.Item>
          <Descriptions.Item label="Giảm giá">{order.discountPercent}%</Descriptions.Item>
          <Descriptions.Item label="Tổng tiền hàng">{order.totalAmount.toLocaleString("vi-VN")} đ</Descriptions.Item>
          <Descriptions.Item label="Tổng thanh toán">
            <b>{order.finalAmount.toLocaleString("vi-VN")} đ</b>
          </Descriptions.Item>
          <Descriptions.Item label="Hóa đơn">
            <a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer">
              Xem hóa đơn
            </a>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Thông tin khách hàng" className="manage-order-detail__card">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Họ tên">{order.customerProfile.fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">{order.customerProfile.email}</Descriptions.Item>
          <Descriptions.Item label="CMND/CCCD">{order.customerProfile.citizenId}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">{order.customerProfile.address}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Danh sách sản phẩm" className="manage-order-detail__card">
        <Table
          dataSource={order.items}
          rowKey="productId"
          pagination={false}
          columns={[
            { title: "Tên sản phẩm", dataIndex: "name", key: "name" },
            { title: "Số lượng", dataIndex: "quantity", key: "quantity", align: "center" as const },
            {
              title: "Đơn giá",
              dataIndex: "unitPrice",
              key: "unitPrice",
              render: (price: number) => `${price.toLocaleString("vi-VN")} đ`,
              align: "right" as const,
            },
            {
              title: "Thành tiền",
              key: "total",
              render: (record: OrderItem) => `${(record.quantity * record.unitPrice).toLocaleString("vi-VN")} đ`,
              align: "right" as const,
            },
          ]}
        />
      </Card>
    </div>
  );
}

export default ManageOrderDetail;
