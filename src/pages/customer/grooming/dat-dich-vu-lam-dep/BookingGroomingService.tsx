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
  TeamOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import type { RootState } from "../../../../redux/rootReducer";
import { selectHamsterForGrooming } from "../../../../redux/features/selectedHamsterGroomingSlice";
import api from "../../../../config/axios";
import ProfileHamsterService, { type HamsterProfile } from "../../../../services/ProfileHamsterService";
import "./BookingGroomingService.scss";
import type { AxiosError } from "axios";
import { Checkbox, Divider } from "antd";
import { toast } from "react-toastify";

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

interface Species {
  id: string;
  speciesName: string;
}
interface GroomingPriceItem {
  id: string;
  displayPrice: string;
}
interface Staff {
  id: string;
  name: string;
  sex: string;
  isBooked: boolean;
}
interface TimeSlot {
  startTime: string;
  endTime: string;
  maxSlots: number;
  availableSlot: number;
  staffs: Staff[];
}
interface SlotData {
  slotDate: string;
  slots: TimeSlot[];
}
interface Membership {
  discountPercent: number;
  rankName: string;
  currentPoint: number;
}

// Key sẽ là: `${staff.id}_${day.slotDate}_${slot.startTime}`
// Value sẽ là: `staff.isBooked` (true/false)
type StaffBookingCache = Map<string, boolean>;

function BookingGroomingService() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedGroomingItem = useSelector((state: RootState) => state.grooming.selectedItem);

  const [currentStep, setCurrentStep] = useState(0);
  const [profiles, setProfiles] = useState<HamsterProfile[]>([]);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [selectedHamster, setSelectedHamster] = useState<HamsterProfile | null>(null);
  const [groomingPrice, setGroomingPrice] = useState<string>("");
  const [slotsData, setSlotsData] = useState<SlotData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; slot: TimeSlot } | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [membership, setMembership] = useState<Membership | null>(null);
  const [currentWeek, setCurrentWeek] = useState(dayjs());
  const [selectMode, setSelectMode] = useState<"scheduleFirst" | "staffFirst">("scheduleFirst");
  const [allStaffs, setAllStaffs] = useState<Staff[]>([]);

  const [staffBookingCache, setStaffBookingCache] = useState<StaffBookingCache>(new Map());

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [agreePolicy, setAgreePolicy] = useState(false);

  const steps = [
    { title: "Chọn Hamster", icon: <UserOutlined /> },
    { title: "Chọn Slot", icon: <CalendarOutlined /> },
    { title: "Xác Nhận", icon: <CheckCircleOutlined /> },
  ];

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await api.get<{ code: number; data: Policy[] }>("/api/policy");
      if (res.data.code === 200) {
        const groomingPolicies = res.data.data.filter(
          (p) => p.applicableServices === "GROOMING" && p.status === "ACTIVE"
        );
        setPolicies(groomingPolicies);
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

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const hamsterProfiles = await ProfileHamsterService.getProfiles();
    setProfiles(hamsterProfiles);
    setLoading(false);
  }, []);

  const fetchSpecies = useCallback(async () => {
    const { data } = await api.get<{ code: number; data: Species[] }>("/api/species");
    if (data.code === 200) setAllSpecies(data.data);
  }, []);

  const fetchMembership = useCallback(async () => {
    try {
      const { data } = await api.get<{ code: number; data: Membership }>("/api/membership");
      if (data.code === 200) setMembership(data.data);
    } catch {
      setMembership(null);
    }
  }, []);

  useEffect(() => {
    if (!selectedGroomingItem) {
      toast.error("Vui lòng chọn dịch vụ grooming trước.");
      navigate("/dich-vu-lam-dep");
      return;
    }
    document.title = "Đặt lịch Grooming";
    fetchProfiles();
    fetchSpecies();
    fetchMembership();
  }, [selectedGroomingItem, navigate, fetchProfiles, fetchSpecies, fetchMembership]);

  const fetchGroomingPrice = useCallback(
    async (speciesId: string) => {
      if (!selectedGroomingItem) return;
      const apiPath = selectedGroomingItem.type === "service" ? "/api/services/species" : "/api/combo/species";
      const response = await api.get<{ code: number; data: GroomingPriceItem[] }>(`${apiPath}/${speciesId}`);
      if (response.data.code === 200) {
        // Nếu chọn nhiều dịch vụ lẻ
        if (selectedGroomingItem.type === "service" && selectedGroomingItem.id.includes(",")) {
          const ids = selectedGroomingItem.id.split(",").map((id) => id.trim());

          const matched = response.data.data.filter((item) => ids.includes(item.id));

          // Nếu thiếu giá thì gán 0 để tránh undefined
          const allPrices = ids.map((id) => {
            const item = matched.find((m) => m.id === id);
            return item ? item.displayPrice : "0";
          });

          setGroomingPrice(allPrices.join("|")); // dùng pipe tránh trùng dấu phẩy số tiền
        } else {
          // Combo hoặc 1 dịch vụ
          const foundItem = response.data.data.find((item) => item.id === selectedGroomingItem.id);
          if (foundItem) setGroomingPrice(foundItem.displayPrice);
        }
      }
    },
    [selectedGroomingItem]
  );

  const handleSelectHamster = (hamster: HamsterProfile) => {
    setSelectedHamster(hamster);
    dispatch(
      selectHamsterForGrooming({
        id: hamster.id,
        name: hamster.name,
        species: hamster.species,
        profilePicture: hamster.profilePicture,
      })
    );
    const foundSpecies = allSpecies.find((s) => s.speciesName.toLowerCase() === hamster.species.toLowerCase());
    if (foundSpecies?.id) fetchGroomingPrice(foundSpecies.id);
  };

  const getWeekRange = (week: Dayjs) => {
    const start = week.startOf("isoWeek");
    const end = week.endOf("isoWeek");
    return { start, end };
  };

  const fetchSlots = useCallback(async (week: Dayjs, staffId?: string) => {
    setLoading(true);
    const { start, end } = getWeekRange(week);
    const startDate = start.format("DD-MM-YYYY");
    const endDate = end.format("DD-MM-YYYY");
    const response = await api.get<{ code: number; data: SlotData[] }>("/api/slot", {
      params: { from: startDate, to: endDate, serviceType: "GROOMING", staffId },
    });
    if (response.data.code === 200) {
      setSlotsData(response.data.data);
    } else {
      setSlotsData([]);
    }
    setLoading(false);

    // Chỉ xây dựng cache khi chúng ta gọi API lấy TẤT CẢ slots (staffId không được định nghĩa)
    if (!staffId && response.data.code === 200) {
      const newBookingCache: StaffBookingCache = new Map();
      response.data.data.forEach((day) => {
        day.slots.forEach((slot) => {
          slot.staffs.forEach((staff) => {
            const cacheKey = `${staff.id}_${day.slotDate}_${slot.startTime}`;
            newBookingCache.set(cacheKey, staff.isBooked);
          });
        });
      });
      setStaffBookingCache(newBookingCache);
    }
  }, []);

  // useEffect chính điều khiển việc tải dữ liệu cho Bước 2
  useEffect(() => {
    if (currentStep === 1) {
      if (selectMode === "scheduleFirst") {
        // Tab "Chọn lịch trước": Tải tất cả slot (việc này sẽ tự động xây dựng cache)
        fetchSlots(currentWeek);
        setAllStaffs([]);
      } else {
        // Tab "Chọn nhân viên trước"
        if (selectedStaff) {
          // Nếu đã chọn 1 staff -> chỉ tải lịch của staff đó
          fetchSlots(currentWeek, selectedStaff.id);
        } else {
          // Nếu chưa chọn staff -> tải tất cả slot (để xây dựng cache VÀ danh sách staff)
          fetchSlots(currentWeek);
        }
        setSelectedSlot(null); // Bỏ chọn slot (nếu có)
      }
    }
  }, [currentStep, currentWeek, selectMode, fetchSlots, selectedStaff]);

  // useEffect: Xây dựng danh sách allStaffs TỪ slotsData
  // Chỉ chạy khi ở tab "Chọn nhân viên trước" VÀ chưa chọn nhân viên
  useEffect(() => {
    // Logic này chỉ chạy khi slotsData là "full" (đã được fetch mà không có staffId)
    if (currentStep === 1 && selectMode === "staffFirst" && !selectedStaff && slotsData.length > 0) {
      const staffMap = new Map<string, Staff>();
      const staffBookingStatus = new Map<string, boolean>();

      slotsData.forEach((day) => {
        day.slots.forEach((slot) => {
          slot.staffs.forEach((staff) => {
            if (!staffMap.has(staff.id)) {
              staffMap.set(staff.id, staff);
            }
            if (staff.isBooked === false) {
              staffBookingStatus.set(staff.id, true);
            }
          });
        });
      });

      const finalStaffList = Array.from(staffMap.values()).map((staff) => ({
        ...staff,
        isBooked: !staffBookingStatus.get(staff.id),
      }));

      setAllStaffs(finalStaffList);
    }
    // ----- START FIX 1: ĐÃ XÓA logic 'else if' ẩn danh sách nhân viên -----
    // else if (currentStep === 1 && selectMode === "staffFirst" && selectedStaff) {
    //   setAllStaffs([]);
    // }
    // ----- END FIX 1 -----
  }, [slotsData, currentStep, selectMode, selectedStaff]); // slotsData là dependency chính

  const handleWeekChange = (direction: "prev" | "next") => {
    const newWeek = direction === "prev" ? currentWeek.subtract(1, "week") : currentWeek.add(1, "week");
    setCurrentWeek(newWeek);
  };

  const handleSlotClick = (date: string, slot: TimeSlot) => {
    const slotDate = dayjs(date, "DD-MM-YYYY");
    if (slotDate.isSame(dayjs(), "day") || slotDate.isBefore(dayjs(), "day")) return;

    // (Kiểm tra cache cho 'staffFirst' mode)
    if (selectMode === "staffFirst" && selectedStaff) {
      const cacheKey = `${selectedStaff.id}_${date}_${slot.startTime}`;
      const isBookedInCache = staffBookingCache.get(cacheKey);
      if (isBookedInCache === true) {
        toast.warning("Nhân viên này bận vào khung giờ này.");
        return;
      }
    }

    // Chặn click nếu slot full (chỉ ở mode 'scheduleFirst')
    if (slot.availableSlot === 0 && selectMode === "scheduleFirst") return;

    if (selectMode === "staffFirst" && selectedStaff) {
      setSelectedSlot({ date, slot });
    } else {
      // Đây là logic cho 'scheduleFirst'
      setSelectedSlot({ date, slot });
      // Reset staff khi chọn 1 SLOT MỚI
      setSelectedStaff(null);
    }
  };

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    // Hàm này sẽ gọi fetchSlots(currentWeek, staff.id)
    // (thông qua useEffect [currentStep, currentWeek, selectMode, fetchSlots, selectedStaff])
    setSelectedSlot(null);
  };

  const handleConfirmBooking = async () => {
    if (selectMode === "staffFirst" && selectedStaff && !selectedSlot) {
      toast.error("Vui lòng chọn một slot trống từ lịch của nhân viên.");
      return;
    }
    if (selectMode === "scheduleFirst" && selectedSlot && !selectedStaff) {
      toast.error("Vui lòng chọn một nhân viên cho slot này.");
      return;
    }

    if (!selectedHamster || !selectedSlot || !selectedGroomingItem || !selectedStaff) {
      toast.error("Vui lòng chọn đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    try {
      const discountPercent = membership?.discountPercent || 0;

      let totalAmount = 0;

      // ✅ Khai báo rõ kiểu dữ liệu cho items
      interface ServiceItem {
        serviceId?: string;
        serviceComboId?: string;
        price: number;
      }

      let items: ServiceItem[] = [];

      // Lấy giá từ API trả về
      const displayPriceStr = groomingPrice ?? "";
      // ✅ Nhiều dịch vụ lẻ
      if (selectedGroomingItem.type === "service") {
        if (!displayPriceStr) {
          totalAmount = 0;
        } else {
          // Dùng regex match để lấy đúng các nhóm số tiền có dạng ###,###
          const priceMatches = displayPriceStr.match(/\d{1,3}(?:,\d{3})*/g) || [];
          const prices = priceMatches.map((p) => parseFloat(p.replace(/,/g, "")));

          totalAmount = prices.reduce((sum, val) => sum + val, 0);

          // Lấy danh sách ID
          const serviceIds = selectedGroomingItem.id ? selectedGroomingItem.id.split(",").map((id) => id.trim()) : [];

          // Map từng id với từng giá
          items = serviceIds.map((id, index) => ({
            serviceId: id,
            price: prices[index] || 0,
          }));
        }
      } else {
        // ✅ Combo chỉ có 1 giá
        const numeric = parseFloat((displayPriceStr || "").replace(/,/g, ""));
        totalAmount = !isNaN(numeric) ? numeric : 0;

        items = [
          {
            serviceComboId: selectedGroomingItem.id,
            price: totalAmount,
          },
        ];
      }

      // ✅ Tính giảm giá nếu có membership
      const totalAmountAfter = Math.round(totalAmount - (totalAmount * discountPercent) / 100);

      // ✅ Payload gửi backend
      const payload = {
        hamsterId: selectedHamster.id,
        staffId: selectedStaff.id,
        appointmentDate: selectedSlot.date,
        notes,
        totalAmount,
        totalAmountAfter,
        discountPercent,
        slotStart: selectedSlot.slot.startTime,
        slotEnd: selectedSlot.slot.endTime,
        serviceType: "GROOMING",
        items,
        isConfirmed: true,
      };

      const res = await api.post("/api/appointment", payload);
      if (res.data.code === 200) {
        toast.success("Đặt lịch thành công!");
        navigate("/booking-success");
      } else {
        throw new Error(res.data?.message || "Đặt lịch thất bại");
      }
    } catch (err) {
      const e = err as AxiosError;
      toast.error(e.message || "Đặt lịch thất bại!");
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
    <div className="booking-grooming-service">
      <div className="header-section">
        <Title level={2} className="page-title">
          Đặt lịch Grooming
        </Title>
        <Steps current={currentStep} items={steps} className="booking-steps" />
      </div>

      <Spin spinning={loading}>
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

        {currentStep === 1 && (
          <div className="step step-weekly-schedule">
            <Title level={4} className="step-title">
              Bước 2: Chọn lịch hoặc nhân viên
            </Title>
            <Tabs
              activeKey={selectMode}
              onChange={(key) => {
                setSelectMode(key as "scheduleFirst" | "staffFirst");

                // 🔥 FIX: reset nhân viên & slot khi chuyển về tab chọn nhân viên trước
                if (key === "staffFirst") {
                  setSelectedStaff(null);
                  setSelectedSlot(null);
                  setAllStaffs([]); // ép load lại
                  fetchSlots(currentWeek); // load full slot để build lại staff list
                }

                // Khi chuyển về chọn lịch trước → cũng nên reset
                if (key === "scheduleFirst") {
                  setSelectedStaff(null);
                  setSelectedSlot(null);
                }
              }}
              items={[
                { key: "scheduleFirst", label: "Chọn lịch trước", icon: <CalendarOutlined /> },
                { key: "staffFirst", label: "Chọn nhân viên trước", icon: <TeamOutlined /> },
              ]}
            />

            {selectMode === "scheduleFirst" ? (
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
                {selectedSlot && (
                  <div className="staff-section">
                    <Title level={5}>Chọn nhân viên</Title>
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
                              {staff.isBooked && <Tag color="red">Đã bận</Tag>}
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Empty description="Không có nhân viên khả dụng" />
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {allStaffs.length > 0 && (
                  <div className="staff-section">
                    <Title level={5}>Chọn nhân viên</Title>
                    <Row gutter={[16, 16]}>
                      {allStaffs.map((staff) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={staff.id}>
                          <Card
                            hoverable={!staff.isBooked}
                            className={`staff-card ${selectedStaff?.id === staff.id ? "selected" : ""} ${
                              staff.isBooked ? "disabled" : ""
                            }`}
                            onClick={() => !staff.isBooked && handleStaffSelect(staff)}
                          >
                            <img
                              src="https://cdn-icons-png.flaticon.com/512/2202/2202112.png"
                              alt={staff.name}
                              className="staff-avatar"
                            />
                            <h4>{staff.name}</h4>
                            <p>{staff.sex === "MALE" ? "Nam" : "Nữ"}</p>
                            {staff.isBooked && <Tag color="red">Đã bận</Tag>}
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
                {selectedStaff && (
                  <>
                    <Title level={5} style={{ marginTop: 20 }}>
                      Lịch của {selectedStaff.name}
                    </Title>
                    <div className="week-header">
                      <Button icon={<LeftOutlined />} onClick={() => handleWeekChange("prev")} />
                      <Title level={5} className="week-title">
                        Tuần {currentWeek.isoWeek()} ({getWeekRange(currentWeek).start.format("DD/MM")} -{" "}
                        {getWeekRange(currentWeek).end.format("DD/MM")})
                      </Title>
                      <Button icon={<RightOutlined />} onClick={() => handleWeekChange("next")} />
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
                        const currentDateStr = day.format("DD-MM-YYYY");
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
                              const cacheKey = `${selectedStaff.id}_${currentDateStr}_${found.startTime}`;
                              const isBookedInCache = staffBookingCache.get(cacheKey);
                              const isFull = found.availableSlot === 0 || isBookedInCache === true;
                              const isSelected =
                                selectedSlot?.date === currentDateStr &&
                                selectedSlot?.slot.startTime === found.startTime;
                              return (
                                <div
                                  key={slotRange}
                                  className={`slot-cell ${isPastDay ? "past" : isFull ? "full" : "available"} ${
                                    isSelected ? "selected" : ""
                                  }`}
                                  onClick={() => !isFull && handleSlotClick(currentDateStr, found)}
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
            )}
          </div>
        )}

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
                <Descriptions.Item label="Dịch vụ">{selectedGroomingItem?.name}</Descriptions.Item>
                <Descriptions.Item label="Nhân viên">{selectedStaff?.name}</Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn">{selectedSlot.date}</Descriptions.Item>
                <Descriptions.Item label="Giờ hẹn">
                  {selectedSlot.slot.startTime} - {selectedSlot.slot.endTime}
                </Descriptions.Item>
                <Descriptions.Item label="Giá gốc">
                  <Tag color="#ff6f61">
                    {(() => {
                      if (!groomingPrice) return "0đ";

                      const prices = groomingPrice.split("|").map((p) => parseFloat(p.replace(/[^\d]/g, "")) || 0);

                      const total = prices.reduce((a, b) => a + b, 0);

                      return total.toLocaleString("vi-VN") + "đ";
                    })()}
                  </Tag>
                </Descriptions.Item>

                {membership && (
                  <>
                    <Descriptions.Item label="Giảm giá">
                      {membership.discountPercent}% ({membership.rankName})
                    </Descriptions.Item>
                    <Descriptions.Item label="Thành tiền sau giảm">
                      <Tag color="green">
                        {(() => {
                          if (groomingPrice) {
                            // const matches = groomingPrice.match(/\d{1,3}(?:,\d{3})*/g) || [];
                            // const numbers = matches.map((p) => parseFloat(p.replace(/,/g, "")));
                            // const total = numbers.reduce((sum, val) => sum + val, 0);
                            // const discountPercent = membership?.discountPercent || 0;
                            // const discounted = Math.round(total - (total * discountPercent) / 100);
                            // return discounted.toLocaleString("vi-VN") + "đ";
                            const prices = groomingPrice
                              .split("|")
                              .map((p) => parseFloat(p.replace(/[^\d]/g, "")) || 0);

                            const total = prices.reduce((a, b) => a + b, 0);

                            const discountPercent = membership?.discountPercent || 0;

                            const discounted = Math.round(total - (total * discountPercent) / 100);

                            return discounted.toLocaleString("vi-VN") + "đ";
                          }
                          return "0đ";
                        })()}
                      </Tag>
                    </Descriptions.Item>
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
                    <Title level={5}>Chính sách áp dụng cho dịch vụ Grooming</Title>
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

        <div className="steps-action">
          {currentStep > 0 && <Button onClick={() => setCurrentStep((s) => s - 1)}>Quay lại</Button>}
          {currentStep < 2 && (
            <Button
              type="primary"
              onClick={() => {
                if (currentStep === 0) {
                  if (!selectedHamster) {
                    return toast.error("Vui lòng chọn hamster trước.");
                  }
                }

                if (currentStep === 1) {
                  // Mode 1: chọn lịch trước
                  if (selectMode === "scheduleFirst") {
                    if (!selectedSlot) {
                      return toast.error("Vui lòng chọn slot trước.");
                    }
                    if (!selectedStaff) {
                      return toast.error("Vui lòng chọn nhân viên cho slot.");
                    }
                  }

                  // Mode 2: chọn nhân viên trước
                  if (selectMode === "staffFirst") {
                    if (!selectedStaff) {
                      return toast.error("Vui lòng chọn nhân viên trước.");
                    }
                    if (!selectedSlot) {
                      return toast.error("Vui lòng chọn slot trống từ lịch của nhân viên.");
                    }
                  }
                }

                setCurrentStep((s) => s + 1);
              }}
            >
              Tiếp theo
            </Button>
          )}

          {currentStep === 2 && (
            <Button type="primary" onClick={handleConfirmBooking} disabled={!agreePolicy}>
              Xác nhận đặt lịch
            </Button>
          )}
        </div>
      </Spin>
    </div>
  );
}

export default BookingGroomingService;
