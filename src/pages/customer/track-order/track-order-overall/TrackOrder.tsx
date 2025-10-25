import { useEffect, useState } from "react";
import { Table, Tag, message, Button, Pagination, Spin, Card, Popconfirm, DatePicker, Select, Row, Col } from "antd";
import { EyeOutlined, StopOutlined, ClockCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import api from "../../../../config/axios";
import "./TrackOrder.scss";

import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import duration from "dayjs/plugin/duration";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Order {
  id: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  finalAmount: number;
  shippingFee: number;
  discountPercent: number;
  paymentMethod: string;
}

interface OrderApiResponse {
  content: Order[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

const TrackOrder = () => {
  const navigate = useNavigate();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Fetch ALL pages of orders once
  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      let all: Order[] = [];
      let page = 0;
      let totalPages = 1;

      do {
        const res = await api.get<{ data: OrderApiResponse }>(
          `/api/order?page=${page}&size=10&sortBy=createdAt&sortDir=desc`
        );
        const { data } = res.data;
        if (data && data.content) {
          all = [...all, ...data.content];
          totalPages = data.totalPages;
        }
        page++;
      } while (page < totalPages);

      setAllOrders(all);
      setOrders(all);
    } catch (error) {
      message.error("Không thể tải danh sách đơn hàng!" + error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Lịch sử đơn hàng";
    fetchAllOrders();
  }, []);

  // Countdown update
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: Record<string, string> = {};
      orders.forEach((order) => {
        if (order.status === "PAID") {
          const orderTime = dayjs.utc(order.orderDate, "DD-MM-YYYY HH:mm:ss").tz("Asia/Ho_Chi_Minh");

          const diff = orderTime.add(12, "hour").diff(dayjs().tz("Asia/Ho_Chi_Minh"));

          if (diff > 0) {
            const dur = dayjs.duration(diff);
            const hours = Math.floor(dur.asHours());
            const minutes = dur.minutes();
            const seconds = dur.seconds();
            newCountdowns[order.id] = `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
          } else {
            newCountdowns[order.id] = "expired";
          }
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [orders]);

  // Filter logic
  const applyFilters = (status: string, dates: [Dayjs | null, Dayjs | null] | null) => {
    let filtered = [...allOrders];

    if (status !== "ALL") {
      filtered = filtered.filter((o) => o.status === status);
    }

    if (dates && dates[0] && dates[1]) {
      const start = dates[0].startOf("day");
      const end = dates[1].endOf("day");
      filtered = filtered.filter((o) => {
        const date = dayjs(o.orderDate, "DD-MM-YYYY HH:mm:ss");
        return date.isAfter(start) && date.isBefore(end);
      });
    }

    setOrders(filtered);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterStatus = (status: string) => {
    setStatusFilter(status);
    applyFilters(status, dateRangeFilter);
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRangeFilter(dates || null);
    applyFilters(statusFilter, dates);
  };

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setDateRangeFilter(null);
    setOrders(allOrders);
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      message.loading({ content: "Đang hủy đơn hàng...", key: "cancel" });
      const { data } = await api.patch(`/api/order/cancel/${orderId}`);
      message.destroy("cancel");
      if (data.code === 200) {
        message.success("Đã hủy đơn hàng. Bạn sẽ được hoàn 75% vào ví.");
        fetchAllOrders();
      } else {
        message.error(data.message || "Không thể hủy đơn hàng.");
      }
    } catch {
      message.destroy("cancel");
      message.error("Lỗi khi hủy đơn hàng.");
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: "gold",
      PAID: "blue",
      PENDING_DELIVERY: "cyan",
      DELIVERED: "green",
      REFUNDED: "purple",
    };
    const textMap: Record<string, string> = {
      PENDING: "Chờ thanh toán",
      PAID: "Đã thanh toán",
      PENDING_DELIVERY: "Đang giao hàng",
      DELIVERED: "Đã giao",
      REFUNDED: "Đã hoàn tiền",
    };
    return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
  };

  const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
  const paginatedOrders = orders.slice(startIndex, startIndex + pagination.pageSize);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <span className="order-id">...{id.slice(-10)}</span>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (date: string) =>
        dayjs.utc(date, "DD-MM-YYYY HH:mm:ss").tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "finalAmount",
      key: "finalAmount",
      render: (v: number) => `${v.toLocaleString()}đ`,
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
          <div className="action-buttons">
            <Button type="default" icon={<EyeOutlined />} onClick={() => navigate(`/your-orders/${record.id}`)}>
              Xem chi tiết
            </Button>
            {canCancel && (
              <>
                <Popconfirm
                  title="Xác nhận hủy đơn?"
                  okText="Xác nhận"
                  cancelText="Hủy"
                  onConfirm={() => handleCancelOrder(record.id)}
                >
                  <Button danger icon={<StopOutlined />}>
                    Hủy đơn
                  </Button>
                </Popconfirm>
                <div className="countdown">
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
        <h1 className="page-title">Lịch sử đơn hàng</h1>

        {/* Bộ lọc */}
        <Card className="filter-card">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Select value={statusFilter} onChange={handleFilterStatus} style={{ width: "100%" }}>
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="PENDING">Chờ thanh toán</Option>
                <Option value="PAID">Đã thanh toán</Option>
                <Option value="PENDING_DELIVERY">Đang giao hàng</Option>
                <Option value="DELIVERED">Đã giao</Option>
                <Option value="REFUNDED">Đã hoàn tiền</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} md={10}>
              <RangePicker
                value={dateRangeFilter}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </Col>

            <Col xs={24} md={6}>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters} block>
                Đặt lại bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Danh sách */}
        <Card className="order-list-card">
          {loading ? (
            <div className="loading-spinner">
              <Spin size="large" tip="Đang tải đơn hàng..." />
            </div>
          ) : (
            <>
              <Table columns={columns} dataSource={paginatedOrders} pagination={false} rowKey="id" />
              {orders.length > 0 && (
                <Pagination
                  current={pagination.currentPage}
                  total={orders.length}
                  pageSize={pagination.pageSize}
                  onChange={handlePageChange}
                  showTotal={(total) => `Tổng cộng ${total} đơn hàng`}
                  className="pagination"
                />
              )}
              {!loading && orders.length === 0 && <div className="no-data">Không tìm thấy đơn hàng phù hợp.</div>}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TrackOrder;
