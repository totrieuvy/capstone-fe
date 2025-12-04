import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, Tag, Space, Typography, Spin, Alert, Select, Input, Row, Col, Button, Pagination } from "antd";
import { CalendarOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { boardingService } from "../../../../services/BoardingService";
import type { BookingHistoryItem } from "../../../../services/BoardingService";
import "./BoardingHistory.scss";

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

// Memoized Filter Section Component - moved outside to prevent recreation
const FilterSection = React.memo<{
  searchText: string;
  statusFilter: string;
  cageTypeFilter: string;
  availableCageTypes: string[];
  statusOptions: string[];
  loading: boolean;
  onSearchChange: (value: string) => void;
  onSearchTrigger: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onCageTypeFilterChange: (value: string) => void;
  getStatusText: (status: string) => string;
}>(({ 
  searchText, 
  statusFilter, 
  cageTypeFilter, 
  availableCageTypes, 
  statusOptions, 
  loading, 
  onSearchChange, 
  onSearchTrigger,
  onStatusFilterChange, 
  onCageTypeFilterChange, 
  getStatusText 
}) => (
  <Card size="small" style={{ marginBottom: 16 }}>
    <Row gutter={16} align="middle">
      <Col xs={24} sm={8}>
        <Search
          placeholder="Tìm kiếm theo tên hamster hoặc mã đặt phòng"
          allowClear
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          onSearch={onSearchTrigger}
          prefix={<SearchOutlined />}
        />
      </Col>
      <Col xs={24} sm={6}>
        <Select
          style={{ width: "100%" }}
          placeholder="Lọc theo trạng thái"
          value={statusFilter}
          onChange={onStatusFilterChange}
          suffixIcon={<FilterOutlined />}
          loading={loading}
        >
          <Option value="all">Tất cả trạng thái</Option>
          {statusOptions.map((status) => (
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
          onChange={onCageTypeFilterChange}
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
));

// Memoized Booking Cards Component - moved outside to prevent recreation
const BookingCards = React.memo<{
  bookingHistory: BookingHistoryItem[];
  searchText: string;
  statusFilter: string;
  cageTypeFilter: string;
  totalElements: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  renderBookingCard: (booking: BookingHistoryItem) => React.ReactNode;
}>(({ 
  bookingHistory, 
  searchText, 
  statusFilter, 
  cageTypeFilter, 
  totalElements, 
  pageSize, 
  currentPage, 
  onPageChange, 
  renderBookingCard 
}) => (
  <div className="booking-cards-container">
    {bookingHistory.length === 0 ? (
      <Card style={{ textAlign: "center", padding: "40px" }}>
        <Space direction="vertical" size="large">
          <CalendarOutlined style={{ fontSize: "48px", color: "#d9d9d9" }} />
          <div>
            <Title level={4} type="secondary">
              {searchText || statusFilter !== "all" || cageTypeFilter !== "all" 
                ? "Không tìm thấy kết quả" 
                : "Không có lịch sử đặt phòng"}
            </Title>
            <Typography.Text type="secondary">
              {searchText || statusFilter !== "all" || cageTypeFilter !== "all" 
                ? "Thử thay đổi bộ lọc để xem thêm kết quả."
                : "Bạn chưa có bất kỳ đặt phòng nào. Hãy đặt phòng cho hamster của bạn ngay!"}
            </Typography.Text>
          </div>
        </Space>
      </Card>
    ) : (
      <>
        {bookingHistory.map((booking) => renderBookingCard(booking))}
        {/* Pagination */}
        {totalElements > pageSize && (
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Pagination
              align="end"
              current={currentPage}
              pageSize={pageSize}
              total={totalElements}
              onChange={onPageChange}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} booking`}
            />
          </div>
        )}
      </>
    )}
  </div>
));

const BoardingHistory: React.FC = () => {
  const navigate = useNavigate();
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(""); // This triggers API calls
  const [inputSearchText, setInputSearchText] = useState(""); // This is for the input display
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cageTypeFilter, setCageTypeFilter] = useState<string>("all");
  const [availableCageTypes, setAvailableCageTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<string>("desc");
  
  // Memoize status options to prevent recreation
  const statusOptions = useMemo(() => [
    "PENDING",
    "BOOKED",
    "IN_PROGRESS",
    "CHECK_OUT",
    "FAILED",
    "CANCELLED",
  ], []);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(4);
  const [totalElements, setTotalElements] = useState(0);
  const [, setTotalPages] = useState(0);

  useEffect(() => {
    fetchBookingHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchText, statusFilter, cageTypeFilter, sortBy, sortDir]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, statusFilter, cageTypeFilter, sortBy, sortDir]);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare API parameters
      const hamsterNameParam = searchText.trim();
      const statusParam = statusFilter === "all" ? "" : statusFilter;
      const cageTypeParam = cageTypeFilter === "all" ? "" : cageTypeFilter;
      
      // Call API with dynamic parameters
      const response = await boardingService.getBookingHistory(
        currentPage - 1, 
        pageSize,
        sortBy,
        sortDir,
        hamsterNameParam,
        statusParam,
        cageTypeParam
      );
      
      const history = response.content;
      setBookingHistory(history);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);

      // Extract unique cage types from current page data for filters
      const allCageTypes = history.flatMap((booking) => [
        booking.cageTypeName,
        ...(booking.newCageTypeName ? [booking.newCageTypeName] : []),
      ]);
      const uniqueCageTypes = [...new Set(allCageTypes)];
      setAvailableCageTypes(uniqueCageTypes.sort());

    } catch (err) {
      setError("Failed to fetch booking history. Please try again.");
      console.error("Error fetching booking history:", err);
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const getStatusText = useCallback((status: string) => {
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
  }, []);

  const handleViewDetails = useCallback((booking: BookingHistoryItem) => {
    navigate(`/boarding-schedule/${booking.bookingId}`);
  }, [navigate]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    // Only update input display, don't trigger API call
    setInputSearchText(value);
  }, []);

  const handleSearchTrigger = useCallback((value: string) => {
    // This triggers the actual API call when search icon is clicked
    setSearchText(value);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handleCageTypeFilterChange = useCallback((value: string) => {
    setCageTypeFilter(value);
  }, []);

  const renderBookingCard = useCallback((booking: BookingHistoryItem) => {
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
  }, [getStatusColor, getStatusText, handleViewDetails]);

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
        <FilterSection 
          searchText={inputSearchText}
          statusFilter={statusFilter}
          cageTypeFilter={cageTypeFilter}
          availableCageTypes={availableCageTypes}
          statusOptions={statusOptions}
          loading={loading}
          onSearchChange={handleSearchChange}
          onSearchTrigger={handleSearchTrigger}
          onStatusFilterChange={handleStatusFilterChange}
          onCageTypeFilterChange={handleCageTypeFilterChange}
          getStatusText={getStatusText}
        />

        {/* Booking Cards */}
        <BookingCards 
          bookingHistory={bookingHistory}
          searchText={searchText}
          statusFilter={statusFilter}
          cageTypeFilter={cageTypeFilter}
          totalElements={totalElements}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          renderBookingCard={renderBookingCard}
        />
      </Card>
    </div>
  );
};

export default BoardingHistory;
