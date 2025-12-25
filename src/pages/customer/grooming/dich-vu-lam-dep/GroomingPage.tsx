import { useEffect, useState, type ReactNode } from "react";
import { Row, Col, Card, Button, Spin, Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  CheckOutlined,
} from "@ant-design/icons";
import type { RootState } from "@/redux/rootReducer";
import { toast } from "react-toastify";

import { AxiosError } from "axios";

interface ErrorResponse {
  code?: number;
  message?: string;
}

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
  const [selectedServices, setSelectedServices] = useState<Service[]>([]); // Nhiều dịch vụ lẻ
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null); // 1 combo
  const [isBanned, setIsBanned] = useState<boolean>(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.user);

  // Check if account is banned
  useEffect(() => {
    const checkBanStatus = async () => {
      if (!user?.token) return;
      try {
        const response = await api.get("/api/auth/is-banned");
        if (response.data?.code === 401) {
          setIsBanned(true);
        }
      } catch (err) {
        const error = err as AxiosError<ErrorResponse>;
        if (error.response?.data?.code === 401) {
          setIsBanned(true);
        }
      }
    };

    checkBanStatus();
  }, [user?.token]);

  useEffect(() => {
    document.title = "Dịch vụ làm đẹp";
    AOS.init({ duration: 800, once: true, offset: 80 });

    const fetchData = async () => {
      setLoading(true);
      try {
        const [serviceResponse, comboResponse] = await Promise.all([
          api.get("/api/services/type/GROOMING"),
          api.get("/api/combo"),
        ]);

        if (serviceResponse.data?.code === 200) {
          setServices(serviceResponse.data.data.filter((s: Service) => s.isActive));
        }
        if (comboResponse.data?.code === 200) {
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

  /** ✅ Chọn hoặc bỏ chọn dịch vụ lẻ */
  // const toggleServiceSelect = (service: Service) => {
  //   setSelectedServices((prev) => {
  //     const isSelected = prev.some((s) => s.id === service.id);
  //     if (isSelected) {
  //       return prev.filter((s) => s.id !== service.id);
  //     }
  //     return [...prev, service];
  //   });
  // };

  const toggleServiceSelect = (service: Service) => {
    if (isBanned) {
      toast.error("Tài khoản của bạn đã bị khóa!");
      return;
    }

    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.id === service.id);

      // 👉 Nếu đang SELECTED → nghĩa là user muốn BỎ CHỌN
      if (isSelected) {
        return prev.filter((s) => s.id !== service.id); // Không check thời gian
      }

      // 👉 Nếu đang chọn thêm dịch vụ mới
      const totalMinutes = prev.reduce((sum, s) => sum + s.durationMinutes, 0);
      const newTotal = totalMinutes + service.durationMinutes;

      if (newTotal > 60) {
        toast.error("Tổng thời gian không được vượt quá 60 phút!");
        return prev; // Không thêm dịch vụ mới
      }

      return [...prev, service];
    });
  };

  /** ✅ Chọn combo (chỉ 1, chọn là đi luôn) */
  const handleComboSelect = (combo: Combo) => {
    if (isBanned) {
      toast.error("Tài khoản của bạn đã bị khóa!");
      return;
    }

    setSelectedCombo(combo);
    dispatch(
      selectGroomingItem({
        id: combo.id,
        name: combo.comboName,
        type: "combo",
        description: combo.description,
        displayPrice: combo.displayPrice,
      })
    );
    navigate("/dich-vu-lam-dep/dat-dich-vu");
  };

  /** ✅ Bấm đặt lịch với nhiều dịch vụ lẻ */
  const handleBookSelectedServices = () => {
    if (!user?.token) {
      toast.error("Vui lòng đăng nhập để đặt dịch vụ.");
      return navigate("/login");
    }
    if (!selectedServices.length) return;
    // Tạo payload gộp (nhiều service)
    dispatch(
      selectGroomingItem({
        id: selectedServices.map((s) => s.id).join(","), // gộp id
        name: selectedServices.map((s) => s.serviceName).join(", "),
        type: "service",
        description: selectedServices.map((s) => s.description).join(" | "),
        displayPrice: selectedServices.map((s) => s.displayPrice).join(", "),
        durationMinutes: selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0),
      })
    );
    navigate("/dich-vu-lam-dep/dat-dich-vu");
  };

  const renderServices = () => (
    <>
      <Row gutter={[24, 24]} justify="center">
        {services.map((service) => {
          const isSelected = selectedServices.some((s) => s.id === service.id);
          return (
            <Col xs={24} sm={12} lg={8} key={service.id} data-aos="zoom-in-up">
              <Card
                hoverable
                className={`service-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleServiceSelect(service)}
              >
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
                  {isSelected && (
                    <div className="selected-check">
                      <CheckOutlined />
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {selectedServices.length > 0 && (
        <div className="book-now-container">
          <Button type="primary" className="book-now-btn" onClick={handleBookSelectedServices}>
            Đặt lịch ngay
          </Button>
        </div>
      )}
    </>
  );

  const renderCombos = () => (
    <Row gutter={[24, 24]} justify="center">
      {combos.map((combo) => (
        <Col xs={24} sm={12} lg={8} key={combo.id} data-aos="zoom-in-up" data-aos-delay="100">
          <Card
            hoverable
            className={`combo-card ${selectedCombo?.id === combo.id ? "selected" : ""}`}
            onClick={() => handleComboSelect(combo)}
          >
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
              {selectedCombo?.id === combo.id && (
                <div className="selected-check">
                  <CheckOutlined />
                </div>
              )}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const tabItems = [
    { key: "services", label: "Dịch vụ đơn lẻ", children: renderServices() },
    { key: "combos", label: "Gói Combo Tiết Kiệm", children: renderCombos() },
  ];

  return (
    <div className="GroomingPage">
      <div className="grooming-banner">
        <h1 className="banner-title" data-aos="fade-down">
          Dịch vụ làm đẹp
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
          <Tabs
            defaultActiveKey="services"
            centered
            items={tabItems}
            onChange={(key) => setActiveView(key as ActiveView)}
            className="view-switcher"
          />
        )}
      </div>
    </div>
  );
}

export default GroomingPage;
