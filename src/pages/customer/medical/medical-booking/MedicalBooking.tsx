import { useState, useEffect, useCallback } from "react";
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
  Tag,
  Descriptions,
  Image,
  Empty,
  Typography,
  Input,
  Tabs,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import type { RootState } from "../../../../redux/rootReducer";
import { selectHamsterForMedical } from "../../../../redux/features/selectedHamsterMedicalSlice";
import ProfileHamsterService, { type HamsterProfile } from "../../../../services/ProfileHamsterService";
import { getFormattedPrice } from "../../../../utils/formatPrice";
import "./MedicalBooking.scss";
import type { AxiosError } from "axios";

import { Checkbox, Divider } from "antd";
import api from "../../../../config/axios";

import {
  getSpecies,
  getMembership,
  getMedicalServicePriceBySpecies,
  getSlots,
  getSlotsByPersonId,
  createAppointment,
  type Species,
  type Staff,
  type TimeSlot,
  type SlotData,
  type Membership,
  type CreateAppointmentRequest,
} from "../../../../services/MedicalService";

const { Title } = Typography;
const { TextArea } = Input;

dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);
dayjs.locale("vi");

interface Policy {
  id: string;
  policyName: string;
  description: string;
  applicableServices: string;
  status: string;
}

function MedicalBooking() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedMedicalItem = useSelector((state: RootState) => state.medical?.selectedItem);

  const [currentStep, setCurrentStep] = useState(0);
  const [profiles, setProfiles] = useState<HamsterProfile[]>([]);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [selectedHamster, setSelectedHamster] = useState<HamsterProfile | null>(null);
  const [medicalPrice, setMedicalPrice] = useState<number | null>(null);
  const [slotsData, setSlotsData] = useState<SlotData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; slot: TimeSlot } | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [membership, setMembership] = useState<Membership | null>(null);
  const [currentWeek, setCurrentWeek] = useState(dayjs());

  // New state for tab functionality
  const [activeTab, setActiveTab] = useState<string>("time");
  const [availableStaffs, setAvailableStaffs] = useState<Staff[]>([]);
  const [selectedVeterinarian, setSelectedVeterinarian] = useState<Staff | null>(null);
  const [veterinarianSlots, setVeterinarianSlots] = useState<SlotData[]>([]);

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [agreePolicy, setAgreePolicy] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await api.get<{ code: number; data: Policy[] }>("/api/policy");
      if (res.data.code === 200) {
        const medicalPolicies = res.data.data.filter(
          (p) => p.applicableServices === "MEDICAL" && p.status === "ACTIVE"
        );
        setPolicies(medicalPolicies);
      } else {
        message.error("Không thể tải danh sách chính sách!");
      }
    } catch {
      message.error("Lỗi khi tải chính sách!");
    }
  }, []);

  useEffect(() => {
    if (currentStep === 2) {
      fetchPolicies();
    }
  }, [currentStep, fetchPolicies]);

  const steps = [
    { title: "Chọn Hamster", icon: <UserOutlined /> },
    { title: "Chọn Slot", icon: <CalendarOutlined /> },
    { title: "Xác Nhận", icon: <CheckCircleOutlined /> },
  ];

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const hamsterProfiles = await ProfileHamsterService.getProfiles();
      setProfiles(hamsterProfiles);
    } catch (error) {
      message.error("Không thể tải danh sách hamster" + error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSpecies = useCallback(async () => {
    try {
      const response = await getSpecies();
      if (response.code === 200) setAllSpecies(response.data);
    } catch (error) {
      message.error("Không thể tải danh sách loài" + error);
    }
  }, []);

  const fetchMembership = useCallback(async () => {
    try {
      const response = await getMembership();
      if (response.code === 200) setMembership(response.data);
    } catch {
      setMembership(null);
    }
  }, []);

  useEffect(() => {
    if (!selectedMedicalItem) {
      message.error("Vui lòng chọn dịch vụ y tế trước.");
      navigate("/dich-vu-y-te");
      return;
    }
    document.title = "Đặt lịch Y tế";
    fetchProfiles();
    fetchSpecies();
    fetchMembership();
  }, [selectedMedicalItem, navigate, fetchProfiles, fetchSpecies, fetchMembership]);

  const fetchMedicalPrice = useCallback(
    async (speciesId: string) => {
      if (!selectedMedicalItem) return;
      try {
        const response = await getMedicalServicePriceBySpecies(speciesId);
        if (response.code === 200) {
          const foundItem = response.data.find((item) => item.id === selectedMedicalItem.id);
          if (foundItem) {
            // Remove commas from displayPrice before parsing
            const parsedPrice = parseFloat(foundItem.displayPrice.replace(/,/g, ""));
            setMedicalPrice(isNaN(parsedPrice) ? 0 : parsedPrice);
          }
        }
      } catch (error) {
        message.error("Không thể tải giá dịch vụ" + error);
      }
    },
    [selectedMedicalItem]
  );

  const handleSelectHamster = (hamster: HamsterProfile) => {
    setSelectedHamster(hamster);
    dispatch(
      selectHamsterForMedical({
        id: hamster.id,
        name: hamster.name,
        species: hamster.species,
        profilePicture: hamster.profilePicture,
      })
    );
    const foundSpecies = allSpecies.find((s) => s.speciesName.toLowerCase() === hamster.species.toLowerCase());
    if (foundSpecies?.id) fetchMedicalPrice(foundSpecies.id);
  };

  const getWeekRange = (week: Dayjs) => {
    const start = week.startOf("isoWeek");
    const end = week.endOf("isoWeek");
    return { start, end };
  };

  const fetchSlots = useCallback(async (week: Dayjs) => {
    setLoading(true);
    try {
      const { start, end } = getWeekRange(week);
      const startDate = start.format("DD-MM-YYYY");
      const endDate = end.format("DD-MM-YYYY");
      const response = await getSlots(startDate, endDate);
      if (response.code === 200) setSlotsData(response.data);
      else setSlotsData([]);
    } catch (error) {
      message.error("Không thể tải lịch khám" + error);
      setSlotsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all available veterinarians from all slots
  const fetchAvailableStaffs = useCallback(async () => {
    try {
      const { start, end } = getWeekRange(currentWeek);
      const startDate = start.format("DD-MM-YYYY");
      const endDate = end.format("DD-MM-YYYY");
      const response = await getSlots(startDate, endDate);
      if (response.code === 200) {
        // Extract unique staff members from all slots
        const uniqueStaffs = new Map<string, Staff>();
        response.data.forEach((slotData) => {
          slotData.slots.forEach((slot) => {
            slot.staffs.forEach((staff) => {
              uniqueStaffs.set(staff.id, staff);
            });
          });
        });
        setAvailableStaffs(Array.from(uniqueStaffs.values()));
      }
    } catch (error) {
      message.error("Không thể tải danh sách bác sĩ" + error);
    }
  }, [currentWeek]);

  // Fetch slots for a specific veterinarian
  const fetchVeterinarianSlots = useCallback(async (veterinarianId: string, week: Dayjs) => {
    setLoading(true);
    try {
      const { start, end } = getWeekRange(week);
      const startDate = start.format("DD-MM-YYYY");
      const endDate = end.format("DD-MM-YYYY");
      const response = await getSlotsByPersonId(veterinarianId, startDate, endDate, "MEDICAL");
      if (response.code === 200) {
        setVeterinarianSlots(response.data);
      } else {
        setVeterinarianSlots([]);
      }
    } catch (error) {
      message.error("Không thể tải lịch của bác sĩ" + error);
      setVeterinarianSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentStep === 1) {
      fetchSlots(currentWeek);
      fetchAvailableStaffs();
    }
  }, [currentStep, currentWeek, fetchSlots, fetchAvailableStaffs]);

  const handleWeekChange = (direction: "prev" | "next") => {
    const newWeek = direction === "prev" ? currentWeek.subtract(1, "week") : currentWeek.add(1, "week");
    setCurrentWeek(newWeek);

    // If we're in doctor priority mode and a veterinarian is selected, fetch their slots for the new week
    if (activeTab === "doctor" && selectedVeterinarian) {
      fetchVeterinarianSlots(selectedVeterinarian.id, newWeek);
    }
  };

  const handleSlotClick = (date: string, slot: TimeSlot) => {
    const slotDate = dayjs(date, "DD-MM-YYYY");
    if (slotDate.isSame(dayjs(), "day") || slotDate.isBefore(dayjs(), "day")) return;
    if (slot.availableSlot === 0) return;
    setSelectedSlot({ date, slot });
    setSelectedStaff(null);
  };

  // Handle veterinarian selection in "Ưu tiên bác sĩ" tab
  const handleVeterinarianSelect = (veterinarian: Staff) => {
    setSelectedVeterinarian(veterinarian);
    setSelectedStaff(null);
    setSelectedSlot(null);
    fetchVeterinarianSlots(veterinarian.id, currentWeek);
  };

  // Handle slot click for veterinarian's schedule
  const handleVeterinarianSlotClick = (date: string, slot: TimeSlot) => {
    const slotDate = dayjs(date, "DD-MM-YYYY");
    if (slotDate.isSame(dayjs(), "day") || slotDate.isBefore(dayjs(), "day")) return;
    if (slot.availableSlot === 0) return;
    setSelectedSlot({ date, slot });
    // Set the selected staff to the veterinarian
    if (selectedVeterinarian) {
      setSelectedStaff(selectedVeterinarian);
    }
  };

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSelectedSlot(null);
    setSelectedStaff(null);
    setSelectedVeterinarian(null);
    setVeterinarianSlots([]);
  };

  const handleConfirmBooking = async () => {
    if (!selectedHamster || !selectedSlot || !selectedMedicalItem || !selectedStaff) {
      message.error("Vui lòng chọn đầy đủ thông tin!");
      return;
    }
    setLoading(true);
    try {
      const discountPercent = membership?.discountPercent || 0;
      const totalAmount = medicalPrice || 0;
      const totalAmountAfter = Math.round(totalAmount - (totalAmount * discountPercent) / 100);

      const payload: CreateAppointmentRequest = {
        hamsterId: selectedHamster.id,
        veterinarianId: selectedStaff.id,
        appointmentDate: selectedSlot.date,
        notes,
        totalAmount,
        totalAmountAfter,
        discountPercent,
        slotStart: selectedSlot.slot.startTime,
        slotEnd: selectedSlot.slot.endTime,
        serviceType: "MEDICAL",
        items: [{ serviceId: selectedMedicalItem.id, price: totalAmount }],
        isConfirmed: true,
      };

      const response = await createAppointment(payload);
      if (response.code === 200) {
        message.success("Đặt lịch thành công!");
        navigate("/booking-success");
      } else {
        throw new Error(response.message || "Đặt lịch thất bại");
      }
    } catch (err) {
      const error = err as AxiosError;
      message.error(error.message || "Đặt lịch thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const getDaysOfWeek = (week: Dayjs) => {
    const start = week.startOf("isoWeek");
    return Array.from({ length: 5 }).map((_, i) => start.add(i, "day"));
  };

  const allSlots = Array.from(
    new Set(slotsData.flatMap((d) => d.slots.map((s) => `${s.startTime}-${s.endTime}`)))
  ).sort();

  return (
    <div className="booking-medical-service">
      <div className="header-section">
        <Title level={2} className="page-title">
          Đặt lịch Y tế
        </Title>
        <Steps current={currentStep} items={steps} className="booking-steps" />
      </div>

      <Spin spinning={loading}>
        {/* ===== BƯỚC 1 ===== */}
        {currentStep === 0 && (
          <div className="step step-select-hamster">
            <Title level={4} className="step-title">
              Bước 1: Chọn Hamster
            </Title>
            {profiles.length ? (
              <Row gutter={[16, 16]}>
                {profiles.map((hamster) => (
                  <Col xs={24} sm={24} md={12} lg={8} key={hamster.id}>
                    <Card
                      hoverable
                      className={`hamster__card-compact ${selectedHamster?.id === hamster.id ? "selected" : ""}`}
                      onClick={() => handleSelectHamster(hamster)}
                      bodyStyle={{ padding: 0 }}
                    >
                      <div style={{ display: "flex", height: "100%" }}>
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
                        <div style={{ flex: 1, padding: 16 }}>
                          <h4 className="hamster__name">{hamster.name}</h4>
                          <div className="hamster__info-compact">
                            <p>
                              <span className="label">Loài:</span> <span className="value">{hamster.species}</span>
                            </p>
                            <p>
                              <span className="label">Ngày sinh:</span> <span className="value">{hamster.dob}</span>
                            </p>
                            <p>
                              <span className="label">Màu:</span> <span className="value">{hamster.color}</span>
                            </p>
                            <p>
                              <span className="label">Giới tính:</span>{" "}
                              <span className="value">{hamster.gender === "Male" ? "Đực" : "Cái"}</span>
                            </p>
                            <p>
                              <span className="label">Cân nặng:</span> <span className="value">{hamster.weight}g</span>
                            </p>
                          </div>
                        </div>
                        {selectedHamster?.id === hamster.id && <div className="selected-checkmark">✓</div>}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="Không có hồ sơ hamster." />
            )}
          </div>
        )}

        {/* ===== BƯỚC 2 ===== */}
        {currentStep === 1 && (
          <div className="step step-weekly-schedule">
            <Title level={4} className="step-title">
              Bước 2: Chọn ngày, giờ và bác sĩ
            </Title>

            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={[
                {
                  key: "time",
                  label: (
                    <span>
                      <ClockCircleOutlined />
                      Ưu tiên thời gian
                    </span>
                  ),
                  children: (
                    <>
                      <div className="week-header">
                        <Button icon={<LeftOutlined />} onClick={() => handleWeekChange("prev")} />
                        <Title level={5} className="week-title">
                          Tuần {currentWeek.isoWeek()} ({getWeekRange(currentWeek).start.format("DD/MM")} -{" "}
                          {getWeekRange(currentWeek).end.format("DD/MM")})
                        </Title>
                        <Button icon={<RightOutlined />} onClick={() => handleWeekChange("next")} />
                      </div>

                      <div className="legend">
                        <div className="legend-item">
                          <span className="dot available-dot" /> Còn trống
                        </div>
                        <div className="legend-item">
                          <span className="dot selected-dot" /> Đã chọn
                        </div>
                        <div className="legend-item">
                          <span className="dot full-dot" /> Hết chỗ
                        </div>
                        <div className="legend-item">
                          <span className="dot past-dot" /> Quá khứ
                        </div>
                      </div>

                      <div className="weekly-grid">
                        <div className="time-column">
                          <div className="time-cell-header">Giờ</div>
                          {allSlots.map((slot) => (
                            <div key={slot} className="time-cell">
                              {slot}
                            </div>
                          ))}
                        </div>

                        {getDaysOfWeek(currentWeek).map((day) => {
                          const slotData = slotsData.find((s) => s.slotDate === day.format("DD-MM-YYYY"));
                          const isPastDay = day.isSame(dayjs(), "day") || day.isBefore(dayjs(), "day");
                          return (
                            <div key={day.format()} className={`day-column ${isPastDay ? "disabled-day" : ""}`}>
                              <div className="day-header">
                                {day.format("dd")}
                                <br />
                                {day.format("DD/MM")}
                              </div>
                              {allSlots.map((slotRange) => {
                                const found = slotData?.slots.find((s) => `${s.startTime}-${s.endTime}` === slotRange);
                                if (!found) return <div key={slotRange} className="slot-cell empty"></div>;
                                const isFull = found.availableSlot === 0;
                                const isSelected =
                                  selectedSlot?.date === day.format("DD-MM-YYYY") &&
                                  selectedSlot?.slot.startTime === found.startTime;
                                return (
                                  <div
                                    key={slotRange}
                                    className={`slot-cell ${isPastDay ? "past" : isFull ? "full" : "available"} ${
                                      isSelected ? "selected" : ""
                                    }`}
                                    onClick={() => handleSlotClick(day.format("DD-MM-YYYY"), found)}
                                  >
                                    {isPastDay
                                      ? ""
                                      : isFull
                                      ? "Hết chỗ"
                                      : isSelected
                                      ? "Đã chọn"
                                      : `Còn trống ${found.availableSlot}`}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>

                      {/* Bác sĩ - Time Priority */}
                      {selectedSlot && activeTab === "time" && (
                        <div className="staff-section">
                          <Title level={5}>Chọn bác sĩ</Title>
                          {selectedSlot.slot.staffs.length ? (
                            <Row gutter={[16, 16]}>
                              {selectedSlot.slot.staffs.map((staff) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={staff.id}>
                                  <Card
                                    hoverable={!staff.isBooked}
                                    className={`staff-card ${selectedStaff?.id === staff.id ? "selected" : ""} ${
                                      staff.isBooked ? "disabled" : ""
                                    }`}
                                    onClick={() => !staff.isBooked && setSelectedStaff(staff)}
                                  >
                                    <img
                                      src="https://cdn-icons-png.flaticon.com/512/2202/2202112.png"
                                      alt={staff.name}
                                      className="staff-avatar"
                                    />
                                    <h4>{staff.name}</h4>
                                    <p>{staff.sex === "MALE" ? "Nam" : "Nữ"}</p>
                                    <p className="specialization">{staff.specialization}</p>
                                    <p className="experience">{staff.experienceYears} năm kinh nghiệm</p>
                                    {staff.bestServices && staff.bestServices.length > 0 && (
                                      <div className="best-services">
                                        <p>Dịch vụ nổi bật:</p>
                                        {staff.bestServices.map((service, index) => (
                                          <Tag key={index} color="blue">
                                            {service}
                                          </Tag>
                                        ))}
                                      </div>
                                    )}
                                    {staff.isBooked && <Tag color="red">Đã bận</Tag>}
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          ) : (
                            <Empty description="Không có bác sĩ khả dụng" />
                          )}
                        </div>
                      )}
                    </>
                  ),
                },
                {
                  key: "doctor",
                  label: (
                    <span>
                      <UserSwitchOutlined />
                      Ưu tiên bác sĩ
                    </span>
                  ),
                  children: (
                    <>
                      {/* Chọn bác sĩ trước */}
                      {availableStaffs.length > 0 && (
                        <div className="staff-section">
                          <Title level={5}>Chọn bác sĩ</Title>
                          <Row gutter={[16, 16]}>
                            {availableStaffs.map((staff) => (
                              <Col xs={24} sm={12} md={8} lg={6} key={staff.id}>
                                <Card
                                  hoverable={!staff.isBooked}
                                  className={`staff-card ${selectedVeterinarian?.id === staff.id ? "selected" : ""} ${
                                    staff.isBooked ? "disabled" : ""
                                  }`}
                                  onClick={() => !staff.isBooked && handleVeterinarianSelect(staff)}
                                >
                                  <img
                                    src="https://cdn-icons-png.flaticon.com/512/2202/2202112.png"
                                    alt={staff.name}
                                    className="staff-avatar"
                                  />
                                  <h4>{staff.name}</h4>
                                  <p>{staff.sex === "MALE" ? "Nam" : "Nữ"}</p>
                                  <p className="specialization">{staff.specialization}</p>
                                  <p className="experience">{staff.experienceYears} năm kinh nghiệm</p>
                                  {staff.bestServices && staff.bestServices.length > 0 && (
                                    <div className="best-services">
                                      <p>Dịch vụ nổi bật:</p>
                                      {staff.bestServices.map((service, index) => (
                                        <Tag key={index} color="blue">
                                          {service}
                                        </Tag>
                                      ))}
                                    </div>
                                  )}
                                  {staff.isBooked && <Tag color="red">Đã bận</Tag>}
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      )}
                      <br />
                      {/* Hiển thị lịch của bác sĩ ĐÃ CHỌN */}
                      {selectedVeterinarian && (
                        <>
                          <div className="week-header">
                            <Button icon={<LeftOutlined />} onClick={() => handleWeekChange("prev")} />
                            <Title level={5} className="week-title">
                              Tuần {currentWeek.isoWeek()} ({getWeekRange(currentWeek).start.format("DD/MM")} -{" "}
                              {getWeekRange(currentWeek).end.format("DD/MM")}) - Lịch của {selectedVeterinarian.name}
                            </Title>
                            <Button icon={<RightOutlined />} onClick={() => handleWeekChange("next")} />
                          </div>

                          <div className="legend">
                            <div className="legend-item">
                              <span className="dot available-dot" /> Còn trống
                            </div>
                            <div className="legend-item">
                              <span className="dot selected-dot" /> Đã chọn
                            </div>
                            <div className="legend-item">
                              <span className="dot full-dot" /> Hết chỗ
                            </div>
                            <div className="legend-item">
                              <span className="dot past-dot" /> Quá khứ
                            </div>
                          </div>

                          <div className="weekly-grid">
                            <div className="time-column">
                              <div className="time-cell-header">Giờ</div>
                              {Array.from(
                                new Set(
                                  veterinarianSlots.flatMap((d) => d.slots.map((s) => `${s.startTime}-${s.endTime}`))
                                )
                              )
                                .sort()
                                .map((slot) => (
                                  <div key={slot} className="time-cell">
                                    {slot}
                                  </div>
                                ))}
                            </div>

                            {getDaysOfWeek(currentWeek).map((day) => {
                              const slotData = veterinarianSlots.find((s) => s.slotDate === day.format("DD-MM-YYYY"));
                              const isPastDay = day.isSame(dayjs(), "day") || day.isBefore(dayjs(), "day");
                              const daySlots = Array.from(
                                new Set(
                                  veterinarianSlots.flatMap((d) => d.slots.map((s) => `${s.startTime}-${s.endTime}`))
                                )
                              ).sort();

                              return (
                                <div key={day.format()} className={`day-column ${isPastDay ? "disabled-day" : ""}`}>
                                  <div className="day-header">
                                    {day.format("dd")}
                                    <br />
                                    {day.format("DD/MM")}
                                  </div>
                                  {daySlots.map((slotRange) => {
                                    const found = slotData?.slots.find(
                                      (s) => `${s.startTime}-${s.endTime}` === slotRange
                                    );
                                    if (!found) return <div key={slotRange} className="slot-cell empty"></div>;
                                    const isFull = found.availableSlot === 0;
                                    const isSelected =
                                      selectedSlot?.date === day.format("DD-MM-YYYY") &&
                                      selectedSlot?.slot.startTime === found.startTime;
                                    return (
                                      <div
                                        key={slotRange}
                                        className={`slot-cell ${isPastDay ? "past" : isFull ? "full" : "available"} ${
                                          isSelected ? "selected" : ""
                                        }`}
                                        onClick={() => handleVeterinarianSlotClick(day.format("DD-MM-YYYY"), found)}
                                      >
                                        {isPastDay
                                          ? ""
                                          : isFull
                                          ? "Hết chỗ"
                                          : isSelected
                                          ? "Đã chọn"
                                          : `Còn trống ${found.availableSlot}`}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* ===== BƯỚC 3 ===== */}
        {currentStep === 2 && selectedHamster && selectedSlot && (
          <div className="step step-confirm">
            <Title level={4} className="step-title">
              Bước 3: Xác nhận thông tin
            </Title>
            <Card>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Hamster">
                  <Image src={selectedHamster.profilePicture} width={50} preview={false} /> {selectedHamster.name} (
                  {selectedHamster.species})
                </Descriptions.Item>
                <Descriptions.Item label="Dịch vụ y tế">{selectedMedicalItem?.name}</Descriptions.Item>
                <Descriptions.Item label="Bác sĩ">{selectedStaff?.name}</Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn">{selectedSlot.date}</Descriptions.Item>
                <Descriptions.Item label="Giờ hẹn">
                  {selectedSlot.slot.startTime} - {selectedSlot.slot.endTime}
                </Descriptions.Item>
                <Descriptions.Item label="Giá gốc">
                  <Tag color="#ff6f61">{getFormattedPrice(String(medicalPrice || 0))}</Tag>
                </Descriptions.Item>
                {membership && (
                  <>
                    <Descriptions.Item label="Giảm giá">
                      {membership.discountPercent}% ({membership.rankName})
                    </Descriptions.Item>
                    <Descriptions.Item label="Thành tiền sau giảm">
                      <Tag color="green">
                        {getFormattedPrice(
                          String(
                            Math.round((medicalPrice || 0) - ((medicalPrice || 0) * membership.discountPercent) / 100)
                          )
                        )}
                      </Tag>
                    </Descriptions.Item>
                  </>
                )}
                {selectedStaff && (
                  <>
                    <Descriptions.Item label="Chuyên môn">{selectedStaff.specialization}</Descriptions.Item>
                    <Descriptions.Item label="Kinh nghiệm">{selectedStaff.experienceYears} năm</Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label="Ghi chú" span={2}>
                  <TextArea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú (không bắt buộc)"
                  />
                </Descriptions.Item>
              </Descriptions>

              {policies.length > 0 && (
                <>
                  <Divider />
                  <div className="policy-section">
                    <Title level={5}>Chính sách áp dụng cho dịch vụ Y tế</Title>
                    <ul>
                      {policies.map((policy) => (
                        <li key={policy.id}>
                          <strong>{policy.policyName}:</strong> {policy.description}
                        </li>
                      ))}
                    </ul>
                    <Checkbox
                      checked={agreePolicy}
                      onChange={(e) => setAgreePolicy(e.target.checked)}
                      style={{ marginTop: 10 }}
                    >
                      Tôi đã đọc và đồng ý với các chính sách trên
                    </Checkbox>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* ===== NÚT ===== */}
        <div className="steps-action">
          {currentStep > 0 && <Button onClick={() => setCurrentStep((s) => s - 1)}>Quay lại</Button>}
          {currentStep < 2 && (
            <Button
              type="primary"
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={currentStep === 0 && !selectedHamster}
            >
              Tiếp theo
            </Button>
          )}
          {currentStep === 2 && (
            <Button
              type="primary"
              onClick={handleConfirmBooking}
              disabled={!selectedHamster || !selectedSlot || !selectedStaff || !agreePolicy}
            >
              Xác nhận đặt lịch
            </Button>
          )}
        </div>
      </Spin>
    </div>
  );
}

export default MedicalBooking;
