import { useEffect, useState } from "react";
import { Table, Input, DatePicker, Button, Tag, Space } from "antd";
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

interface TransactionType {
  id: string;
  status: "PENDING" | "PAID" | "CHECK_IN" | "CHECK_OUT" | "CONFIRMED" | "REFUNDED";
  amount: number;
  serviceName: string;
  documentNo: string;
  transactionTime: string;
}

function ManageTransaction() {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchTransactions = async (page = 1, size = 10): Promise<void> => {
    setLoading(true);
    try {
      const res = await api.get(`/api/transaction`, {
        params: { page: page - 1, size, sortBy: "transactionTime", sortDir: "desc" },
      });
      if (res.data.code === 200) {
        const data = res.data.data;
        setTransactions(data.content);
        setPagination({
          current: data.pageNumber + 1,
          pageSize: data.pageSize,
          total: data.totalElements,
        });
      } else toast.error(res.data.message);
    } catch (error) {
      toast.error("Không thể tải giao dịch: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lý giao dịch";
    void fetchTransactions(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize]);

  const handleTableChange = (newPagination: TablePaginationConfig): void => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchStatus = statusFilter === "ALL" ? true : t.status === statusFilter;
    const matchSearch = t.documentNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate =
      dateRange && dateRange[0] && dateRange[1]
        ? dayjs(t.transactionTime, "DD-MM-YYYY HH:mm:ss").add(7, "hour").isAfter(dateRange[0]) &&
          dayjs(t.transactionTime, "DD-MM-YYYY HH:mm:ss").add(7, "hour").isBefore(dateRange[1])
        : true;
    return matchStatus && matchSearch && matchDate;
  });

  const renderStatusTag = (status: TransactionType["status"]) => {
    const colorMap: Record<TransactionType["status"], string> = {
      PENDING: "orange",
      PAID: "green",
      CHECK_IN: "blue",
      CHECK_OUT: "cyan",
      CONFIRMED: "purple",
      REFUNDED: "red",
    };
    return <Tag color={colorMap[status]}>{status}</Tag>;
  };

  const columns: TableColumnsType<TransactionType> = [
    {
      title: "Mã GD",
      dataIndex: "id",
      key: "id",
      render: (text: string) => <span className="transaction__id">{text.substring(0, 8)}...</span>,
      align: "center" as const,
    },
    {
      title: "Mã chứng từ",
      dataIndex: "documentNo",
      key: "documentNo",
      align: "center" as const,
    },
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      align: "center" as const,
      render: (text: string) => {
        if (text === "ORDER") return <Tag color="cyan">Đơn hàng</Tag>;
        if (text === "BOOKING") return <Tag color="geekblue">Đặt chỗ</Tag>;
        return <Tag color="default">{text}</Tag>;
      },
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      sorter: (a: TransactionType, b: TransactionType) => a.amount - b.amount,
      sortDirections: ["ascend", "descend"],
      render: (price: number) => getFormattedPrice(price),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: renderStatusTag,
    },
    {
      title: "Thời gian GD",
      dataIndex: "transactionTime",
      key: "transactionTime",
      align: "center" as const,
      render: (time: string) => dayjs(time, "DD-MM-YYYY HH:mm:ss").add(7, "hour").format("DD/MM/YYYY HH:mm"),
    },
  ];

  const statuses = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "PENDING" },
    { key: "PAID", label: "PAID" },
    { key: "CHECK_IN", label: "CHECK_IN" },
    { key: "CHECK_OUT", label: "CHECK_OUT" },
    { key: "CONFIRMED", label: "CONFIRMED" },
    { key: "REFUNDED", label: "REFUNDED" },
  ];

  return (
    <div className="ManageTransaction">
      <h1 className="page-title">Quản lý giao dịch</h1>

      <div className="filter-status">
        {statuses.map((s) => (
          <Button
            key={s.key}
            type={statusFilter === s.key ? "primary" : "default"}
            shape="round"
            className="status-btn"
            onClick={() => setStatusFilter(s.key)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="filter-bar">
        <Space className="filter-controls">
          <Search
            placeholder="Tìm theo mã chứng từ..."
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 340 }}
          />
          <RangePicker format="DD/MM/YYYY" onChange={(v) => setDateRange(v)} style={{ width: 340 }} />
        </Space>
      </div>

      <div className="table-wrapper">
        <Table
          dataSource={filteredTransactions}
          columns={columns}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} giao dịch`,
          }}
          loading={loading}
          onChange={handleTableChange}
          bordered
        />
      </div>
    </div>
  );
}

export default ManageTransaction;
