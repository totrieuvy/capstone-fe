import { useEffect, useState } from "react";
import { Table, Input, DatePicker, Tag, Button, Space } from "antd";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import { Link } from "react-router-dom";
import api from "../../../../config/axios";
import { toast } from "react-toastify";
import { getFormattedPrice } from "../../../../utils/formatPrice";
import "./ManageOrder.scss";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const { RangePicker } = DatePicker;
const { Search } = Input;

interface OrderType {
  id: string;
  orderDate: string;
  status:
    | "PENDING"
    | "PAID"
    | "PREPARING"
    | "PENDING_DELIVERY"
    | "DELIVERED"
    | "REFUNDED"
    | "CANCELLED"
    | "NOT_RECEIVED";
  finalAmount: number;
  customerProfile: {
    fullName: string;
    email: string;
  };
  paymentMethod: string;
}

interface OrderQueryParams {
  page: number;
  size: number;
  sortBy: string;
  sortDir: string;
  status?: string;
}

function ManageOrder() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchOrders = async (page = 1, size = 10, status = "ALL") => {
    setLoading(true);
    try {
      const params: OrderQueryParams = {
        page: page - 1,
        size,
        sortBy: "createdAt",
        sortDir: "desc",
      };

      if (status !== "ALL") {
        params.status = status; // 🔥 Gửi status lên API
      }

      const res = await api.get("/api/order", { params });
      const data = res.data.data;

      setOrders(data.content || []);
      setPagination({
        current: data.pageNumber + 1,
        pageSize: data.pageSize,
        total: data.totalElements,
      });
    } catch (err: unknown) {
      if (err instanceof Error) toast.error("Không thể tải đơn hàng: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lí đơn hàng";
    fetchOrders(pagination.current, pagination.pageSize, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, statusFilter]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  };

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.customerProfile.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDate =
      dateRange && dateRange[0] && dateRange[1]
        ? dayjs(order.orderDate, "DD-MM-YYYY HH:mm:ss").add(7, "hour").isAfter(dateRange[0]) &&
          dayjs(order.orderDate, "DD-MM-YYYY HH:mm:ss").add(7, "hour").isBefore(dateRange[1])
        : true;

    return matchSearch && matchDate; // ❗ KHÔNG filter status nữa
  });

  const renderStatusTag = (status: OrderType["status"]) => {
    const colorMap: Record<string, string> = {
      PENDING: "orange",
      PAID: "blue",
      PREPARING: "gold",
      PENDING_DELIVERY: "cyan",
      DELIVERED: "green",
      REFUNDED: "purple",
      CANCELLED: "red",
      NOT_RECEIVED: "volcano",
    };

    const textMap: Record<string, string> = {
      PENDING: "Chờ thanh toán",
      PAID: "Đã thanh toán",
      PREPARING: "Đang chuẩn bị",
      PENDING_DELIVERY: "Đang giao hàng",
      DELIVERED: "Đã giao",
      REFUNDED: "Đã hoàn tiền",
      CANCELLED: "Đã hủy",
      NOT_RECEIVED: "Khách không nhận",
    };

    return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
  };

  const columns: TableColumnsType<OrderType> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "id",
      key: "id",
      align: "center",
      render: (text) => (
        <Link to={`/ADMIN/quan-li-don-hang/${text}`} className="order__link">
          {text.substring(0, 8)}...
        </Link>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: ["customerProfile", "fullName"],
      key: "fullName",
      align: "center",
    },
    {
      title: "Ngày đặt",
      dataIndex: "orderDate",
      key: "orderDate",
      align: "center",
      render: (date: string) =>
        date ? dayjs(date, "DD-MM-YYYY HH:mm:ss").add(7, "hour").format("DD/MM/YYYY HH:mm") : "---",
    },
    {
      title: "Tổng tiền",
      dataIndex: "finalAmount",
      key: "finalAmount",
      align: "center",
      sorter: (a, b) => a.finalAmount - b.finalAmount,
      render: (price) => getFormattedPrice(price),
    },
    {
      title: "Phương thức",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      align: "center",
      render: (method: string) => {
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
              src="https://media.zenfs.com/en/globenewswire.com/d572fcc587598e58786c3856ba2bc978"
              alt="PAYOS"
              className="payment-logo"
            />
          );

        if (method === "WALLET")
          return (
            <img
              src="https://i.pinimg.com/1200x/b4/9f/f9/b49ff9a83a19ebc745cb4ed40970b6e6.jpg"
              alt="WALLET"
              className="payment-logo"
            />
          );
        return <span>{method || "Chưa cập nhật"}</span>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: renderStatusTag,
    },
  ];

  const statuses = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ thanh toán" },
    { key: "PAID", label: "Đã thanh toán" },
    { key: "PREPARING", label: "Đang chuẩn bị" },
    { key: "PENDING_DELIVERY", label: "Đang giao hàng" },
    { key: "DELIVERED", label: "Đã giao" },
    { key: "NOT_RECEIVED", label: "Khách không nhận" },
    { key: "REFUNDED", label: "Đã hoàn tiền" },
    { key: "CANCELLED", label: "Đã hủy" },
  ];

  return (
    <div className="ManageOrder">
      <h1>Quản lí đơn hàng</h1>

      <div className="filter-status">
        {statuses.map((s) => (
          <Button
            key={s.key}
            type="default"
            style={{
              backgroundColor: statusFilter === s.key ? "#ff6f61" : "#f0f0f0",
              color: statusFilter === s.key ? "white" : "black",
              borderColor: statusFilter === s.key ? "#ff6f61" : "#d9d9d9",
            }}
            onClick={() => {
              setStatusFilter(s.key);
              fetchOrders(1, pagination.pageSize, s.key);
            }}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="filter-bar">
        <Space className="filter-controls">
          <Search
            placeholder="Tìm theo tên hoặc ID..."
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ width: 340 }}
          />
          <RangePicker format="DD/MM/YYYY" onChange={(v) => setDateRange(v)} style={{ width: 340 }} />
        </Space>
      </div>

      {loading ? (
        <div className="loading-wrapper">
          <svg className="hamster-icon" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#1890ff"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="188"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 50 50;360 50 50"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="70" cy="30" r="6" fill="#1890ff">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 50 50;360 50 50"
                dur="0.6s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <Table
          dataSource={filteredOrders}
          columns={columns}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          bordered
        />
      )}
    </div>
  );
}

export default ManageOrder;
