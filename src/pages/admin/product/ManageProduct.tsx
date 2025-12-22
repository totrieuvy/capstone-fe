import { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Upload,
  Tag,
  Popconfirm,
  Image,
  Spin,
  message,
  Card,
  Row,
  Col,
  Switch,
  Space,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import type { TableColumnsType } from "antd";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import { getFormattedPrice } from "../../../utils/formatPrice";
import type { ProductType } from "../../../types/product";
import "./ManageProduct.scss";
import { storage } from "../../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const { Search } = Input;
const { Option } = Select;

interface ProductFormValues {
  id?: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  weight: number;
  stockQuantity: number;
  imageUrl: UploadFile[];
  isActive: boolean;
}

function ManageProduct() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [form] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/api/products/all");
      setProducts(response.data.data);
      setFilteredProducts(response.data.data);
    } catch (error) {
      toast.error("Lấy danh sách sản phẩm thất bại: " + error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/product-categories/all");
      setCategories(response.data.data);
    } catch (error) {
      toast.error("Lấy danh sách danh mục thất bại: " + error);
    }
  };

  useEffect(() => {
    document.title = "Quản lí sản phẩm";
    fetchProducts();
    fetchCategories();
  }, []);

  const handleSearch = (value: string) => {
    const filtered = products.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()));
    setFilteredProducts(filtered);
  };

  const handleFilterCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === "ALL") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((item) => item.categoryId === categoryId);
      setFilteredProducts(filtered);
    }
  };

  const handleSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    try {
      let imageUrl = "";
      const newFile = values.imageUrl?.[0]?.originFileObj as File | undefined;

      if (newFile) {
        const storageRef = ref(storage, `images/${Date.now()}_${newFile.name}`);
        await uploadBytes(storageRef, newFile);
        imageUrl = await getDownloadURL(storageRef);
      } else {
        if (isUpdate) {
          imageUrl = "";
        } else {
          message.error("Vui lòng chọn ảnh sản phẩm!");
          setLoading(false);
          return;
        }
      }

      const payload = {
        name: values.name,
        description: values.description,
        categoryId: values.categoryId,
        price: values.price,
        weight: values.weight,
        stockQuantity: values.stockQuantity,
        imageUrl,
        isActive: values.isActive,
      };

      if (isUpdate && values.id) {
        await api.put(`/api/products/${values.id}`, payload);
        toast.success("Cập nhật sản phẩm thành công!");
      } else {
        await api.post("/api/products/create", payload);
        toast.success("Thêm sản phẩm thành công!");
      }

      fetchProducts();
      handleCancel();
    } catch (error) {
      message.error("Thao tác thất bại: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleOpenAdd = () => {
    setIsUpdate(false);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/products/${id}`);
      toast.success("Xóa sản phẩm thành công!");
      fetchProducts();
    } catch (error) {
      toast.error("Xóa thất bại: " + error);
    }
  };

  const handleOpenDetail = (product: ProductType) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const columns: TableColumnsType<ProductType> = [
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <a href="#" onClick={() => handleOpenDetail(record)} style={{ color: "#1890ff" }}>
          {text}
        </a>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "categoryName",
      key: "categoryName",
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price) => getFormattedPrice(price),
    },
    {
      title: "Số lượng",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
    },
    {
      title: "Hình ảnh",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (url) => <Image width={60} src={url} alt="product" />,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Không hoạt động"}</Tag>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <>
          <Space>
            <Button
              icon={<FiEdit />}
              size="small"
              className="action-btn-edit"
              onClick={() => {
                setIsUpdate(true);
                setIsModalVisible(true);
                form.setFieldsValue({
                  ...record,
                  imageUrl: record.imageUrl
                    ? [
                        {
                          uid: "-1",
                          name: "image.png",
                          status: "done",
                          url: record.imageUrl,
                        },
                      ]
                    : [],
                });
              }}
            />

            <Popconfirm
              title="Xóa sản phẩm?"
              okText="Xóa"
              cancelText="Hủy"
              okType="danger"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button icon={<FiTrash2 />} size="small" className="action-btn-delete" />
            </Popconfirm>
          </Space>
        </>
      ),
    },
  ];

  return (
    <div className="ManageProduct">
      <h1>Quản lí sản phẩm</h1>

      <div className="filter-category">
        <Button
          type={selectedCategory === "ALL" ? "primary" : "default"}
          shape="round"
          className="category-btn"
          onClick={() => handleFilterCategory("ALL")}
        >
          Tất cả
        </Button>

        {categories.map((cat) => (
          <Button
            key={cat.id}
            type={selectedCategory === cat.id ? "primary" : "default"}
            shape="round"
            className="category-btn"
            onClick={() => handleFilterCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* SEARCH + ADD BUTTON Ở DƯỚI */}
      <div className="manageProduct__toolbar">
        <Search
          placeholder="Tìm kiếm sản phẩm..."
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 340 }}
        />

        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
          Thêm sản phẩm
        </Button>
      </div>

      <Table dataSource={filteredProducts} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />

      <Modal
        open={isModalVisible}
        title={isUpdate ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ isActive: true }}>
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Tên sản phẩm"
                  name="name"
                  rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm!" }]}
                >
                  <Input placeholder="Nhập tên sản phẩm" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Danh mục"
                  name="categoryId"
                  rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
                >
                  <Select placeholder="Chọn danh mục">
                    {categories.map((cat) => (
                      <Option key={cat.id} value={cat.id}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Giá"
                  name="price"
                  validateTrigger={["onChange", "onBlur"]}
                  rules={[
                    {
                      validator: (_, value) => {
                        if (value === undefined || value === null) {
                          return Promise.reject("Vui lòng nhập giá!");
                        }
                        if (value < 1 || value > 999999) {
                          return Promise.reject("Giá phải từ 1 đến 999,999!");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Cân nặng (gram)"
                  name="weight"
                  rules={[{ required: true, message: "Vui lòng nhập cân nặng!" }]}
                >
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Số lượng"
                  name="stockQuantity"
                  rules={[{ required: true, message: "Vui lòng nhập số lượng!" }]}
                >
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
                  <Switch checkedChildren="Hoạt động" unCheckedChildren="Khoá" />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="Mô tả"
                  name="description"
                  rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
                >
                  <Input.TextArea placeholder="Nhập mô tả sản phẩm" rows={3} />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="Ảnh sản phẩm"
                  name="imageUrl"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                  rules={[{ required: true, message: "Vui lòng chọn ảnh!" }]}
                >
                  <Upload listType="picture-card" beforeUpload={() => false} maxCount={1} accept="image/*">
                    <div>Chọn ảnh</div>
                  </Upload>
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    {isUpdate ? "Cập nhật" : "Thêm sản phẩm"}
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      <Modal
        open={detailModalVisible}
        title="Chi tiết sản phẩm"
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedProduct && (
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Row gutter={[16, 16]} justify="center">
              <Col xs={24} md={8}>
                <Image
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  width={200}
                  style={{ borderRadius: 8, objectFit: "cover", display: "block", margin: "0 auto" }}
                />
              </Col>
              <Col xs={24} md={16}>
                <div className="product-detail">
                  <p>
                    <strong>Tên sản phẩm:</strong> {selectedProduct.name}
                  </p>
                  <p>
                    <strong>Danh mục:</strong> {selectedProduct.categoryName}
                  </p>
                  <p>
                    <strong>Giá:</strong> {getFormattedPrice(selectedProduct.price)}
                  </p>
                  <p>
                    <strong>Cân nặng:</strong> {selectedProduct.weight} gram
                  </p>
                  <p>
                    <strong>Số lượng:</strong> {selectedProduct.stockQuantity}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong>
                    <Tag color={selectedProduct.isActive ? "green" : "red"}>
                      {selectedProduct.isActive ? "Hoạt động" : "Không hoạt động"}
                    </Tag>
                  </p>
                  <p>
                    <strong>Mô tả:</strong> {selectedProduct.description}
                  </p>
                </div>
              </Col>
            </Row>
          </Card>
        )}
      </Modal>
    </div>
  );
}

export default ManageProduct;
