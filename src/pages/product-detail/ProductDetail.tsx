import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Image, Spin, Typography, Row, Col, Button, Tag, InputNumber, Divider } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { getFormattedPrice } from "../../utils/formatPrice";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/features/cartSlice";
import "./ProductDetail.scss";

const { Title, Paragraph, Text } = Typography;

// --- Interfaces ---
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
  weight: number; // Thêm trọng lượng sản phẩm
}

// Interface cho Redux State
interface RootState {
  user: { fullName: string; role: string } | null;
}

// --- Component ---
function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Kết nối với Redux
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    document.title = "Chi tiết sản phẩm";
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/products/detail/${id}`);
        setProduct(response.data.data);
      } catch (error) {
        toast.error("Lấy thông tin sản phẩm thất bại." + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // --- Logic thêm vào giỏ hàng ---
  const handleAddToCart = () => {
    // 1. Kiểm tra đăng nhập
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    // 2. Kiểm tra sản phẩm và số lượng tồn kho
    if (!product || product.stockQuantity === 0) {
      toast.error("Sản phẩm đã hết hàng, không thể mua!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    // 3. Dispatch action để thêm vào giỏ
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl,
        quantity: quantity, // Lấy số lượng từ state
        weight: product.weight,
      })
    );

    // 4. Hiển thị thông báo thành công
    toast.success(`Đã thêm ${quantity} sản phẩm "${product.name}" vào giỏ hàng!`, {
      position: "top-right",
      autoClose: 3000,
      theme: "colored",
    });
  };

  if (loading) {
    return (
      <div className="ProductDetail-loading">
        <Spin size="large" tip="Đang tải sản phẩm..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="ProductDetail-loading">
        <Title level={4}>Sản phẩm không tồn tại hoặc đã bị xóa.</Title>
      </div>
    );
  }

  return (
    <div className="ProductDetail">
      <Card className="product-card">
        <Row gutter={[32, 32]}>
          {/* --- Cột hình ảnh --- */}
          <Col xs={24} md={12} className="product-image-col">
            <Image src={product.imageUrl} alt={product.name} className="product-image" />
          </Col>

          {/* --- Cột thông tin --- */}
          <Col xs={24} md={12} className="product-info-col">
            <div className="product-info">
              <Tag className="product-category-tag">{product.categoryName}</Tag>
              <Title level={2} className="product-name">
                {product.name}
              </Title>
              <Text className="product-created-date">
                Ngày tạo: {new Date(product.createdAt).toLocaleDateString("vi-VN")}
              </Text>

              <Divider />

              <Paragraph className="product-description">{product.description}</Paragraph>

              <div className="product-stock-wrapper">
                <Text strong>Tình trạng: </Text>
                <Tag color={product.stockQuantity > 0 ? "green" : "red"} className="product-stock-tag">
                  {product.stockQuantity > 0 ? `Còn ${product.stockQuantity} sản phẩm` : "Hết hàng"}
                </Tag>
              </div>

              <Text className="product-price">{getFormattedPrice(product.price)}</Text>

              <Divider />

              {/* --- Khu vực hành động (Thêm vào giỏ) --- */}
              <div className="product-actions">
                <div className="quantity-selector">
                  <Text strong>Số lượng:</Text>
                  <InputNumber
                    min={1}
                    max={product.stockQuantity}
                    defaultValue={1}
                    onChange={(value) => setQuantity(value || 1)}
                    disabled={product.stockQuantity === 0}
                  />
                </div>
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  size="large"
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity === 0}
                >
                  Thêm vào giỏ hàng
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default ProductDetail;
