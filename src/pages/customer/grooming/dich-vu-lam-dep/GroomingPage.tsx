import { useEffect, useState, type ReactNode } from "react";
import { Row, Col, Card, Button, Spin } from "antd";
import api from "../../../../config/axios";
import AOS from "aos";
import "aos/dist/aos.css";
import "./GroomingPage.scss";
import { DollarOutlined, ClockCircleOutlined, ScissorOutlined } from "@ant-design/icons";

interface Service {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  displayPrice: string; // 🔹 Đổi từ number → string
  isActive: boolean;
}

function GroomingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    document.title = "Dịch vụ Grooming - The Hamster";
    AOS.init({ duration: 800, once: true, offset: 80 });

    const fetchGroomingServices = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/services/type/GROOMING");
        if (response.data && response.data.code === 200) {
          setServices(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dịch vụ grooming:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroomingServices();
  }, []);

  const serviceIcon: ReactNode = <ScissorOutlined />;

  return (
    <div className="GroomingPage">
      <div className="grooming-banner">
        <h1 className="banner-title" data-aos="fade-down">
          Dịch vụ Grooming & Spa
        </h1>
        <p className="banner-subtitle" data-aos="fade-up" data-aos-delay="200">
          Chăm sóc chuyên nghiệp cho các bé Hamster cưng của bạn.
        </p>
      </div>

      <div className="grooming-content">
        <h2 className="section-title" data-aos="fade-up">
          Bảng giá dịch vụ
        </h2>
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>Đang tải dịch vụ...</p>
          </div>
        ) : (
          <Row gutter={[24, 24]} justify="center">
            {services.map((service) => (
              <Col xs={24} sm={12} lg={8} key={service.id} data-aos="zoom-in-up">
                <Card hoverable className="service-card">
                  <div className="service-icon-container">{serviceIcon}</div>
                  <div className="service-info">
                    <h3 className="service-name">{service.serviceName}</h3>
                    <p className="service-description">{service.description}</p>
                    <div className="service-details">
                      <span className="service-price">
                        <DollarOutlined /> {service.displayPrice}
                      </span>
                      <span className="service-duration">
                        <ClockCircleOutlined /> {service.durationMinutes} phút
                      </span>
                    </div>
                    <Button type="primary" className="book-button">
                      Đặt lịch ngay
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}

export default GroomingPage;
