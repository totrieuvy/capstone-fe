import { useEffect, useState } from "react";
import { Table, Tag, message, Button, Pagination, Spin, Card, DatePicker, Select, Row, Col } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import api from "../../../../config/axios";
import "./HistoryGrooming.scss";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Grooming {
  id: string;
  customerName: string;
  hamsterName: string;
  appointmentTime: string;
  serviceType: string;
  status: "BOOKED" | "CHECKED_IN" | "IN_PROCESS" | "CHECKOUT";
}

const HistoryGrooming = () => {
  const navigate = useNavigate();
  const [allAppointments, setAllAppointments] = useState<Grooming[]>([]);
  const [appointments, setAppointments] = useState<Grooming[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 10 });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/appointment?serviceType=GROOMING`);
      if (res.data.code === 200) {
        const content = res.data.data?.content || [];
        setAllAppointments(content);
        setAppointments(content);
      } else {
        message.error(res.data.message || "Không thể tải lịch sử grooming!");
      }
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu lịch hẹn grooming!" + error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Lịch sử Grooming";
    fetchAppointments();
  }, []);

  const applyFilters = (status: string, dates: [Dayjs | null, Dayjs | null] | null) => {
    let filtered = [...allAppointments];

    if (status !== "ALL") {
      filtered = filtered.filter((a) => a.status === status);
    }

    if (dates && dates[0] && dates[1]) {
      const start = dates[0].startOf("day");
      const end = dates[1].endOf("day");
      filtered = filtered.filter((a) => {
        const date = dayjs(a.appointmentTime, "YYYY-MM-DD");
        return date.isAfter(start) && date.isBefore(end);
      });
    }

    setAppointments(filtered);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterStatus = (status: string) => {
    setStatusFilter(status);
    applyFilters(status, dateRangeFilter);
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRangeFilter(dates || null);
    applyFilters(statusFilter, dates);
  };

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setDateRangeFilter(null);
    setAppointments(allAppointments);
  };

  const getStatusTag = (status: Grooming["status"]) => {
    const colorMap: Record<string, string> = {
      BOOKED: "gold",
      CHECKED_IN: "blue",
      IN_PROCESS: "cyan",
      CHECKOUT: "green",
    };
    const textMap: Record<string, string> = {
      BOOKED: "Đã đặt",
      CHECKED_IN: "Đã check-in",
      IN_PROCESS: "Đang thực hiện",
      CHECKOUT: "Hoàn tất",
    };
    return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
  };

  const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
  const paginatedAppointments = appointments.slice(startIndex, startIndex + pagination.pageSize);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const columns: ColumnsType<Grooming> = [
    {
      title: "Mã lịch hẹn",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="order-id">...{id.slice(-8)}</span>,
    },
    { title: "Khách hàng", dataIndex: "customerName", key: "customerName" },
    { title: "Hamster", dataIndex: "hamsterName", key: "hamsterName" },
    {
      title: "Ngày hẹn",
      dataIndex: "appointmentTime",
      key: "appointmentTime",
      render: (d) => dayjs(d, "YYYY-MM-DD").format("DD/MM/YYYY"),
    },
    { title: "Trạng thái", dataIndex: "status", key: "status", render: getStatusTag },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button icon={<EyeOutlined />} onClick={() => navigate(`/STAFF/lich-dat-grooming/${record.id}`)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="history-grooming-page">
      <div className="container">
        <h1 className="page-title">Lịch sử Grooming</h1>

        <Card className="filter-card">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Select value={statusFilter} onChange={handleFilterStatus} style={{ width: "100%" }}>
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="BOOKED">Đã đặt</Option>
                <Option value="CHECKED_IN">Đã check-in</Option>
                <Option value="IN_PROCESS">Đang thực hiện</Option>
                <Option value="CHECKOUT">Hoàn tất</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={10}>
              <RangePicker
                value={dateRangeFilter}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} md={6}>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters} block>
                Đặt lại bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        <Card className="order-list-card">
          {loading ? (
            <div className="loading-spinner">
              <Spin size="large" tip="Đang tải lịch hẹn..." />
            </div>
          ) : (
            <>
              <Table columns={columns} dataSource={paginatedAppointments} pagination={false} rowKey="id" />
              {appointments.length > 0 && (
                <Pagination
                  current={pagination.currentPage}
                  total={appointments.length}
                  pageSize={pagination.pageSize}
                  onChange={handlePageChange}
                  showTotal={(total) => `Tổng cộng ${total} lịch hẹn`}
                  className="pagination"
                />
              )}
              {!loading && appointments.length === 0 && <div className="no-data">Không có lịch hẹn phù hợp.</div>}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default HistoryGrooming;
