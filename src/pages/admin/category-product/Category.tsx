import { useEffect, useState } from "react";
import api from "../../../config/axios";
import { Table, Input, Button, Modal, Form, Tag } from "antd";
import type { TableColumnsType } from "antd";
import "./Category.scss";
import { toast } from "react-toastify";
import type { CategoryType } from "../../../types/Category";

const { Search } = Input;

function Category() {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryType[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/product-categories/all");
      setCategories(response.data.data);
      setFilteredCategories(response.data.data);
    } catch (error) {
      toast.error("Lấy danh sách danh mục thất bại" + error);
    }
  };

  const handleSearch = (value: string) => {
    const filtered = categories.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()));
    setFilteredCategories(filtered);
  };

  const handleAddCategory = async (values: { name: string }) => {
    setLoading(true);
    try {
      const response = await api.post("/api/product-categories", null, { params: { name: values.name } });

      toast.success(response.data.message);
      fetchCategories();
    } catch (error) {
      toast.error("Thêm danh mục thất bại" + error);
    } finally {
      setLoading(false);
      form.resetFields();
      handleCancel();
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns: TableColumnsType<CategoryType> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 150,
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 300,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 150,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Không hoạt động"}</Tag>
      ),
    },
  ];

  useEffect(() => {
    document.title = "Quản lí danh mục";
    fetchCategories();
  }, []);

  return (
    <div className="Category">
      <h1>Quản lí danh mục</h1>

      <div className="search-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Search
          placeholder="Tìm kiếm danh mục..."
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" onClick={showModal} loading={loading}>
          Thêm danh mục
        </Button>
      </div>

      <Table dataSource={filteredCategories} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />

      <Modal
        title="Thêm danh mục mới"
        visible={isModalVisible}
        onOk={() => form.submit()}
        onCancel={handleCancel}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={form} name="add_category_form" layout="vertical" onFinish={handleAddCategory}>
          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="Nhập tên danh mục" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Category;
