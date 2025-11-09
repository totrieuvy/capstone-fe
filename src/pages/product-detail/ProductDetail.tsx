import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, Image, Spin, Typography, Row, Col, Button, Rate, Tag, Divider, Tabs, Avatar, Progress } from "antd";
import { ShoppingCartOutlined, HeartOutlined, UserOutlined } from "@ant-design/icons";
import { getFormattedPrice } from "../../utils/formatPrice";
import api from "../../config/axios";
import { toast } from "react-toastify";
import "./ProductDetail.scss";

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface Product {
  id: string;
  name: string;
  description: string;
  categoryName: string;
  price: number;
  stockQuantity: number;
  weight: number;
  imageUrl: string;
  isActive: boolean;
}

interface Feedback {
  feedbackId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  // Tính trung bình rating
  const averageRating = useMemo(() => {
    if (feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
    return (total / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/api/products/detail/${id}`);
        setProduct(res.data.data);
      } catch {
        toast.error("Không thể tải sản phẩm!");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchFeedbacks = async () => {
      try {
        const res = await api.get(`/api/feedbacks/${id}`);
        if (res.data.code === 200) setFeedbacks(res.data.data);
      } catch {
        toast.error("Không thể tải đánh giá!");
      } finally {
        setFeedbackLoading(false);
      }
    };
    fetchFeedbacks();
  }, [id]);

  if (loading)
    return (
      <div className="ProductDetail-loading">
        <Spin size="large" tip="Đang tải sản phẩm..." />
      </div>
    );

  if (!product)
    return (
      <div className="ProductDetail-loading">
        <Title level={4}>Sản phẩm không tồn tại hoặc đã bị xóa.</Title>
      </div>
    );

  return (
    <div className="ProductDetail">
      <Card className="product-card">
        <Row gutter={[40, 32]}>
          <Col xs={24} md={10}>
            <div className="image-section">
              <Image src={product.imageUrl} alt={product.name} className="main-image" />
              <div className="thumbnail-row">
                {[1, 2, 3].map((i) => (
                  <Image key={i} src={product.imageUrl} alt={`thumb-${i}`} className="thumbnail" preview={false} />
                ))}
              </div>
            </div>
          </Col>

          <Col xs={24} md={14}>
            <div className="info-section">
              <Text className="category">{product.categoryName}</Text>
              <Title level={2} className="name">
                {product.name}
              </Title>

              <div className="rating">
                <Rate disabled allowHalf value={Number(averageRating)} />
                <span>
                  {averageRating} ({feedbacks.length} đánh giá)
                </span>
              </div>

              <div className="price-box">
                <Text className="new-price">{getFormattedPrice(product.price)}</Text>
              </div>

              <Paragraph className="desc">{product.description}</Paragraph>

              <div className="stock">
                <Text strong>Tình trạng: </Text>
                <Tag color={product.isActive ? "green" : "red"}>
                  {product.isActive ? "Còn hàng" : "Ngừng kinh doanh"}
                </Tag>
              </div>

              <div className="quantity">
                <Text strong>Số lượng còn: </Text>
                <Text>{product.stockQuantity}</Text>
              </div>

              <div className="weight">
                <Text strong>Trọng lượng: </Text>
                <Text>{product.weight} g</Text>
              </div>

              <div className="actions">
                <Button type="primary" icon={<ShoppingCartOutlined />} className="add-btn">
                  Thêm vào giỏ hàng
                </Button>
                <Button icon={<HeartOutlined />} className="wishlist-btn">
                  Yêu thích
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="1" className="product-tabs">
        <TabPane tab="Đánh giá sản phẩm" key="1">
          <div className="review-summary">
            <div className="left">
              <Title level={2}>{averageRating}</Title>
              <Rate disabled allowHalf value={Number(averageRating)} />
              <Text>({feedbacks.length} đánh giá)</Text>
            </div>
            <div className="right">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = feedbacks.filter((f) => f.rating === star).length;
                const percent = feedbacks.length ? (count / feedbacks.length) * 100 : 0;
                return (
                  <div className="rating-bar" key={star}>
                    <Text>{star} sao</Text>
                    <Progress percent={percent} showInfo={false} strokeColor="#ffb400" trailColor="#eee" />
                  </div>
                );
              })}
            </div>
          </div>

          <Divider />

          <div className="review-list">
            {feedbackLoading ? (
              <Spin tip="Đang tải đánh giá..." />
            ) : feedbacks.length === 0 ? (
              <p className="no-feedback">Chưa có đánh giá nào cho sản phẩm này.</p>
            ) : (
              feedbacks.map((fb) => (
                <Card key={fb.feedbackId} className="review-card">
                  <Row gutter={[16, 8]} align="middle">
                    <Col xs={24} md={3} className="review-avatar">
                      <Avatar
                        src={`https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
                          fb.customerName
                        )}`}
                        size={64}
                        icon={<UserOutlined />}
                      />
                    </Col>
                    <Col xs={24} md={21}>
                      <div className="review-content">
                        <div className="review-header">
                          <Text strong className="reviewer-name">
                            {fb.customerName}
                          </Text>
                          <span className="review-time">{new Date(fb.createdAt).toLocaleString("vi-VN")}</span>
                        </div>
                        <Rate disabled value={fb.rating} />
                        <Paragraph className="comment">“{fb.comment}”</Paragraph>
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))
            )}
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}

export default ProductDetail;
