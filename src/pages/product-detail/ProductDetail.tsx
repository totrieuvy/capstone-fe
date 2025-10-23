import { useEffect, useState } from "react";
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

function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Chi tiết sản phẩm";
    const fetchData = async () => {
      try {
        const res = await api.get(`/api/products/detail/${id}`);
        setProduct(res.data.data);
      } catch {
        toast.error("Không thể tải sản phẩm!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const feedbacks = [
    {
      id: 1,
      name: "Kristin Watson",
      avatar: "https://i.pravatar.cc/150?img=47",
      rating: 5,
      comment:
        "Xích đu rất chắc chắn, giao hàng nhanh và đóng gói cẩn thận. Chất liệu nhựa gỗ rất đẹp, cảm giác ngồi cực kỳ thoải mái!",
      images: [
        "https://images.unsplash.com/photo-1585386959984-a4155223169a",
        "https://images.unsplash.com/photo-1616627987931-9c5e9a69b1c2",
      ],
      time: "1 tháng trước",
    },
    {
      id: 2,
      name: "Jenny Wilson",
      avatar: "https://i.pravatar.cc/150?img=11",
      rating: 4,
      comment:
        "Thiết kế đẹp, màu sắc nhã nhặn. Chỉ tiếc là khâu lắp ráp hơi mất thời gian. Tổng thể vẫn rất đáng tiền!",
      images: ["https://images.unsplash.com/photo-1600185365483-26d7a1b4a4e6"],
      time: "2 tháng trước",
    },
    {
      id: 3,
      name: "Darlene Robertson",
      avatar: "https://i.pravatar.cc/150?img=25",
      rating: 5,
      comment: "Quá tuyệt! Rất phù hợp để đặt ngoài ban công, chuyển động êm ái và cảm giác ngồi thư giãn.",
      images: ["https://images.unsplash.com/photo-1596461404969-9ae70c5aebcd"],
      time: "2 tháng trước",
    },
  ];

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
                <Rate disabled defaultValue={4.8} allowHalf />
                <span>4.8 (245 đánh giá)</span>
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
        <TabPane tab="Review" key="1">
          <div className="review-summary">
            <div className="left">
              <Title level={2}>4.8</Title>
              <Rate disabled defaultValue={4.8} allowHalf />
              <Text>(245 đánh giá)</Text>
            </div>
            <div className="right">
              {[5, 4, 3, 2, 1].map((star) => (
                <div className="rating-bar" key={star}>
                  <Text>{star} sao</Text>
                  <Progress
                    percent={star === 5 ? 80 : star === 4 ? 15 : star === 3 ? 3 : 1}
                    showInfo={false}
                    strokeColor="#ff6f61"
                    trailColor="#eee"
                  />
                </div>
              ))}
            </div>
          </div>

          <Divider />

          <div className="review-list">
            {feedbacks.map((fb) => (
              <Card key={fb.id} className="review-card">
                <Row gutter={[16, 8]}>
                  <Col xs={24} md={3} className="review-avatar">
                    <Avatar src={fb.avatar} size={60} icon={<UserOutlined />} />
                  </Col>
                  <Col xs={24} md={21}>
                    <div className="review-content">
                      <Text strong>{fb.name}</Text> <Tag color="success">Verified</Tag> • <span>{fb.time}</span>
                      <Rate disabled defaultValue={fb.rating} />
                      <Paragraph className="comment">{fb.comment}</Paragraph>
                      <div className="review-images">
                        {fb.images.map((img, index) => (
                          <Image key={index} src={img} alt="review" className="review-img" preview />
                        ))}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}

export default ProductDetail;
