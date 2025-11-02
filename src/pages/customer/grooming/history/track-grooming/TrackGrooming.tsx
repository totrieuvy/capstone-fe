import React, { useEffect, useState } from "react";
import { Card, Tag, Typography, Spin, Alert, Select, DatePicker, Row, Col, Button, Empty } from "antd";
import { CalendarOutlined, FilterOutlined, SearchOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import api from "../../../../../config/axios";
import "./TrackGrooming.scss";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface GroomingItem {
  id: string;
  hamsterName: string;
  appointmentTime: string;
  status: string;
}

interface ApiResponse {
  code: number;
  message: string;
  data: {
    content: GroomingItem[];
    totalElements: number;
  };
}

const TrackGrooming: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<GroomingItem[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<GroomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  useEffect(() => {
    document.title = "Lịch Grooming";
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, statusFilter, dateRange]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse>("/api/appointment?serviceType=GROOMING");
      if (res.data.code === 200) {
        setAppointments(res.data.data.content);
      } else {
        setError("Không thể tải lịch Grooming!");
      }
    } catch {
      setError("Lỗi kết nối tới server!");
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((a) => {
        const apptDate = dayjs(a.appointmentTime);
        return apptDate.isAfter(dateRange[0].startOf("day")) && apptDate.isBefore(dateRange[1].endOf("day"));
      });
    }

    setFilteredAppointments(filtered);
  };

  const getStatusTag = (status: string) => {
    const mapColor: Record<string, string> = {
      BOOKED: "blue",
      CHECKED_IN: "processing",
      IN_PROGRESS: "gold",
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
      <Tag color={mapColor[status] || "default"} style={{ fontSize: "13px", padding: "4px 8px" }}>
        {mapText[status] || status}
      </Tag>
    );
  };

  const handleReset = () => {
    setStatusFilter("ALL");
    setDateRange(null);
    fetchAppointments();
  };

  const handleViewDetail = (id: string) => {
    navigate(`/grooming-history/${id}`);
  };

  const renderGroomingCard = (g: GroomingItem) => (
    <Card key={g.id} className="grooming-card" hoverable>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={5}>
          <div className="grooming-info">
            <div className="info-label">Tên hamster</div>
            <div className="info-value">{g.hamsterName}</div>
          </div>
        </Col>

        <Col xs={24} sm={5}>
          <div className="grooming-info">
            <div className="info-label">
              <CalendarOutlined style={{ marginRight: 4, color: "#1890ff" }} />
              Ngày hẹn
            </div>
            <div className="info-value">{dayjs(g.appointmentTime).format("DD/MM/YYYY")}</div>
          </div>
        </Col>

        <Col xs={24} sm={5}>
          <div className="grooming-info">
            <div className="info-label">Mã lịch</div>
            <div className="info-value">...{g.id.slice(-8)}</div>
          </div>
        </Col>

        <Col xs={24} sm={5}>
          <div className="grooming-info">{getStatusTag(g.status)}</div>
        </Col>

        <Col xs={24} sm={4}>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            style={{ width: "100%", backgroundColor: "#ff6f61" }}
            onClick={() => handleViewDetail(g.id)}
          >
            Chi tiết
          </Button>
        </Col>
      </Row>
    </Card>
  );

  if (loading) {
    return (
      <div className="grooming-loading">
        <Spin size="large" />
        <p>Đang tải lịch Grooming...</p>
      </div>
    );
  }

  return (
    <div className="track-grooming">
      <Card>
        <div className="grooming-header">
          <Title level={2}>Lịch Grooming</Title>
        </div>

        {error && <Alert message="Lỗi" description={error} type="error" closable style={{ marginBottom: 16 }} />}

        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Select
                style={{ width: "100%" }}
                placeholder="Lọc theo trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="BOOKED">Đã đặt</Option>
                <Option value="CHECKED_IN">Đã check-in</Option>
                <Option value="IN_PROGRESS">Đang thực hiện</Option>
                <Option value="CHECK_OUT">Hoàn tất</Option>
                <Option value="CANCELLED">Đã hủy</Option>
              </Select>
            </Col>

            <Col xs={24} sm={10}>
              <RangePicker
                value={dateRange || [null, null]}
                onChange={(range) => setDateRange(range as [Dayjs, Dayjs])}
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </Col>

            <Col xs={12} sm={3}>
              <Button type="primary" icon={<SearchOutlined />} style={{ width: "100%" }} onClick={filterAppointments}>
                Lọc
              </Button>
            </Col>

            <Col xs={12} sm={3}>
              <Button icon={<ReloadOutlined />} style={{ width: "100%" }} onClick={handleReset}>
                Đặt lại
              </Button>
            </Col>
          </Row>
        </Card>

        <div className="grooming-cards-container">
          {filteredAppointments.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không có lịch Grooming nào phù hợp."
              style={{ padding: "40px" }}
            />
          ) : (
            filteredAppointments.map((g) => renderGroomingCard(g))
          )}
        </div>
      </Card>
    </div>
  );
};

export default TrackGrooming;
