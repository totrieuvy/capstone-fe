import { useEffect, useState } from "react";
import { Table, Tag, Button, Card, Select, DatePicker, Space, message, Spin } from "antd";
import { EyeOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import api from "../../../../../config/axios";
import "./TrackGrooming.scss";

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
  const [data, setData] = useState<GroomingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse>("/api/appointment?serviceType=GROOMING");
      if (res.data.code === 200) {
        setData(res.data.data.content);
      } else {
        message.error("Không thể tải lịch Grooming!");
      }
    } catch {
      message.error("Lỗi kết nối tới server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Lịch Grooming";
    fetchAppointments();
  }, []);

  const handleFilter = () => {
    fetchAppointments();
  };

  const handleReset = () => {
    setStatusFilter("ALL");
    setDateRange(null);
    fetchAppointments();
  };

  const getStatusTag = (status: string) => {
    const mapColor: Record<string, string> = {
      BOOKED: "gold",
      CHECKED_IN: "processing",
      IN_PROGRESS: "cyan",
      CHECK_OUT: "success",
      CANCELLED: "error",
    };

    const mapText: Record<string, string> = {
      BOOKED: "Đã đặt",
      CHECKED_IN: "Đã check-in",
      IN_PROGRESS: "Đang thực hiện",
      CHECK_OUT: "Hoàn tất",
      CANCELLED: "Đã hủy",
    };

    return <Tag color={mapColor[status] || "default"}>{mapText[status] || status}</Tag>;
  };

  const filteredData = data.filter((item) => {
    // Lọc theo trạng thái
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    // Lọc theo khoảng ngày
    if (dateRange && dateRange[0] && dateRange[1]) {
      const appointment = dayjs(item.appointmentTime);
      if (appointment.isBefore(dateRange[0].startOf("day")) || appointment.isAfter(dateRange[1].endOf("day"))) {
        return false;
      }
    }
    return true;
  });

  const columns = [
    {
      title: "Mã lịch hẹn",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <span style={{ fontWeight: 500 }}>...{id.slice(-8)}</span>,
    },
    {
      title: "Tên Hamster",
      dataIndex: "hamsterName",
      key: "hamsterName",
    },
    {
      title: "Ngày hẹn",
      dataIndex: "appointmentTime",
      key: "appointmentTime",
      render: (time: string) => dayjs(time).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Chi tiết",
      key: "action",
      render: (_: unknown, record: GroomingItem) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/grooming-history/${record.id}`)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="track-grooming-page">
      <div className="tg-container">
        <div className="tg-header">
          <h2>Lịch Grooming</h2>
        </div>

        <Card className="tg-filter-card">
          <Space wrap>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }}>
              <Option value="ALL">Tất cả trạng thái</Option>
              <Option value="BOOKED">Đã đặt</Option>
              <Option value="CHECKED_IN">Đã check-in</Option>
              <Option value="IN_PROGRESS">Đang thực hiện</Option>
              <Option value="CHECK_OUT">Hoàn tất</Option>
            </Select>

            <RangePicker
              value={dateRange || [null, null]}
              onChange={(range) => setDateRange(range as [Dayjs, Dayjs])}
              format="DD/MM/YYYY"
            />

            <Button type="primary" icon={<SearchOutlined />} onClick={handleFilter}>
              Lọc
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Đặt lại
            </Button>
          </Space>
        </Card>

        <Card className="tg-card">
          {loading ? (
            <div className="tg-loading">
              <Spin size="large" tip="Đang tải danh sách Grooming..." />
            </div>
          ) : (
            <>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredData}
                pagination={{
                  pageSize: 7,
                  showSizeChanger: false,
                }}
              />
              {filteredData.length === 0 && <div className="tg-empty">Không có lịch Grooming nào phù hợp.</div>}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TrackGrooming;
