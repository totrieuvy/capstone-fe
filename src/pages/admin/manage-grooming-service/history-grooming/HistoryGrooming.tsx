import { useEffect, useState } from "react";
import { Table, Tag, message, Button, Pagination, Spin, Card, DatePicker, Select, Row, Col } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import api from "../../../../config/axios";
import "./HistoryGrooming.scss";

const { Option } = Select;

interface Grooming {
  id: string;
  customerName: string;
  hamsterName: string;
  appointmentTime: string;
  serviceType: string;
  status: string;
  staffName?: string;
}

interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  gender: string;
}

interface AppointmentFilterParams {
  date: string;
  serviceType: string;
  status?: string;
  staffId?: string;
  page: number;
  size: number;
}

interface ApiResponse {
  content: Grooming[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

const HistoryGrooming = () => {
  const navigate = useNavigate();

  // DATA STATES
  const [appointments, setAppointments] = useState<Grooming[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // FILTER STATES
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [staffFilter, setStaffFilter] = useState<string>("ALL");

  // PAGINATION
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 8,
    total: 0,
  });

  const fetchStaff = async () => {
    try {
      const res = await api.get<{ code: number; data: Staff[] }>("/api/staff");
      if (res.data.code === 200) {
        setStaffList(res.data.data);
      }
    } catch {
      message.error("Không thể tải danh sách nhân viên!");
    }
  };

  const fetchAppointments = async (page: number = 1) => {
    setLoading(true);

    try {
      const params: AppointmentFilterParams = {
        date: selectedDate.format("YYYY-MM-DD"),
        serviceType: "GROOMING",
        page: page - 1,
        size: pagination.pageSize,
      };

      if (statusFilter !== "ALL") params.status = statusFilter;
      if (staffFilter !== "ALL") params.staffId = staffFilter;

      const res = await api.get<{ code: number; data: ApiResponse }>("/api/appointment", { params });

      if (res.data.code === 200) {
        const data = res.data.data;
        setAppointments(data.content);

        setPagination({
          currentPage: data.pageNumber + 1,
          pageSize: data.pageSize,
          total: data.totalElements,
        });
      }
    } catch {
      message.error("Không thể tải lịch hẹn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Lịch sử Grooming";
    fetchStaff();
    fetchAppointments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAppointments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, statusFilter, staffFilter]);

  /* ===============================
     STATUS TAG
  ================================== */
  const mapColor: Record<string, string> = {
    BOOKED: "gold",
    CHECKED_IN: "blue",
    IN_PROGRESS: "cyan",
    CHECK_OUT: "green",
    CANCELLED: "red",
  };

  const mapName: Record<string, string> = {
    BOOKED: "Đã đặt",
    CHECKED_IN: "Đã check-in",
    IN_PROGRESS: "Đang thực hiện",
    CHECK_OUT: "Hoàn tất",
    CANCELLED: "Đã hủy",
  };

  const getStatusTag = (status: string) => <Tag color={mapColor[status]}>{mapName[status]}</Tag>;

  /* ===============================
     TABLE COLUMNS
  ================================== */
  const columns: ColumnsType<Grooming> = [
    {
      title: "Mã lịch hẹn",
      dataIndex: "id",
      render: (id) => <span>...{id.slice(-8)}</span>,
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
    },
    {
      title: "Hamster",
      dataIndex: "hamsterName",
    },
    {
      title: "Ngày hẹn",
      dataIndex: "appointmentTime",
      render: (d) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Nhân viên",
      render: (_, r) => r.staffName || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: getStatusTag,
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Button icon={<EyeOutlined />} onClick={() => navigate(`/STAFF/lich-dat-grooming/${record.id}`)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  /* ===============================
     RESET FILTERS
  ================================== */
  const handleReset = () => {
    setSelectedDate(dayjs());
    setStatusFilter("ALL");
    setStaffFilter("ALL");
    fetchAppointments(1);
  };

  return (
    <div className="history-grooming-page">
      <div className="container">
        <h1 className="page-title">Lịch sử Grooming</h1>

        {/* FILTER CARD */}
        <Card className="filter-card">
          <Row gutter={[16, 16]}>
            {/* DATE */}
            <Col xs={24} sm={12} md={6}>
              <DatePicker
                value={selectedDate}
                onChange={(d) => d && setSelectedDate(d)}
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </Col>

            {/* STATUS */}
            <Col xs={24} sm={12} md={6}>
              <Select value={statusFilter} onChange={setStatusFilter} style={{ width: "100%" }}>
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="BOOKED">Đã đặt</Option>
                <Option value="CHECKED_IN">Đã check-in</Option>
                <Option value="IN_PROGRESS">Đang thực hiện</Option>
                <Option value="CHECK_OUT">Hoàn tất</Option>
                <Option value="CANCELLED">Đã hủy</Option>
              </Select>
            </Col>

            {/* STAFF */}
            <Col xs={24} sm={12} md={6}>
              <Select value={staffFilter} onChange={setStaffFilter} style={{ width: "100%" }}>
                <Option value="ALL">Tất cả nhân viên</Option>
                {staffList.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.fullName}
                  </Option>
                ))}
              </Select>
            </Col>

            {/* RESET */}
            <Col xs={24} sm={12} md={6}>
              <Button icon={<ReloadOutlined />} onClick={handleReset} block>
                Đặt lại bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        {/* LIST */}
        <Card className="order-list-card">
          {loading ? (
            <div className="loading-spinner">
              <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
          ) : (
            <>
              <Table columns={columns} dataSource={appointments} pagination={false} rowKey="id" />

              <Pagination
                current={pagination.currentPage}
                total={pagination.total}
                pageSize={pagination.pageSize}
                onChange={(p) => fetchAppointments(p)}
                className="pagination"
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default HistoryGrooming;
