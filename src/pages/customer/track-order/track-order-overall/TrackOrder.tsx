import { useEffect, useState } from "react";
import { Table, Tag, message, Button, Pagination, Spin, Card, Popconfirm, DatePicker, Row, Col, Select } from "antd";
import { EyeOutlined, StopOutlined, ClockCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import api from "../../../../config/axios";
import "./TrackOrder.scss";

import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const { RangePicker } = DatePicker;

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

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Fetch all orders once
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
        all = [...all, ...data.content];
        totalPages = data.totalPages;
        page++;
      } while (page < totalPages);

      setAllOrders(all);
      setOrders(all);
    } catch {
      message.error("Không thể tải danh sách đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Lịch sử đơn hàng";
    fetchAllOrders();
  }, []);

  /* COUNTDOWN FOR CANCEL */
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: Record<string, string> = {};

      orders.forEach((order) => {
        if (order.status === "PAID") {
          const orderTime = dayjs.utc(order.orderDate, "DD-MM-YYYY HH:mm:ss").tz("Asia/Ho_Chi_Minh");
          const diff = orderTime.add(12, "hour").diff(dayjs().tz("Asia/Ho_Chi_Minh"));

          if (diff > 0) {
            const dur = dayjs.duration(diff);
            const hours = String(Math.floor(dur.asHours())).padStart(2, "0");
            const minutes = String(dur.minutes()).padStart(2, "0");
            const seconds = String(dur.seconds()).padStart(2, "0");
            newCountdowns[order.id] = `${hours}:${minutes}:${seconds}`;
          } else {
            newCountdowns[order.id] = "expired";
          }
        }
      });

      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  /* FILTER */
  const applyFilters = (status: string, dates: [Dayjs | null, Dayjs | null] | null) => {
    let filtered = [...allOrders];

    if (status !== "ALL") {
      filtered = filtered.filter((o) => o.status === status);
    }

    if (dates && dates[0] && dates[1]) {
      const start = dates[0].startOf("day");
      const end = dates[1].endOf("day");

      filtered = filtered.filter((o) => {
        const date = dayjs.utc(o.orderDate, "DD-MM-YYYY HH:mm:ss").tz("Asia/Ho_Chi_Minh");
        return date.isAfter(start) && date.isBefore(end);
      });
    }

    setOrders(filtered);
    setPagination({ ...pagination, currentPage: 1 });
  };

  const resetFilters = () => {
    setStatusFilter("ALL");
    setDateRangeFilter(null);
    setOrders(allOrders);
  };

  /* STATUS COLORS / TEXT */
  const statusColors: Record<string, string> = {
    PENDING: "orange",
    PAID: "blue",
    PREPARING: "orange",
    PENDING_DELIVERY: "cyan",
    DELIVERED: "green",
    REFUNDED: "purple",
    CANCELLED: "red",
    NOT_RECEIVED: "volcano",
  };

  const statusTexts: Record<string, string> = {
    PENDING: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    PREPARING: "Đang chuẩn bị",
    PENDING_DELIVERY: "Đang giao hàng",
    DELIVERED: "Đã giao",
    REFUNDED: "Đã hoàn tiền",
    CANCELLED: "Đã hủy",
    NOT_RECEIVED: "Khách không nhận",
  };

  const getStatusTag = (status: string) => <Tag color={statusColors[status]}>{statusTexts[status]}</Tag>;

  /* PAYMENT METHOD RENDER */
  const renderPayment = (method: string) => {
    if (method === "VNPAY")
      return (
        <img
          src="https://itviec.com/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6NDAzODMzMCwicHVyIjoiYmxvYl9pZCJ9fQ==--d01b1b407f49d33d4ea19b9218e10da4dc7f231d/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlszMDAsMzAwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--e1d036817a0840c585f202e70291f5cdd058753d/logo%20d%E1%BB%8Dc.png"
          alt="VNPAY"
          className="payment-logo"
        />
      );
    if (method === "PAYOS")
      return (
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZG9s8OQPSV0K2v8rU_TANaTplRa-t2uUSwg&s"
          alt="PAYOS"
          className="payment-logo"
        />
      );
    if (method === "WALLET")
      return (
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2mZQ9QbMgq9hGCLWzL4ALr870gurzUpV1mg&s"
          alt="WALLET"
          className="payment-logo"
        />
      );

    return method;
  };

  /* TABLE COLUMNS */
  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      render: (id) => <span className="order-id">...{id.slice(-10)}</span>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "orderDate",
      render: (date) => dayjs.utc(date, "DD-MM-YYYY HH:mm:ss").tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Phương thức",
      dataIndex: "paymentMethod",
      render: (method) => renderPayment(method),
    },
    {
      title: "Tổng",
      dataIndex: "finalAmount",
      render: (v) => `${v.toLocaleString()}đ`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: getStatusTag,
    },
    {
      title: "Hành động",
      render: (_, record) => {
        const countdown = countdowns[record.id];
        const canCancel = record.status === "PAID" && countdown && countdown !== "expired";

        return (
          <div className="action-buttons">
            <Button icon={<EyeOutlined />} onClick={() => navigate(`/your-orders/${record.id}`)}>
              Xem
            </Button>

            {canCancel && (
              <>
                <Popconfirm title="Hủy đơn?" onConfirm={() => message.info("Chưa kết nối API demo")}>
                  <Button danger icon={<StopOutlined />}>
                    Hủy
                  </Button>
                </Popconfirm>

                <div className="countdown">
                  <ClockCircleOutlined /> {countdown}
                </div>
              </>
            )}
          </div>
        );
      },
    },
  ];

  /* PAGINATION */
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
  const paginatedOrders = orders.slice(startIndex, startIndex + pagination.pageSize);

  return (
    <div className="track-order-page">
      <div className="container">
        <h1 className="page-title">Lịch sử đơn hàng</h1>

        {/* Bộ lọc */}
        <Card className="filter-card">
          <Row gutter={[16, 16]}>
            {/* Dropdown chọn trạng thái */}
            <Col xs={24} sm={12} md={8}>
              <Select
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  applyFilters(value, dateRangeFilter);
                }}
                style={{ width: "100%" }}
                className="status-select"
                placeholder="Chọn trạng thái"
              >
                <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
                <Select.Option value="PENDING">Chờ thanh toán</Select.Option>
                <Select.Option value="PAID">Đã thanh toán</Select.Option>
                <Select.Option value="PREPARING">Đang chuẩn bị</Select.Option>
                <Select.Option value="PENDING_DELIVERY">Đang giao hàng</Select.Option>
                <Select.Option value="DELIVERED">Đã giao</Select.Option>
                <Select.Option value="NOT_RECEIVED">Khách không nhận</Select.Option>
                <Select.Option value="REFUNDED">Hoàn tiền</Select.Option>
                <Select.Option value="CANCELLED">Đã hủy</Select.Option>
              </Select>
            </Col>

            {/* Lọc theo ngày */}
            <Col xs={24} sm={12} md={10}>
              <RangePicker
                value={dateRangeFilter}
                onChange={(v) => {
                  setDateRangeFilter(v);
                  applyFilters(statusFilter, v);
                }}
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </Col>

            {/* Nút reset */}
            <Col xs={24} md={6}>
              <Button icon={<ReloadOutlined />} onClick={resetFilters} block className="reset-btn">
                Đặt lại bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        {/* TABLE */}
        <Card className="order-list-card">
          {loading ? (
            <div className="loading-spinner">
              <Spin size="large" tip="Đang tải..." />
            </div>
          ) : (
            <>
              <Table columns={columns} dataSource={paginatedOrders} pagination={false} />

              <Pagination
                current={pagination.currentPage}
                total={orders.length}
                pageSize={pagination.pageSize}
                onChange={(p) => setPagination({ ...pagination, currentPage: p })}
                className="pagination"
                showTotal={(t) => `Tổng ${t} đơn`}
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TrackOrder;
