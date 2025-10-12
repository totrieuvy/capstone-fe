import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Table, Button, message, Spin, Tag, Row, Col } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table"; // ✅ Thêm dòng này
import api from "../../../../config/axios";
import "./TrackOrderDetail.scss";

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderDetail {
  id: string;
  orderDate: string;
  status: "PENDING" | "PAID" | "SHIPPING" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  totalAmount: number;
  discountPercent: number;
  shippingFee: number;
  finalAmount: number;
  items: OrderItem[];
  deliveryAddress?: string;
  customerName?: string;
  customerPhone?: string;
}

const TrackOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Chi tiết đơn hàng ${orderId ? `...${orderId.slice(-6)}` : ""}`;
    if (orderId) {
      fetchOrderDetail(orderId);
    }
  }, [orderId]);

  const fetchOrderDetail = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get<{ data: OrderDetail }>(`/api/order/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      message.error("Không thể tải chi tiết đơn hàng! " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: OrderDetail["status"]) => {
    switch (status) {
      case "PAID":
        return <Tag color="green">ĐÃ THANH TOÁN</Tag>;
      case "SHIPPING":
        return <Tag color="blue">ĐANG GIAO HÀNG</Tag>;
      case "DELIVERED":
        return <Tag color="purple">ĐÃ GIAO</Tag>;
      case "CANCELLED":
        return <Tag color="red">ĐÃ HỦY</Tag>;
      case "REFUNDED":
        return <Tag color="orange">ĐÃ HOÀN TIỀN</Tag>;
      default:
        return <Tag color="gold">ĐANG CHỜ</Tag>;
    }
  };

  const itemColumns: ColumnsType<OrderItem> = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (price: number) => `${price.toLocaleString()}đ`,
    },
    {
      title: "Thành tiền",
      key: "total",
      render: (_, record) => `${(record.quantity * record.unitPrice).toLocaleString()}đ`,
    },
  ];

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return <div className="loading-spinner">Không tìm thấy thông tin đơn hàng.</div>;
  }

  return (
    <div className="track-order-detail-page">
      <div className="container">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/your-orders")} className="back-button">
          Quay lại danh sách
        </Button>
        <h1 className="page-title">Chi Tiết Đơn Hàng</h1>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Card title="Các sản phẩm trong đơn" bordered={false} className="detail-card">
              <Table columns={itemColumns} dataSource={order.items} rowKey="productId" pagination={false} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Thông tin đơn hàng" bordered={false} className="detail-card">
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Mã đơn hàng">{order.id}</Descriptions.Item>
                <Descriptions.Item label="Ngày đặt">
                  {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">{getStatusTag(order.status)}</Descriptions.Item>
                <Descriptions.Item label="Tạm tính">{order.totalAmount.toLocaleString()}đ</Descriptions.Item>
                <Descriptions.Item label="Phí vận chuyển">{order.shippingFee.toLocaleString()}đ</Descriptions.Item>
                <Descriptions.Item label="Giảm giá">{order.discountPercent}%</Descriptions.Item>
                <Descriptions.Item label="Tổng cộng" className="final-amount">
                  <strong>{order.finalAmount.toLocaleString()}đ</strong>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default TrackOrderDetail;
