import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Space, message, Spin, Tag } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { FiEdit } from "react-icons/fi";
import type { ColumnsType } from "antd/es/table";
import "./Policy.scss";
import api from "../../../config/axios";
import { toast } from "react-toastify";

interface Species {
  id: string;
  speciesName: string;
}

interface SpeciesRefundDetail {
  speciesId: string;
  priceRefund: number;
}

interface Policy {
  id?: string;
  policyName: string;
  description: string;
  applicableServices: "BOOKING" | "GROOMING" | "ORDER" | "MEDICAL";
  status?: "ACTIVE" | "INACTIVE";
  refundPercentage: number;
  timesBeforeCheckin: number;
  category: "REFUND" | "CANCELLED" | "INFORMATION";
  cancelTime?: number;
  blockedDay?: number;
  speciesRefundDetail: SpeciesRefundDetail[];
}

interface PolicyResponse {
  code: number;
  message: string;
  data: Policy[];
}

const Policy: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [currentService, setCurrentService] = useState<Policy["applicableServices"] | "">("");
  const [form] = Form.useForm();
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Quản lí chính sách";
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.get<PolicyResponse>("/api/policy");
      if (res.data.code === 200) setPolicies(res.data.data);
      else message.error(res.data.message);
    } catch {
      message.error("Lỗi khi lấy danh sách chính sách");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecies = async () => {
    try {
      const res = await api.get("/api/species");
      setSpecies(res.data.data || []);
    } catch {
      message.error("Lỗi tải danh sách loài");
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchSpecies();
  }, []);

  const handleOpenAdd = () => {
    setIsUpdate(false);
    setIsModalVisible(true);
    setCurrentService("");
    form.resetFields();
  };

  const handleOpenEdit = (record: Policy) => {
    setIsUpdate(true);
    setCurrentId(record.id || null);
    setIsModalVisible(true);
    setCurrentService(record.applicableServices);
    form.setFieldsValue({ ...record });
  };

  // const handleDelete = async (id: string) => {
  //   try {
  //     const res = await api.delete(`/api/policy/${id}`);
  //     if (res.data.code === 200) {
  //       message.success("Xóa thành công");
  //       fetchPolicies();
  //     } else message.error(res.data.message);
  //   } catch {
  //     message.error("Lỗi khi xóa");
  //   }
  // };

  const handleSubmit = async (values: Policy) => {
    setSubmitLoading(true);

    const payload: Policy = {
      ...values,
      speciesRefundDetail: values.applicableServices === "BOOKING" ? values.speciesRefundDetail : [],
      cancelTime:
        values.applicableServices === "GROOMING" || values.applicableServices === "MEDICAL"
          ? values.cancelTime
          : undefined,
      blockedDay:
        values.applicableServices === "GROOMING" || values.applicableServices === "MEDICAL"
          ? values.blockedDay
          : undefined,
    };

    try {
      let res;
      if (isUpdate && currentId) res = await api.put(`/api/policy/${currentId}`, payload);
      else res = await api.post("/api/policy", payload);

      if (res.data.code === 200 || res.data.code === 201) {
        toast.success(isUpdate ? "Cập nhật thành công" : "Thêm mới thành công");
        fetchPolicies();
        handleCancel();
      } else toast.error(res.data.message);
    } catch {
      toast.error("Lỗi máy chủ");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentId(null);
    setIsUpdate(false);
    setCurrentService("");
    form.resetFields();
  };

  const filteredData = policies.filter((i) => {
    const matchSearch = i.policyName.toLowerCase().includes(searchText.toLowerCase());
    const matchService = serviceFilter ? i.applicableServices === serviceFilter : true;
    return matchSearch && matchService;
  });

  const serviceMap = {
    BOOKING: "Đặt lịch giữ hộ",
    GROOMING: "Làm đẹp",
    ORDER: "Đặt hàng",
    MEDICAL: "Y tế",
  };

  const columns: ColumnsType<Policy> = [
    { title: "Tên chính sách", dataIndex: "policyName", align: "center" },
    {
      title: "Mô tả",
      dataIndex: "description",
      align: "center",
      render: (t) => <div style={{ whiteSpace: "pre-wrap" }}>{t}</div>,
    },
    {
      title: "Dịch vụ",
      dataIndex: "applicableServices",
      align: "center",
      render: (service: Policy["applicableServices"]) => <Tag color="orange">{serviceMap[service]}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      render: (st) => (
        <Tag color={st === "ACTIVE" ? "green" : "red"}>{st === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}</Tag>
      ),
    },
    {
      title: "Hành động",
      align: "center",
      render: (_, r) => (
        <Space>
          <Button icon={<FiEdit />} type="primary" size="small" onClick={() => handleOpenEdit(r)} />
          {/* <Button icon={<FiTrash2 />} danger size="small" onClick={() => handleDelete(r.id!)} /> */}
        </Space>
      ),
    },
  ];

  return (
    <div className="Policy">
      <h1>Quản lí chính sách</h1>

      <div className="policy__filters">
        <div className="policy__filter-top">
          <Button className={!serviceFilter ? "ant-btn-primary" : ""} onClick={() => setServiceFilter(null)}>
            Tất cả
          </Button>
          <Button
            className={serviceFilter === "BOOKING" ? "ant-btn-primary" : ""}
            onClick={() => setServiceFilter("BOOKING")}
          >
            Đặt lịch giữ hộ
          </Button>
          <Button
            className={serviceFilter === "GROOMING" ? "ant-btn-primary" : ""}
            onClick={() => setServiceFilter("GROOMING")}
          >
            Làm đẹp
          </Button>
          <Button
            className={serviceFilter === "ORDER" ? "ant-btn-primary" : ""}
            onClick={() => setServiceFilter("ORDER")}
          >
            Đặt hàng
          </Button>
          <Button
            className={serviceFilter === "MEDICAL" ? "ant-btn-primary" : ""}
            onClick={() => setServiceFilter("MEDICAL")}
          >
            Y tế
          </Button>
        </div>

        <div className="policy__filter-bottom">
          <Input
            placeholder="Tìm kiếm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
            Thêm chính sách
          </Button>
        </div>
      </div>

      <Table columns={columns} dataSource={filteredData} loading={loading} rowKey="id" bordered />

      <Modal
        open={isModalVisible}
        title={isUpdate ? "Cập nhật chính sách" : "Thêm chính sách"}
        onCancel={handleCancel}
        footer={null}
        width={650}
      >
        <Spin spinning={submitLoading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="policyName" label="Tên chính sách" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="applicableServices" label="Dịch vụ" rules={[{ required: true }]}>
              <Select onChange={(v) => setCurrentService(v)}>
                <Select.Option value="BOOKING">Đặt lịch giữ hộ</Select.Option>
                <Select.Option value="GROOMING">Làm đẹp</Select.Option>
                <Select.Option value="ORDER">Đặt hàng</Select.Option>
                <Select.Option value="MEDICAL">Y tế</Select.Option>
              </Select>
            </Form.Item>

            {currentService === "BOOKING" && (
              <Form.List name="speciesRefundDetail">
                {(fields, { add, remove }) => (
                  <>
                    <Button type="dashed" block style={{ marginBottom: 12 }} onClick={() => add()}>
                      + Thêm loài
                    </Button>

                    {fields.map(({ key, name }) => (
                      <div className="species-row" key={key}>
                        <Form.Item name={[name, "speciesId"]} label="Loài" rules={[{ required: true }]}>
                          <Select placeholder="Chọn loài">
                            {species.map((s) => (
                              <Select.Option key={s.id} value={s.id}>
                                {s.speciesName}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item name={[name, "priceRefund"]} label="Giá hoàn tiền" rules={[{ required: true }]}>
                          <Input type="number" />
                        </Form.Item>

                        <Button danger onClick={() => remove(name)}>
                          Xóa
                        </Button>
                      </div>
                    ))}
                  </>
                )}
              </Form.List>
            )}

            {(currentService === "GROOMING" || currentService === "MEDICAL") && (
              <>
                <Form.Item name="cancelTime" label="Số lần được phép hủy" rules={[{ required: true }]}>
                  <Input type="number" min={0} />
                </Form.Item>

                <Form.Item name="blockedDay" label="Số ngày bị khóa khi hủy" rules={[{ required: true }]}>
                  <Input type="number" min={0} />
                </Form.Item>
              </>
            )}

            <Form.Item name="refundPercentage" label="Phần trăm hoàn tiền" rules={[{ required: true }]}>
              <Input type="number" min={0} max={100} />
            </Form.Item>

            <Form.Item name="timesBeforeCheckin" label="Thời gian được hủy (giờ)" rules={[{ required: true }]}>
              <Input type="number" min={0} />
            </Form.Item>

            <Form.Item name="category" label="Loại" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="REFUND">REFUND</Select.Option>
                <Select.Option value="CANCELLED">CANCELLED</Select.Option>
                <Select.Option value="INFORMATION">INFORMATION</Select.Option>
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
