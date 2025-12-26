import React, { useState, useEffect, useMemo } from "react";
import { Table, Input, Tag, message, Modal, Form, Select, Button, Card, Divider } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { AiOutlineEye, AiOutlineEdit } from "react-icons/ai";
import api from "../../../config/axios";
import { cageService } from "../../../services/CageService";
import type { CageDetail, UpdateCageRequest, CreateCageRequest } from "../../../services/CageService";
import { cageTypeService } from "../../../services/CageTypeService";
import type { CageTypeResponse } from "../../../services/CageTypeService";
import { getAllTemperatures } from "../../../services/IotService";
import type { TemperatureData } from "../../../services/IotService";
import "./ManageCage.scss";
import { toast } from "react-toastify";

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
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [allCageTypes, setAllCageTypes] = useState<CageTypeResponse[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [iotDevices, setIotDevices] = useState<TemperatureData[]>([]);

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

  // Fetch cage types
  const fetchCageTypes = async () => {
    try {
      const types = await cageTypeService.getCageTypes();
      setAllCageTypes(types);
    } catch {
      message.error("Không thể tải danh sách loại chuồng");
    }
  };

  // Fetch IoT devices
  const fetchIotDevices = async () => {
    try {
      const devices = await getAllTemperatures();
      setIotDevices(devices);
    } catch {
      message.error("Không thể tải danh sách thiết bị IoT");
    }
  };

  useEffect(() => {
    document.title = "Quản lí chuồng";
    fetchCages();
    fetchCageTypes();
    fetchIotDevices();
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

  const handleUpdateCage = async (cageId: string) => {
    try {
      const cageDetail = await cageService.getCageById(cageId);
      setSelectedCage(cageDetail);
      form.setFieldsValue({
        cageTypeId: cageDetail.cageTypeId,
        cageName: cageDetail.cageName,
        status: cageDetail.status,
        iotCode: cageDetail.iotCode || "",
      });
      setIsUpdateModalOpen(true);
    } catch (error) {
      message.error("Không thể tải thông tin chuồng");
    }
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedCage(null);
    form.resetFields();
  };

  const handleSubmitUpdate = async (values: UpdateCageRequest) => {
    if (!selectedCage) return;
    
    setUpdateLoading(true);
    try {
      // Set iotCode to null if not selected
      const updateData: UpdateCageRequest = {
        ...values,
        iotCode: values.iotCode || null,
      };
      
      await cageService.updateCage(selectedCage.id, updateData);
      toast.success("Cập nhật chuồng thành công");
      handleCloseUpdateModal();
      fetchCages(); // Refresh the list
    } catch (error) {
      toast.error("Không thể cập nhật chuồng");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    createForm.resetFields();
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.resetFields();
  };

  const handleSubmitCreate = async (values: CreateCageRequest) => {
    setCreateLoading(true);
    try {
      const createData: CreateCageRequest = {
        cageTypeId: values.cageTypeId,
        cageName: values.cageName,
        iotCode: values.iotCode || null,
      };
      
      await cageService.createCage(createData);
      toast.success("Tạo chuồng mới thành công");
      handleCloseCreateModal();
      fetchCages(); // Refresh the list
    } catch (error) {
      toast.error("Không thể tạo chuồng mới");
    } finally {
      setCreateLoading(false);
    }
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
            onClick={() => handleUpdateCage(record.id)}
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
        <Button type="primary" icon={<PlusOutlined />}  style={{ marginBottom: 12 }} onClick={handleOpenCreateModal}>
          Thêm chuồng mới
        </Button>
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
        footer={
          <Button type="primary" onClick={handleCloseViewModal}>
            Đóng
          </Button>
        }
        width={650}
      >
        {modalLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div>Đang tải...</div>
          </div>
        ) : selectedCage ? (
          <div style={{ padding: "8px 0" }}>
            <Card
              size="small"
              style={{
                marginBottom: "16px",
                borderRadius: "8px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ marginBottom: "12px" }}>
                <div style={{ color: "#999", fontSize: "12px", marginBottom: "4px" }}>ID Chuồng</div>
                <div style={{ fontSize: "13px", color: "#666", fontFamily: "monospace" }}>{selectedCage.id}</div>
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <div>
                <div style={{ color: "#999", fontSize: "12px", marginBottom: "4px" }}>Tên chuồng</div>
                <div style={{ fontSize: "20px", fontWeight: 600, color: "#ff6f61" }}>{selectedCage.cageName}</div>
              </div>
            </Card>

            <Card
              title="Thông tin loại chuồng"
              size="small"
              style={{
                marginBottom: "16px",
                borderRadius: "8px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
              headStyle={{ backgroundColor: "#fafafa", fontSize: "14px", fontWeight: 600 }}
            >
              <div style={{ marginBottom: "12px" }}>
                <div style={{ color: "#999", fontSize: "12px", marginBottom: "6px" }}>Loại chuồng</div>
                <Tag color={cageTypeColorMap[selectedCage.cageTypeName]} style={{ fontSize: "14px", padding: "4px 12px" }}>
                  {selectedCage.cageTypeName}
                </Tag>
              </div>
              <div>
                <div style={{ color: "#999", fontSize: "12px", marginBottom: "4px" }}>ID Loại chuồng</div>
                <div style={{ fontSize: "13px", color: "#666", fontFamily: "monospace" }}>{selectedCage.cageTypeId}</div>
              </div>
            </Card>

            <Card
              title="Thông tin thiết bị & trạng thái"
              size="small"
              style={{
                borderRadius: "8px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
              headStyle={{ backgroundColor: "#fafafa", fontSize: "14px", fontWeight: 600 }}
            >
              <div style={{ marginBottom: "12px" }}>
                <div style={{ color: "#999", fontSize: "12px", marginBottom: "6px" }}>Mã IoT</div>
                {selectedCage.iotCode ? (
                  <Tag color="cyan" style={{ fontSize: "14px", padding: "4px 12px" }}>
                    {selectedCage.iotCode}
                  </Tag>
                ) : (
                  <Tag color="default" style={{ fontSize: "14px", padding: "4px 12px" }}>Chưa có</Tag>
                )}
              </div>
              <div>
                <div style={{ color: "#999", fontSize: "12px", marginBottom: "6px" }}>Trạng thái</div>
                <Tag
                  color={getStatusColor(selectedCage.status)}
                  style={{
                    fontSize: "14px",
                    padding: "4px 12px",
                    fontWeight: 500,
                  }}
                >
                  {getStatusText(selectedCage.status)}
                </Tag>
              </div>
            </Card>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Cập nhật thông tin chuồng"
        open={isUpdateModalOpen}
        onCancel={handleCloseUpdateModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitUpdate}
          style={{ marginTop: "20px" }}
        >
          <Form.Item
            label="Loại chuồng"
            name="cageTypeId"
            rules={[{ required: true, message: "Vui lòng chọn loại chuồng" }]}
          >
            <Select placeholder="Chọn loại chuồng">
              {allCageTypes
                .filter((type) => type.isActive)
                .map((type) => (
                  <Select.Option key={type.id} value={type.id}>
                    {type.typeName}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Tên chuồng"
            name="cageName"
            rules={[{ required: true, message: "Vui lòng nhập tên chuồng" }]}
          >
            <Input placeholder="Nhập tên chuồng" />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="ACTIVE">Hoạt động</Select.Option>
              <Select.Option value="INACTIVE">Không hoạt động</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Mã IoT (Tùy chọn)" name="iotCode">
            <Select placeholder="Chọn mã IoT" allowClear>
              {iotDevices.map((device) => (
                <Select.Option key={device.iotId} value={device.iotId}>
                  {device.iotId}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button onClick={handleCloseUpdateModal} style={{ marginRight: "8px" }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={updateLoading}>
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo chuồng mới"
        open={isCreateModalOpen}
        onCancel={handleCloseCreateModal}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleSubmitCreate}
          style={{ marginTop: "20px" }}
        >
          <Form.Item
            label="Loại chuồng"
            name="cageTypeId"
            rules={[{ required: true, message: "Vui lòng chọn loại chuồng" }]}
          >
            <Select placeholder="Chọn loại chuồng">
              {allCageTypes
                .filter((type) => type.isActive)
                .map((type) => (
                  <Select.Option key={type.id} value={type.id}>
                    {type.typeName}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Tên chuồng"
            name="cageName"
            rules={[{ required: true, message: "Vui lòng nhập tên chuồng" }]}
          >
            <Input placeholder="Nhập tên chuồng" />
          </Form.Item>

          <Form.Item label="Mã IoT (Tùy chọn)" name="iotCode">
            <Select placeholder="Chọn mã IoT" allowClear>
              {iotDevices.map((device) => (
                <Select.Option key={device.iotId} value={device.iotId}>
                  {device.iotId}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button onClick={handleCloseCreateModal} style={{ marginRight: "8px" }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={createLoading}>
              Tạo chuồng
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageCage;
