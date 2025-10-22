import { useEffect, useState, type ReactNode } from "react";
import { Row, Col, Card, Button, Spin, Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { selectGroomingItem } from "../../../../redux/features/SelectedGroomingItem";
import api from "../../../../config/axios";
import AOS from "aos";
import "aos/dist/aos.css";
import "./GroomingPage.scss";
import {
  DollarOutlined,
  ClockCircleOutlined,
  ScissorOutlined,
  AppstoreOutlined,
  GiftOutlined,
} from "@ant-design/icons";

interface Service {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  displayPrice: string;
  isActive: boolean;
}

interface Combo {
  id: string;
  comboName: string;
  description: string;
  serviceCount: number;
  displayPrice: string;
  isActive: boolean;
}

type ActiveView = "services" | "combos";

function GroomingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setActiveView] = useState<ActiveView>("services");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    document.title = "Dịch vụ Grooming - The Hamster";
    AOS.init({ duration: 800, once: true, offset: 80 });

    const fetchData = async () => {
      setLoading(true);
      try {
        const [serviceResponse, comboResponse] = await Promise.all([
          api.get("/api/services/type/GROOMING"),
          api.get("/api/combo"),
        ]);

        if (serviceResponse.data && serviceResponse.data.code === 200) {
          setServices(serviceResponse.data.data.filter((s: Service) => s.isActive));
        }
        if (comboResponse.data && comboResponse.data.code === 200) {
          setCombos(comboResponse.data.data.filter((c: Combo) => c.isActive));
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dịch vụ hoặc combo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const serviceIcon: ReactNode = <ScissorOutlined />;
  const comboIcon: ReactNode = <GiftOutlined />;

  const handleBookNowClick = (item: Service | Combo, type: "service" | "combo") => {
    dispatch(
      selectGroomingItem({
        id: item.id,
        name: type === "service" ? (item as Service).serviceName : (item as Combo).comboName,
        type: type,
        description: item.description,
        displayPrice: item.displayPrice,
        durationMinutes: type === "service" ? (item as Service).durationMinutes : undefined,
      })
    );
    navigate("/dich-vu-lam-dep/dat-dich-vu");
  };

  const renderServices = () => (
    <Row gutter={[24, 24]} justify="center">
      {services.map((service) => (
        <Col xs={24} sm={12} lg={8} key={service.id} data-aos="zoom-in-up">
          <Card hoverable className="service-card">
            <div className="service-icon-container">{serviceIcon}</div>
            <div className="service-info">
              <div>
                <h3 className="service-name">{service.serviceName}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-details">
                  <span className="service-price">
                    <DollarOutlined /> {service.displayPrice.replace(".00", "")}
                  </span>
                  <span className="service-duration">
                    <ClockCircleOutlined /> {service.durationMinutes} phút
                  </span>
                </div>
              </div>
              <Button type="primary" className="book-button" onClick={() => handleBookNowClick(service, "service")}>
                Đặt lịch ngay
              </Button>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderCombos = () => (
    <Row gutter={[24, 24]} justify="center">
      {combos.map((combo) => (
        <Col xs={24} sm={12} lg={8} key={combo.id} data-aos="zoom-in-up" data-aos-delay="100">
          <Card hoverable className="combo-card">
            <div className="combo-icon-container">{comboIcon}</div>
            <div className="combo-info">
              <div>
                <h3 className="combo-name">{combo.comboName}</h3>
                <p className="combo-description">{combo.description}</p>
                <div className="combo-details">
                  <span className="combo-price">
                    <DollarOutlined /> {combo.displayPrice.replace(".00", "")}
                  </span>
                  <span className="combo-count">
                    <AppstoreOutlined /> {combo.serviceCount} dịch vụ
                  </span>
                </div>
              </div>
              <Button type="primary" className="book-button" onClick={() => handleBookNowClick(combo, "combo")}>
                Đặt lịch ngay
              </Button>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const tabItems = [
    {
      key: "services",
      label: "Dịch vụ đơn lẻ",
      children: renderServices(),
    },
    {
      key: "combos",
      label: "Gói Combo Tiết Kiệm",
      children: renderCombos(),
    },
  ];

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
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>Đang tải dịch vụ...</p>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <Tabs
              defaultActiveKey="services"
              centered
              items={tabItems}
              onChange={(key) => setActiveView(key as ActiveView)}
              className="view-switcher"
            />
          </>
        )}
      </div>
    </div>
  );
}

export default GroomingPage;
