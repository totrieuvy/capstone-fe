import { useEffect, useState } from "react";
import { Table, Tag, Button, Input, Popconfirm, Space } from "antd";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import "./ManageIncident.scss";

const { Search } = Input;

interface IncidentType {
  bookingId: string;
  customerName: string;
  phoneNumber: string;
  hamsterName: string;
  cageTypeName: string;
  cageName: string;
  isIncident: boolean;
  incidentSolve: boolean;
}
function ManageIncident() {
  const [data, setData] = useState<IncidentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  const fetchIncidents = async (page = 1, size = 5) => {
    try {
      setLoading(true);
      const res = await api.get("/api/booking/incidents", {
        params: { page: page - 1, size },
      });

      const content = res.data.data.content;
      setData(content);

      setPagination({
        current: res.data.data.number + 1,
        pageSize: res.data.data.size,
        total: res.data.data.totalElements,
      });
    } catch {
      toast.error("Không thể tải danh sách sự cố!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  };

  // 🔍 Lọc theo tên khách hàng
  const filteredData = data.filter((item) => item.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSolve = async (id: string) => {
    try {
      await api.patch(`/api/booking/${id}/handle-incident`);
      toast.success("Đã cập nhật tình trạng sự cố!");
      fetchIncidents(pagination.current, pagination.pageSize);
    } catch {
      toast.error("Cập nhật thất bại!");
    }
  };

  const columns: TableColumnsType<IncidentType> = [
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      align: "center",
    },
    {
      title: "SĐT",
      dataIndex: "phoneNumber",
      align: "center",
    },
    {
      title: "Hamster",
      dataIndex: "hamsterName",
      align: "center",
    },
    {
      title: "Loại chuồng",
      dataIndex: "cageTypeName",
      align: "center",
    },
    {
      title: "Tên chuồng",
      dataIndex: "cageName",
      align: "center",
    },
    {
      title: "Sự cố",
      dataIndex: "isIncident",
      align: "center",
      render: (value: boolean) => (value ? <Tag color="red">Có sự cố</Tag> : <Tag color="green">Không có</Tag>),
    },
    {
      title: "Tình trạng",
      dataIndex: "incidentSolve",
      align: "center",
      render: (solve: boolean) => (solve ? <Tag color="green">Đã duyệt</Tag> : <Tag color="orange">Chưa duyệt</Tag>),
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) =>
        !record.incidentSolve && (
          <Popconfirm
            title="Xác nhận duyệt sự cố?"
            okText="Xác nhận"
            cancelText="Hủy"
            onConfirm={() => handleSolve(record.bookingId)}
          >
            <Button style={{ backgroundColor: "#ff6f61", color: "white" }}>Duyệt</Button>
          </Popconfirm>
        ),
    },
  ];

  return (
    <div className="ManageIncident">
      <h1>Quản lí sự cố</h1>

      <Space style={{ marginBottom: 20 }}>
        <Search
          placeholder="Tìm theo tên khách hàng..."
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
      </Space>

      <Table
        dataSource={filteredData}
        columns={columns}
        loading={loading}
        rowKey="bookingId"
        pagination={pagination}
        onChange={handleTableChange}
        bordered
      />
    </div>
  );
}

export default ManageIncident;
