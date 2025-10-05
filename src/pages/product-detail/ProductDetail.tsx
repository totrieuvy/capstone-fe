import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Image, Spin, Typography, Row, Col } from "antd";
import { getFormattedPrice } from "../../utils/formatPrice";
import api from "../../config/axios";
import { toast } from "react-toastify";
import "./ProductDetail.scss";

const { Title, Paragraph } = Typography;

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Chi tiết sản phẩm";
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/products/detail/${id}`);
        setProduct(response.data.data);
      } catch (error) {
        toast.error("Lấy thông tin sản phẩm thất bại: " + error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="ProductDetail">
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="ProductDetail">
        <p>Sản phẩm không tồn tại.</p>
      </div>
    );
  }

  return (
    <div className="ProductDetail">
      <Title level={2} className="title">
        Chi tiết sản phẩm
      </Title>
      <Card className="product-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={10} className="product-image-col">
            <div className="image-wrapper">
              <Image src={product.imageUrl} alt={product.name} className="product-image" />
            </div>
          </Col>

          <Col xs={24} md={14}>
            <div className="product-info">
              <Title level={3} className="product-name">
                {product.name}
              </Title>
              <Paragraph className="product-description">{product.description}</Paragraph>

              <div className="product-meta">
                <p className="product-price">Giá: {getFormattedPrice(product.price)}</p>
                <p className={`product-stock ${product.stockQuantity > 0 ? "in-stock" : "out-of-stock"}`}>
                  {product.stockQuantity > 0 ? `Còn ${product.stockQuantity} sản phẩm` : "Hết hàng"}
                </p>
                <p className="product-category">Danh mục: {product.categoryName}</p>
                <p className="product-created">Ngày tạo: {new Date(product.createdAt).toLocaleDateString("vi-VN")}</p>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default ProductDetail;
