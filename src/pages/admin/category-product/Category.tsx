import { useEffect, useState } from "react";
import api from "../../../config/axios";
import { Table, Input, Button, Modal, Form, Tag, Popconfirm } from "antd";
import type { TableColumnsType } from "antd";
import "./Category.scss";
import { toast } from "react-toastify";
import type { CategoryType } from "../../../types/category";

const { Search } = Input;

function Category() {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryType[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/product-categories/all");
      setCategories(response.data.data);
      setFilteredCategories(response.data.data);
    } catch (error) {
      toast.error("Lấy danh sách danh mục thất bại: " + error);
    }
  };

  useEffect(() => {
    document.title = "Quản lí danh mục";
    fetchCategories();
  }, []);

  const handleSearch = (value: string) => {
    const filtered = categories.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()));
    setFilteredCategories(filtered);
  };

  const handleSubmit = async (values: { id?: number; name: string }) => {
    setLoading(true);
    try {
      if (values.id) {
        await api.put(`/api/product-categories/${values.id}`, { name: values.name, isActive: true });
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await api.post("/api/product-categories", null, { params: { name: values.name } });
        toast.success("Thêm danh mục thành công!");
      }
      fetchCategories();
    } catch (error) {
      toast.error("Thao tác thất bại: " + error);
    } finally {
      setLoading(false);
      form.resetFields();
      handleCancel();
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleOpenAdd = () => {
    form.resetFields();
    setIsUpdate(false);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/product-categories/${id}`);
      toast.success("Xoá danh mục thành công!");
      fetchCategories();
    } catch (error) {
      toast.error("Xoá danh mục thất bại: " + error);
    }
  };

  const columns: TableColumnsType<CategoryType> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
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
    {
      title: "Hành động",
      key: "action",
      width: 250,
      render: (_, record) => (
        <>
          <Button
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => {
              setIsUpdate(true);
              setIsModalVisible(true);
              form.setFieldsValue(record);
            }}
          >
            Cập nhật
          </Button>
          <Popconfirm
            title="Xóa danh mục?"
            description="Bạn có chắc muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

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
        <Button type="primary" onClick={handleOpenAdd} loading={loading}>
          Thêm danh mục
        </Button>
      </div>

      <Table dataSource={filteredCategories} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />

      <Modal
        open={isModalVisible}
        title={isUpdate ? "Cập nhật danh mục" : "Thêm danh mục mới"}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
            {isUpdate ? "Cập nhật" : "Thêm"}
          </Button>,
        ]}
      >
        <Form form={form} name="category_form" layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
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
