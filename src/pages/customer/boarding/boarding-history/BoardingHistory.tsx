import React, { useState, useEffect } from "react";
import { Card, Tag, Space, Typography, Spin, Alert, Select, Input, Row, Col, Button, Pagination } from "antd";
import { CalendarOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { boardingService } from "../../../../services/BoardingService";
import type { BookingHistoryItem } from "../../../../services/BoardingService";
import "./BoardingHistory.scss";

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const BoardingHistory: React.FC = () => {
  const navigate = useNavigate();
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cageTypeFilter, setCageTypeFilter] = useState<string>("all");
  const [availableCageTypes, setAvailableCageTypes] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(4);
  const [totalElements, setTotalElements] = useState(0);
  const [, setTotalPages] = useState(0);

  useEffect(() => {
    fetchBookingHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    filterBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingHistory, searchText, statusFilter, cageTypeFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, statusFilter, cageTypeFilter]);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use pagination with page size of 4 and sort by startDate descending
      const response = await boardingService.getBookingHistory(currentPage - 1, pageSize);
      const history = response.content;

      // Sort by startDate in descending order (most recent first)
      const sortedHistory = history.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      setBookingHistory(sortedHistory);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);

      // Extract unique cage types from all booking history (need to get all for filters)
      // For now, we'll use the current page data for filters
      const allCageTypes = history.flatMap((booking) => [
        booking.cageTypeName,
        ...(booking.newCageTypeName ? [booking.newCageTypeName] : []),
      ]);
      const uniqueCageTypes = [...new Set(allCageTypes)];
      setAvailableCageTypes(uniqueCageTypes.sort());

      // Extract unique statuses from the current page
      const uniqueStatuses = [...new Set(history.map((booking) => booking.status))];
      setAvailableStatuses(uniqueStatuses.sort());
    } catch (err) {
      setError("Failed to fetch booking history. Please try again.");
      console.error("Error fetching booking history:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookingHistory];

    // Filter by search text (hamster name or booking ID only)
    if (searchText) {
      filtered = filtered.filter(
        (booking) =>
          booking.hamsterName.toLowerCase().includes(searchText.toLowerCase()) ||
          booking.bookingId.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    // Filter by cage type
    if (cageTypeFilter !== "all") {
      filtered = filtered.filter(
        (booking) => booking.cageTypeName === cageTypeFilter || booking.newCageTypeName === cageTypeFilter
      );
    }

    setFilteredHistory(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "orange";
      case "BOOKED":
        return "cyan";
      case "NO-SHOW":
        return "volcano";
      case "IN_PROGRESS":
        return "blue";
      case "CHECK_OUT":
        return "green";
      case "CANCELLED":
        return "red";
      case "FAILED":
        return "red";
      case "INCIDENT":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "Chờ xử lý";
      case "BOOKED":
        return "Đã đặt";
      case "NO-SHOW":
        return "Không đến";
      case "IN_PROGRESS":
        return "Đang thực hiện";
      case "CHECK_OUT":
        return "Hoàn tất";
      case "CANCELLED":
        return "Đã hủy";
      case "FAILED":
        return "Thanh toán thất bại";
      case "INCIDENT":
        return "Có sự cố";
      default:
        return status.replace("_", " ");
    }
  };

  const handleViewDetails = (booking: BookingHistoryItem) => {
    navigate(`/boarding-schedule/${booking.bookingId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderBookingCard = (booking: BookingHistoryItem) => {
    const isIncident = booking.isIncident;
    const isExtended = booking.newEndDate && booking.newEndDate !== booking.endDate;
    const isCageTypeChanged = booking.newCageTypeName && booking.newCageTypeName !== booking.cageTypeName;
    const hasChanges = isExtended || isCageTypeChanged;

    return (
      <Card
        key={booking.bookingId}
        className={`booking-card ${isIncident ? "has-incident" : hasChanges ? "has-changes" : ""}`}
        hoverable
        style={{ marginBottom: 16, position: "relative" }}
      >
        {isIncident ? (
          <div className="incident-ribbon">
            <span>Sự cố</span>
          </div>
        ) : (
          hasChanges && (
            <div className="extension-ribbon">
              <span>Gia hạn</span>
            </div>
          )
        )}
        <Row gutter={[16, 16]} align="middle">
          {/* Hamster Name */}
          <Col xs={24} sm={4}>
            <div className="booking-info-section">
              <div className="info-label">Tên hamster</div>
              <div className="hamster-name">{booking.hamsterName}</div>
            </div>
          </Col>

          {/* Cage Type */}
          <Col xs={24} sm={4}>
            <div className="booking-info-section">
              <div className="info-label">Loại chuồng</div>
              <div>
                <Tag
                  color={booking.newCageTypeName && booking.newCageTypeName !== booking.cageTypeName ? "green" : "blue"}
                  className="cage-tag"
                >
                  {booking.newCageTypeName || booking.cageTypeName}
                </Tag>
              </div>
            </div>
          </Col>

          {/* Check-in Date */}
          <Col xs={12} sm={4}>
            <div className="booking-info-section">
              <div className="info-label">
                <CalendarOutlined style={{ marginRight: 4, color: "#1890ff" }} />
                Ngày nhận
              </div>
              <div className="info-value">{new Date(booking.startDate).toLocaleDateString("vi-VN")}</div>
            </div>
          </Col>

          {/* Check-out Date */}
          <Col xs={12} sm={4}>
            <div className="booking-info-section">
              <div className="info-label">
                <CalendarOutlined style={{ marginRight: 4, color: "#52c41a" }} />
                Ngày trả
              </div>
              <div
                className="info-value"
                style={{
                  color: booking.newEndDate && booking.newEndDate !== booking.endDate ? "#52c41a" : "#333",
                }}
              >
                {new Date(booking.newEndDate || booking.endDate).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </Col>

          {/* Status */}
          <Col xs={12} sm={4}>
            <div className="booking-info-section">
              {/* <div className="info-label">Trạng thái</div> */}
              <Tag
                color={getStatusColor(booking.status)}
                style={{
                  minWidth: "80px",
                  textAlign: "center",
                  fontSize: "13px",
                  padding: "4px 8px",
                }}
              >
                {getStatusText(booking.status)}
              </Tag>
            </div>
          </Col>

          {/* Action Button */}
          <Col xs={12} sm={4}>
            <div className="booking-actions">
              <Button type="primary" size="middle" style={{ width: "100%" }} onClick={() => handleViewDetails(booking)}>
                Chi tiết
              </Button>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  // const stats = getStatistics();

  if (loading) {
    return (
      <div className="boarding-history-loading">
        <Spin size="large" />
        <p>Loading booking history...</p>
      </div>
    );
  }

  return (
    <div className="boarding-history">
      <Card style={{ overflow: "visible", height: "auto" }}>
        <div className="boarding-history-header">
          <Title level={2}>Lịch sử đặt gửi hộ</Title>
        </div>

        {error && <Alert message="Error" description={error} type="error" closable style={{ marginBottom: 16 }} />}

        {/* Filters */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Search
                placeholder="Tìm kiếm theo tên hamster hoặc mã đặt phòng"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Select
                style={{ width: "100%" }}
                placeholder="Lọc theo trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                suffixIcon={<FilterOutlined />}
                loading={loading}
              >
                <Option value="all">Tất cả trạng thái</Option>
                {availableStatuses.map((status) => (
                  <Option key={status} value={status}>
                    {getStatusText(status)}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <Select
                style={{ width: "100%" }}
                placeholder="Lọc theo loại chuồng"
                value={cageTypeFilter}
                onChange={setCageTypeFilter}
                suffixIcon={<FilterOutlined />}
                loading={loading}
              >
                <Option value="all">Tất cả loại chuồng</Option>
                {availableCageTypes.map((cageType) => (
                  <Option key={cageType} value={cageType}>
                    {cageType}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Booking Cards */}
        <div className="booking-cards-container">
          {filteredHistory.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "40px" }}>
              <Space direction="vertical" size="large">
                <CalendarOutlined style={{ fontSize: "48px", color: "#d9d9d9" }} />
                <div>
                  <Title level={4} type="secondary">
                    Không có lịch sử đặt phòng
                  </Title>
                  <Typography.Text type="secondary">
                    Bạn chưa có bất kỳ đặt phòng nào. Hãy đặt phòng cho hamster của bạn ngay!
                  </Typography.Text>
                </div>
              </Space>
            </Card>
          ) : (
            <>
              {filteredHistory.map((booking) => renderBookingCard(booking))}
              {/* Pagination */}
              {totalElements > pageSize && (
                <div style={{ textAlign: "center", marginTop: "24px" }}>
                  <Pagination
                    align="end"
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalElements}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} booking`}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BoardingHistory;
