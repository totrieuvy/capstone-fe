import React, { useEffect, useState } from "react";
import { Card, Tag, Typography, Spin, Alert, Select, DatePicker, Row, Col, Button, Empty } from "antd";
import { CalendarOutlined, UserOutlined, ClockCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import api from "../../../../../config/axios";
import "./TrackGrooming.scss";

const { Title } = Typography;
const { Option } = Select;

interface GroomingItem {
  id: string;
  hamsterName: string;
  appointmentTime: string;
  status: string;
  staffName: string | null;
  slotStart: string | null;
  slotEnd: string | null;
}

interface ApiResponse {
  code: number;
  message: string;
  data: {
    content: GroomingItem[];
    totalElements: number;
  };
}

interface AppointmentQueryParams {
  date: string;
  serviceType: "GROOMING";
  sortBy: string;
  sortDir: "asc" | "desc";
  page: number;
  size: number;
  status?: string; // optional
}

const TrackGrooming: React.FC = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<GroomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [date, setDate] = useState<Dayjs>(dayjs());

  // Auto fetch when filter changed
  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, date]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: AppointmentQueryParams = {
        date: date.format("YYYY-MM-DD"),
        serviceType: "GROOMING",
        sortBy: "createdAt",
        sortDir: "desc",
        page: 0,
        size: 10,
      };

      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await api.get<ApiResponse>("/api/appointment", { params });

      if (res.data.code === 200) {
        setAppointments(res.data.data.content || []);
      } else {
        setError(res.data.message || "Không thể tải lịch");
      }
    } catch {
      setError("Lỗi kết nối tới server!");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const mapColor: Record<string, string> = {
      BOOKED: "blue",
      CHECKED_IN: "cyan",
      IN_PROGRESS: "orange",
      CHECK_OUT: "green",
      CANCELLED: "red",
    };

    const mapText: Record<string, string> = {
      BOOKED: "Đã đặt",
      CHECKED_IN: "Đã check-in",
      IN_PROGRESS: "Đang thực hiện",
      CHECK_OUT: "Hoàn tất",
      CANCELLED: "Đã hủy",
    };

    return (
      <Tag color={mapColor[status] || "default"} style={{ minWidth: 80, textAlign: "center", padding: "4px 8px" }}>
        {mapText[status] || status}
      </Tag>
    );
  };

  const handleReset = () => {
    setStatusFilter("ALL");
    setDate(dayjs());
  };

  const handleViewDetail = (id: string) => {
    navigate(`/grooming-history/${id}`);
  };

  const renderCard = (g: GroomingItem) => (
    <Card key={g.id} className="appointment-card" hoverable>
      <Row gutter={[16, 16]} align="middle">
        {/* Hamster name */}
        <Col xs={24} sm={4}>
          <div className="appointment-info-section">
            <div className="info-label">Tên hamster</div>
            <div className="hamster-name">{g.hamsterName}</div>
          </div>
        </Col>

        {/* Date */}
        <Col xs={12} sm={4}>
          <div className="appointment-info-section">
            <div className="info-label">
              <CalendarOutlined style={{ marginRight: 4, color: "#1890ff" }} />
              Ngày hẹn
            </div>
            <div className="info-value">{dayjs(g.appointmentTime).format("DD/MM/YYYY")}</div>
          </div>
        </Col>

        {/* Slot */}
        <Col xs={12} sm={4}>
          <div className="appointment-info-section">
            <div className="info-label">
              <ClockCircleOutlined style={{ marginRight: 4 }} /> Slot
            </div>
            <div className="info-value">
              {g.slotStart ? `${g.slotStart.slice(0, 5)} - ${g.slotEnd?.slice(0, 5)}` : "—"}
            </div>
          </div>
        </Col>

        {/* Staff */}
        <Col xs={12} sm={4}>
          <div className="appointment-info-section">
            <div className="info-label">
              <UserOutlined style={{ marginRight: 4, color: "#52c41a" }} />
              Nhân viên
            </div>
            <div className="info-value">{g.staffName || "Chưa phân công"}</div>
          </div>
        </Col>

        {/* Status */}
        <Col xs={12} sm={4}>
          <div className="appointment-info-section">{getStatusTag(g.status)}</div>
        </Col>

        {/* Button */}
        <Col xs={12} sm={4}>
          <Button type="primary" size="middle" style={{ width: "100%" }} onClick={() => handleViewDetail(g.id)}>
            Chi tiết
          </Button>
        </Col>
      </Row>
    </Card>
  );

  if (loading) {
    return (
      <div className="medical-history-loading">
        <Spin size="large" />
        <p>Đang tải lịch Grooming...</p>
      </div>
    );
  }

  return (
    <div className="medical-appointment-history">
      <Card>
        <div className="medical-history-header">
          <Title level={2}>Lịch Grooming</Title>
        </div>

        {error && <Alert message="Lỗi" description={error} type="error" closable style={{ marginBottom: 16 }} />}

        {/* Filters */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={6}>
              <Select style={{ width: "100%" }} value={statusFilter} onChange={setStatusFilter}>
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="BOOKED">Đã đặt</Option>
                <Option value="CHECKED_IN">Đã check-in</Option>
                <Option value="IN_PROGRESS">Đang thực hiện</Option>
                <Option value="CHECK_OUT">Hoàn tất</Option>
                <Option value="CANCELLED">Đã hủy</Option>
              </Select>
            </Col>

            <Col xs={24} sm={6}>
              <DatePicker
                format="DD/MM/YYYY"
                value={date}
                onChange={(d) => d && setDate(d)}
                style={{ width: "100%" }}
              />
            </Col>

            <Col xs={24} sm={4}>
              <Button icon={<ReloadOutlined />} style={{ width: "100%" }} onClick={handleReset}>
                Đặt lại
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Appointment cards */}
        <div className="appointment-cards-container">
          {appointments.length === 0 ? (
            <Empty description="Không có lịch Grooming nào." />
          ) : (
            appointments.map((g) => renderCard(g))
          )}
        </div>
      </Card>
    </div>
  );
};

export default TrackGrooming;
