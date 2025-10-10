import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  message,
  Popconfirm,
  Image,
  Upload,
  type UploadFile,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import cageTypeService from "../../../services/CageTypeService";
import type {
  CageTypeResponse,
  CreateCageTypeReq,
} from "../../../services/CageTypeService";
import { getFormattedPrice } from "../../../utils/formatPrice";
import "./CageType.scss";


const CageType: React.FC = () => {
  const [cageTypes, setCageTypes] = useState<CageTypeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CageTypeResponse | null>(
    null
  );
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  // Fetch all cage types
  const fetchCageTypes = async () => {
    setLoading(true);
    try {
      const data = await cageTypeService.getCageTypes();
      setCageTypes(data);
    } catch (error) {
      message.error("Failed to fetch cage types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCageTypes();
  }, []);

  // Handle create/update
  const handleSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        await cageTypeService.updateCageType(editingRecord.id, values);
        message.success("Cage type updated successfully");
      } else {
        await cageTypeService.createCageType(values);
        message.success("Cage type created successfully");
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      fetchCageTypes();
    } catch (error) {
      message.error(
        `Failed to ${editingRecord ? "update" : "create"} cage type`
      );
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await cageTypeService.deleteCageType(id);
      message.success("Cage type deleted successfully");
      fetchCageTypes();
    } catch (error) {
      message.error("Failed to delete cage type");
    }
  };

  // Open modal for create/edit
  const openModal = (record?: CageTypeResponse) => {
    if (record) {
      setEditingRecord(record);
      form.setFieldsValue(record);
    } else {
      setEditingRecord(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
  };

  // Filter data based on search
  const filteredData = cageTypes.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  // Table columns
  const columns: ColumnsType<CageTypeResponse> = [
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 100,
      render: (imageUrl: string) => (
        <Image
          src={imageUrl}
          alt="Cage"
          width={60}
          height={60}
          style={{ objectFit: "cover", borderRadius: "8px" }}
          fallback="https://via.placeholder.com/60"
        />
      ),
    },
    {
      title: "Type Name",
      dataIndex: "typeName",
      key: "typeName",
      sorter: (a, b) => a.typeName.localeCompare(b.typeName),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Size",
      dataIndex: "sizeDimensions",
      key: "sizeDimensions",
    },
    {
      title: "Material",
      dataIndex: "material",
      key: "material",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price: number) => getFormattedPrice(price),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? "#52c41a" : "#ff4d4f" }}>
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa loại chuồng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
   <div className="CageType">
      <h1>Quản lý loại chuồng</h1>

      <div className="search-box">
        <Space style={{ marginBottom: 16, width: "100%" }}>
          <Input
            placeholder="Search cage types..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
            style={{ marginLeft: "auto" }}
          >
            Thêm loại chuồng mới 
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
          showTotal: (total) => `Total ${total} items`,
        }}
      />

      <Modal
        title={editingRecord ? "Chỉnh sửa loại chuồng" : "Thêm loại chuồng mới"}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="typeName"
            label="Tên"
            rules={[
              { required: true, message: "Please input the type name!" },
            ]}
          >
            <Input placeholder="Enter cage type name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter description"
            />
          </Form.Item>

          <Form.Item
            name="sizeDimensions"
            label="Kích thước"
            rules={[
              { required: true, message: "Please input the size dimensions!" },
            ]}
          >
            <Input placeholder="e.g., 24x18x21 inches" />
          </Form.Item>

          <Form.Item
            name="material"
            label="Chất liệu"
            rules={[{ required: true, message: "Please input the material!" }]}
          >
            <Input placeholder="e.g., Stainless Steel" />
          </Form.Item>

         <Form.Item
            name="price"
            label="Giá (VND)"
            rules={[{ required: true, message: "Please input the price!" }]}
          >
            <InputNumber
              min={0}
              step={1000}
              style={{ width: "100%" }}
              placeholder="Enter price in VND"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => parseFloat(value!.replace(/\$\s?|(,*)/g, "")) || 0}
              addonAfter="đ"
            />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="URL hình ảnh"
            rules={[
              { required: true, message: "Please input the image URL!" },
              { type: "url", message: "Please enter a valid URL!" },
            ]}
          >
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Đang áp dụng" unCheckedChildren="Ngừng áp dụng" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={closeModal}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CageType;