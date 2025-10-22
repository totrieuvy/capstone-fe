// src/pages/customer/grooming/dat-dich-vu-lam-dep/BookingGroomingService.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Steps,
  Button,
  Card,
  Row,
  Col,
  Spin,
  message,
  Calendar,
  Radio,
  Tag,
  Descriptions,
  Image,
  Empty,
  Alert,
  Typography,
} from "antd";
import { UserOutlined, CalendarOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import type { RootState } from "../../../../redux/rootReducer"; //
import { clearSelectedGroomingItem } from "../../../../redux/features/SelectedGroomingItem"; //
import {
  selectHamsterForGrooming, // Import action
  clearSelectedHamsterForGrooming,
} from "../../../../redux/features/selectedHamsterGroomingSlice"; //

import api from "../../../../config/axios"; //
import ProfileHamsterService, { type HamsterProfile } from "../../../../services/ProfileHamsterService"; //
import { getFormattedPrice } from "../../../../utils/formatPrice"; //

import "./BookingGroomingService.scss"; // Giả sử file này tồn tại
import type { AxiosError } from "axios";

const { Title, Text } = Typography;

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");

// --- Interfaces ---
interface Species {
  id: string;
  speciesName: string;
}

interface ApiError {
  message: string;
}
interface GroomingPriceItem {
  id: string;
  serviceType?: string;
  comboName?: string;
  serviceName?: string;
  description: string;
  durationMinutes?: number;
  serviceCount?: number;
  displayPrice: string;
  isActive: boolean;
}
interface TimeSlot {
  startTime: string;
  endTime: string;
  maxSlots: number;
}
interface SlotData {
  slotDate: string;
  slots: TimeSlot[];
}
interface AppointmentItem {
  serviceId: string | null;
  serviceComboId: string | null;
  price: number;
}
interface AppointmentPayload {
  hamsterId: string;
  appointmentDate: string;
  notes?: string;
  totalAmount: number;
  items: AppointmentItem[];
}

// --- Component ---
function BookingGroomingService() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const selectedGroomingItem = useSelector((state: RootState) => state.grooming.selectedItem); //

  const [currentStep, setCurrentStep] = useState(0);
  const [profiles, setProfiles] = useState<HamsterProfile[]>([]);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [selectedHamster, setSelectedHamster] = useState<HamsterProfile | null>(null);
  const [groomingPrice, setGroomingPrice] = useState<string | null>(null);
  const [slotsData, setSlotsData] = useState<SlotData[]>([]); // State to hold API slot data
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(() => {
    const now = dayjs();
    return now.isValid() ? now : dayjs(new Date()); // Fallback
  });

  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const steps = [
    { title: "Chọn Hamster", icon: <UserOutlined /> },
    { title: "Chọn Lịch", icon: <CalendarOutlined /> },
    { title: "Xác Nhận", icon: <CheckCircleOutlined /> },
  ];

  // --- Data Fetching ---
  const fetchSpecies = useCallback(async () => {
    setLoadingSpecies(true);
    try {
      const { data } = await api.get<{ code: number; data: Species[] }>("/api/species");
      if (data.code === 200) {
        setAllSpecies(data.data);
      } else {
        message.error("Không thể tải danh sách loài hamster.");
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách loài hamster.");
      console.error("Error fetching species:", error);
    } finally {
      setLoadingSpecies(false);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const hamsterProfiles = await ProfileHamsterService.getProfiles(); //
      setProfiles(hamsterProfiles);
    } catch (error) {
      message.error("Không thể tải danh sách hamster");
      console.error("Error fetching hamster profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedGroomingItem) {
      message.error("Vui lòng chọn dịch vụ grooming trước.");
      navigate("/dich-vu-lam-dep");
      return;
    }
    document.title = "Đặt lịch Grooming";
    fetchProfiles();
    fetchSpecies();
  }, [selectedGroomingItem, navigate, fetchProfiles, fetchSpecies]);

  // --- Price Fetching ---
  const fetchGroomingPrice = useCallback(
    async (speciesId: string) => {
      if (!selectedGroomingItem) return;
      setLoadingPrice(true);
      setGroomingPrice(null);
      try {
        const apiPath = selectedGroomingItem.type === "service" ? "/api/services/species" : "/api/combo/species"; //
        const response = await api.get<{ code: number; data: GroomingPriceItem[] }>(`${apiPath}/${speciesId}`); //

        if (response.data.code === 200 && response.data.data) {
          const foundItem = response.data.data.find((item) => item.id === selectedGroomingItem.id);
          if (foundItem) {
            setGroomingPrice(foundItem.displayPrice);
          } else {
            message.error(
              `Không tìm thấy giá cho ${selectedGroomingItem.type === "service" ? "dịch vụ" : "combo"} "${
                selectedGroomingItem.name
              }" với loài đã chọn.`
            );
          }
        } else {
          message.error(`Không thể lấy giá ${selectedGroomingItem.type === "service" ? "dịch vụ" : "combo"}.`);
        }
      } catch (error) {
        console.error("Error fetching grooming price:", error);
        message.error(`Lỗi khi lấy giá ${selectedGroomingItem.type === "service" ? "dịch vụ" : "combo"}.`);
      } finally {
        setLoadingPrice(false);
      }
    },
    [selectedGroomingItem]
  );

  // --- Hamster Selection ---
  const handleSelectHamster = useCallback(
    (hamster: HamsterProfile) => {
      setSelectedHamster(hamster);
      dispatch(
        selectHamsterForGrooming({
          //
          id: hamster.id,
          name: hamster.name,
          species: hamster.species,
          profilePicture: hamster.profilePicture,
        })
      );
      setGroomingPrice(null);
      setLoadingPrice(true);
      const hamsterSpeciesName = hamster.species;
      if (!hamsterSpeciesName) {
        message.error("Hồ sơ hamster bị thiếu tên loài (species).");
        setLoadingPrice(false);
        return;
      }
      const foundSpecies = allSpecies.find((s) => s.speciesName.toLowerCase() === hamsterSpeciesName.toLowerCase());
      if (foundSpecies?.id) {
        fetchGroomingPrice(foundSpecies.id);
      } else if (!loadingSpecies) {
        console.error(`Không tìm thấy speciesId cho loài: ${hamsterSpeciesName}`, allSpecies);
        message.error(`Không tìm thấy thông tin ID cho loài "${hamsterSpeciesName}". Không thể lấy giá.`);
        setLoadingPrice(false);
      } else {
        console.warn("Species list not yet loaded, deferring price fetch.");
      }
    },
    [allSpecies, dispatch, fetchGroomingPrice, loadingSpecies]
  );

  // --- Slot Fetching ---
  const fetchSlots = useCallback(async (month: Dayjs) => {
    if (!month || !dayjs.isDayjs(month) || !month.isValid()) {
      console.error("fetchSlots: Invalid month received:", month);
      message.error("Tháng không hợp lệ để tải lịch.");
      setSlotsData([]);
      setLoadingSlots(false);
      return;
    }
    setLoadingSlots(true);
    setSelectedDate(null); // Clear selection when fetching new month data
    setSelectedTimeSlot(null);
    const startDate = month.startOf("month").format("DD-MM-YYYY");
    const endDate = month.endOf("month").format("DD-MM-YYYY");
    console.log(`FETCHING SLOTS: ${startDate} to ${endDate}`); // DEBUG

    try {
      const response = await api.get<{ code: number; data: SlotData[] }>("/api/slot", {
        //
        params: { from: startDate, to: endDate, serviceType: "GROOMING" },
      });
      console.log("API Response Data:", response.data); // DEBUG

      if (response.data.code === 200 && response.data.data) {
        // *** Keep all valid dates from the response for the selected month ***
        const validData = response.data.data.filter((dayData) => {
          const slotDay = dayjs(dayData.slotDate, "DD-MM-YYYY");
          // Only check validity for now, disabledDate handles past dates
          return slotDay.isValid();
        });

        console.log(`FETCH SLOTS SUCCESS: Setting slotsData for ${month.format("MM-YYYY")} with:`, validData); // DEBUG
        setSlotsData(validData); // Update state
      } else {
        message.error("Không thể tải lịch hẹn (API Error).");
        console.error("API Error fetching slots:", response.data); // DEBUG
        setSlotsData([]);
      }
    } catch (error) {
      console.error("EXCEPTION fetching slots:", error); // DEBUG
      message.error("Lỗi mạng khi tải lịch hẹn.");
      setSlotsData([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (currentStep === 1 && calendarMonth && calendarMonth.isValid()) {
      fetchSlots(calendarMonth);
    } else if (currentStep === 1 && (!calendarMonth || !calendarMonth.isValid())) {
      console.error("Attempted to fetch slots with invalid calendarMonth:", calendarMonth);
    }
    // No cleanup needed that clears slotsData here
  }, [currentStep, calendarMonth, fetchSlots]);

  // --- Calendar Rendering ---
  const dateCellRender = useCallback(
    (date: Dayjs): React.ReactNode => {
      // Basic validity checks first
      if (!date || !dayjs.isDayjs(date) || !date.isValid()) {
        return null;
      }
      // Don't render anything for past/today
      if (date.isBefore(dayjs().add(1, "day"), "day")) {
        return <div className="no-slots disabled-day"></div>;
      }

      const dateString = date.format("DD-MM-YYYY");
      // Find data directly in the state *during this render cycle*
      const dayData = slotsData.find((d) => d.slotDate === dateString);

      // Add explicit logging inside render function
      // console.log(`RENDER CELL for ${dateString}, Found data:`, dayData ? 'Yes' : 'No'/*, 'Current slotsData:', slotsData*/); // Reduce noise slightly

      // Show loading specifically in the cell if slots are loading
      // if (loadingSlots) { return <Spin size="small" />; } // Removed - using overlay Spin

      if (!dayData || dayData.slots.length === 0) {
        // If no data found OR slots array is empty, explicitly show "Không có lịch"
        return <div className="no-slots">Không có lịch</div>;
      }

      // --- If data found, Render Radio Buttons ---
      return (
        <Radio.Group
          onChange={(e) => {
            setSelectedDate(date);
            setSelectedTimeSlot(e.target.value);
          }}
          value={selectedDate?.isSame(date, "day") ? selectedTimeSlot : undefined}
          className="slot-radio-group"
          optionType="button"
          buttonStyle="solid"
        >
          {dayData.slots.map((slot) => {
            const isSelected = selectedDate?.isSame(date, "day") && selectedTimeSlot?.startTime === slot.startTime;
            const isFull = slot.maxSlots === 0;
            return (
              <Radio.Button
                key={`${slot.startTime}-${slot.endTime}`}
                value={slot}
                disabled={isFull}
                className={`slot-button ${isFull ? "slot-full" : "slot-available"} ${
                  isSelected ? "slot-selected" : ""
                }`}
              >
                {slot.startTime}
                {!isFull && (
                  <Tag color="success" className="slot-tag">
                    {slot.maxSlots}
                  </Tag>
                )}
                {isFull && (
                  <Tag color="error" className="slot-tag">
                    Hết
                  </Tag>
                )}
              </Radio.Button>
            );
          })}
        </Radio.Group>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slotsData, loadingSlots, selectedDate, selectedTimeSlot]
  ); // Add loadingSlots dependency

  const disabledDate = useCallback((current: Dayjs | null): boolean => {
    // console.log("disabledDate received:", current?.format());
    if (!current || !dayjs.isDayjs(current) || !current.isValid()) {
      return false;
    }
    return current.isBefore(dayjs().add(1, "day"), "day");
  }, []);

  // --- Booking Confirmation ---
  const handleConfirmBooking = useCallback(async () => {
    if (!selectedHamster || !selectedGroomingItem || !selectedDate || !selectedTimeSlot || !groomingPrice) {
      message.error("Thông tin đặt lịch chưa đầy đủ.");
      return;
    }
    setSubmittingBooking(true);
    try {
      const parsedPrice = parseInt(groomingPrice.replace(/[đ,.\s]/g, ""), 10);
      if (isNaN(parsedPrice)) {
        throw new Error("Giá dịch vụ không hợp lệ.");
      }
      // console.log("Selected Date before formatting:", selectedDate?.format());
      if (!selectedDate || !selectedDate.isValid()) {
        throw new Error("Ngày hẹn không hợp lệ.");
      }
      const startTimeString = selectedTimeSlot.startTime;
      const [hours, minutes] = startTimeString.split(":").map(Number);
      const appointmentDateTime = selectedDate.hour(hours).minute(minutes).second(0).millisecond(0);
      const formattedAppointmentDate = appointmentDateTime.toISOString(); // ISO 8601 UTC

      const appointmentItem: AppointmentItem = {
        serviceId: selectedGroomingItem.type === "service" ? selectedGroomingItem.id : null,
        serviceComboId: selectedGroomingItem.type === "combo" ? selectedGroomingItem.id : null,
        price: parsedPrice,
      };
      const payload: AppointmentPayload = {
        hamsterId: selectedHamster.id,
        appointmentDate: formattedAppointmentDate,
        totalAmount: parsedPrice,
        items: [appointmentItem],
      }; //

      console.log("Submitting:", JSON.stringify(payload, null, 2));
      const response = await api.post("/api/appointment", payload); //

      if (response.data.code === 200 || response.status === 200 || response.status === 201) {
        message.success("Đặt lịch grooming thành công!");
        dispatch(clearSelectedGroomingItem());
        dispatch(clearSelectedHamsterForGrooming());
        setSelectedHamster(null);
        setGroomingPrice(null);
        setSelectedDate(null);
        setSelectedTimeSlot(null);
        setCurrentStep(0);
        navigate("/boarding-schedule"); // Chuyển hướng sau khi thành công
      } else {
        throw new Error(response.data.message || "Đặt lịch thất bại.");
      }
    } catch (error: unknown) {
      console.error("Error creating appointment:", error);
      const err = error as AxiosError<ApiError>;
      const apiErrorMessage = err.response?.data?.message || err.message || "Lỗi không xác định";
      message.error(`Đặt lịch thất bại: ${apiErrorMessage}`);
    } finally {
      setSubmittingBooking(false);
    }
  }, [selectedHamster, selectedGroomingItem, selectedDate, selectedTimeSlot, groomingPrice, dispatch, navigate]);

  // --- Navigation ---
  const handleNext = useCallback(() => {
    if (currentStep === 0) {
      if (!selectedHamster) {
        message.warning("Vui lòng chọn hamster.");
        return;
      }
      if (!groomingPrice && loadingPrice) {
        message.warning("Đang tải giá...");
        return;
      }
      if (!groomingPrice && !loadingPrice) {
        message.warning("Không có giá cho loài này.");
        return;
      }
    }
    if (currentStep === 1 && (!selectedDate || !selectedTimeSlot)) {
      message.warning("Vui lòng chọn ngày và giờ hẹn.");
      return;
    }
    setCurrentStep(currentStep + 1);
  }, [currentStep, selectedHamster, groomingPrice, loadingPrice, selectedDate, selectedTimeSlot]);

  const handlePrev = useCallback(() => {
    if (currentStep === 1) {
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      setSlotsData([]);
    } // Clear slots when going back
    setCurrentStep(currentStep - 1);
  }, [currentStep]);

  // --- Render ---
  const isCalendarMonthValid = calendarMonth && calendarMonth.isValid();
  // console.log("Rendering Calendar with month:", calendarMonth?.format(), "Is Valid:", isCalendarMonthValid);

  return (
    <div className="booking-grooming-service">
      <Title level={2} className="page-title">
        Đặt lịch Grooming
      </Title>
      <Steps current={currentStep} items={steps} className="booking-steps" />

      {/* Spin bao phủ toàn bộ nội dung steps */}
      <Spin spinning={loadingProfiles || loadingSpecies || submittingBooking} tip={/* Tip logic */ ""}>
        <div className="steps-content">
          {/* --- Step 1 --- */}
          {currentStep === 0 && (
            <div className="step-content step-select-hamster">
              <Title level={4}>Bước 1: Chọn Hamster</Title>
              {!selectedGroomingItem ? (
                <Alert message="Lỗi" description="Không có dịch vụ nào được chọn." type="error" showIcon />
              ) : (
                <Card title="Dịch vụ/Combo đã chọn" style={{ marginBottom: 20 }}>
                  {" "}
                  {/* */}
                  <Descriptions column={1}>
                    <Descriptions.Item label="Tên">{selectedGroomingItem.name}</Descriptions.Item> {/* */}
                    <Descriptions.Item label="Loại">
                      {selectedGroomingItem.type === "service" ? "Dịch vụ lẻ" : "Combo"}
                    </Descriptions.Item>{" "}
                    {/* */}
                    {selectedGroomingItem.description && (
                      <Descriptions.Item label="Mô tả">{selectedGroomingItem.description}</Descriptions.Item>
                    )}{" "}
                    {/* */}
                    {selectedGroomingItem.durationMinutes && (
                      <Descriptions.Item label="Thời gian">
                        {selectedGroomingItem.durationMinutes} phút
                      </Descriptions.Item>
                    )}{" "}
                    {/* */}
                    <Descriptions.Item label="Giá cho loài đã chọn">
                      {" "}
                      {/* */}
                      <Spin spinning={loadingPrice} size="small">
                        {selectedHamster ? (
                          groomingPrice ? (
                            <Tag color="purple" style={{ fontSize: "1.1em" }}>
                              {getFormattedPrice(groomingPrice)}
                            </Tag>
                          ) : (
                            !loadingPrice && <Text type="danger">Không có giá</Text>
                          )
                        ) : (
                          <Text type="secondary">Chọn hamster để xem giá</Text>
                        )}
                      </Spin>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}
              {profiles.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {profiles.map((hamster) => (
                    <Col xs={24} sm={12} md={8} key={hamster.id}>
                      <Card
                        hoverable
                        className={`hamster-card ${selectedHamster?.id === hamster.id ? "selected" : ""}`}
                        onClick={() => handleSelectHamster(hamster)}
                        cover={
                          <img
                            alt={hamster.name}
                            src={hamster.profilePicture}
                            style={{ height: 150, objectFit: "cover" }}
                            onError={(e) => {
                              e.currentTarget.src = "https://dummyimage.com/150/cccccc/ffffff&text=No+Image";
                            }}
                          />
                        }
                      >
                        <Card.Meta title={hamster.name} description={hamster.species} />
                        {selectedHamster?.id === hamster.id && <div className="selected-checkmark">✓</div>} {/* */}
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                !loadingProfiles && !loadingSpecies && <Empty description="Không tìm thấy hồ sơ hamster nào." />
              )}
            </div>
          )}

          {/* --- Step 2 --- */}
          {currentStep === 1 && (
            <div className="step-content step-select-time">
              <Title level={4}>Bước 2: Chọn Ngày và Giờ Hẹn</Title>
              <Alert
                message="Lịch hẹn chỉ hiển thị các ngày và giờ còn trống từ ngày mai trở đi."
                type="info"
                showIcon
                style={{ marginBottom: 20 }}
              />
              {/* Spin overlay cho Calendar */}
              <Spin spinning={loadingSlots} tip="Đang tải lịch..." style={{ width: "100%" }}>
                {isCalendarMonthValid ? (
                  <Calendar
                    fullscreen={true}
                    dateCellRender={dateCellRender} // Use useCallback version
                    disabledDate={disabledDate} // Use useCallback version
                    value={calendarMonth}
                    onPanelChange={(value) => {
                      if (dayjs.isDayjs(value) && value.isValid()) {
                        setCalendarMonth(value);
                        // Selection is cleared in fetchSlots now
                      } else {
                        console.error("Invalid value from onPanelChange:", value);
                      }
                    }}
                  />
                ) : (
                  <Alert message="Lỗi hiển thị lịch" description="Tháng không hợp lệ." type="error" showIcon />
                )}
              </Spin>
              {selectedDate && selectedTimeSlot && (
                <Alert
                  message={`Đã chọn: ${selectedDate.format("dddd, DD/MM/YYYY")} lúc ${selectedTimeSlot.startTime} - ${
                    selectedTimeSlot.endTime
                  }`}
                  type="success"
                  showIcon
                  style={{ marginTop: 20 }}
                />
              )}
            </div>
          )}

          {/* --- Step 3 --- */}
          {currentStep === 2 &&
            selectedHamster &&
            selectedGroomingItem &&
            selectedDate &&
            selectedTimeSlot &&
            groomingPrice && (
              <div className="step-content step-confirmation">
                <Title level={4}>Bước 3: Xác nhận thông tin</Title>
                <Card>
                  <Descriptions title="Chi tiết đặt lịch" bordered column={1}>
                    <Descriptions.Item label="Hamster">
                      <Image
                        src={selectedHamster.profilePicture}
                        width={50}
                        style={{ borderRadius: "50%", marginRight: 10 }}
                        preview={false}
                        fallback="https://dummyimage.com/50/cccccc/ffffff&text=X"
                      />
                      {selectedHamster.name} ({selectedHamster.species})
                    </Descriptions.Item>
                    <Descriptions.Item label={selectedGroomingItem.type === "service" ? "Dịch vụ" : "Combo"}>
                      {" "}
                      {selectedGroomingItem.name}{" "}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày hẹn">{selectedDate.format("dddd, DD/MM/YYYY")}</Descriptions.Item>
                    <Descriptions.Item label="Giờ hẹn">
                      {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
                    </Descriptions.Item>
                    <Descriptions.Item label="Giá">
                      {" "}
                      <Tag color="purple" style={{ fontSize: "1.2em" }}>
                        {getFormattedPrice(groomingPrice)}
                      </Tag>{" "}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="steps-action">
          {" "}
          {/* */}
          {currentStep > 0 && (
            <Button style={{ margin: "0 8px" }} onClick={handlePrev}>
              {" "}
              Quay lại{" "}
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button
              type="primary"
              onClick={handleNext}
              disabled={currentStep === 0 && (!selectedHamster || loadingPrice || !groomingPrice)}
            >
              {" "}
              Tiếp theo{" "}
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" onClick={handleConfirmBooking} loading={submittingBooking}>
              {" "}
              Xác nhận đặt lịch{" "}
            </Button>
          )}
        </div>
      </Spin>
    </div>
  );
}

export default BookingGroomingService;
