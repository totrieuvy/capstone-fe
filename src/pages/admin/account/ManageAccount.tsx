import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Spin,
  Select,
  Tag,
  Descriptions,
  Switch,
} from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  getStaffAccounts,
  createStaffAccount,
  getStaffDetail,
  updateStaffAccount,
  toggleStaffStatus,
  type StaffAccount,
  type CreateStaffAccountRequest,
  type UpdateStaffAccountRequest,
} from "../../../services/AccountService";
import "./ManageAccount.scss";
import { toast } from "react-toastify";

const { Option } = Select;
const { TextArea } = Input;

interface StaffAccountFormValues {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  staffType: "STAFF" | "VET";
  specialization?: string;
  experienceYears?: number;
  licenseNumber?: string;
  status?: "ACTIVE" | "INACTIVE";
}

const ManageAccount: React.FC = () => {
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [form] = Form.useForm();

  // Fetch staff accounts
  const fetchStaffAccounts = async (page: number = 1, size: number = 10) => {
    setLoading(true);
    try {
      const response = await getStaffAccounts({ page: page - 1, size });
      setStaffAccounts(response.data.content);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      message.error("Không thể tải danh sách tài khoản nhân viên");
      console.error("Error fetching staff accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lí tài khoản nhân viên";
    fetchStaffAccounts(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Handle create/update
  const handleSubmit = async (values: StaffAccountFormValues) => {
    setSubmitLoading(true);
    try {
      if (isUpdate && values.id) {
        // Update existing staff account
        const updatePayload: UpdateStaffAccountRequest = {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          address: values.address,
          specialization: values.specialization,
          experienceYears: values.experienceYears,
          licenseNumber: values.licenseNumber,
        };

        const response = await updateStaffAccount(values.id, updatePayload);
        if (response.code === 200) {
          toast.success("Cập nhật thành công");
        }
      } else {
        // Create new staff account
        const createPayload: CreateStaffAccountRequest = {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          address: values.address,
          staffType: values.staffType,
          specialization: values.specialization,
          experienceYears: values.experienceYears,
        };

        const response = await createStaffAccount(createPayload);
        if (response.code === 200) {
          toast.success("Tạo tài khoản nhân viên thành công!");
          toast.info("Mật khẩu mặc định: hamstercare");
        }
      }

      fetchStaffAccounts(currentPage, pageSize);
      handleCancel();
    } catch (error) {
      message.error("Thao tác thất bại: " + String(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsUpdate(false);
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({ staffType: "STAFF" });
  };

  const handleOpenEdit = (record: StaffAccount) => {
    setIsUpdate(true);
    setIsModalVisible(true);
    form.setFieldsValue({
      ...record,
    });
  };

  const handleViewDetail = async (record: StaffAccount) => {
    try {
      setLoading(true);
      const response = await getStaffDetail(record.id);
      setSelectedStaff(response.data);
      setIsDetailModalVisible(true);
    } catch (error) {
      message.error("Không thể tải thông tin chi tiết");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setIsUpdate(false);
  };

  const handleDetailModalCancel = () => {
    setIsDetailModalVisible(false);
    setSelectedStaff(null);
  };

  const handleToggleStatus = async (staffId: string, currentStatus: string) => {
    setToggleLoading(true);
    try {
      const response = await toggleStaffStatus(staffId);
      if (response.code === 200) {
        const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        toast.success(`Trạng thái đã được cập nhật thành ${newStatus === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}`);
        
        // Update selected staff state
        if (selectedStaff) {
          setSelectedStaff({ ...selectedStaff, status: newStatus });
        }
        
        // Refresh the staff list
        fetchStaffAccounts(currentPage, pageSize);
      }
    } catch (error) {
      message.error("Không thể cập nhật trạng thái: " + String(error));
    } finally {
      setToggleLoading(false);
    }
  };

  const handleTableChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
  };

  const filteredData = staffAccounts.filter((item) =>
    Object.values(item).some((val) => 
      val && String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const columns: ColumnsType<StaffAccount> = [
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      width: 200,
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
    },
    {
      title: "Loại nhân viên",
      dataIndex: "staffType",
      key: "staffType",
      width: 120,
      render: (staffType: string) => {
        const color = staffType === "VET" ? "blue" : "green";
        const label = staffType === "VET" ? "Bác sĩ" : "Nhân viên";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Chuyên môn",
      dataIndex: "specialization",
      key: "specialization",
      width: 180,
      render: (specialization: string) => specialization || "—",
    },
    {
      title: "Kinh nghiệm",
      dataIndex: "experienceYears",
      key: "experienceYears",
      width: 120,
      render: (years: number) => years ? `${years} năm` : "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const color = status === "ACTIVE" ? "success" : "error";
        const label = status === "ACTIVE" ? "Hoạt động" : "Không hoạt động";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
          >
            
          </Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
            size="small"
          >
            
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="ManageAccount">
      <h1>Quản lí tài khoản nhân viên</h1>

      <div className="search-box">
        <Space style={{ marginBottom: 16, width: "100%" }}>
          <Input
            placeholder="Tìm kiếm nhân viên..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleOpenAdd} 
            style={{ marginLeft: "auto" }}
          >
            Thêm nhân viên mới
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={searchText ? filteredData : staffAccounts}
        loading={loading}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: searchText ? filteredData.length : totalElements,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} nhân viên`,
          onChange: handleTableChange,
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={isUpdate ? "Cập nhật thông tin nhân viên" : "Thêm nhân viên mới"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Spin spinning={submitLoading}>
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleSubmit} 
            initialValues={{ staffType: "STAFF" }}
          >
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" }
              ]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              name="address"
              label="Địa chỉ"
              rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
            >
              <TextArea rows={3} placeholder="Nhập địa chỉ" />
            </Form.Item>

            <Form.Item
              name="staffType"
              label="Loại nhân viên"
              rules={[{ required: true, message: "Vui lòng chọn loại nhân viên!" }]}
            >
              <Select placeholder="Chọn loại nhân viên" disabled={isUpdate}>
                <Option value="STAFF">Nhân viên</Option>
                <Option value="VET">Bác sĩ thú y</Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.staffType !== currentValues.staffType
              }
            >
              {({ getFieldValue }) => {
                const staffType = getFieldValue("staffType");
                return staffType === "VET" ? (
                  <>
                    <Form.Item
                      name="specialization"
                      label="Chuyên môn"
                      rules={[{ required: true, message: "Vui lòng nhập chuyên môn!" }]}
                    >
                      <Input placeholder="Nhập chuyên môn" />
                    </Form.Item>

                    <Form.Item
                      name="experienceYears"
                      label="Số năm kinh nghiệm"
                      rules={[
                        { required: true, message: "Vui lòng nhập số năm kinh nghiệm!" },
                        { type: "number", min: 0, max: 50, message: "Kinh nghiệm từ 0-50 năm!" }
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={50}
                        style={{ width: "100%" }}
                        placeholder="Nhập số năm kinh nghiệm"
                      />
                    </Form.Item>

                    <Form.Item
                      name="licenseNumber"
                      label="Số giấy phép hành nghề"
                    >
                      <Input placeholder="Nhập số giấy phép hành nghề" />
                    </Form.Item>
                  </>
                ) : null;
              }}
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {isUpdate ? "Cập nhật nhân viên" : "Thêm nhân viên"}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Thông tin chi tiết nhân viên"
        open={isDetailModalVisible}
        onCancel={handleDetailModalCancel}
        footer={[
          <Button key="close" onClick={handleDetailModalCancel}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {selectedStaff && (
          <div className="staff-detail">
            <Descriptions
              title="Thông tin cá nhân"
              bordered
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              size="small"
            >
              <Descriptions.Item label="Họ và tên" span={1}>
                <strong>{selectedStaff.fullName}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Loại nhân viên" span={1}>
                <Tag color={selectedStaff.staffType === "VET" ? "blue" : "green"}>
                  {selectedStaff.staffType === "VET" ? "Bác sĩ thú y" : "Nhân viên"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={1}>
                {selectedStaff.email}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại" span={1}>
                {selectedStaff.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedStaff.address}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={1}>
                <Space>
                  <Tag color={selectedStaff.status === "ACTIVE" ? "success" : "error"}>
                    {selectedStaff.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
                  </Tag>
                  <Switch
                    checked={selectedStaff.status === "ACTIVE"}
                    loading={toggleLoading}
                    onChange={() => handleToggleStatus(selectedStaff.id, selectedStaff.status)}
                    checkedChildren="Bật"
                    unCheckedChildren="Tắt"
                    size="small"
                  />
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="ID Tài khoản" span={1}>
                <code>{selectedStaff.accountId}</code>
              </Descriptions.Item>
            </Descriptions>

            {selectedStaff.staffType === "VET" && (
              <Descriptions
                title="Thông tin chuyên môn"
                bordered
                column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                size="small"
                style={{ marginTop: 24 }}
              >
                <Descriptions.Item label="Chuyên môn" span={1}>
                  {selectedStaff.specialization || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Kinh nghiệm" span={1}>
                  {selectedStaff.experienceYears ? `${selectedStaff.experienceYears} năm` : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Số giấy phép" span={2}>
                  {selectedStaff.licenseNumber ? (
                    <code>{selectedStaff.licenseNumber}</code>
                  ) : (
                    "—"
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageAccount;
