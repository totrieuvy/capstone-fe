import { useEffect, useState } from "react";
import { Table, Tag, message, Button, Pagination, Spin, Card } from "antd"; // Import Card
import { EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import api from "../../../../config/axios";
import "./TrackOrder.scss";

// ... (Interfaces và các hàm fetchOrders, handlePageChange, getStatusTag không đổi)
interface Order {
  id: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  finalAmount: number | null;
}

interface OrderApiResponse {
  content: Order[];
  totalPages: number;
  totalElements: number;
  pageNumber: number;
}

const TrackOrder = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
  });

  const pageSize = 10;

  useEffect(() => {
    document.title = "Lịch sử đơn hàng";
    fetchOrders(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchOrders = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get<{ data: OrderApiResponse }>(
        `/api/order?page=${page - 1}&size=${pageSize}&sortBy=createdAt&sortDir=desc`
      );
      const { data } = response.data;
      if (data) {
        setOrders(data.content);
        setPagination({
          currentPage: data.pageNumber + 1,
          totalPages: data.totalPages,
          totalItems: data.totalElements,
        });
      }
    } catch (error) {
      message.error("Không thể tải lịch sử đơn hàng. Vui lòng thử lại!" + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const getStatusTag = (status: string) => {
    const upperCaseStatus = status.toUpperCase();
    switch (upperCaseStatus) {
      case "PAID":
        return <Tag color="green">ĐÃ THANH TOÁN</Tag>;
      case "SHIPPING":
        return <Tag color="blue">ĐANG GIAO HÀNG</Tag>;
      case "DELIVERED":
        return <Tag color="purple">ĐÃ GIAO</Tag>;
      case "CANCELLED":
        return <Tag color="red">ĐÃ HỦY</Tag>;
      case "PENDING":
        return <Tag color="gold">ĐANG CHỜ</Tag>;
      default:
        return <Tag>{upperCaseStatus}</Tag>;
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "id",
      key: "id",
      render: (text: string) => <span className="order-id">...{text?.slice(-12)}</span>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "finalAmount",
      key: "finalAmount",
      render: (amount: number | null) => `${(amount ?? 0).toLocaleString()}đ`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button
          className="view-detail-button"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/your-orders/${record.id}`)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="track-order-page">
      <div className="container">
        <h1 className="page-title">Lịch sử Mua hàng</h1>
        <Card className="order-list-card">
          {" "}
          {/* Bọc nội dung trong Card */}
          {loading ? (
            <div className="loading-spinner">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Table columns={columns} dataSource={orders} rowKey="id" pagination={false} className="order-table" />
              <Pagination
                current={pagination.currentPage}
                total={pagination.totalItems}
                pageSize={pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
                className="pagination"
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TrackOrder;
