import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Spin,
  Badge,
  Steps,
  message,
  DatePicker,
  Drawer,
  Alert,
  Statistic,
  Checkbox,
  Divider,
  Image,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "./BoardingHamster.scss";

const { RangePicker } = DatePicker;

interface HamsterProfile {
  id: string;
  name: string;
  color: string;
  dob: string;
  species: string;
  gender: "Male" | "Female";
  weight: number;
  profilePicture: string;
  healthNote: string;
}

interface CageType {
  id: string;
  typeName: string;
  description: string;
  pricePerDay: number;
  size: string;
  image: string;
}

interface AdditionalService {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
}

// Mock data for hamsters
const mockHamsters: HamsterProfile[] = [
  {
    id: "1",
    name: "Fluffy",
    color: "Nâu vàng",
    dob: "15-03-2024",
    species: "Syrian",
    gender: "Male",
    weight: 120,
    profilePicture: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400",
    healthNote: "Khỏe mạnh",
  },
  {
    id: "2",
    name: "Snowy",
    color: "Trắng",
    dob: "22-05-2024",
    species: "Winter White",
    gender: "Female",
    weight: 95,
    profilePicture: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400",
    healthNote: "Không có",
  },
  {
    id: "3",
    name: "Cookie",
    color: "Vàng nâu",
    dob: "10-01-2024",
    species: "Roborovski",
    gender: "Male",
    weight: 85,
    profilePicture: "https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=400",
    healthNote: "Đã tiêm đầy đủ",
  },
  {
    id: "4",
    name: "Milo",
    color: "Xám",
    dob: "30-06-2024",
    species: "Campbell's Dwarf",
    gender: "Male",
    weight: 110,
    profilePicture: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400",
    healthNote: "Dị ứng với hạt hướng dương",
  }
];

// Mock data for cage types
const mockCageTypes: CageType[] = [
  {
    id: "1",
    typeName: "Standard",
    description: "Chuồng tiêu chuẩn với đầy đủ tiện nghi cơ bản cho hamster. Bao gồm lồng rộng rãi, bình nước, chén ăn và bánh xe chạy.",
    pricePerDay: 50000,
    size: "40cm x 30cm x 25cm",
    image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600",
  },
  {
    id: "2",
    typeName: "Premium",
    description: "Chuồng cao cấp với không gian rộng rãi hơn, có thêm khu vực vui chơi, đường hầm và nhiều đồ chơi thú vị cho hamster.",
    pricePerDay: 80000,
    size: "60cm x 40cm x 35cm",
    image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600",
  },
  {
    id: "3",
    typeName: "Family",
    description: "Chuồng gia đình dành cho 2-3 hamster cùng ở. Không gian siêu rộng với nhiều khu vực riêng biệt và đồ chơi phong phú.",
    pricePerDay: 120000,
    size: "80cm x 50cm x 40cm",
    image: "https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=600",
  },
  {
    id: "4",
    typeName: "VIP",
    description: "Chuồng VIP sang trọng nhất với thiết kế đặc biệt, camera quan sát 24/7, hệ thống điều hòa riêng và chăm sóc đặc biệt.",
    pricePerDay: 200000,
    size: "100cm x 60cm x 50cm",
    image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600",
  },
  
];

// Mock data for additional services
const mockAdditionalServices: AdditionalService[] = [
  {
    id: "1",
    name: "Thức ăn cao cấp",
    description: "Thức ăn nhập khẩu chất lượng cao, giàu dinh dưỡng, phù hợp cho mọi loại hamster",
    pricePerDay: 15000,
  },
  {
    id: "2",
    name: "Rau củ/trái cây tươi",
    description: "Rau củ và trái cây tươi mỗi ngày, bổ sung vitamin và khoáng chất cần thiết",
    pricePerDay: 10000,
  },
  {
    id: "3",
    name: "Snack đặc biệt",
    description: "Các loại snack đặc biệt như hạt óc chó, hạnh nhân, sunflower seeds cho hamster",
    pricePerDay: 12000,
  },
];

function BoardingHamster() {
  const [currentStep, setCurrentStep] = useState(0);
  const [profiles, setProfiles] = useState<HamsterProfile[]>([]);
  const [cageTypes, setCageTypes] = useState<CageType[]>([]);
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  const [selectedHamsterId, setSelectedHamsterId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [selectedCageId, setSelectedCageId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerCage, setDrawerCage] = useState<CageType | null>(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    document.title = "Đặt Phòng Hamster";
    fetchProfiles();
    fetchCageTypes();
    fetchAdditionalServices();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProfiles(mockHamsters);
    } catch {
      message.error("Không thể tải danh sách hamster");
    } finally {
      setLoading(false);
    }
  };

  const fetchCageTypes = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCageTypes(mockCageTypes);
    } catch {
      message.error("Không thể tải danh sách loại chuồng");
    }
  };

  const fetchAdditionalServices = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAdditionalServices(mockAdditionalServices);
    } catch {
      message.error("Không thể tải danh sách dịch vụ bổ sung");
    }
  };

  const handleSelectHamster = (hamsterId: string) => {
    setSelectedHamsterId(hamsterId);
  };

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates) {
      setDateRange(dates);
    } else {
      setDateRange([null, null]);
    }
  };

  const calculateTotalDays = (): number => {
    if (!dateRange[0] || !dateRange[1]) return 0;
    return dateRange[1].diff(dateRange[0], "day") + 1;
  };

  const calculateDiscount = (days: number): number => {
    if (days >= 30) return 20;
    if (days >= 14) return 15;
    if (days >= 7) return 10;
    if (days >= 3) return 5;
    return 0;
  };

  const handleCageClick = (cage: CageType) => {
    setDrawerCage(cage);
    setDrawerVisible(true);
  };

  const handleSelectCage = (cageId: string) => {
    setSelectedCageId(cageId);
    setDrawerVisible(false);
    message.success("Đã chọn loại chuồng");
  };

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleNext = () => {
    if (currentStep === 0 && !selectedHamsterId) {
      message.warning("Vui lòng chọn một hamster");
      return;
    }
    if (currentStep === 1) {
      if (!dateRange[0] || !dateRange[1]) {
        message.warning("Vui lòng chọn ngày gửi và nhận hamster");
        return;
      }
      if (!selectedCageId) {
        message.warning("Vui lòng chọn loại chuồng");
        return;
      }
    }
    if (currentStep === 2) {
      if (!termsAccepted) {
        message.warning("Vui lòng đồng ý với điều khoản dịch vụ");
        return;
      }
      // Handle booking submission here
      message.success("Đặt phòng thành công!");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    {
      title: "Chọn Hamster",
      icon: <UserOutlined />,
    },
    {
      title: "Chọn Ngày & Chuồng",
      icon: <CalendarOutlined />,
    },
    {
      title: "Xác Nhận",
      icon: <CheckCircleOutlined />,
    },
  ];

  const totalDays = calculateTotalDays();
  const discount = calculateDiscount(totalDays);

  // Get selected items
  const selectedHamster = profiles.find((h) => h.id === selectedHamsterId);
  const selectedCage = cageTypes.find((c) => c.id === selectedCageId);
  const selectedServices = additionalServices.filter((s) =>
    selectedServiceIds.includes(s.id)
  );

  // Calculate pricing
  const cageTotal = selectedCage ? selectedCage.pricePerDay * totalDays : 0;
  const servicesTotal = selectedServices.reduce(
    (sum, service) => sum + service.pricePerDay * totalDays,
    0
  );
  const subtotal = cageTotal + servicesTotal;
  const discountAmount = (subtotal * discount) / 100;
  const finalTotal = subtotal - discountAmount;

  return (
    <div className="boarding-container">
      <div className="boarding__header">
        <h2 style={{ color: "#ff6f61", textShadow: "1px 1px 2px rgba(0, 0, 0, 0.2)" }}>
          🏠 Đặt Phòng Chăm Sóc Hamster
        </h2>
      </div>

      <div className="boarding__steps">
        <Steps current={currentStep} items={steps} style={{ marginBottom: 40 }} />
      </div>

      <Spin spinning={loading} size="large" tip="Đang tải dữ liệu...">
        <div className="boarding__content">
          {/* Step 1: Select Hamster */}
          {currentStep === 0 && (
            <div className="step-select-hamster">
              <h3 style={{ color: "#ff6f61", marginBottom: 24, fontSize: 20 }}>
                Chọn Hamster của bạn
              </h3>

              {profiles.length === 0 && !loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 0",
                    color: "#ff6f61",
                    fontSize: "18px",
                    fontWeight: 500,
                  }}
                >
                  🐹 Chưa có hồ sơ hamster nào. Vui lòng tạo hồ sơ trước.
                </div>
              ) : (
                <Row gutter={[24, 24]}>
                  {profiles.map((hamster) => (
                    <Col xs={24} sm={12} md={8} key={hamster.id}>
                      <Badge.Ribbon text={hamster.species} color="#ff6f61">
                        <Card
                          hoverable
                          className={`hamster__card ${
                            selectedHamsterId === hamster.id ? "selected" : ""
                          }`}
                          cover={
                            <img
                              src={hamster.profilePicture}
                              alt={hamster.name}
                              className="hamster__card-img"
                            />
                          }
                          onClick={() => handleSelectHamster(hamster.id)}
                          style={{
                            animation: "fadeIn 0.5s ease-in-out",
                            border:
                              selectedHamsterId === hamster.id
                                ? "3px solid #ff6f61"
                                : "1px solid #f0f0f0",
                            cursor: "pointer",
                          }}
                        >
                          <div className="hamster__card-name">{hamster.name}</div>
                          <div className="hamster__info">
                            <p>
                              <b style={{ color: "#ff6f61" }}>Màu sắc:</b> {hamster.color}
                            </p>
                            <p>
                              <b style={{ color: "#ff6f61" }}>Ngày sinh:</b> {hamster.dob}
                            </p>
                            <p>
                              <b style={{ color: "#ff6f61" }}>Giới tính:</b> {hamster.gender}
                            </p>
                            <p>
                              <b style={{ color: "#ff6f61" }}>Cân nặng:</b> {hamster.weight} g
                            </p>
                            <p>
                              <b style={{ color: "#ff6f61" }}>Ghi chú:</b>{" "}
                              {hamster.healthNote || "Không có"}
                            </p>
                          </div>
                          {selectedHamsterId === hamster.id && (
                            <div className="selected-checkmark">✓</div>
                          )}
                        </Card>
                      </Badge.Ribbon>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}

          {/* Step 2: Select Dates & Cage Type */}
          {currentStep === 1 && (
            <div className="step-select-dates">
              {/* Date Selection Section */}
              <div className="date-section">
                <h3 style={{ color: "#ff6f61", marginBottom: 16, fontSize: 20 }}>
                  📅 Chọn Ngày Gửi và Nhận
                </h3>

                {/* Discount Information */}
                <Alert
                  message="Ưu đãi theo thời gian gửi thú"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Từ 3-6 ngày: Giảm 5% tổng hóa đơn</li>
                      <li>Từ 7-13 ngày: Giảm 10% tổng hóa đơn</li>
                      <li>Từ 14-29 ngày: Giảm 15% tổng hóa đơn</li>
                      <li>Từ 30 ngày trở lên: Giảm 20% tổng hóa đơn</li>
                    </ul>
                  }
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Alert
                  message="Phụ thu ngày lễ"
                  description="Các ngày lễ, Tết sẽ có phụ thu 20% trên giá dịch vụ hàng ngày"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                {/* Date Picker */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#333" }}>
                    Chọn ngày gửi và nhận hamster:
                  </label>
                  <RangePicker
                    style={{ width: "100%", borderRadius: 8 }}
                    format="DD-MM-YYYY"
                    placeholder={["Ngày gửi", "Ngày nhận"]}
                    onChange={handleDateChange}
                    disabledDate={(current) => current && current < dayjs().startOf("day")}
                  />
                </div>

                {/* Display Total Days and Discount */}
                {totalDays > 0 && (
                  <Row gutter={16} style={{ marginTop: 24 }}>
                    <Col span={12}>
                      <Card style={{ textAlign: "center", borderRadius: 8 }}>
                        <Statistic
                          title="Tổng số ngày"
                          value={totalDays}
                          suffix="ngày"
                          valueStyle={{ color: "#ff6f61" }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card style={{ textAlign: "center", borderRadius: 8 }}>
                        <Statistic
                          title="Giảm giá"
                          value={discount}
                          suffix="%"
                          valueStyle={{ color: "#52c41a" }}
                        />
                      </Card>
                    </Col>
                  </Row>
                )}
              </div>

              {/* Cage Type Selection Section */}
              <div className="cage-section" style={{ marginTop: 40 }}>
                <h3 style={{ color: "#ff6f61", marginBottom: 24, fontSize: 20 }}>
                  🏠 Chọn Loại Chuồng
                </h3>

                <Row gutter={[24, 24]}>
                  {cageTypes.map((cage) => (
                    <Col xs={24} sm={12} md={6} key={cage.id}>
                      <Card
                        hoverable
                        className={`cage__card ${selectedCageId === cage.id ? "selected" : ""}`}
                        onClick={() => handleCageClick(cage)}
                        style={{
                          borderRadius: 12,
                          border:
                            selectedCageId === cage.id
                              ? "3px solid #ff6f61"
                              : "1px solid #f0f0f0",
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <HomeOutlined
                            style={{ fontSize: 48, color: "#ff6f61", marginBottom: 12 }}
                          />
                          <h4 style={{ fontSize: 18, fontWeight: 700, color: "#ff6f61", marginBottom: 8 }}>
                            {cage.typeName}
                          </h4>
                          <p style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "8px 0" }}>
                            {cage.pricePerDay.toLocaleString("vi-VN")} đ/ngày
                          </p>
                          <p style={{ fontSize: 14, color: "#666", margin: 0 }}>
                            Kích thước: {cage.size}
                          </p>
                        </div>
                        {selectedCageId === cage.id && (
                          <div className="selected-checkmark">✓</div>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Additional Services Section */}
              <div className="services-section" style={{ marginTop: 40 }}>
                <h3 style={{ color: "#ff6f61", marginBottom: 8, fontSize: 20 }}>
                  ✨ Dịch Vụ Bổ Sung (Tùy chọn)
                </h3>
                <p style={{ color: "#999", marginBottom: 24, fontSize: 14 }}>
                  Chọn các dịch vụ bổ sung để chăm sóc hamster tốt hơn
                </p>

                <Row gutter={[16, 16]}>
                  {additionalServices.map((service) => (
                    <Col xs={24} sm={12} md={8} key={service.id}>
                      <Card
                        hoverable
                        className={`service__card ${
                          selectedServiceIds.includes(service.id) ? "selected" : ""
                        }`}
                        onClick={() => handleToggleService(service.id)}
                        style={{
                          borderRadius: 12,
                          border: selectedServiceIds.includes(service.id)
                            ? "2px solid #ff6f61"
                            : "1px solid #f0f0f0",
                          cursor: "pointer",
                          position: "relative",
                          height: "100%",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: "#ff6f61",
                              marginBottom: 8,
                            }}
                          >
                            {service.name}
                          </h4>
                          <p
                            style={{
                              fontSize: 14,
                              color: "#666",
                              marginBottom: 12,
                              minHeight: 40,
                            }}
                          >
                            {service.description}
                          </p>
                          <p
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: "#333",
                              margin: 0,
                            }}
                          >
                            {service.pricePerDay.toLocaleString("vi-VN")} đ/ngày
                          </p>
                        </div>
                        {selectedServiceIds.includes(service.id) && (
                          <div className="selected-checkmark">✓</div>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 2 && (
            <div className="step-confirmation">
              <h3 style={{ color: "#ff6f61", marginBottom: 24, fontSize: 20 }}>
                ✅ Xác Nhận Đặt Phòng
              </h3>

              {/* Owner and Hamster Info Section */}
              <Card
                title={
                  <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
                    👤 Thông Tin Chủ Nhân & Hamster
                  </span>
                }
                style={{ marginBottom: 24, borderRadius: 12 }}
              >
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <div className="info-group">
                      <h4 style={{ color: "#ff6f61", marginBottom: 12 }}>Thông tin chủ nhân:</h4>
                      <p><strong>Họ tên:</strong> Nguyễn Văn A</p>
                      <p><strong>Email:</strong> nguyenvana@email.com</p>
                      <p><strong>Số điện thoại:</strong> 0123 456 789</p>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    {selectedHamster && (
                      <div className="info-group">
                        <h4 style={{ color: "#ff6f61", marginBottom: 12 }}>Thông tin hamster:</h4>
                        <p><strong>Tên:</strong> {selectedHamster.name}</p>
                        <p><strong>Loài:</strong> {selectedHamster.species}</p>
                        <p><strong>Giới tính:</strong> {selectedHamster.gender}</p>
                        <p><strong>Cân nặng:</strong> {selectedHamster.weight}g</p>
                        <p><strong>Ngày sinh:</strong> {selectedHamster.dob}</p>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card>

              {/* Service Info Section */}
              <Card
                title={
                  <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
                    📋 Thông Tin Dịch Vụ
                  </span>
                }
                style={{ marginBottom: 24, borderRadius: 12 }}
              >
                <Row gutter={[24, 24]}>
                  {/* Left Column - Services Detail */}
                  <Col xs={24} md={12}>
                    <div className="service-details">
                      <h4 style={{ color: "#ff6f61", marginBottom: 16 }}>Dịch vụ đã chọn:</h4>
                      
                      {/* Booking Dates */}
                      <div style={{ marginBottom: 20 }}>
                        <p style={{ marginBottom: 4 }}>
                          <strong>📅 Ngày gửi:</strong> {dateRange[0]?.format("DD-MM-YYYY")}
                        </p>
                        <p style={{ marginBottom: 4 }}>
                          <strong>📅 Ngày nhận:</strong> {dateRange[1]?.format("DD-MM-YYYY")}
                        </p>
                        <p>
                          <strong>⏱️ Tổng số ngày:</strong> {totalDays} ngày
                        </p>
                      </div>

                      <Divider style={{ margin: "16px 0" }} />

                      {/* Cage Type with Image */}
                      {selectedCage && (
                        <div style={{ marginBottom: 20 }}>
                          <h4 style={{ color: "#333", marginBottom: 12 }}>🏠 Loại chuồng:</h4>
                          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <Image
                              src={selectedCage.image}
                              alt={selectedCage.typeName}
                              width={100}
                              height={100}
                              style={{ borderRadius: 8, objectFit: "cover" }}
                            />
                            <div>
                              <p style={{ fontWeight: 600, marginBottom: 4 }}>
                                {selectedCage.typeName}
                              </p>
                              <p style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
                                {selectedCage.size}
                              </p>
                              <p style={{ fontSize: 14, color: "#333" }}>
                                {selectedCage.pricePerDay.toLocaleString("vi-VN")} đ/ngày
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Services */}
                      {selectedServices.length > 0 && (
                        <>
                          <Divider style={{ margin: "16px 0" }} />
                          <div>
                            <h4 style={{ color: "#333", marginBottom: 12 }}>✨ Dịch vụ bổ sung:</h4>
                            {selectedServices.map((service) => (
                              <div key={service.id} style={{ marginBottom: 12 }}>
                                <p style={{ fontWeight: 600, marginBottom: 2 }}>
                                  • {service.name}
                                </p>
                                <p style={{ fontSize: 13, color: "#666", marginLeft: 12 }}>
                                  {service.pricePerDay.toLocaleString("vi-VN")} đ/ngày
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </Col>

                  {/* Right Column - Price Breakdown */}
                  <Col xs={24} md={12}>
                    <div className="price-breakdown">
                      <h4 style={{ color: "#ff6f61", marginBottom: 16 }}>💰 Chi Tiết Giá:</h4>
                      
                      <div className="price-item">
                        <span>Tiền chuồng ({totalDays} ngày):</span>
                        <span>{cageTotal.toLocaleString("vi-VN")} đ</span>
                      </div>

                      {selectedServices.length > 0 && (
                        <div className="price-item">
                          <span>Dịch vụ bổ sung ({totalDays} ngày):</span>
                          <span>{servicesTotal.toLocaleString("vi-VN")} đ</span>
                        </div>
                      )}

                      <Divider style={{ margin: "12px 0" }} />

                      <div className="price-item">
                        <span>Tạm tính:</span>
                        <span style={{ fontWeight: 600 }}>
                          {subtotal.toLocaleString("vi-VN")} đ
                        </span>
                      </div>

                      {discount > 0 && (
                        <div className="price-item" style={{ color: "#52c41a" }}>
                          <span>Giảm giá ({discount}%):</span>
                          <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                        </div>
                      )}

                      <Divider style={{ margin: "12px 0" }} />

                      <div className="price-item total">
                        <span>Tổng cộng:</span>
                        <span>{finalTotal.toLocaleString("vi-VN")} đ</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Terms of Service Section */}
              <Card
                style={{
                  marginBottom: 24,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%)",
                }}
              >
                <div className="terms-section">
                  <h4 style={{ color: "#ff6f61", marginBottom: 16, fontSize: 16 }}>
                    📜 Điều Khoản Dịch Vụ
                  </h4>
                  <div
                    style={{
                      background: "white",
                      padding: 16,
                      borderRadius: 8,
                      marginBottom: 16,
                      maxHeight: 200,
                      overflowY: "auto",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <p style={{ marginBottom: 12, fontSize: 14 }}>
                      <strong>1. Chăm sóc hamster:</strong> Chúng tôi cam kết chăm sóc hamster của bạn 
                      với sự tận tâm và chuyên nghiệp nhất. Hamster sẽ được cho ăn đầy đủ, vệ sinh 
                      chuồng hàng ngày và được theo dõi sức khỏe thường xuyên.
                    </p>
                    <p style={{ marginBottom: 12, fontSize: 14 }}>
                      <strong>2. Trách nhiệm của khách hàng:</strong> Vui lòng cung cấp đầy đủ 
                      thông tin về tình trạng sức khỏe, thói quen ăn uống và các lưu ý đặc biệt của 
                      hamster. Khách hàng cần đưa hamster đến và đón hamster đúng giờ đã hẹn.
                    </p>
                    <p style={{ marginBottom: 12, fontSize: 14 }}>
                      <strong>3. Chính sách hủy đặt phòng:</strong> Hủy trước 48 giờ: Hoàn 100% tiền. 
                      Hủy trước 24 giờ: Hoàn 50% tiền. Hủy trong vòng 24 giờ: Không hoàn tiền.
                    </p>
                    <p style={{ marginBottom: 0, fontSize: 14 }}>
                      <strong>4. Chính sách khẩn cấp:</strong> Trong trường hợp hamster có vấn đề về 
                      sức khỏe, chúng tôi sẽ liên hệ ngay với bạn và đưa hamster đến bác sĩ thú y nếu 
                      cần thiết. Chi phí y tế sẽ do khách hàng chi trả.
                    </p>
                  </div>
                  
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ fontSize: 15 }}
                  >
                    <span style={{ color: "#333", fontWeight: 500 }}>
                      Tôi đã đọc và đồng ý với các điều khoản dịch vụ
                    </span>
                  </Checkbox>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="boarding__actions">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            style={{
              marginRight: 12,
              borderRadius: 8,
            }}
          >
            Quay lại
          </Button>
          <Button
            type="primary"
            onClick={handleNext}
            style={{
              background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
              border: "none",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            }}
          >
            {currentStep === 2 ? "Xác nhận đặt phòng" : "Tiếp theo"}
          </Button>
        </div>
      </Spin>

      {/* Cage Details Drawer */}
      <Drawer
        title={
          <span style={{ fontSize: 20, color: "#ff6f61", fontWeight: 700 }}>
            {drawerCage?.typeName}
          </span>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {drawerCage && (
          <div className="cage-details">
            <img
              src={drawerCage.image}
              alt={drawerCage.typeName}
              style={{
                width: "100%",
                height: 250,
                objectFit: "cover",
                borderRadius: 8,
                marginBottom: 24,
              }}
            />

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ color: "#ff6f61", marginBottom: 8 }}>Giá thuê:</h4>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#333", margin: 0 }}>
                {drawerCage.pricePerDay.toLocaleString("vi-VN")} đ/ngày
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ color: "#ff6f61", marginBottom: 8 }}>Kích thước:</h4>
              <p style={{ fontSize: 16, color: "#666", margin: 0 }}>{drawerCage.size}</p>
            </div>

            <div style={{ marginBottom: 32 }}>
              <h4 style={{ color: "#ff6f61", marginBottom: 8 }}>Mô tả:</h4>
              <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6, margin: 0 }}>
                {drawerCage.description}
              </p>
            </div>

            <Button
              type="primary"
              size="large"
              block
              onClick={() => handleSelectCage(drawerCage.id)}
              style={{
                background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
                border: "none",
                borderRadius: 8,
                height: 48,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Chọn loại chuồng này
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default BoardingHamster;