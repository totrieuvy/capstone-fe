import { useEffect, useState } from "react";
import { Table, Tag, message, Button, Pagination, Spin, Card, Popconfirm } from "antd";
import { EyeOutlined, StopOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import api from "../../../../config/axios";
import "./TrackOrder.scss";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

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
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  const pageSize = 10;

  useEffect(() => {
    document.title = "Lịch sử đơn hàng";
    fetchOrders(pagination.currentPage);
  }, [pagination.currentPage]);

  useEffect(() => {
    const interval = setInterval(() => updateCountdowns(), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

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
      message.error("Không thể tải lịch sử đơn hàng. " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateCountdowns = () => {
    const newCountdowns: Record<string, string> = {};
    orders.forEach((order) => {
      if (order.status.toUpperCase() === "PAID") {
        const orderTime = dayjs(order.orderDate);
        const diff = 12 * 60 * 60 * 1000 - (Date.now() - orderTime.valueOf());
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          newCountdowns[order.id] = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        } else {
          newCountdowns[order.id] = "expired";
        }
      }
    });
    setCountdowns(newCountdowns);
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { data } = await api.patch(`/api/order/cancel/${orderId}`);
      if (data.code === 200) {
        message.success("Đã hủy đơn hàng. Bạn sẽ được hoàn 75% vào ví.");
        fetchOrders(pagination.currentPage);
      } else {
        message.error(data.message || "Không thể hủy đơn hàng.");
      }
    } catch {
      message.error("Lỗi khi hủy đơn hàng.");
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
      render: (date: string) => dayjs(date, "DD-MM-YYYY HH:mm:ss").format("DD/MM/YYYY HH:mm"),
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
      render: (_, record) => {
        const countdown = countdowns[record.id];
        const canCancel = record.status === "PAID" && countdown && countdown !== "expired";

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Button
              className="view-detail-button"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/your-orders/${record.id}`)}
            >
              Xem chi tiết
            </Button>

            {canCancel && (
              <>
                <Popconfirm
                  title="Xác nhận hủy đơn?"
                  description="Nếu bạn hủy trong vòng 12 tiếng, bạn sẽ được hoàn 75% vào ví ảo."
                  okText="Xác nhận"
                  cancelText="Hủy"
                  onConfirm={() => handleCancelOrder(record.id)}
                >
                  <Button danger icon={<StopOutlined />}>
                    Hủy đơn
                  </Button>
                </Popconfirm>
                <div className="countdown-timer">
                  <ClockCircleOutlined /> <span style={{ color: "#ff6f61", fontWeight: 600 }}>{countdown}</span>
                </div>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="track-order-page">
      <div className="container">
        <h1 className="page-title">Lịch sử Mua hàng</h1>
        <Card className="order-list-card">
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
