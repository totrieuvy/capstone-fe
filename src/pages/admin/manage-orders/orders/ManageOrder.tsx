// src/pages/admin/manage-orders/ManageOrder.tsx

import { useEffect, useState } from "react";
import { Table, Input, Tag } from "antd";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import { Link } from "react-router-dom";
import api from "../../../../config/axios";
import { toast } from "react-toastify";
import { getFormattedPrice } from "../../../../utils/formatPrice";
import "./ManageOrder.scss";

const { Search } = Input;

interface OrderType {
  id: string;
  orderDate: string;
  status: "PENDING" | "PAID" | "DELIVERING" | "COMPLETED" | "CANCELLED";
  finalAmount: number;
  customerProfile: {
    fullName: string;
    email: string;
    address: string;
    citizenId: string;
  };
  deliveryAddress: string;
  totalAmount: number;
  discountPercent: number;
  shippingFee: number;
  deliveredAt: string | null;
}

function ManageOrder() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/order`, {
        params: {
          page: page - 1,
          size: size,
          sortBy: "createdAt",
          sortDir: "desc",
        },
      });

      const data = response.data.data;
      setOrders(data.content);
      setPagination({
        current: data.pageNumber + 1,
        pageSize: data.pageSize,
        total: data.totalElements,
      });
    } catch (error) {
      toast.error("Lấy danh sách đơn hàng thất bại: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lý đơn hàng";
    fetchOrders(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.customerProfile.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStatusTag = (status: OrderType["status"]) => {
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

  const columns: TableColumnsType<OrderType> = [
    {
      title: "Mã đơn hàng (ID)",
      dataIndex: "id",
      key: "id",
      render: (text) => (
        <Link to={`/ADMIN/quan-li-don-hang/${text}`} style={{ color: "#1890ff", fontWeight: "500" }}>
          {text.substring(0, 8)}...
        </Link>
      ),
    },
    {
      title: "Tên khách hàng",
      dataIndex: ["customerProfile", "fullName"],
      key: "fullName",
      sorter: (a, b) => a.customerProfile.fullName.localeCompare(b.customerProfile.fullName),
    },
    {
      title: "Ngày đặt",
      dataIndex: "orderDate",
      key: "orderDate",
    },
    {
      title: "Tổng tiền",
      dataIndex: "finalAmount",
      key: "finalAmount",
      sorter: (a, b) => a.finalAmount - b.finalAmount,
      render: (price) => getFormattedPrice(price),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: renderStatusTag,
    },
  ];

  return (
    <div className="ManageOrder">
      <h1>Quản lý đơn hàng</h1>

      <div className="manageOrder__toolbar">
        <Search
          placeholder="Tìm kiếm theo tên khách hàng hoặc ID..."
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      <Table
        dataSource={filteredOrders}
        columns={columns}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
}

export default ManageOrder;
