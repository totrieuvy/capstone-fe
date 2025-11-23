import { useEffect, useState } from "react";
import { Table, Input, DatePicker, Button, Tag, Space, Select } from "antd";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import { getFormattedPrice } from "../../../utils/formatPrice";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "./ManageTransaction.scss";

dayjs.extend(utc);
dayjs.extend(timezone);

const { RangePicker } = DatePicker;
const { Search } = Input;
const { Option } = Select;

/* ==============================
   INTERFACES
================================= */
interface TransactionType {
  id: string;
  status: string;
  amount: number;
  serviceName: string;
  documentNo: string;
  transactionTime: string;
}

interface TransactionQueryParams {
  page: number;
  size: number;
  status?: string;
  serviceName?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

function ManageTransaction() {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  /* ======================================
     FETCH TRANSACTIONS (BACKEND PAGINATION)
  ====================================== */
  const fetchTransactions = async (
    page = 1,
    size = 10,
    status = statusFilter,
    service = serviceFilter,
    search = searchTerm,
    dates = dateRange
  ) => {
    setLoading(true);

    try {
      const params: TransactionQueryParams = {
        page: page - 1,
        size,
      };

      if (status !== "ALL") params.status = status;
      if (service !== "ALL") params.serviceName = service;
      if (search.trim() !== "") params.search = search.trim();

      if (dates && dates[0] && dates[1]) {
        params.startDate = dates[0].startOf("day").format("YYYY-MM-DD");
        params.endDate = dates[1].endOf("day").format("YYYY-MM-DD");
      }

      const res = await api.get(`/api/transaction`, { params });
      const data = res.data.data;

      setTransactions(data.content);

      setPagination({
        current: data.pageNumber + 1,
        pageSize: data.pageSize,
        total: data.totalElements,
      });
    } catch (error) {
      toast.error("Không thể tải giao dịch: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /* ================================
     FIRST LOAD
  ================================== */
  useEffect(() => {
    document.title = "Quản lí giao dịch";
    fetchTransactions(1, 10);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================================
     PAGINATION CHANGE
  ================================== */
  const handleTableChange = (newPagination: TablePaginationConfig) => {
    fetchTransactions(
      newPagination.current!,
      newPagination.pageSize!,
      statusFilter,
      serviceFilter,
      searchTerm,
      dateRange
    );
  };

  /* ================================
     STATUS COLORS
  ================================== */
  const renderStatusTag = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      PENDING: { color: "orange", label: "Đang chờ" },
      BOOKED: { color: "blue", label: "Đã đặt" },
      CHECK_IN: { color: "geekblue", label: "Đã nhận thú" },
      CHECK_OUT: { color: "cyan", label: "Đã trả thú" },
      CANCELLED: { color: "red", label: "Đã hủy" },
      REFUNDED: { color: "green", label: "Đã hoàn tiền" },

      PAID: { color: "green", label: "Đã thanh toán" },
      IN_PROGRESS: { color: "purple", label: "Đang thực hiện" },
      FAILED: { color: "red", label: "Thất bại" },
      COMPLETED: { color: "green", label: "Hoàn tất" },
      REJECTED: { color: "volcano", label: "Từ chối" },
    };

    const item = map[status];
    return <Tag color={item?.color || "default"}>{item?.label || status}</Tag>;
  };

  /* ================================
     TABLE COLUMNS
  ================================== */
  const columns: TableColumnsType<TransactionType> = [
    {
      title: "Mã GD",
      dataIndex: "id",
      align: "center",
      render: (text) => <span className="transaction__id">{text.substring(0, 8)}...</span>,
    },
    {
      title: "Mã chứng từ",
      dataIndex: "documentNo",
      align: "center",
    },
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      align: "center",
      render: (text) => {
        const map: Record<string, { label: string; color: string }> = {
          ORDER: { label: "Đơn hàng", color: "cyan" },
          BOOKING: { label: "Đặt lịch giữ hộ", color: "geekblue" },
          GROOMING: { label: "Đặt làm đẹp", color: "magenta" },
          MEDICAL: { label: "Y tế", color: "purple" }, // 🔥 thêm MEDICAL
        };

        const item = map[text];
        return <Tag color={item?.color}>{item?.label || text}</Tag>;
      },
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      align: "right",
      sorter: (a, b) => a.amount - b.amount,
      render: (price) => getFormattedPrice(price),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      render: renderStatusTag,
    },
    {
      title: "Thời gian",
      dataIndex: "transactionTime",
      align: "center",
      render: (time) => dayjs(time, "DD-MM-YYYY HH:mm:ss").add(7, "hour").format("DD/MM/YYYY HH:mm"),
    },
  ];

  /* ================================
     STATUS + SERVICE OPTIONS
  ================================== */
  const statuses = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Đang chờ" },
    { key: "BOOKED", label: "Đã đặt" },
    { key: "IN_PROGRESS", label: "Đang thực hiện" },
    { key: "CHECK_IN", label: "Đã nhận thú" },
    { key: "CHECK_OUT", label: "Đã trả thú" },
    { key: "PAID", label: "Đã thanh toán" },
    { key: "COMPLETED", label: "Hoàn tất" },
    { key: "FAILED", label: "Thất bại" },
    { key: "REJECTED", label: "Từ chối" },
    { key: "CANCELLED", label: "Đã hủy" },
    { key: "REFUNDED", label: "Đã hoàn tiền" },
  ];

  const serviceTypes = [
    { key: "ALL", label: "Tất cả" },
    { key: "BOOKING", label: "Đặt lịch giữ hộ" },
    { key: "GROOMING", label: "Đặt làm đẹp" },
    { key: "ORDER", label: "Đơn hàng" },
    { key: "MEDICAL", label: "Y tế" },
  ];

  /* ================================
     RENDER UI
  ================================== */
  return (
    <div className="ManageTransaction">
      <h1 className="page-title">Quản lí giao dịch</h1>

      {/* FILTER TRẠNG THÁI */}
      <div className="filter-status">
        {statuses.map((s) => (
          <Button
            key={s.key}
            type={statusFilter === s.key ? "primary" : "default"}
            shape="round"
            onClick={() => {
              setStatusFilter(s.key);
              fetchTransactions(1, pagination.pageSize, s.key);
            }}
            className="status-btn"
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <Space className="filter-controls">
          <Search
            placeholder="Tìm theo mã chứng từ..."
            allowClear
            onChange={(e) => {
              setSearchTerm(e.target.value);
              fetchTransactions(1, pagination.pageSize, statusFilter, serviceFilter, e.target.value);
            }}
            style={{ width: 260 }}
          />

          <RangePicker
            format="DD/MM/YYYY"
            onChange={(v) => {
              setDateRange(v);
              fetchTransactions(1, pagination.pageSize, statusFilter, serviceFilter, searchTerm, v);
            }}
            style={{ width: 260 }}
          />

          <Select
            value={serviceFilter}
            onChange={(value) => {
              setServiceFilter(value);
              fetchTransactions(1, pagination.pageSize, statusFilter, value);
            }}
            style={{ width: 220 }}
          >
            {serviceTypes.map((s) => (
              <Option key={s.key} value={s.key}>
                {s.label}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <Table
          dataSource={transactions}
          columns={columns}
          rowKey="id"
          loading={loading}
          bordered
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            showTotal: (t) => `Tổng ${t} giao dịch`,
          }}
          onChange={handleTableChange}
        />
      </div>
    </div>
  );
}

export default ManageTransaction;
