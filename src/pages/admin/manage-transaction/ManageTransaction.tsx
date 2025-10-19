// src/pages/admin/manage-transaction/ManageTransaction.tsx

import { useEffect, useState } from "react";
import { Table, Input, Tag } from "antd";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import { getFormattedPrice } from "../../../utils/formatPrice";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "./ManageTransaction.scss";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Search } = Input;

interface TransactionType {
  id: string;
  status: string | null;
  amount: number;
  serviceName: string;
  documentNo: string;
  transactionTime: string;
}

function ManageTransaction() {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTransactions = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/transaction`, {
        params: {
          page: page - 1,
          size: size,
          sortBy: "transactionTime",
          sortDir: "desc",
        },
      });

      const data = response.data.data;
      setTransactions(data.content);
      setPagination({
        current: data.pageNumber + 1,
        pageSize: data.pageSize,
        total: data.totalElements,
      });
    } catch (error) {
      toast.error("Lấy danh sách giao dịch thất bại: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lý giao dịch";
    fetchTransactions(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  };

  const filteredTransactions = transactions.filter((t) =>
    t.documentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStatusTag = (status: string | null) => {
    switch (status) {
      case "PAID":
        return <Tag color="blue">Đã thanh toán</Tag>;
      case "FAILED":
        return <Tag color="red">Thất bại</Tag>;
      case "REFUNDED":
        return <Tag color="purple">Đã hoàn tiền</Tag>;
      default:
        return <Tag color="default">Đang xử lý</Tag>;
    }
  };

  const columns: TableColumnsType<TransactionType> = [
    {
      title: "Mã giao dịch (ID)",
      dataIndex: "id",
      key: "id",
      render: (text) => <span style={{ color: "#1890ff", fontWeight: 500 }}>{text.substring(0, 8)}...</span>,
    },
    {
      title: "Mã chứng từ",
      dataIndex: "documentNo",
      key: "documentNo",
    },
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      render: (text) => (text === "ORDER" ? <Tag color="cyan">Đơn hàng</Tag> : <Tag color="geekblue">Đặt chỗ</Tag>),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => a.amount - b.amount,
      render: (price) => getFormattedPrice(price),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: renderStatusTag,
    },
    {
      title: "Thời gian giao dịch",
      dataIndex: "transactionTime",
      key: "transactionTime",
      render: (time: string) => dayjs(time, "DD-MM-YYYY HH:mm:ss").add(7, "hour").format("DD/MM/YYYY HH:mm"),
    },
  ];

  return (
    <div className="ManageTransaction">
      <h1>Quản lý giao dịch</h1>

      <div className="manageTransaction__toolbar">
        <Search
          placeholder="Tìm kiếm theo mã chứng từ..."
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      <Table
        dataSource={filteredTransactions}
        columns={columns}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
}

export default ManageTransaction;
