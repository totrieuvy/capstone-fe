import React, { useEffect, useState } from "react";
import { Table, Input, Modal, Space, Tag, message } from "antd";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import "./ManageCustomer.scss";
import api from "../../../config/axios";

interface Customer {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
}

const ManageCustomer: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const convertUTCToVN = (str: string) => {
    // str: "16-11-2025 09:08:09"
    const [datePart, timePart] = str.split(" ");
    const [day, month, year] = datePart.split("-");

    // Tạo ISO format chuẩn: YYYY-MM-DDTHH:mm:ssZ (UTC)
    const isoString = `${year}-${month}-${day}T${timePart}Z`;

    const date = new Date(isoString); // JS tự convert sang giờ VN

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    const HH = String(date.getHours()).padStart(2, "0");
    const MM = String(date.getMinutes()).padStart(2, "0");
    const SS = String(date.getSeconds()).padStart(2, "0");

    return `${dd}-${mm}-${yyyy} ${HH}:${MM}:${SS}`;
  };

  const fetchCustomers = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/admin/account?role=CUSTOMER&page=${page - 1}&size=${size}&sortBy=createdAt&sortDir=desc`
      );
      const result = res.data.data;

      setCustomers(result.content);
      setTotalElements(result.totalElements);
    } catch {
      message.error("Không thể tải danh sách khách hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lí khách hàng";
    fetchCustomers(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const columns: ColumnsType<Customer> = [
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      width: 200,
      render: (v) => v || "—",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (v) => v || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "success" : "error"}>
          {status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (v) => convertUTCToVN(v),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <EyeOutlined
          onClick={() => {
            setSelectedCustomer(record);
            setIsDetailModalVisible(true);
          }}
          style={{ fontSize: 18, cursor: "pointer", color: "#1677ff" }}
        />
      ),
    },
  ];

  const filtered = customers.filter((item) =>
    Object.values(item).some((val) => val && String(val).toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className="ManageCustomer">
      <h1>Quản lí khách hàng</h1>

      <div className="search-box">
        <Space style={{ marginBottom: 16, width: "100%" }}>
          <Input
            placeholder="Tìm kiếm khách hàng..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={searchText ? filtered : customers}
        loading={loading}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: searchText ? filtered.length : totalElements,
          showSizeChanger: true,
          onChange: (p, s) => {
            setCurrentPage(p);
            setPageSize(s);
          },
          showTotal: (t) => `Tổng ${t} khách hàng`,
        }}
      />

      <Modal
        title="Thông tin khách hàng"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedCustomer && (
          <div className="customer-detail">
            <p>
              <strong>Họ và tên:</strong> {selectedCustomer.fullName || "—"}
            </p>
            <p>
              <strong>Email:</strong> {selectedCustomer.email}
            </p>
            <p>
              <strong>SĐT:</strong> {selectedCustomer.phone || "—"}
            </p>
            <p>
              <strong>Trạng thái:</strong>
              <Tag color={selectedCustomer.status === "ACTIVE" ? "success" : "error"}>
                {selectedCustomer.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
              </Tag>
            </p>
            <p>
              <strong>Ngày tạo:</strong> {convertUTCToVN(selectedCustomer.createdAt)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageCustomer;
