import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button, Spin } from "antd";
import { getMedicalServices, type Service } from "../../../../services/MedicalService";
import { selectMedicalItem } from "../../../../redux/features/SelectedMedicalItem";
import AOS from "aos";
import "aos/dist/aos.css";
import "./MedicalList.scss";
import { DollarOutlined, ClockCircleOutlined, MedicineBoxOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import type { RootState } from "@/redux/rootReducer";

function MedicalList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    document.title = "Dịch vụ Y tế - The Hamster";
    AOS.init({ duration: 800, once: true, offset: 80 });

    const fetchMedicalServices = async () => {
      setLoading(true);
      try {
        const response = await getMedicalServices();
        if (response && response.code === 200) {
          setServices(response.data.filter((s: Service) => s.isActive && s.isDefault));
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dịch vụ y tế:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalServices();
  }, []);

  const serviceIcon: ReactNode = <MedicineBoxOutlined />;

  const handleBookNowClick = (service: Service) => {
    // Dispatch the selected medical service to Redux store

    if (!user?.token) {
      toast.error("Vui lòng đăng nhập để đặt dịch vụ.");
      return navigate("/login");
    }

    dispatch(
      selectMedicalItem({
        id: service.id,
        name: service.serviceName,
        type: "service",
        description: service.description,
        displayPrice: service.displayPrice,
        durationMinutes: service.durationMinutes,
      })
    );

    // Navigate to medical booking page
    navigate("/dich-vu-y-te/dat-dich-vu");
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
              <Button type="primary" className="book-button" onClick={() => handleBookNowClick(service)}>
                Đặt lịch ngay
              </Button>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div className="MedicalList">
      <div className="medical-banner">
        <h1 className="banner-title" data-aos="fade-down">
          Dịch vụ Y tế & Chăm sóc Sức khỏe
        </h1>
        <p className="banner-subtitle" data-aos="fade-up" data-aos-delay="200">
          Dịch vụ khám chữa bệnh chuyên nghiệp cho các bé Hamster cưng của bạn.
        </p>
      </div>

      <div className="medical-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>Đang tải dịch vụ y tế...</p>
          </div>
        ) : (
          <>
            <h2 className="section-title" data-aos="fade-up">
              Danh sách Dịch vụ Y tế
            </h2>
            {renderServices()}
          </>
        )}
      </div>
    </div>
  );
}

export default MedicalList;
