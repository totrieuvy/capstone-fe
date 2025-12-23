import React, { useState, useEffect, useMemo } from "react";
import { Table, Input, Tag, message, Modal } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { AiOutlineEye, AiOutlineEdit } from "react-icons/ai";
import api from "../../../config/axios";
import { cageService } from "../../../services/CageService";
import type { CageDetail } from "../../../services/CageService";
import "./ManageCage.scss";

// Màu sắc cho từng loại chuồng
const CAGE_TYPE_COLORS: Record<string, string> = {
  "Chuồng tiêu chuẩn": "#1890ff",
  "Chuồng cơ bản ": "#52c41a",
  "Chuồng đầy đủ": "#722ed1",
  "Chuồng vip": "#faad14",
};

const DEFAULT_COLORS = ["#13c2c2", "#fa541c", "#2f54eb", "#a0d911", "#f759ab"];

interface CageResponse {
  id: string;
  cageTypeId: string;
  cageTypeName: string;
  cageName: string;
  status: string;
  iotCode: string | null;
}

const ManageCage: React.FC = () => {
  const [cages, setCages] = useState<CageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedCageType, setSelectedCageType] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCage, setSelectedCage] = useState<CageDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch cages
  const fetchCages = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/cage");
      setCages(response.data.data || []);
    } catch {
      message.error("Không thể tải danh sách chuồng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lí chuồng";
    fetchCages();
  }, []);

  // Lấy danh sách loại chuồng unique và tạo map màu
  const cageTypes = useMemo(() => {
    return [...new Set(cages.map((c) => c.cageTypeName))];
  }, [cages]);

  const cageTypeColorMap = useMemo(() => {
    const colorMap: Record<string, string> = {};
    let defaultColorIndex = 0;
    cageTypes.forEach((typeName) => {
      if (CAGE_TYPE_COLORS[typeName]) {
        colorMap[typeName] = CAGE_TYPE_COLORS[typeName];
      } else {
        colorMap[typeName] = DEFAULT_COLORS[defaultColorIndex % DEFAULT_COLORS.length];
        defaultColorIndex++;
      }
    });
    return colorMap;
  }, [cageTypes]);

  const filteredData = cages.filter((item) => {
    const matchSearch = Object.values(item).some((val) => String(val).toLowerCase().includes(searchText.toLowerCase()));
    const matchCageType = !selectedCageType || item.cageTypeName === selectedCageType;
    return matchSearch && matchCageType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "green";
      case "INACTIVE":
        return "red";
      case "MAINTENANCE":
        return "orange";
      case "OCCUPIED":
        return "blue";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "INACTIVE":
        return "Không hoạt động";
      case "MAINTENANCE":
        return "Bảo trì";
      case "OCCUPIED":
        return "Đang sử dụng";
      default:
        return status;
    }
  };

  const handleViewCage = async (cageId: string) => {
    setModalLoading(true);
    setIsViewModalOpen(true);
    try {
      const cageDetail = await cageService.getCageById(cageId);
      setSelectedCage(cageDetail);
    } catch (error) {
      message.error("Không thể tải thông tin chuồng");
      setIsViewModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedCage(null);
  };

  const columns: ColumnsType<CageResponse> = [
    {
      title: "Tên chuồng",
      dataIndex: "cageName",
      key: "cageName",
      sorter: (a, b) => a.cageName.localeCompare(b.cageName),
      render: (cageName: string) => <span style={{ fontWeight: 600, fontSize: "14px" }}>{cageName}</span>,
    },
    {
      title: "Loại chuồng",
      dataIndex: "cageTypeName",
      key: "cageTypeName",
      sorter: (a, b) => a.cageTypeName.localeCompare(b.cageTypeName),
      render: (cageTypeName: string) => (
        <Tag color={cageTypeColorMap[cageTypeName]} style={{ fontWeight: 500 }}>
          {cageTypeName}
        </Tag>
      ),
    },
    {
      title: "Mã IoT",
      dataIndex: "iotCode",
      key: "iotCode",
      render: (iotCode: string | null) =>
        iotCode ? (
          <Tag color="cyan" style={{ fontWeight: 500 }}>
            {iotCode}
          </Tag>
        ) : (
          <Tag color="default">Chưa có</Tag>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Hoạt động", value: "ACTIVE" },
        { text: "Không hoạt động", value: "INACTIVE" },
        { text: "Bảo trì", value: "MAINTENANCE" },
        { text: "Đang sử dụng", value: "OCCUPIED" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ fontWeight: 500 }}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: CageResponse) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <AiOutlineEye
            style={{ fontSize: "18px", color: "#1890ff", cursor: "pointer" }}
            onClick={() => handleViewCage(record.id)}
          />
          <AiOutlineEdit
            style={{ fontSize: "18px", color: "#52c41a", cursor: "pointer" }}
            onClick={() => {
              // Update action - you can implement this later
              console.log("Update cage:", record);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="ManageCage">
      <h1>Quản lí chuồng</h1>

      <div className="search-box">
        <Input
          placeholder="Tìm kiếm chuồng..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300, marginBottom: 12 }}
        />
      </div>

      <div className="cage-type-filter">
        <span className="filter-label">Lọc theo loại chuồng:</span>
        <Tag className={`filter-tag ${!selectedCageType ? "active" : ""}`} onClick={() => setSelectedCageType(null)}>
          Tất cả
        </Tag>
        {cageTypes.map((type) => (
          <Tag
            key={type}
            className={`filter-tag ${selectedCageType === type ? "active" : ""}`}
            onClick={() => setSelectedCageType(type)}
          >
            {type}
          </Tag>
        ))}
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} chuồng`,
        }}
      />

      <Modal
        title="Thông tin chi tiết chuồng"
        open={isViewModalOpen}
        onCancel={handleCloseViewModal}
        footer={null}
        width={600}
      >
        {modalLoading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>Đang tải...</div>
        ) : selectedCage ? (
          <div style={{ padding: "16px 0" }}>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#666" }}>ID:</span>
              <span style={{ fontSize: "14px" }}>{selectedCage.id}</span>
            </div>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#666" }}>Tên chuồng:</span>
              <span style={{ fontSize: "16px", fontWeight: 600 }}>{selectedCage.cageName}</span>
            </div>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#666" }}>Loại chuồng:</span>
              <Tag color={cageTypeColorMap[selectedCage.cageTypeName]} style={{ fontWeight: 500, fontSize: "14px" }}>
                {selectedCage.cageTypeName}
              </Tag>
            </div>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#666" }}>ID loại chuồng:</span>
              <span style={{ fontSize: "14px" }}>{selectedCage.cageTypeId}</span>
            </div>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#666" }}>Mã IoT:</span>
              {selectedCage.iotCode ? (
                <Tag color="cyan" style={{ fontWeight: 500, fontSize: "14px" }}>
                  {selectedCage.iotCode}
                </Tag>
              ) : (
                <Tag color="default">Chưa có</Tag>
              )}
            </div>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#666" }}>Trạng thái:</span>
              <Tag color={getStatusColor(selectedCage.status)} style={{ fontWeight: 500, fontSize: "14px" }}>
                {getStatusText(selectedCage.status)}
              </Tag>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default ManageCage;
