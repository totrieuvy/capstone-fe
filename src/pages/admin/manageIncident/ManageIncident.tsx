import { useEffect, useState } from "react";
import { Table, Tag, Button, Input, Popconfirm, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import "./ManageIncident.scss";

interface IncidentType {
  bookingId: string;
  customerName: string;
  phoneNumber: string;
  hamsterName: string;
  incidentNote: string;
  isIncident: boolean;
  incidentSolve: boolean;
}
function ManageIncident() {
  const [data, setData] = useState<IncidentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchIncidents = async (page = 1, size = 10) => {
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
    document.title = "Quản lí sự cố";
    fetchIncidents(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  };

  // Filter by customer name
  const filteredData = data.filter((item) => item.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSolve = async (id: string, refunded: boolean) => {
    try {
      await api.patch(`/api/booking/${id}/handle-incident`, {
        refunded,
      });
      toast.success(refunded ? "Đã bồi thường!" : "Đã từ chối bồi thường!");
      fetchIncidents(pagination.current, pagination.pageSize);
    } catch {
      toast.error(refunded ? "Bồi thường thất bại!" : "Từ chối thất bại!");
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
      title: "Ghi chú sự cố",
      dataIndex: "incidentNote",
      align: "center",
      render: (note: string) => note || "Không ghi chú",
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
          <Space>
            <Popconfirm
              title="Xác nhận duyệt sự cố?"
              okText="Xác nhận"
              cancelText="Hủy"
              onConfirm={() => handleSolve(record.bookingId, true)}
            >
              <Button style={{ backgroundColor: "#52c41a", color: "white" }}>Duyệt</Button>
            </Popconfirm>
            <Popconfirm
              title="Xác nhận từ chối sự cố?"
              okText="Xác nhận"
              cancelText="Hủy"
              onConfirm={() => handleSolve(record.bookingId, false)}
            >
              <Button style={{ backgroundColor: "#ff4d4f", color: "white" }}>Từ chối</Button>
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <div className="ManageIncident">
      <h1>Quản lí sự cố</h1>

      <div className="search-box">
        <Space style={{ marginBottom: 16, width: "100%" }}>
          <Input
            placeholder="Tìm kiếm theo tên khách hàng..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="bookingId"
        pagination={{
          ...pagination,
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} sự cố`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
}

export default ManageIncident;
