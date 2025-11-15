import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Space, message, Spin, Tag } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import type { ColumnsType } from "antd/es/table";
import "./Policy.scss";
import api from "../../../config/axios";

interface Policy {
  id: string;
  policyName: string;
  description: string;
  applicableServices: string;
  status: string;
}

interface PolicyResponse {
  code: number;
  message: string;
  data: Policy[];
}

interface PolicyFormValues {
  policyName: string;
  description: string;
  applicableServices: "GROOMING" | "MEDICAL" | "BOARDING";
}

const Policy: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [currentId, setCurrentId] = useState<string | null>(null);

  const fetchPolicies = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await api.get<PolicyResponse>("/api/policy");
      if (res.data.code === 200) {
        setPolicies(res.data.data);
      } else {
        message.error(res.data.message || "Không thể lấy danh sách chính sách");
      }
    } catch {
      message.error("Lỗi khi lấy danh sách chính sách");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lí chính sách";
    fetchPolicies();
  }, []);

  const handleOpenAdd = (): void => {
    setIsUpdate(false);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleOpenEdit = (record: Policy): void => {
    setIsUpdate(true);
    setCurrentId(record.id);
    setIsModalVisible(true);
    form.setFieldsValue({
      policyName: record.policyName,
      description: record.description,
      applicableServices: record.applicableServices,
    });
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      const res = await api.delete(`/api/policy/${id}`);
      if (res.data.code === 200) {
        message.success("Xóa chính sách thành công!");
        fetchPolicies();
      } else {
        message.error(res.data.message || "Xóa thất bại!");
      }
    } catch {
      message.error("Lỗi khi xóa chính sách!");
    }
  };

  const handleSubmit = async (values: PolicyFormValues): Promise<void> => {
    setSubmitLoading(true);
    try {
      if (isUpdate && currentId) {
        const res = await api.put(`/api/policy/${currentId}`, values);
        if (res.data.code === 200) {
          message.success("Cập nhật chính sách thành công!");
        } else {
          message.error(res.data.message || "Cập nhật thất bại!");
        }
      } else {
        const res = await api.post("/api/policy", values);
        if (res.data.code === 201 || res.data.code === 200) {
          message.success("Thêm chính sách thành công!");
        } else {
          message.error(res.data.message || "Thêm thất bại!");
        }
      }
      fetchPolicies();
      handleCancel();
    } catch {
      message.error("Thao tác thất bại!");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = (): void => {
    setIsModalVisible(false);
    setIsUpdate(false);
    setCurrentId(null);
    form.resetFields();
  };

  // search + filter
  const filteredData = policies.filter((item) => {
    const matchSearch = Object.values(item).some((val) => String(val).toLowerCase().includes(searchText.toLowerCase()));
    const matchService = serviceFilter ? item.applicableServices === serviceFilter : true;
    return matchSearch && matchService;
  });

  const columns: ColumnsType<Policy> = [
    {
      title: "Tên chính sách",
      dataIndex: "policyName",
      key: "policyName",
      align: "center",
      sorter: (a, b) => a.policyName.localeCompare(b.policyName),
      width: 200,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      align: "center",
      render: (text: string) => <div style={{ whiteSpace: "pre-wrap", textAlign: "center" }}>{text}</div>,
    },
    {
      title: "Dịch vụ áp dụng",
      dataIndex: "applicableServices",
      key: "applicableServices",
      align: "center",
      width: 180,
      render: (service: string) => {
        const color = service === "GROOMING" ? "geekblue" : service === "MEDICAL" ? "green" : "volcano";
        return <Tag color={color}>{service}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 120,
      render: (status: string) => (
        <span style={{ color: status === "ACTIVE" ? "#52c41a" : "#ff4d4f" }}>
          {status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
        </span>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button icon={<FiEdit />} onClick={() => handleOpenEdit(record)} size="small" type="primary" />
          <Button icon={<FiTrash2 />} danger size="small" onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="Policy">
      <h1>Quản lí chính sách</h1>

      <div className="policy__filters">
        <Space style={{ width: "100%", marginBottom: 16 }}>
          <Input
            placeholder="Tìm kiếm chính sách..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />

          <div className="filter-buttons">
            <Button type={!serviceFilter ? "primary" : "default"} onClick={() => setServiceFilter(null)}>
              Tất cả
            </Button>
            <Button
              type={serviceFilter === "GROOMING" ? "primary" : "default"}
              onClick={() => setServiceFilter("GROOMING")}
            >
              GROOMING
            </Button>
            <Button
              type={serviceFilter === "MEDICAL" ? "primary" : "default"}
              onClick={() => setServiceFilter("MEDICAL")}
            >
              MEDICAL
            </Button>
            <Button
              type={serviceFilter === "BOARDING" ? "primary" : "default"}
              onClick={() => setServiceFilter("BOARDING")}
            >
              BOARDING
            </Button>
          </div>

          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd} style={{ marginLeft: "auto" }}>
            Thêm chính sách
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} chính sách`,
        }}
        bordered
      />

      <Modal
        title={isUpdate ? "Cập nhật chính sách" : "Thêm chính sách mới"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Spin spinning={submitLoading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="policyName"
              label="Tên chính sách"
              rules={[{ required: true, message: "Vui lòng nhập tên chính sách!" }]}
            >
              <Input placeholder="Nhập tên chính sách" />
            </Form.Item>

            <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}>
              <Input.TextArea rows={4} placeholder="Nhập mô tả chi tiết" />
            </Form.Item>

            <Form.Item
              name="applicableServices"
              label="Dịch vụ áp dụng"
              rules={[{ required: true, message: "Vui lòng chọn dịch vụ!" }]}
            >
              <Select placeholder="Chọn dịch vụ áp dụng">
                <Select.Option value="GROOMING">GROOMING</Select.Option>
                <Select.Option value="MEDICAL">MEDICAL</Select.Option>
                <Select.Option value="BOARDING">BOARDING</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {isUpdate ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default Policy;
