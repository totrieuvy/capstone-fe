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
  Calendar,
  Tag,
  Descriptions,
  Image,
  Empty,
  Typography,
  Input,
} from "antd";
import { UserOutlined, CalendarOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { RootState } from "../../../../redux/rootReducer";
import { selectHamsterForGrooming } from "../../../../redux/features/selectedHamsterGroomingSlice";
import api from "../../../../config/axios";
import ProfileHamsterService, { type HamsterProfile } from "../../../../services/ProfileHamsterService";
import { getFormattedPrice } from "../../../../utils/formatPrice";
import "./BookingGroomingService.scss";
import type { AxiosError } from "axios";

const { Title } = Typography;
const { TextArea } = Input;

dayjs.extend(customParseFormat);
dayjs.locale("vi");

interface Species {
  id: string;
  speciesName: string;
}
interface GroomingPriceItem {
  id: string;
  displayPrice: string;
}
interface TimeSlot {
  startTime: string;
  endTime: string;
  maxSlots: number;
  availableSlot: number;
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

function BookingGroomingService() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedGroomingItem = useSelector((state: RootState) => state.grooming.selectedItem);
  const [currentStep, setCurrentStep] = useState(0);
  const [profiles, setProfiles] = useState<HamsterProfile[]>([]);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [selectedHamster, setSelectedHamster] = useState<HamsterProfile | null>(null);
  const [groomingPrice, setGroomingPrice] = useState<number | null>(null);
  const [slotsData, setSlotsData] = useState<SlotData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [membership, setMembership] = useState<Membership | null>(null);

  const steps = [
    { title: "Chọn Hamster", icon: <UserOutlined /> },
    { title: "Chọn Ngày và Giờ", icon: <CalendarOutlined /> },
    { title: "Xác Nhận", icon: <CheckCircleOutlined /> },
  ];

  const fetchSpecies = useCallback(async () => {
    const { data } = await api.get<{ code: number; data: Species[] }>("/api/species");
    if (data.code === 200) setAllSpecies(data.data);
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const hamsterProfiles = await ProfileHamsterService.getProfiles();
    setProfiles(hamsterProfiles);
    setLoading(false);
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
      message.error("Vui lòng chọn dịch vụ grooming trước.");
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
        const foundItem = response.data.data.find((item) => item.id === selectedGroomingItem.id);
        if (foundItem) {
          const parsedPrice = parseFloat(String(foundItem.displayPrice));
          setGroomingPrice(isNaN(parsedPrice) ? 0 : parsedPrice);
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

  const fetchSlots = useCallback(async (month: Dayjs) => {
    setLoading(true);
    const startDate = month.startOf("month").format("DD-MM-YYYY");
    const endDate = month.endOf("month").format("DD-MM-YYYY");
    const response = await api.get<{ code: number; data: SlotData[] }>("/api/slot", {
      params: { from: startDate, to: endDate, serviceType: "GROOMING" },
    });
    if (response.data.code === 200) setSlotsData(response.data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentStep === 1) fetchSlots(calendarMonth);
  }, [currentStep, calendarMonth, fetchSlots]);

  const handleConfirmBooking = async () => {
    if (!selectedHamster || !selectedDate || !selectedTimeSlot || !selectedGroomingItem) {
      message.error("Vui lòng chọn đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    try {
      const discountPercent = membership?.discountPercent || 0;
      const totalAmount = groomingPrice || 0;
      const totalAmountAfter = Math.round(totalAmount - (totalAmount * discountPercent) / 100);

      const isService = selectedGroomingItem.type === "service";
      const itemKey = isService ? "serviceId" : "serviceComboId";

      const payload = {
        hamsterId: selectedHamster.id,
        appointmentDate: selectedDate.format("DD-MM-YYYY"),
        notes: notes || "",
        totalAmount,
        totalAmountAfter,
        discountPercent,
        slotStart: selectedTimeSlot.startTime,
        slotEnd: selectedTimeSlot.endTime,
        serviceType: "GROOMING",
        items: [
          {
            [itemKey]: selectedGroomingItem.id,
            price: totalAmount,
          },
        ],
      };

      const res = await api.post("/api/appointment", payload);
      if (res.data.code === 200) {
        message.success("Đặt lịch thành công!");
        navigate("/booking-success");
      } else {
        throw new Error(res.data?.message || "Đặt lịch thất bại");
      }
    } catch (err) {
      const e = err as AxiosError;
      message.error(e.message || "Đặt lịch thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const slotsForDay = () => {
    if (!selectedDate) return [];
    const daySlot = slotsData.find((d) => d.slotDate === selectedDate.format("DD-MM-YYYY"));
    return daySlot ? daySlot.slots : [];
  };

  return (
    <div className="booking-grooming-service">
      <Title level={2} className="page-title">
        Đặt lịch Grooming
      </Title>

      <Steps current={currentStep} items={steps} className="booking-steps" />

      <Spin spinning={loading}>
        {currentStep === 0 && (
          <div className="step">
            <Title level={4} className="step-title">
              Bước 1: Chọn Hamster
            </Title>
            {profiles.length ? (
              <Row gutter={[16, 16]}>
                {profiles.map((hamster) => (
                  <Col xs={24} sm={12} md={8} key={hamster.id}>
                    <Card
                      hoverable
                      className={`hamster-card ${selectedHamster?.id === hamster.id ? "selected" : ""}`}
                      cover={<img alt={hamster.name} src={hamster.profilePicture} />}
                      onClick={() => handleSelectHamster(hamster)}
                    >
                      <Card.Meta title={hamster.name} description={hamster.species} />
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
          <div className="step">
            <Title level={4} className="step-title">
              Bước 2: Chọn Ngày và Giờ
            </Title>
            <Calendar
              fullscreen={false}
              value={calendarMonth}
              onPanelChange={setCalendarMonth}
              onSelect={(v) => setSelectedDate(v)}
              disabledDate={(current) => current.isBefore(dayjs(), "day") || current.isSame(dayjs(), "day")}
              dateFullCellRender={(current) => {
                const isSelected = selectedDate?.isSame(current, "day");
                const isToday = current.isSame(dayjs(), "day");
                return (
                  <div
                    className={`ant-picker-cell-inner custom-cell ${isSelected ? "selected-day" : ""} ${
                      isToday ? "today-disabled" : ""
                    }`}
                  >
                    {current.date()}
                  </div>
                );
              }}
            />

            <div className="slot-container">
              {selectedDate ? (
                slotsForDay().length ? (
                  <div className="slot-grid">
                    {slotsForDay().map((slot) => {
                      const full = slot.availableSlot === 0;
                      const selected = selectedTimeSlot?.startTime === slot.startTime;
                      return (
                        <div
                          key={slot.startTime}
                          className={`slot-card ${full ? "full" : ""} ${selected ? "selected" : ""}`}
                          onClick={() => !full && setSelectedTimeSlot(slot)}
                        >
                          <div className="time">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="meta">
                            Còn: {slot.availableSlot} / Tổng: {slot.maxSlots}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Empty description="Không có khung giờ" />
                )
              ) : (
                <div className="choose-day-hint">Hãy chọn ngày trên lịch để xem khung giờ</div>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && selectedHamster && selectedDate && selectedTimeSlot && (
          <div className="step">
            <Title level={4} className="step-title">
              Bước 3: Xác nhận thông tin
            </Title>
            <Card>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Hamster">
                  <Image src={selectedHamster.profilePicture} width={50} preview={false} /> {selectedHamster.name} (
                  {selectedHamster.species})
                </Descriptions.Item>
                <Descriptions.Item label="Dịch vụ">{selectedGroomingItem?.name}</Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn">{selectedDate.format("dddd, DD/MM/YYYY")}</Descriptions.Item>
                <Descriptions.Item label="Giờ hẹn">
                  {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
                </Descriptions.Item>
                <Descriptions.Item label="Giá gốc">
                  <Tag color="#ff6f61">{getFormattedPrice(String(groomingPrice || 0))}</Tag>
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
                            Math.round((groomingPrice || 0) - ((groomingPrice || 0) * membership.discountPercent) / 100)
                          )
                        )}
                      </Tag>
                    </Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label="Ghi chú">
                  <TextArea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú (không bắt buộc)"
                  />
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}

        <div className="steps-action">
          {currentStep > 0 && <Button onClick={() => setCurrentStep((s) => s - 1)}>Quay lại</Button>}
          {currentStep < 2 && (
            <Button type="primary" onClick={() => setCurrentStep((s) => s + 1)}>
              Tiếp theo
            </Button>
          )}
          {currentStep === 2 && (
            <Button type="primary" onClick={handleConfirmBooking}>
              Xác nhận đặt lịch
            </Button>
          )}
        </div>
      </Spin>
    </div>
  );
}

export default BookingGroomingService;
