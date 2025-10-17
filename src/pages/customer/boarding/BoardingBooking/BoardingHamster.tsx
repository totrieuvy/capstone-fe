import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Spin,
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
import ProfileHamsterService from "../../../../services/ProfileHamsterService";
import cageTypeService from "../../../../services/CageTypeService";
import boardingService from "../../../../services/BoardingService";
import type { DailyAvailability, CalculateBookingCostResponse, CreateBookingRequest } from "../../../../services/BoardingService";
import { customerService } from "../../../../services/CustomerService";
import type { CustomerProfile } from "../../../../services/CustomerService";
import { getServicesByType, ServiceType } from "../../../../services/AdditionService";
import type { Service } from "../../../../services/AdditionService";
import { useNavigate } from "react-router-dom";

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
  material?: string;
  isActive?: boolean;
}

function BoardingHamster() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [profiles, setProfiles] = useState<HamsterProfile[]>([]);
  const [cageTypes, setCageTypes] = useState<CageType[]>([]);
  const [additionalServices, setAdditionalServices] = useState<Service[]>([]);
  const [selectedHamsterId, setSelectedHamsterId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [selectedCageId, setSelectedCageId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerCage, setDrawerCage] = useState<CageType | null>(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  
  // New state for cage selection and availability
  const [cageSelectionStep, setCageSelectionStep] = useState(0); // 0: select cage, 1: select dates
  const [availability, setAvailability] = useState<DailyAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  
  // New state for booking cost calculation
  const [bookingCostData, setBookingCostData] = useState<CalculateBookingCostResponse | null>(null);
  const [loadingCostCalculation, setLoadingCostCalculation] = useState(false);

  useEffect(() => {
    document.title = "Đặt Phòng Hamster";
    fetchProfiles();
    fetchCageTypes();
    fetchAdditionalServices();
    fetchCustomerProfile();
  }, []);

  // Recalculate costs when in step 3 and services change
  useEffect(() => {
    if (currentStep === 2 && selectedHamsterId && selectedCageId && dateRange[0] && dateRange[1]) {
      calculateBookingCost();
    }
  }, [selectedServiceIds, currentStep]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const hamsterProfiles = await ProfileHamsterService.getProfiles();
      setProfiles(hamsterProfiles);
    } catch (error) {
      message.error("Không thể tải danh sách hamster");
      console.error("Error fetching hamster profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCageTypes = async () => {
    try {
      setLoading(true);
      const response = await cageTypeService.getCageTypes();
      
      // Map API response to component interface
      const mappedCageTypes: CageType[] = response
        .filter(cageType => cageType.isActive) // Only show active cage types
        .map(cageType => ({
          id: cageType.id,
          typeName: cageType.typeName,
          description: cageType.description,
          pricePerDay: cageType.price,
          size: cageType.sizeDimensions,
          image: cageType.imageUrl,
          material: cageType.material,
          isActive: cageType.isActive,
        }));
      
      setCageTypes(mappedCageTypes);
    } catch (error) {
      console.error("Error fetching cage types:", error);
      message.error("Không thể tải danh sách loại chuồng");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalServices = async () => {
    try {
      const foodServices = await getServicesByType(ServiceType.FOOD);
      
      const activeServices = foodServices.data.filter(service => service.isActive);
      
      setAdditionalServices(activeServices);
    } catch (error) {
      console.error("Error fetching additional services:", error);
      message.error("Không thể tải danh sách dịch vụ bổ sung");
    }
  };

  const fetchCustomerProfile = async () => {
    try {
      const profile = await customerService.getCustomerProfile();
      setCustomerProfile(profile);
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      message.error("Không thể tải thông tin khách hàng");
    }
  };

  const handleSelectHamster = (hamsterId: string) => {
    setSelectedHamsterId(hamsterId);
  };

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      // Check if the date range exceeds 1 month
      const daysDifference = dates[1].diff(dates[0], "day");
      if (daysDifference > 30) {
        message.warning("Khoảng thời gian gửi hamster không được quá 30 ngày. Vui lòng chọn lại.");
        return;
      }
      setDateRange(dates);
    } else {
      setDateRange([null, null]);
    }
  };

  // Function to render simplified availability information
  const renderAvailabilityInfo = () => {
    // No longer needed since DatePicker handles availability automatically
    return null;
  };

  const calculateTotalDays = (): number => {
    if (!dateRange[0] || !dateRange[1]) return 0;
    return dateRange[1].diff(dateRange[0], "day") + 1;
  };

  const handleCageClick = (cage: CageType) => {
    setDrawerCage(cage);
    setDrawerVisible(true);
  };

  const handleSelectCage = (cageId: string) => {
    setSelectedCageId(cageId);
    setDrawerVisible(false);
    setCageSelectionStep(1); // Move to date selection step
    message.success("Đã chọn loại chuồng. Vui lòng chọn ngày gửi.");
    
    // Check availability for the selected cage type
    checkCageAvailability(cageId);
  };

  // Function to check cage availability for a large date range to populate disabled dates
  const checkCageAvailability = async (cageId: string) => {
    if (!cageId) return;
    
    setLoadingAvailability(true);
    try {
      // Check availability for the next 1 month to have enough data for date picker
      const startDate = dayjs();
      const endDate = dayjs().add(1, 'month');
      
      const response = await boardingService.checkAvailability({
        cageTypeId: cageId,
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      });
      setAvailability(response.dailyAvailability);
    } catch (error) {
      console.error("Error checking availability:", error);
      message.error("Không thể kiểm tra tình trạng chuồng. Vui lòng thử lại.");
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Function to disable unavailable dates in the DatePicker
  const getDisabledDate = (current: Dayjs) => {
    // Disable past dates
    if (current && current < dayjs().startOf("day")) {
      return true;
    }
    
    // Disable dates beyond 1 month from today
    if (current && current > dayjs().add(1, 'month')) {
      return true;
    }
    
    // If no availability data yet, don't disable any future dates within the 1-month range
    if (availability.length === 0) {
      return false;
    }
    
    // Check if the current date is in our availability data and is unavailable
    const currentDateStr = current.format("YYYY-MM-DD");
    const dayAvailability = availability.find(day => day.date === currentDateStr);
    
    // If we have data for this date and it's not available, disable it
    return dayAvailability ? !dayAvailability.isAvailable : false;
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

  // Function to calculate booking cost using the API
  const calculateBookingCost = async () => {
    if (!selectedHamsterId || !selectedCageId || !dateRange[0] || !dateRange[1]) {
      return;
    }

    setLoadingCostCalculation(true);
    try {
      const request = {
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
        cageTypeId: selectedCageId,
        hamsterId: selectedHamsterId,
        paymentMethod: "VNPAY", // Default payment method
        serviceIds: selectedServiceIds,
        notes: "", // Can be added if needed
      };

      const response = await boardingService.calculateBookingCost(request);
      setBookingCostData(response);
    } catch (error) {
      console.error("Error calculating booking cost:", error);
      message.error("Không thể tính toán chi phí đặt phòng. Vui lòng thử lại.");
    } finally {
      setLoadingCostCalculation(false);
    }
  };

  // Function to create booking and redirect to payment
  const handleCreateBooking = async () => {
    if (!selectedHamsterId || !selectedCageId || !dateRange[0] || !dateRange[1]) {
      message.error("Thiếu thông tin cần thiết để tạo đặt phòng");
      return;
    }

    // Validate customer profile and membership
    if (!customerProfile) {
      message.error("Không thể tải thông tin khách hàng. Vui lòng thử lại.");
      // Try to fetch customer profile again
      await fetchCustomerProfile();
      return;
    }

    // Check if membership information is available
    if (!customerProfile.rank || !customerProfile.currentPoint) {
      message.error("Thông tin thành viên không đầy đủ. Vui lòng liên hệ hỗ trợ.");
      return;
    }

    setLoading(true);
    try {
      const request: CreateBookingRequest = {
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
        cageTypeId: selectedCageId,
        hamsterId: selectedHamsterId,
        paymentMethod: "VNPAY",
        serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
        notes: "", // Can be expanded to include user notes
      };

      message.loading("Đang tạo đặt phòng...", 0);
      const response = await boardingService.createBooking(request);
      message.destroy();
      
      if (response.paymentUrl) {
        message.success("Đặt phòng thành công! Đang chuyển đến trang thanh toán...");
        // Small delay to show success message before redirect
        setTimeout(() => {
          window.location.href = response.paymentUrl;
        }, 1000);
      } else {
        throw new Error("Không nhận được URL thanh toán");
      }
      
    } catch (error: any) {
      message.destroy();
      console.error("Error creating booking:", error);
      
      // More specific error messages based on error type
      if (error.response?.status === 400) {
        message.error("Thông tin đặt phòng không hợp lệ. Vui lòng kiểm tra lại.");
      } else if (error.response?.status === 409) {
        message.error("Chuồng đã được đặt trong khoảng thời gian này. Vui lòng chọn ngày khác.");
      } else if (error.response?.status === 500) {
        message.error("Lỗi hệ thống. Vui lòng thử lại sau ít phút.");
      } else if (error.message?.includes("Network")) {
        message.error("Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.");
      } else {
        message.error("Không thể tạo đặt phòng. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && !selectedHamsterId) {
      message.warning("Vui lòng chọn một hamster");
      return;
    }
    if (currentStep === 1) {
      // In step 1, check which sub-step we're in
      if (cageSelectionStep === 0) {
        // User is trying to proceed without selecting a cage
        if (!selectedCageId) {
          message.warning("Vui lòng chọn loại chuồng");
          return;
        }
        // Cage is selected, move to date selection sub-step
        setCageSelectionStep(1);
        return;
      } else if (cageSelectionStep === 1) {
        // User is in date selection sub-step
        if (!dateRange[0] || !dateRange[1]) {
          message.warning("Vui lòng chọn ngày gửi và nhận hamster");
          return;
        }
        // No need to check for unavailable days since DatePicker prevents selecting them
      }
    }
    if (currentStep === 2) {
      if (!termsAccepted) {
        message.warning("Vui lòng đồng ý với điều khoản dịch vụ");
        return;
      }
      // Create booking and redirect to payment
      handleCreateBooking();
      return;
    }

    // Calculate booking cost when moving to step 3 (confirmation)
    if (currentStep === 1 && cageSelectionStep === 1) {
      calculateBookingCost();
    }

    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep === 1 && cageSelectionStep === 1) {
      // If in date selection sub-step, go back to cage selection
      setCageSelectionStep(0);
      setDateRange([null, null]);
      setAvailability([]);
      return;
    }
    // For other cases, go to previous main step
    if (currentStep === 1) {
      setCageSelectionStep(0); // Reset to cage selection when going back from step 1
      setSelectedCageId(null); // Clear cage selection when going back to step 0
      setDateRange([null, null]);
      setAvailability([]);
    }
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

  // Get selected items
  const selectedHamster = profiles.find((h) => h.id === selectedHamsterId);
  const selectedCage = cageTypes.find((c) => c.id === selectedCageId);
  const selectedServices = additionalServices.filter((s) =>
    selectedServiceIds.includes(s.id)
  );

  // Use API calculated pricing data
  const cageTotal = bookingCostData?.totalCageAmount || 0;
  const servicesTotal = bookingCostData?.totalServicesAmount || 0;
  const holidayTotal = bookingCostData?.totalHolidaySurcharge || 0;
  const membershipDiscount = bookingCostData?.totalMembershipDiscount || 0;
  const finalTotal = bookingCostData?.totalAmount || 0;

  // Ensure all values are numbers and not NaN
  const safeCageTotal = Number.isFinite(cageTotal) ? cageTotal : 0;
  const safeServicesTotal = Number.isFinite(servicesTotal) ? servicesTotal : 0;
  const safeHolidayTotal = Number.isFinite(holidayTotal) ? holidayTotal : 0;
  const safeMembershipDiscount = Number.isFinite(membershipDiscount) ? membershipDiscount : 0;
  const safeFinalTotal = Number.isFinite(finalTotal) ? finalTotal : 0;

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
                  🐹 Chưa có hồ sơ hamster nào. Vui lòng tạo hồ sơ trước{" "}
                  <span
                    style={{
                      textDecoration: "underline",
                      cursor: "pointer",
                      color: "#ff6f61",
                      fontWeight: 600,
                    }}
                    onClick={() => navigate("/profile/your-hamster")}
                  >
                    tại đây
                  </span>
                  .
                </div>
              ) : (
                <Row gutter={[16, 16]}>
                  {profiles.map((hamster) => (
                    <Col xs={24} sm={24} md={12} lg={8} key={hamster.id}>
                      <Card
                        hoverable
                        className={`hamster__card-compact ${
                          selectedHamsterId === hamster.id ? "selected" : ""
                        }`}
                        onClick={() => handleSelectHamster(hamster.id)}
                        style={{
                          border:
                            selectedHamsterId === hamster.id
                              ? "3px solid #ff6f61"
                              : "2px solid #f0f0f0",
                          cursor: "pointer",
                          position: "relative",
                          borderRadius: 12,
                        }}
                        bodyStyle={{ padding: 0 }}
                      >
                        <div style={{ display: "flex", height: "100%" }}>
                          {/* Left Column - Image */}
                          <div style={{ width: 150, flexShrink: 0 }}>
                            <img
                              src={hamster.profilePicture}
                              alt={hamster.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "10px 0 0 10px",
                              }}
                            />
                          </div>

                          {/* Right Column - Information */}
                          <div style={{ flex: 1, padding: 16, minWidth: 0 }}>
                            <h4
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: "#ff6f61",
                                margin: "0 0 8px 0",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {hamster.name}
                            </h4>
                            <div className="hamster__info-compact">
                              <p>
                                <span className="label">Loài:</span>
                                <span className="value">{hamster.species}</span>
                              </p>
                               <p>
                                <span className="label">Ngày sinh:</span>
                                <span className="value">{hamster.dob}</span>
                              </p>
                              <p>
                                <span className="label">Màu:</span>
                                <span className="value">{hamster.color}</span>
                              </p>
                              <p>
                                <span className="label">Giới tính:</span>
                                <span className="value">{hamster.gender === "Male" ? "Đực" : "Cái"}</span>
                              </p>
                              <p>
                                <span className="label">Cân nặng:</span>
                                <span className="value">{hamster.weight}g</span>
                              </p>
                            </div>
                          </div>

                          {/* Selection indicator */}
                          {selectedHamsterId === hamster.id && (
                            <div
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                background: "#ff6f61",
                                color: "white",
                                borderRadius: "50%",
                                width: 24,
                                height: 24,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                fontWeight: "bold",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                              }}
                            >
                              ✓
                            </div>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}

          {/* Step 2: Select Cage Type & Dates */}
          {currentStep === 1 && (
            <div className="step-select-cage-and-dates">
              {cageSelectionStep === 0 ? (
                // Sub-step 1: Select Cage Type
                <div className="cage-selection-substep">
                  <h3 style={{ color: "#ff6f61", marginBottom: 24, fontSize: 20 }}>
                    🏠 Chọn Loại Chuồng
                  </h3>
                  
                  <Alert
                    message="Bước 1: Chọn loại chuồng"
                    description="Vui lòng chọn loại chuồng phù hợp cho hamster của bạn. Sau khi chọn, bạn sẽ có thể xem tình trạng khả dụng và chọn ngày gửi."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />

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

                  {selectedCageId && (
                    <Alert
                      message="Đã chọn loại chuồng"
                      description="Nhấn 'Tiếp theo' để chọn ngày gửi và xem tình trạng khả dụng của chuồng."
                      type="success"
                      showIcon
                      style={{ marginTop: 24 }}
                    />
                  )}
                </div>
              ) : (
                // Sub-step 2: Select Dates with Availability
                <div className="date-selection-substep">
                  <h3 style={{ color: "#ff6f61", marginBottom: 16, fontSize: 20 }}>
                    📅 Chọn Ngày Gửi và Nhận
                  </h3>

                  {/* Show selected cage info */}
                  {selectedCageId && (
                    <Card style={{ marginBottom: 24, background: "#f9f9f9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <HomeOutlined style={{ fontSize: 24, color: "#ff6f61" }} />
                        <div>
                          <h4 style={{ margin: 0, color: "#ff6f61" }}>
                            Đã chọn: {cageTypes.find(c => c.id === selectedCageId)?.typeName}
                          </h4>
                          <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
                            {cageTypes.find(c => c.id === selectedCageId)?.pricePerDay?.toLocaleString("vi-VN")} đ/ngày
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Discount Information */}
                  <Alert
                    message="Giới hạn thời gian gửi thú"
                    description="Bạn chỉ có thể đặt phòng trong vòng 1 tháng tới và thời gian gửi hamster tối đa là 30 ngày."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

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
                    <Spin spinning={loadingAvailability} tip="Đang kiểm tra tình trạng chuồng...">
                      <RangePicker
                        style={{ width: "100%", borderRadius: 8 }}
                        format="DD-MM-YYYY"
                        placeholder={["Ngày gửi", "Ngày nhận"]}
                        onChange={handleDateChange}
                        disabledDate={getDisabledDate}
                      />
                    </Spin>
                    {availability.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                        💡 Các ngày có màu xám không thể chọn do không có chuồng trống hoặc nằm ngoài phạm vi 1 tháng
                      </div>
                    )}
                  </div>

                  {/* Display Total Days and Discount */}
                  {totalDays > 0 && (
                    <Row gutter={16} style={{ marginBottom: 24 }}>
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
                            title="Giảm giá thành viên"
                            value={bookingCostData?.membershipDiscountPercent || 0}
                            suffix="%"
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  )}

                  {/* Availability Information */}
                  {renderAvailabilityInfo()}

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
                                {service.serviceName}
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
                                {service.displayPrice.toLocaleString("vi-VN")} đ/ngày
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
                      {customerProfile ? (
                        <>
                          <p><strong>Họ tên:</strong> {customerProfile.fullName}</p>
                          <p><strong>Email:</strong> {customerProfile.email}</p>
                          <p><strong>Số điện thoại:</strong> {customerProfile.phone}</p>
                          <p><strong>Hạng thành viên:</strong> 
                            <span style={{ 
                              color: customerProfile.rank === 'PLATINUM' ? '#722ed1' : 
                                     customerProfile.rank === 'GOLD' ? '#faad14' :
                                     customerProfile.rank === 'SILVER' ? '#52c41a' : '#1890ff',
                              fontWeight: 600,
                              marginLeft: 8
                            }}>
                              {customerProfile.rank}
                            </span>
                          </p>
                          <p><strong>Điểm tích lũy:</strong> {customerProfile.currentPoint} điểm</p>
                        </>
                      ) : (
                        <p>Đang tải thông tin khách hàng...</p>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    {selectedHamster && (
                      <div className="info-group">
                        <h4 style={{ color: "#ff6f61", marginBottom: 12 }}>Thông tin hamster:</h4>
                        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                          <div style={{ flexShrink: 0 }}>
                            <Image
                              src={selectedHamster.profilePicture}
                              alt={selectedHamster.name}
                              width={120}
                              height={120}
                              style={{ 
                                borderRadius: 12, 
                                objectFit: "cover",
                                border: "2px solid #cabab9ff"
                              }}
                              placeholder={
                                <div style={{
                                  width: 120,
                                  height: 120,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "#f5f5f5",
                                  borderRadius: 12,
                                  color: "#ccc"
                                }}>
                                  🐹
                                </div>
                              }
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p><strong>Tên:</strong> {selectedHamster.name}</p>
                            <p><strong>Loài:</strong> {selectedHamster.species}</p>
                            <p><strong>Giới tính:</strong> {selectedHamster.gender}</p>
                            <p><strong>Cân nặng:</strong> {selectedHamster.weight}g</p>
                            <p><strong>Ngày sinh:</strong> {selectedHamster.dob}</p>
                          </div>
                        </div>
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
                                  • {service.serviceName}
                                </p>
                                <p style={{ fontSize: 13, color: "#666", marginLeft: 12 }}>
                                  {service.displayPrice.toLocaleString("vi-VN")} đ/ngày
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
                    <Spin spinning={loadingCostCalculation} tip="Đang tính toán chi phí...">
                      <div className="price-breakdown">
                        <h4 style={{ color: "#ff6f61", marginBottom: 16 }}>💰 Chi Tiết Giá:</h4>
                        
                        <div className="price-item">
                          <span>Tiền chuồng ({totalDays} ngày):</span>
                          <span>{safeCageTotal.toLocaleString("vi-VN")} đ</span>
                        </div>

                        {selectedServices.length > 0 && (
                          <div className="price-item">
                            <span>Dịch vụ bổ sung ({totalDays} ngày):</span>
                            <span>{safeServicesTotal.toLocaleString("vi-VN")} đ</span>
                          </div>
                        )}

                        {safeHolidayTotal > 0 && (
                          <div className="price-item" style={{ color: "#fa8c16" }}>
                            <span>Phụ thu ngày lễ:</span>
                            <span>{safeHolidayTotal.toLocaleString("vi-VN")} đ</span>
                          </div>
                        )}

                        <Divider style={{ margin: "12px 0" }} />

                        <div className="price-item">
                          <span>Tạm tính:</span>
                          <span style={{ fontWeight: 600 }}>
                            {(safeCageTotal + safeServicesTotal + safeHolidayTotal).toLocaleString("vi-VN")} đ
                          </span>
                        </div>

                        {safeMembershipDiscount > 0 && (
                          <div className="price-item" style={{ color: "#52c41a" }}>
                            <span>
                              Giảm giá thành viên {bookingCostData?.membershipDiscountPercent ? `(${bookingCostData.membershipDiscountPercent}%)` : ''}:
                            </span>
                            <span>-{safeMembershipDiscount.toLocaleString("vi-VN")} đ</span>
                          </div>
                        )}

                        <Divider style={{ margin: "12px 0" }} />

                        <div className="price-item total">
                          <span>Tổng cộng:</span>
                          <span>{safeFinalTotal.toLocaleString("vi-VN")} đ</span>
                        </div>
                      </div>
                    </Spin>
                  </Col>
                </Row>
              </Card>

              {/* Membership Status Alert */}
              {!customerProfile && (
                <Alert
                  message="Đang tải thông tin thành viên"
                  description="Vui lòng đợi trong khi chúng tôi tải thông tin thành viên của bạn..."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              )}

              {customerProfile && (!customerProfile.rank || !customerProfile.currentPoint) && (
                <Alert
                  message="Thông tin thành viên không đầy đủ"
                  description="Thông tin thành viên của bạn chưa đầy đủ. Vui lòng liên hệ hỗ trợ để hoàn tất thông tin trước khi đặt phòng."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              )}

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
            disabled={currentStep === 0 && cageSelectionStep === 0}
            style={{
              marginRight: 12,
              borderRadius: 8,
            }}
          >
            {currentStep === 1 && cageSelectionStep === 1 ? "Chọn lại chuồng" : "Quay lại"}
          </Button>
          <Button
            type="primary"
            onClick={handleNext}
            loading={currentStep === 2 && loading}
            disabled={currentStep === 2 && (!termsAccepted || loading || !customerProfile)}
            style={{
              background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
              border: "none",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            }}
          >
            {currentStep === 2 
              ? (loading ? "Đang xử lý..." : !customerProfile ? "Đang tải thông tin..." : "Xác nhận đặt phòng")
              : currentStep === 1 && cageSelectionStep === 0
              ? "Chọn ngày gửi" 
              : "Tiếp theo"
            }
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