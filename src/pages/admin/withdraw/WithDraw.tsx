import React, { useEffect, useState } from "react";
import { Table, Button, Space, Input, Popconfirm, Upload, message, Tag, Spin } from "antd";
import { UploadOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api from "../../../config/axios";
import "./WithDraw.scss";
import { storage } from "../../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";

interface Withdraw {
  id: string;
  customerName: string;
  amount: number;
  status: string;
  note: string;
  bankAccount: string;
  bankName: string;
  cardOwner: string;
  createdAt: string;
}

// ======================== Helper: +7h giờ VN ========================
const toVietnamTime = (dateStr: string) => {
  const [datePart, timePart] = dateStr.split(" ");
  const [day, month, year] = datePart.split("-");
  const date = new Date(`${year}-${month}-${day}T${timePart}`);
  date.setHours(date.getHours() + 7);
  return date.toLocaleString("vi-VN", { hour12: false });
};

const WithDraw: React.FC = () => {
  const [withdraws, setWithdraws] = useState<Withdraw[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const fetchWithdraws = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/withdraw");
      if (res.data.code === 200) {
        const sorted = res.data.data.content.sort((a: Withdraw, b: Withdraw) => {
          const [da, ma, ya] = a.createdAt.split(" ")[0].split("-");
          const [db, mb, yb] = b.createdAt.split(" ")[0].split("-");
          return new Date(`${yb}-${mb}-${db}`).getTime() - new Date(`${ya}-${ma}-${da}`).getTime();
        });
        setWithdraws(sorted);
      } else {
        message.error(res.data.message || "Không thể tải danh sách rút tiền");
      }
    } catch {
      message.error("Lỗi khi tải danh sách rút tiền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lí rút tiền";
    fetchWithdraws();
  }, []);

  const handleReject = async (id: string) => {
    try {
      const res = await api.patch(`/api/withdraw/${id}`, {
        status: "REJECTED",
        withdrawImage: "",
      });
      if (res.data.code === 200) {
        toast.success(res.data.message || "Đã từ chối yêu cầu rút tiền!");
        fetchWithdraws();
      } else {
        toast.error(res.data.message || "Không thể cập nhật trạng thái!");
      }
    } catch {
      toast.error("Lỗi khi từ chối yêu cầu!");
    }
  };

  const handleComplete = async (file: File, id: string) => {
    try {
      const fileRef = ref(storage, `withdraw/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      const res = await api.patch(`/api/withdraw/${id}`, {
        status: "COMPLETED",
        withdrawImage: url,
      });

      if (res.data.code === 200) {
        toast.success("Đã xác nhận hoàn thành giao dịch!");
        fetchWithdraws();
      } else {
        toast.error(res.data.message || "Cập nhật thất bại!");
      }
    } catch {
      toast.error("Lỗi khi upload ảnh hoặc cập nhật trạng thái!");
    }
  };

  const filteredData = withdraws.filter((w) => {
    const matchStatus = filterStatus ? w.status === filterStatus : true;
    const matchSearch = w.customerName.toLowerCase().includes(searchText.toLowerCase());
    return matchStatus && matchSearch;
  });

  const columns: ColumnsType<Withdraw> = [
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      align: "center",
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      align: "center",
      render: (amount: number) => <b>{amount.toLocaleString("vi-VN")} đ</b>,
    },
    {
      title: "Ngân hàng",
      dataIndex: "bankName",
      key: "bankName",
      align: "center",
    },
    {
      title: "Số tài khoản",
      dataIndex: "bankAccount",
      key: "bankAccount",
      align: "center",
    },
    {
      title: "Chủ thẻ",
      dataIndex: "cardOwner",
      key: "cardOwner",
      align: "center",
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      align: "center",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      align: "center",
      render: (time: string) => toVietnamTime(time),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: string) => {
        let color = "orange";
        let text = "";
        if (status === "PENDING") {
          color = "gold";
          text = "Đang xử lý";
        } else if (status === "COMPLETED") {
          color = "green";
          text = "Hoàn thành";
        } else if (status === "REJECTED") {
          color = "red";
          text = "Từ chối";
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      render: (_, record) =>
        record.status === "PENDING" ? (
          <Space>
            <Popconfirm
              title="Xác nhận từ chối yêu cầu này?"
              onConfirm={() => handleReject(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button danger size="small">
                REJECTED
              </Button>
            </Popconfirm>
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                handleComplete(file, record.id);
                return false;
              }}
            >
              <Button type="primary" size="small" icon={<UploadOutlined />}>
                COMPLETED
              </Button>
            </Upload>
          </Space>
        ) : null,
    },
  ];

  return (
    <div className="withdraw-page">
      <h1>Quản lí rút tiền</h1>

      <div className="withdraw__filters">
        <Space style={{ width: "100%", marginBottom: 16 }}>
          <Input
            placeholder="Tìm kiếm theo tên khách hàng..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />

          <div className="filter-buttons">
            <Button type={!filterStatus ? "primary" : "default"} onClick={() => setFilterStatus(null)}>
              Tất cả
            </Button>
            <Button
              type={filterStatus === "PENDING" ? "primary" : "default"}
              onClick={() => setFilterStatus("PENDING")}
            >
              Đang xử lý
            </Button>
            <Button
              type={filterStatus === "COMPLETED" ? "primary" : "default"}
              onClick={() => setFilterStatus("COMPLETED")}
            >
              Hoàn thành
            </Button>
            <Button
              type={filterStatus === "REJECTED" ? "primary" : "default"}
              onClick={() => setFilterStatus("REJECTED")}
            >
              Từ chối
            </Button>
          </div>
        </Space>
      </div>

      <Spin spinning={loading} tip="Đang tải dữ liệu...">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          bordered
          pagination={{
            pageSize: 8,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
          }}
        />
      </Spin>
    </div>
  );
};

export default WithDraw;
