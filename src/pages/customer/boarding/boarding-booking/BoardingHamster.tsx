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
  Modal,
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
import type { CreateBookingRequest, CageTypeAvailability } from "../../../../services/BoardingService";
import { customerService } from "../../../../services/CustomerService";
import type { CustomerProfile, MembershipDetails } from "../../../../services/CustomerService";
import { getServicesByType, ServiceType } from "../../../../services/AdditionService";
import type { Service } from "../../../../services/AdditionService";
import { useNavigate } from "react-router-dom";
import { getFormattedPrice } from "../../../../utils/formatPrice";
import { fetchBookingPolicies, type Policy } from "../../../../services/PoliciyService";
import { toast } from "react-toastify";

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

// Frontend calculated booking cost interface
interface CalculatedBookingCost {
  totalCageAmount: number;
  totalServicesAmount: number;
  totalHolidaySurcharge: number;
  totalMembershipDiscount: number;
  membershipDiscountPercent: number;
  totalAmount: number;
  dailyBreakdowns: DailyBreakdown[];
}

interface DailyBreakdown {
  date: string;
  cagePrice: number;
  servicesPrice: number;
  holidaySurcharge: number;
  membershipDiscount: number;
  dailyTotal: number;
  isHoliday: boolean;
  holidayName: string | null;
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
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  
  // New state for cage selection and availability
  const [availability, setAvailability] = useState<CageTypeAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  
  // New state for booking cost calculation
  const [bookingCostData, setBookingCostData] = useState<CalculatedBookingCost | null>(null);
  const [loadingCostCalculation, setLoadingCostCalculation] = useState(false);
  const [membershipDetails, setMembershipDetails] = useState<MembershipDetails | null>(null);

  // Policy state
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [agreePolicy, setAgreePolicy] = useState(false);

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'WALLET' | 'VNPAY' | 'PAYOS'>('VNPAY');

  // Change date modal state
  const [changeDateModalVisible, setChangeDateModalVisible] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [modalAvailability, setModalAvailability] = useState<CageTypeAvailability[]>([]);
  const [loadingModalAvailability, setLoadingModalAvailability] = useState(false);

  // Change cage modal state
  const [changeCageModalVisible, setChangeCageModalVisible] = useState(false);
  const [tempSelectedCageId, setTempSelectedCageId] = useState<string | null>(null);
  const [cageModalAvailability, setCageModalAvailability] = useState<CageTypeAvailability[]>([]);
  const [loadingCageModalAvailability, setLoadingCageModalAvailability] = useState(false);

  // Change hamster modal state
  const [changeHamsterModalVisible, setChangeHamsterModalVisible] = useState(false);
  const [tempSelectedHamsterId, setTempSelectedHamsterId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Đặt Phòng Hamster";
    fetchProfiles();
    fetchCageTypes();
    fetchAdditionalServices();
    fetchCustomerProfile();
    fetchMembershipDetails();
  }, []);

  // Recalculate costs when in step 3 and services change
  useEffect(() => {
    if (currentStep === 2 && selectedHamsterId && selectedCageId && dateRange[0] && dateRange[1] && membershipDetails) {
      calculateBookingCost();
    }
  }, [selectedServiceIds, currentStep, membershipDetails]);

  // Trigger calculation when membership details are loaded
  useEffect(() => {
    if (membershipDetails && currentStep === 2 && selectedHamsterId && selectedCageId && dateRange[0] && dateRange[1]) {
      calculateBookingCost();
    }
  }, [membershipDetails]);

  // Fetch policies when step 2 (confirmation) is reached
  useEffect(() => {
    if (currentStep === 2) {
      loadPolicies();
    }
  }, [currentStep]);

  const loadPolicies = async () => {
    try {
      const bookingPolicies = await fetchBookingPolicies();
      setPolicies(bookingPolicies);
    } catch (error) {
      message.error("Không thể tải danh sách chính sách!");
      console.error("Error fetching policies:", error);
    }
  };

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
        }))
        .sort((a, b) => a.pricePerDay - b.pricePerDay); // Sort by price lowest to highest
      
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

  const fetchMembershipDetails = async () => {
    try {
      const details = await customerService.getMembershipDetails();
      setMembershipDetails(details);
    } catch (error) {
      console.error("Error fetching membership details:", error);
      message.error("Không thể tải thông tin thành viên");
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
      // Check availability for all cage types when date is selected
      checkAvailabilityForAllCages(dates[0], dates[1]);
    } else {
      setDateRange([null, null]);
      setAvailability([]);
    }
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
    message.success("Đã chọn loại chuồng thành công!");
  };

  // Function to check availability for all cage types based on selected date range
  const checkAvailabilityForAllCages = async (startDate: Dayjs, endDate: Dayjs) => {
    setLoadingAvailability(true);
    try {
      const response = await boardingService.checkAvailability({
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      });
      setAvailability(response);
    } catch (error) {
      console.error("Error checking availability:", error);
      message.error("Không thể kiểm tra tình trạng chuồng. Vui lòng thử lại.");
      setAvailability([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Function to disable unavailable dates in the DatePicker
  const getDisabledDate = (current: Dayjs) => {
    // Disable past dates and today - users must book at least 1 day in advance
    if (current && current <= dayjs().startOf("day")) {
      return true;
    }
    
    // Disable dates beyond 1 month from today
    if (current && current > dayjs().add(1, 'month')) {
      return true;
    }
    
    // For the new flow, we don't disable dates based on availability since user selects dates first
    return false;
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

  // Function to calculate booking cost on frontend
  const calculateBookingCost = async () => {
    if (!selectedHamsterId || !selectedCageId || !dateRange[0] || !dateRange[1] || !membershipDetails) {
      return;
    }

    setLoadingCostCalculation(true);
    try {
      const startDate = dateRange[0];
      const endDate = dateRange[1];
      const selectedCage = cageTypes.find(cage => cage.id === selectedCageId);
      
      if (!selectedCage) {
        throw new Error("Selected cage type not found");
      }

      const dailyBreakdowns: DailyBreakdown[] = [];
      let totalCageAmount = 0;
      let totalServicesAmount = 0;
      let totalHolidaySurcharge = 0;

      // Calculate for each day in the date range (inclusive of both start and end date)
      for (let current = startDate.clone(); current.isBefore(endDate) || current.isSame(endDate); current = current.add(1, 'day')) {
        const dailyCagePrice = selectedCage.pricePerDay;
        
        // Calculate services price for this day
        const dailyServicesPrice = selectedServiceIds.reduce((total, serviceId) => {
          const service = additionalServices.find(s => s.id === serviceId);
          // Remove commas from displayPrice before parsing
          return total + (service ? parseFloat(service.displayPrice.replace(/,/g, "")) : 0);
        }, 0);

        // Check if it's a holiday (simplified - you may need to implement actual holiday checking)
        const isHoliday = false; // You can implement holiday checking logic here
        const holidayName = null;
        const holidaySurcharge = isHoliday ? (dailyCagePrice + dailyServicesPrice) * 0.2 : 0;

        // Calculate membership discount for this day
        const dailySubtotal = dailyCagePrice + dailyServicesPrice + holidaySurcharge;
        const membershipDiscount = dailySubtotal * (membershipDetails.discountPercent / 100);
        const dailyTotal = dailySubtotal - membershipDiscount;

        dailyBreakdowns.push({
          date: current.format("YYYY-MM-DD"),
          cagePrice: dailyCagePrice,
          servicesPrice: dailyServicesPrice,
          holidaySurcharge,
          membershipDiscount,
          dailyTotal,
          isHoliday,
          holidayName
        });

        totalCageAmount += dailyCagePrice;
        totalServicesAmount += dailyServicesPrice;
        totalHolidaySurcharge += holidaySurcharge;
      }

      const subtotal = totalCageAmount + totalServicesAmount + totalHolidaySurcharge;
      const totalMembershipDiscount = subtotal * (membershipDetails.discountPercent / 100);
      const totalAmount = subtotal - totalMembershipDiscount;

      const calculatedCost: CalculatedBookingCost = {
        totalCageAmount,
        totalServicesAmount,
        totalHolidaySurcharge,
        totalMembershipDiscount,
        membershipDiscountPercent: membershipDetails.discountPercent,
        totalAmount,
        dailyBreakdowns
      };

      setBookingCostData(calculatedCost);
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
        paymentMethod: selectedPaymentMethod,
        serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
        notes: "", // Can be expanded to include user notes
        isConfirmed: agreePolicy, // Set to true when policy is agreed to
      };

      message.loading("Đang tạo đặt phòng...", 0);
      const response = await boardingService.createBooking(request);
      message.destroy();
      
      if (selectedPaymentMethod === 'WALLET') {
        toast.success("Đặt phòng và thanh toán thành công!");
        // Small delay to show success message before redirect
        setTimeout(() => {
          navigate('/payment-success');
        }, 1000);
      } else if (response.paymentUrl) {
        toast.success("Đặt phòng thành công! Đang chuyển đến trang thanh toán...");
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
      // Check if user has selected dates
      if (!dateRange[0] || !dateRange[1]) {
        message.warning("Vui lòng chọn ngày gửi và nhận hamster");
        return;
      }
      // Check if user has selected cage type
      if (!selectedCageId) {
        message.warning("Vui lòng chọn loại chuồng");
        return;
      }
      // Calculate booking cost when moving to step 3 (confirmation)
      calculateBookingCost();
    }

    setCurrentStep(currentStep + 1);
  };

  const handleConfirmBooking = async () => {
    if (!agreePolicy && policies.length > 0) {
      message.warning("Vui lòng đồng ý với chính sách đặt phòng");
      return;
    }
    // Create booking and redirect to payment
    await handleCreateBooking();
  };

  const handlePrevious = () => {
    // For other cases, go to previous main step
    if (currentStep === 1) {
      setDateRange([null, null]); // Clear date selection when going back to step 0
      setSelectedCageId(null); // Clear cage selection when going back to step 0
      setAvailability([]);
    }
    setCurrentStep(currentStep - 1);
  };

  // Function to handle opening the change date modal
  const handleOpenChangeDateModal = () => {
    setTempDateRange(dateRange);
    setChangeDateModalVisible(true);
  };

  // Function to handle date change in the modal
  const handleModalDateChange = async (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      // Check if the date range exceeds 1 month
      const daysDifference = dates[1].diff(dates[0], "day");
      if (daysDifference > 30) {
        message.warning("Khoảng thời gian gửi hamster không được quá 30 ngày. Vui lòng chọn lại.");
        return;
      }
      setTempDateRange(dates);
      // Check availability for the currently selected cage type
      await checkModalAvailability(dates[0], dates[1]);
    } else {
      setTempDateRange([null, null]);
      setModalAvailability([]);
    }
  };

  // Function to check availability in modal for the selected cage type
  const checkModalAvailability = async (startDate: Dayjs, endDate: Dayjs) => {
    if (!selectedCageId) return;
    
    setLoadingModalAvailability(true);
    try {
      const response = await boardingService.checkAvailability({
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      });
      setModalAvailability(response);
    } catch (error) {
      console.error("Error checking availability:", error);
      message.error("Không thể kiểm tra tình trạng chuồng. Vui lòng thử lại.");
      setModalAvailability([]);
    } finally {
      setLoadingModalAvailability(false);
    }
  };

  // Function to disable dates in the modal based on cage availability
  const getModalDisabledDate = (current: Dayjs) => {
    // Disable past dates and today - users must book at least 1 day in advance
    if (current && current <= dayjs().startOf("day")) {
      return true;
    }
    
    // Disable dates beyond 1 month from today
    if (current && current > dayjs().add(1, 'month')) {
      return true;
    }
    
    // If we have availability data and a date range is being selected
    if (modalAvailability.length > 0 && selectedCageId && tempDateRange[0]) {
      const selectedCageAvailability = modalAvailability.find(ca => ca.cageTypeId === selectedCageId);
      if (selectedCageAvailability) {
        const currentDateStr = current.format("YYYY-MM-DD");
        const dayAvailability = selectedCageAvailability.dailyAvailability.find(da => da.date === currentDateStr);
        // Disable dates where the selected cage type is not available
        if (dayAvailability && !dayAvailability.isAvailable) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Function to confirm the date change
  const handleConfirmDateChange = async () => {
    if (!tempDateRange[0] || !tempDateRange[1]) {
      message.warning("Vui lòng chọn ngày gửi và nhận hamster");
      return;
    }

    // Check if the selected cage type is available for the new date range
    if (modalAvailability.length > 0 && selectedCageId) {
      const selectedCageAvailability = modalAvailability.find(ca => ca.cageTypeId === selectedCageId);
      if (selectedCageAvailability) {
        const isFullyAvailable = selectedCageAvailability.dailyAvailability.every(day => day.isAvailable);
        if (!isFullyAvailable) {
          message.error("Loại chuồng đã chọn không có sẵn trong khoảng thời gian mới. Vui lòng chọn ngày khác.");
          return;
        }
      }
    }

    // Update the main date range
    setDateRange(tempDateRange);
    
    // Recalculate booking cost with new dates directly (avoid state timing issues)
    if (selectedHamsterId && selectedCageId && membershipDetails) {
      await calculateBookingCostWithDates(tempDateRange[0]!, tempDateRange[1]!);
    }
    
    // Close the modal
    setChangeDateModalVisible(false);
    message.success("Đã cập nhật ngày đặt phòng thành công!");
  };

  // Function to calculate booking cost with specific dates (for modal date change)
  const calculateBookingCostWithDates = async (startDate: Dayjs, endDate: Dayjs) => {
    if (!selectedHamsterId || !selectedCageId || !membershipDetails) {
      return;
    }

    setLoadingCostCalculation(true);
    try {
      const selectedCage = cageTypes.find(cage => cage.id === selectedCageId);
      
      if (!selectedCage) {
        throw new Error("Selected cage type not found");
      }

      const dailyBreakdowns: DailyBreakdown[] = [];
      let totalCageAmount = 0;
      let totalServicesAmount = 0;
      let totalHolidaySurcharge = 0;

      // Calculate for each day in the date range (inclusive of both start and end date)
      for (let current = startDate.clone(); current.isBefore(endDate) || current.isSame(endDate); current = current.add(1, 'day')) {
        const dailyCagePrice = selectedCage.pricePerDay;
        
        // Calculate services price for this day
        const dailyServicesPrice = selectedServiceIds.reduce((total, serviceId) => {
          const service = additionalServices.find(s => s.id === serviceId);
          // Remove commas from displayPrice before parsing
          return total + (service ? parseFloat(service.displayPrice.replace(/,/g, "")) : 0);
        }, 0);

        // Check if it's a holiday (simplified - you may need to implement actual holiday checking)
        const isHoliday = false; // You can implement holiday checking logic here
        const holidayName = null;
        const holidaySurcharge = isHoliday ? (dailyCagePrice + dailyServicesPrice) * 0.2 : 0;

        // Calculate membership discount for this day
        const dailySubtotal = dailyCagePrice + dailyServicesPrice + holidaySurcharge;
        const membershipDiscount = dailySubtotal * (membershipDetails.discountPercent / 100);
        const dailyTotal = dailySubtotal - membershipDiscount;

        dailyBreakdowns.push({
          date: current.format("YYYY-MM-DD"),
          cagePrice: dailyCagePrice,
          servicesPrice: dailyServicesPrice,
          holidaySurcharge,
          membershipDiscount,
          dailyTotal,
          isHoliday,
          holidayName
        });

        totalCageAmount += dailyCagePrice;
        totalServicesAmount += dailyServicesPrice;
        totalHolidaySurcharge += holidaySurcharge;
      }

      const subtotal = totalCageAmount + totalServicesAmount + totalHolidaySurcharge;
      const totalMembershipDiscount = subtotal * (membershipDetails.discountPercent / 100);
      const totalAmount = subtotal - totalMembershipDiscount;

      const calculatedCost: CalculatedBookingCost = {
        totalCageAmount,
        totalServicesAmount,
        totalHolidaySurcharge,
        totalMembershipDiscount,
        membershipDiscountPercent: membershipDetails.discountPercent,
        totalAmount,
        dailyBreakdowns
      };

      setBookingCostData(calculatedCost);
    } catch (error) {
      console.error("Error calculating booking cost:", error);
      message.error("Không thể tính toán chi phí đặt phòng. Vui lòng thử lại.");
    } finally {
      setLoadingCostCalculation(false);
    }
  };

  // Function to cancel the date change
  const handleCancelDateChange = () => {
    setTempDateRange([null, null]);
    setModalAvailability([]);
    setChangeDateModalVisible(false);
  };

  // Function to handle opening the change cage modal
  const handleOpenChangeCageModal = () => {
    setTempSelectedCageId(selectedCageId);
    setChangeCageModalVisible(true);
    // Check availability for all cage types with current date range
    if (dateRange[0] && dateRange[1]) {
      checkCageModalAvailability(dateRange[0], dateRange[1]);
    }
  };

  // Function to check availability for all cage types in cage modal
  const checkCageModalAvailability = async (startDate: Dayjs, endDate: Dayjs) => {
    setLoadingCageModalAvailability(true);
    try {
      const response = await boardingService.checkAvailability({
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      });
      setCageModalAvailability(response);
    } catch (error) {
      console.error("Error checking availability:", error);
      message.error("Không thể kiểm tra tình trạng chuồng. Vui lòng thử lại.");
      setCageModalAvailability([]);
    } finally {
      setLoadingCageModalAvailability(false);
    }
  };

  // Function to handle cage selection in modal
  const handleSelectCageInModal = (cageId: string) => {
    setTempSelectedCageId(cageId);
  };

  // Function to confirm cage change
  const handleConfirmCageChange = async () => {
    if (!tempSelectedCageId) {
      message.warning("Vui lòng chọn loại chuồng");
      return;
    }

    // Check if the selected cage type is available for current date range
    if (cageModalAvailability.length > 0) {
      const selectedCageAvailability = cageModalAvailability.find(ca => ca.cageTypeId === tempSelectedCageId);
      if (selectedCageAvailability) {
        const isFullyAvailable = selectedCageAvailability.dailyAvailability.every(day => day.isAvailable);
        if (!isFullyAvailable) {
          message.error("Loại chuồng đã chọn không có sẵn trong khoảng thời gian hiện tại. Vui lòng chọn loại chuồng khác.");
          return;
        }
      }
    }

    // Update the selected cage
    setSelectedCageId(tempSelectedCageId);
    
    // Recalculate booking cost with new cage type
    if (selectedHamsterId && dateRange[0] && dateRange[1] && membershipDetails) {
      await calculateBookingCostWithCage(tempSelectedCageId);
    }
    
    // Close the modal
    setChangeCageModalVisible(false);
    message.success("Đã cập nhật loại chuồng thành công!");
  };

  // Function to calculate booking cost with specific cage type (for modal cage change)
  const calculateBookingCostWithCage = async (cageId: string) => {
    if (!selectedHamsterId || !dateRange[0] || !dateRange[1] || !membershipDetails) {
      return;
    }

    setLoadingCostCalculation(true);
    try {
      const selectedCage = cageTypes.find(cage => cage.id === cageId);
      
      if (!selectedCage) {
        throw new Error("Selected cage type not found");
      }

      const dailyBreakdowns: DailyBreakdown[] = [];
      let totalCageAmount = 0;
      let totalServicesAmount = 0;
      let totalHolidaySurcharge = 0;

      // Calculate for each day in the date range (inclusive of both start and end date)
      for (let current = dateRange[0].clone(); current.isBefore(dateRange[1]) || current.isSame(dateRange[1]); current = current.add(1, 'day')) {
        const dailyCagePrice = selectedCage.pricePerDay;
        
        // Calculate services price for this day
        const dailyServicesPrice = selectedServiceIds.reduce((total, serviceId) => {
          const service = additionalServices.find(s => s.id === serviceId);
          // Remove commas from displayPrice before parsing
          return total + (service ? parseFloat(service.displayPrice.replace(/,/g, "")) : 0);
        }, 0);

        // Check if it's a holiday (simplified - you may need to implement actual holiday checking)
        const isHoliday = false; // You can implement holiday checking logic here
        const holidayName = null;
        const holidaySurcharge = isHoliday ? (dailyCagePrice + dailyServicesPrice) * 0.2 : 0;

        // Calculate membership discount for this day
        const dailySubtotal = dailyCagePrice + dailyServicesPrice + holidaySurcharge;
        const membershipDiscount = dailySubtotal * (membershipDetails.discountPercent / 100);
        const dailyTotal = dailySubtotal - membershipDiscount;

        dailyBreakdowns.push({
          date: current.format("YYYY-MM-DD"),
          cagePrice: dailyCagePrice,
          servicesPrice: dailyServicesPrice,
          holidaySurcharge,
          membershipDiscount,
          dailyTotal,
          isHoliday,
          holidayName
        });

        totalCageAmount += dailyCagePrice;
        totalServicesAmount += dailyServicesPrice;
        totalHolidaySurcharge += holidaySurcharge;
      }

      const subtotal = totalCageAmount + totalServicesAmount + totalHolidaySurcharge;
      const totalMembershipDiscount = subtotal * (membershipDetails.discountPercent / 100);
      const totalAmount = subtotal - totalMembershipDiscount;

      const calculatedCost: CalculatedBookingCost = {
        totalCageAmount,
        totalServicesAmount,
        totalHolidaySurcharge,
        totalMembershipDiscount,
        membershipDiscountPercent: membershipDetails.discountPercent,
        totalAmount,
        dailyBreakdowns
      };

      setBookingCostData(calculatedCost);
    } catch (error) {
      console.error("Error calculating booking cost:", error);
      message.error("Không thể tính toán chi phí đặt phòng. Vui lòng thử lại.");
    } finally {
      setLoadingCostCalculation(false);
    }
  };

  // Function to cancel cage change
  const handleCancelCageChange = () => {
    setTempSelectedCageId(null);
    setCageModalAvailability([]);
    setChangeCageModalVisible(false);
  };

  // Function to handle opening the change hamster modal
  const handleOpenChangeHamsterModal = () => {
    setTempSelectedHamsterId(selectedHamsterId);
    setChangeHamsterModalVisible(true);
  };

  // Function to handle hamster selection in modal
  const handleSelectHamsterInModal = (hamsterId: string) => {
    setTempSelectedHamsterId(hamsterId);
  };

  // Function to confirm hamster change
  const handleConfirmHamsterChange = () => {
    if (!tempSelectedHamsterId) {
      message.warning("Vui lòng chọn hamster");
      return;
    }

    // Update the selected hamster
    setSelectedHamsterId(tempSelectedHamsterId);
    
    // Close the modal
    setChangeHamsterModalVisible(false);
    message.success("Đã cập nhật hamster thành công!");
  };

  // Function to cancel hamster change
  const handleCancelHamsterChange = () => {
    setTempSelectedHamsterId(null);
    setChangeHamsterModalVisible(false);
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
                                <span className="value">{dayjs(hamster.dob).format('DD/MM/YYYY')}</span>
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

          {/* Step 2: Select Dates & Cage Type */}
          {currentStep === 1 && (
            <div className="step-select-dates-and-cage">
              <h3 style={{ color: "#ff6f61", marginBottom: 24, fontSize: 20 }}>
                📅🏠 Chọn Ngày và Loại Chuồng
              </h3>
              
              {/* Date Selection Section */}
              <Card style={{ marginBottom: 32, borderRadius: 12 }}>
                
                <Alert
                  message="Bạn chỉ có thể đặt trong vòng 1 tháng tới và thời gian gửi hamster tối đa là 30 ngày."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Row gutter={[24, 16]} align="middle">
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#333" }}>
                        Chọn ngày gửi và nhận:
                      </label>
                      <RangePicker
                        style={{ width: "100%", borderRadius: 8 }}
                        format="DD-MM-YYYY"
                        placeholder={["Ngày gửi", "Ngày nhận"]}
                        onChange={handleDateChange}
                        disabledDate={getDisabledDate}
                        value={dateRange}
                        size="large"
                      />
                    </div>
                  </Col>
                  
                  {totalDays > 0 && (
                    <>
                      <Col xs={12} md={6}>
                        <Card style={{ textAlign: "center", borderRadius: 8, background: "#f6ffed" }}>
                          <Statistic
                            title="Tổng số ngày"
                            value={totalDays}
                            suffix="ngày"
                            valueStyle={{ color: "#ff6f61", fontSize: 18 }}
                          />
                        </Card>
                      </Col>
                      <Col xs={12} md={6}>
                        <Card style={{ textAlign: "center", borderRadius: 8, background: "#f6ffed" }}>
                          <Statistic
                            title="Giảm giá thành viên"
                            value={membershipDetails?.discountPercent || 0}
                            suffix="%"
                            valueStyle={{ color: "#52c41a", fontSize: 18 }}
                          />
                        </Card>
                      </Col>
                    </>
                  )}
                </Row>

                {/* <Alert
                  message="Các ngày lễ, Tết sẽ có phụ thu 20% trên giá dịch vụ hàng ngày"
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                /> */}
              </Card>

              {/* Cage Types Selection */}
              <div>
                <h4 style={{ color: "#ff6f61", marginBottom: 16, fontSize: 18 }}>
                  🏠 Chọn Loại Chuồng
                </h4>
                
                {dateRange[0] && dateRange[1] ? (
                  <Alert
                    message={`Hiển thị tình trạng chuồng từ ${dateRange[0].format("DD/MM/YYYY")} đến ${dateRange[1].format("DD/MM/YYYY")}`}
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                ) : (
                  <Alert
                    message="Vui lòng chọn ngày trước để xem tình trạng chuồng"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                )}

                <Spin spinning={loadingAvailability} tip="Đang kiểm tra tình trạng chuồng...">
                  {availability.length > 0 ? (
                    <div>
                      {availability.map((cageAvailability) => {
                        const cageType = cageTypes.find(c => c.id === cageAvailability.cageTypeId);
                        if (!cageType) return null;

                        // Check if this cage type is available for all selected dates
                        const isFullyAvailable = cageAvailability.dailyAvailability.every(day => day.isAvailable);

                        return (
                          <Card
                            key={cageAvailability.cageTypeId}
                            className={`cage__card ${selectedCageId === cageAvailability.cageTypeId ? "selected" : ""} ${!isFullyAvailable ? "disabled" : ""}`}
                            style={{
                              marginBottom: 24,
                              borderRadius: 12,
                              border: selectedCageId === cageAvailability.cageTypeId
                                ? "3px solid #ff6f61"
                                : isFullyAvailable 
                                  ? "1px solid #f0f0f0"
                                  : "1px solid #ffccc7",
                              cursor: isFullyAvailable ? "pointer" : "not-allowed",
                              opacity: isFullyAvailable ? 1 : 0.6,
                              background: !isFullyAvailable ? "#fff2f0" : "white"
                            }}
                            hoverable={isFullyAvailable}
                            onClick={() => isFullyAvailable ? handleCageClick(cageType) : null}
                          >
                            <Row gutter={[24, 16]} align="middle">
                              {/* Cage Image */}
                              <Col xs={24} sm={8} md={6}>
                                <div style={{ textAlign: "center" }}>
                                  {cageType.image ? (
                                    <img
                                      src={cageType.image}
                                      alt={cageAvailability.typeName}
                                      style={{
                                        width: "100%",
                                        maxWidth: 150,
                                        height: 120,
                                        objectFit: "cover",
                                        borderRadius: 8,
                                        border: "1px solid #f0f0f0"
                                      }}
                                    />
                                  ) : (
                                    <div style={{
                                      width: "100%",
                                      maxWidth: 150,
                                      height: 120,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      background: "#f5f5f5",
                                      borderRadius: 8,
                                      border: "1px solid #f0f0f0"
                                    }}>
                                      <HomeOutlined style={{ fontSize: 48, color: "#ccc" }} />
                                    </div>
                                  )}
                                </div>
                              </Col>

                              {/* Cage Info */}
                              <Col xs={24} sm={8} md={10}>
                                <div>
                                  <h4 style={{ 
                                    fontSize: 20, 
                                    fontWeight: 700, 
                                    color: isFullyAvailable ? "#ff6f61" : "#ff7875", 
                                    marginBottom: 8 
                                  }}>
                                    {cageAvailability.typeName}
                                  </h4>
                                  <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                                    {cageType.description}
                                  </p>
                                  <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                                    <strong>Kích thước:</strong> {cageType.size}
                                  </p>
                                  <p style={{ fontSize: 18, fontWeight: 600, color: "#333", margin: 0 }}>
                                    {cageType.pricePerDay.toLocaleString("vi-VN")} đ/ngày
                                  </p>
                                </div>
                              </Col>

                              {/* Availability Status */}
                              <Col xs={24} sm={8} md={8}>
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ 
                                    padding: "16px", 
                                    borderRadius: 8, 
                                    background: isFullyAvailable ? "#f6ffed" : "#fff2f0",
                                    border: isFullyAvailable ? "1px solid #b7eb8f" : "1px solid #ffccc7",
                                  }}>
                                    <p style={{ 
                                      margin: 0, 
                                      fontSize: 16, 
                                      color: isFullyAvailable ? "#52c41a" : "#ff4d4f", 
                                      fontWeight: 600 
                                    }}>
                                      {isFullyAvailable ? "✅ Có sẵn" : "❌ Không có sẵn"}
                                    </p>
                                    <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#666" }}>
                                      {isFullyAvailable ? "Sẵn sàng cho thời gian đã chọn" : "Không đủ chuồng cho khoảng thời gian này"}
                                    </p>
                                  </div>
                                </div>
                              </Col>
                            </Row>

                            {selectedCageId === cageAvailability.cageTypeId && (
                              <div style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                background: "#ff6f61",
                                color: "white",
                                borderRadius: "50%",
                                width: 32,
                                height: 32,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 16,
                                fontWeight: "bold",
                                boxShadow: "0 2px 8px rgba(255, 111, 97, 0.4)",
                              }}>
                                ✓
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  ) : dateRange[0] && dateRange[1] ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
                      <HomeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <p style={{ fontSize: 16 }}>Đang kiểm tra tình trạng chuồng...</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
                      <CalendarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <p style={{ fontSize: 16 }}>Vui lòng chọn ngày trước để xem các loại chuồng có sẵn</p>
                    </div>
                  )}
                </Spin>
              </div>

              {/* Additional Services Section */}
              {selectedCageId && (
                <Card style={{ marginTop: 32, borderRadius: 12 }}>
                  <h4 style={{ color: "#ff6f61", marginBottom: 16, fontSize: 18 }}>
                    ✨ Dịch Vụ Bổ Sung (Tùy chọn)
                  </h4>
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
                              {getFormattedPrice(service.displayPrice)}/ngày
                            </p>
                          </div>
                          {selectedServiceIds.includes(service.id) && (
                            <div className="selected-checkmark">✓</div>
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 2 && (
            <div className="step-confirmation">
              <h3 style={{ color: "#ff6f61", marginBottom: 24, fontSize: 20 }}>
                ✅ Xác Nhận Đặt Phòng
              </h3>

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

              <Row gutter={[32, 24]}>
                {/* Left Column - Customer & Hamster Info + Terms */}
                <Col xs={24} lg={12}>
                  {/* Customer Info */}
                  <Card
                    title={
                      <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
                        👤 Thông Tin Khách Hàng
                      </span>
                    }
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  >
                    <div className="info-group">
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
                  </Card>

                  {/* Hamster Info */}
                  {selectedHamster && (
                    <Card
                      title={
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
                            🐹 Thông Tin Hamster
                          </span>
                          <Button
                            type="link"
                            onClick={handleOpenChangeHamsterModal}
                            style={{ 
                              color: "#ff6f61", 
                              fontWeight: 600,
                              padding: "4px 8px",
                              height: "auto"
                            }}
                          >
                            Thay đổi
                          </Button>
                        </div>
                      }
                      style={{ marginBottom: 24, borderRadius: 12 }}
                    >
                      <div className="info-group">
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
                    </Card>
                  )}

                  {/* Terms of Service and Confirm Button */}
                  <Card
                    style={{
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%)",
                    }}
                  >
                    <div className="terms-section">
                      {/* Payment Method Selection */}
                      <div style={{ marginBottom: 24 }}>
                        <h4 style={{ color: "#ff6f61", marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
                          💳 Chọn phương thức thanh toán
                        </h4>
                        <Row gutter={[12, 12]}>
                          <Col xs={24} sm={8}>
                            <Card
                              hoverable
                              className={`payment-method-card ${selectedPaymentMethod === 'WALLET' ? 'selected' : ''}`}
                              onClick={() => setSelectedPaymentMethod('WALLET')}
                              style={{
                                borderRadius: 12,
                                border: selectedPaymentMethod === 'WALLET'
                                  ? "2px solid #ff6f61"
                                  : "1px solid #f0f0f0",
                                cursor: "pointer",
                                textAlign: "center",
                                height: 100,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                position: "relative",
                              }}
                              bodyStyle={{ padding: 12 }}
                            >
                              <div style={{
                                width: 40,
                                height: 40,
                                background: "#f0f0f0",
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 8,
                                fontSize: 20
                              }}>
                                👛
                              </div>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#333" }}>
                                Ví ảo
                              </p>
                              {selectedPaymentMethod === 'WALLET' && (
                                <div style={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  background: "#ff6f61",
                                  color: "white",
                                  borderRadius: "50%",
                                  width: 20,
                                  height: 20,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: "bold"
                                }}>
                                  ✓
                                </div>
                              )}
                            </Card>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Card
                              hoverable
                              className={`payment-method-card ${selectedPaymentMethod === 'VNPAY' ? 'selected' : ''}`}
                              onClick={() => setSelectedPaymentMethod('VNPAY')}
                              style={{
                                borderRadius: 12,
                                border: selectedPaymentMethod === 'VNPAY'
                                  ? "2px solid #ff6f61"
                                  : "1px solid #f0f0f0",
                                cursor: "pointer",
                                textAlign: "center",
                                height: 100,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                position: "relative",
                              }}
                              bodyStyle={{ padding: 12 }}
                            >
                              <div style={{
                                width: 40,
                                height: 40,
                                background: "#f0f0f0",
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 8,
                                fontSize: 20
                              }}>
                                🏦
                              </div>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#333" }}>
                                VNPay
                              </p>
                              {selectedPaymentMethod === 'VNPAY' && (
                                <div style={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  background: "#ff6f61",
                                  color: "white",
                                  borderRadius: "50%",
                                  width: 20,
                                  height: 20,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: "bold"
                                }}>
                                  ✓
                                </div>
                              )}
                            </Card>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Card
                              hoverable
                              className={`payment-method-card ${selectedPaymentMethod === 'PAYOS' ? 'selected' : ''}`}
                              onClick={() => setSelectedPaymentMethod('PAYOS')}
                              style={{
                                borderRadius: 12,
                                border: selectedPaymentMethod === 'PAYOS'
                                  ? "2px solid #ff6f61"
                                  : "1px solid #f0f0f0",
                                cursor: "pointer",
                                textAlign: "center",
                                height: 100,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                position: "relative",
                              }}
                              bodyStyle={{ padding: 12 }}
                            >
                              <div style={{
                                width: 40,
                                height: 40,
                                background: "#f0f0f0",
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 8,
                                fontSize: 20
                              }}>
                                💳
                              </div>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#333" }}>
                                PayOS
                              </p>
                              {selectedPaymentMethod === 'PAYOS' && (
                                <div style={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  background: "#ff6f61",
                                  color: "white",
                                  borderRadius: "50%",
                                  width: 20,
                                  height: 20,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: "bold"
                                }}>
                                  ✓
                                </div>
                              )}
                            </Card>
                          </Col>
                        </Row>
                      </div>

                      {/* Policy Section */}
                      {policies.length > 0 && (
                        <>
                          <div style={{ marginBottom: 20 }}>
                            <h4 style={{ color: "#ff6f61", marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
                              📋 Chính sách đặt phòng
                            </h4>
                            <div style={{ 
                              maxHeight: "200px", 
                              overflowY: "auto", 
                              border: "1px solid #d9d9d9", 
                              borderRadius: 8, 
                              padding: 16,
                              backgroundColor: "white",
                              marginBottom: 16
                            }}>
                              {policies.map((policy, index) => (
                                <div key={policy.id} style={{ marginBottom: index < policies.length - 1 ? 16 : 0 }}>
                                  <h5 style={{ color: "#ff6f61", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                                    {policy.policyName}
                                  </h5>
                                  <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5, margin: 0 }}>
                                    {policy.description}
                                  </p>
                                  {index < policies.length - 1 && <Divider style={{ margin: "12px 0" }} />}
                                </div>
                              ))}
                            </div>
                            <Checkbox
                              checked={agreePolicy}
                              onChange={(e) => setAgreePolicy(e.target.checked)}
                              style={{ fontSize: 14 }}
                            >
                              <span style={{ color: "#333", fontWeight: 500 }}>
                                Tôi đã đọc và đồng ý với các chính sách đặt phòng trên
                              </span>
                            </Checkbox>
                          </div>
                        </>
                      )}

                      <Row gutter={12}>
                        <Col span={8}>
                          <Button
                            size="large"
                            onClick={handlePrevious}
                            style={{
                              borderRadius: 8,
                              height: 48,
                              fontSize: 16,
                              fontWeight: 600,
                              width: "100%",
                            }}
                          >
                            Quay lại
                          </Button>
                        </Col>
                        <Col span={16}>
                          <Button
                            type="primary"
                            size="large"
                            onClick={handleConfirmBooking}
                            loading={loading}
                            disabled={loading || !customerProfile || (policies.length > 0 && !agreePolicy)}
                            style={{
                              background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
                              border: "none",
                              borderRadius: 8,
                              height: 48,
                              fontSize: 16,
                              fontWeight: 600,
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                              width: "100%",
                            }}
                          >
                            {loading ? "Đang xử lý..." : !customerProfile ? "Đang tải thông tin..." : "Xác nhận đặt phòng"}
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                </Col>

                {/* Right Column - Service & Price Info */}
                <Col xs={24} lg={12}>
                  {/* Service Info */}
                  <Card
                    title={
                      <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
                        📋 Thông Tin Dịch Vụ
                      </span>
                    }
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  >
                    <div className="service-details">
                      {/* Booking Dates */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <h4 style={{ color: "#ff6f61", margin: 0 }}>📅 Thời gian:</h4>
                          <Button
                            type="link"
                            onClick={handleOpenChangeDateModal}
                            style={{ 
                              color: "#ff6f61", 
                              fontWeight: 600,
                              padding: "4px 8px",
                              height: "auto"
                            }}
                          >
                            Thay đổi
                          </Button>
                        </div>
                        <p style={{ marginBottom: 4 }}>
                          <strong>Ngày gửi:</strong> {dateRange[0]?.format("DD-MM-YYYY")}
                        </p>
                        <p style={{ marginBottom: 4 }}>
                          <strong>Ngày nhận:</strong> {dateRange[1]?.format("DD-MM-YYYY")}
                        </p>
                        <p>
                          <strong>Tổng số ngày:</strong> {totalDays} ngày
                        </p>
                      </div>

                      <Divider style={{ margin: "16px 0" }} />

                      {/* Cage Type with Image */}
                      {selectedCage && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <h4 style={{ color: "#ff6f61", margin: 0 }}>🏠 Loại chuồng:</h4>
                            <Button
                              type="link"
                              onClick={handleOpenChangeCageModal}
                              style={{ 
                                color: "#ff6f61", 
                                fontWeight: 600,
                                padding: "4px 8px",
                                height: "auto"
                              }}
                            >
                              Thay đổi
                            </Button>
                          </div>
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
                            <h4 style={{ color: "#ff6f61", marginBottom: 12 }}>✨ Dịch vụ bổ sung:</h4>
                            {selectedServices.map((service) => (
                              <div key={service.id} style={{ marginBottom: 12 }}>
                                <p style={{ fontWeight: 600, marginBottom: 2 }}>
                                  • {service.serviceName}
                                </p>
                                <p style={{ fontSize: 13, color: "#666", marginLeft: 12 }}>
                                  {getFormattedPrice(service.displayPrice)}/ngày
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>

                  {/* Price Breakdown */}
                  <Card
                    title={
                      <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
                        💰 Chi Tiết Thanh Toán
                      </span>
                    }
                    style={{ borderRadius: 12 }}
                  >
                    <Spin spinning={loadingCostCalculation} tip="Đang tính toán chi phí...">
                      <div className="price-breakdown">
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
                              Giảm giá thành viên {membershipDetails?.discountPercent ? `(${membershipDetails.discountPercent}%)` : ''}:
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
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </div>

        {currentStep !== 2 && (
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
                background: (currentStep === 0 && !selectedHamsterId) || 
                          (currentStep === 1 && (!dateRange[0] || !dateRange[1] || !selectedCageId))
                  ? "#d9d9d9" 
                  : "linear-gradient(45deg, #ff6f61, #ffcc5c)",
                border: "none",
                borderRadius: 8,
                boxShadow: (currentStep === 0 && !selectedHamsterId) || 
                          (currentStep === 1 && (!dateRange[0] || !dateRange[1] || !selectedCageId))
                  ? "none" 
                  : "0 4px 12px rgba(0, 0, 0, 0.2)",
                color: (currentStep === 0 && !selectedHamsterId) || 
                      (currentStep === 1 && (!dateRange[0] || !dateRange[1] || !selectedCageId))
                  ? "#999" 
                  : "white",
              }}
            >
              Tiếp theo
            </Button>
          </div>
        )}
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

      {/* Change Date Modal */}
      <Modal
        title={
          <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
            📅 Thay đổi ngày đặt phòng
          </span>
        }
        open={changeDateModalVisible}
        onCancel={handleCancelDateChange}
        footer={[
          <Button key="cancel" onClick={handleCancelDateChange}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmDateChange}
            disabled={!tempDateRange[0] || !tempDateRange[1] || loadingModalAvailability}
            style={{
              background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
              border: "none",
            }}
          >
            Xác nhận
          </Button>,
        ]}
        width={600}
      >
        <div style={{ padding: "16px 0" }}>
          {/* <Alert
            message="Chỉ có thể chọn ngày có sẵn cho loại chuồng đã chọn"
            description={selectedCage ? `Loại chuồng: ${selectedCage.typeName}` : ""}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          /> */}
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#333" }}>
              Chọn ngày gửi và nhận mới:
            </label>
            <RangePicker
              style={{ width: "100%", borderRadius: 8 }}
              format="DD-MM-YYYY"
              placeholder={["Ngày gửi", "Ngày nhận"]}
              onChange={handleModalDateChange}
              disabledDate={getModalDisabledDate}
              value={tempDateRange}
              size="large"
            />
          </div>

          {tempDateRange[0] && tempDateRange[1] && (
            <div style={{ 
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: 8,
              padding: 16,
              marginTop: 16
            }}>
              <h4 style={{ color: "#52c41a", margin: "0 0 8px 0" }}>📊 Thông tin mới:</h4>
              <p style={{ margin: "4px 0" }}>
                <strong>Ngày gửi:</strong> {tempDateRange[0].format("DD-MM-YYYY")}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Ngày nhận:</strong> {tempDateRange[1].format("DD-MM-YYYY")}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Tổng số ngày:</strong> {tempDateRange[1].diff(tempDateRange[0], "day") + 1} ngày
              </p>
              
              {loadingModalAvailability && (
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <Spin size="small" /> <span style={{ marginLeft: 8, color: "#666" }}>Đang kiểm tra tình trạng...</span>
                </div>
              )}
              
              {modalAvailability.length > 0 && selectedCageId && (
                <div style={{ marginTop: 12 }}>
                  {(() => {
                    const selectedCageAvailability = modalAvailability.find(ca => ca.cageTypeId === selectedCageId);
                    if (selectedCageAvailability) {
                      const isFullyAvailable = selectedCageAvailability.dailyAvailability.every(day => day.isAvailable);
                      return (
                        <p style={{ 
                          margin: "4px 0", 
                          color: isFullyAvailable ? "#52c41a" : "#ff4d4f",
                          fontWeight: 600
                        }}>
                          <strong>Tình trạng:</strong> {isFullyAvailable ? "✅ Có sẵn" : "❌ Không có sẵn"}
                        </p>
                      );
                    }
                    return null;
                  })()} 
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Change Cage Modal */}
      <Modal
        title={
          <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
            🏠 Thay đổi loại chuồng
          </span>
        }
        open={changeCageModalVisible}
        onCancel={handleCancelCageChange}
        footer={[
          <Button key="cancel" onClick={handleCancelCageChange}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmCageChange}
            disabled={!tempSelectedCageId || loadingCageModalAvailability}
            style={{
              background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
              border: "none",
            }}
          >
            Xác nhận
          </Button>,
        ]}
        width={1000}
      >
        <div style={{ padding: "16px 0" }}>
          <Alert
            message={ dateRange[0] && dateRange[1] ? `Hiển thị các loại chường có sẵn từ ${dateRange[0].format("DD/MM/YYYY")} đến ${dateRange[1].format("DD/MM/YYYY")}` : ""}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Spin spinning={loadingCageModalAvailability} tip="Đang kiểm tra tình trạng chuồng...">
            {cageModalAvailability.length > 0 ? (
              <Row gutter={[16, 16]}>
                {cageModalAvailability.map((cageAvailability) => {
                  const cageType = cageTypes.find(c => c.id === cageAvailability.cageTypeId);
                  if (!cageType) return null;

                  // Check if this cage type is available for all selected dates
                  const isFullyAvailable = cageAvailability.dailyAvailability.every(day => day.isAvailable);
                  
                  // Don't show unavailable cages in the modal
                  if (!isFullyAvailable) return null;

                  return (
                    <Col xs={24} sm={12} key={cageAvailability.cageTypeId}>
                      <Card
                        className={`cage__card ${tempSelectedCageId === cageAvailability.cageTypeId ? "selected" : ""}`}
                        style={{
                          marginBottom: 16,
                          borderRadius: 12,
                          border: tempSelectedCageId === cageAvailability.cageTypeId
                            ? "3px solid #ff6f61"
                            : "1px solid #f0f0f0",
                          cursor: "pointer",
                          position: "relative",
                          height: "100%"
                        }}
                        hoverable
                        onClick={() => handleSelectCageInModal(cageAvailability.cageTypeId)}
                      >
                        <Row gutter={[12, 12]} align="middle">
                          {/* Cage Image */}
                          <Col xs={24} sm={10}>
                            <div style={{ textAlign: "center" }}>
                              {cageType.image ? (
                                <img
                                  src={cageType.image}
                                  alt={cageAvailability.typeName}
                                  style={{
                                    width: "100%",
                                    maxWidth: 100,
                                    height: 80,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    border: "1px solid #f0f0f0"
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: "100%",
                                  maxWidth: 100,
                                  height: 80,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "#f5f5f5",
                                  borderRadius: 8,
                                  border: "1px solid #f0f0f0"
                                }}>
                                  <HomeOutlined style={{ fontSize: 24, color: "#ccc" }} />
                                </div>
                              )}
                            </div>
                          </Col>

                          {/* Cage Info */}
                          <Col xs={24} sm={14}>
                            <div>
                              <h4 style={{ 
                                fontSize: 16, 
                                fontWeight: 700, 
                                color: "#ff6f61", 
                                marginBottom: 6 
                              }}>
                                {cageAvailability.typeName}
                              </h4>
                              <p style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                                {cageType.description}
                              </p>
                              <p style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                                <strong>Kích thước:</strong> {cageType.size}
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: "4px 0" }}>
                                {cageType.pricePerDay.toLocaleString("vi-VN")} đ/ngày
                              </p>
                              
                              {/* Availability status */}
                              <div style={{ 
                                marginTop: 6,
                                padding: "2px 6px",
                                background: "#f6ffed",
                                border: "1px solid #b7eb8f",
                                borderRadius: 4,
                                display: "inline-block"
                              }}>
                                <span style={{ 
                                  fontSize: 11, 
                                  color: "#52c41a", 
                                  fontWeight: 600 
                                }}>
                                  ✅ Có sẵn
                                </span>
                              </div>
                            </div>
                          </Col>
                        </Row>

                        {tempSelectedCageId === cageAvailability.cageTypeId && (
                          <div style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "#ff6f61",
                            color: "white",
                            borderRadius: "50%",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: "bold",
                            boxShadow: "0 2px 4px rgba(255, 111, 97, 0.4)",
                          }}>
                            ✓
                          </div>
                        )}
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                <HomeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p style={{ fontSize: 16 }}>Đang tải danh sách loại chuồng...</p>
              </div>
            )}
          </Spin>
        </div>
      </Modal>

      {/* Change Hamster Modal */}
      <Modal
        title={
          <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
            🐹 Thay đổi hamster
          </span>
        }
        open={changeHamsterModalVisible}
        onCancel={handleCancelHamsterChange}
        footer={[
          <Button key="cancel" onClick={handleCancelHamsterChange}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmHamsterChange}
            disabled={!tempSelectedHamsterId}
            style={{
              background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
              border: "none",
            }}
          >
            Xác nhận
          </Button>,
        ]}
        width={1100}
      >
        <div style={{ padding: "16px 0" }}>    
          <Row gutter={[16, 16]}>
            {profiles.map((hamster) => (
              <Col xs={24} sm={12} md={8} key={hamster.id}>
                <Card
                  hoverable
                  className={`hamster__card-compact ${
                    tempSelectedHamsterId === hamster.id ? "selected" : ""
                  }`}
                  onClick={() => handleSelectHamsterInModal(hamster.id)}
                  style={{
                    border:
                      tempSelectedHamsterId === hamster.id
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
                    <div style={{ width: 120, flexShrink: 0 }}>
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
                    <div style={{ flex: 1, padding: 12, minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#ff6f61",
                          margin: "0 0 6px 0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {hamster.name}
                      </h4>
                      <div className="hamster__info-compact">
                        <p style={{ fontSize: 12, margin: "2px 0" }}>
                          <span className="label">Loài:</span>
                          <span className="value">{hamster.species}</span>
                        </p>
                        <p style={{ fontSize: 12, margin: "2px 0" }}>
                          <span className="label">Màu:</span>
                          <span className="value">{hamster.color}</span>
                        </p>
                        <p style={{ fontSize: 12, margin: "2px 0" }}>
                          <span className="label">Giới tính:</span>
                          <span className="value">{hamster.gender === "Male" ? "Đực" : "Cái"}</span>
                        </p>
                        <p style={{ fontSize: 12, margin: "2px 0" }}>
                          <span className="label">Cân nặng:</span>
                          <span className="value">{hamster.weight}g</span>
                        </p>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {tempSelectedHamsterId === hamster.id && (
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
                          fontSize: 12,
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
        </div>
      </Modal>
    </div>
  );
}

export default BoardingHamster;