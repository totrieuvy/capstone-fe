import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Space,
  Typography,
  Spin,
  Alert,
  Select,
  Input,
  Row,
  Col,
  
  Button
} from 'antd';
import {
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { boardingService } from '../../../../services/BoardingService';
import type { BookingHistoryItem } from '../../../../services/BoardingService';
import './BoardingHistory.scss';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const BoardingHistory: React.FC = () => {
  const navigate = useNavigate();
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cageTypeFilter, setCageTypeFilter] = useState<string>('all');
  const [availableCageTypes, setAvailableCageTypes] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookingHistory, searchText, statusFilter, cageTypeFilter]);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await boardingService.getBookingHistory();
      setBookingHistory(history);
      
      // Extract unique cage types from the booking history
      const uniqueCageTypes = [...new Set(history.map(booking => booking.cageTypeName))];
      setAvailableCageTypes(uniqueCageTypes.sort());
      
      // Extract unique statuses from the booking history
      const uniqueStatuses = [...new Set(history.map(booking => booking.status))];
      setAvailableStatuses(uniqueStatuses.sort());
    } catch (err) {
      setError('Failed to fetch booking history. Please try again.');
      console.error('Error fetching booking history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookingHistory];

    // Filter by search text (hamster name or booking ID only)
    if (searchText) {
      filtered = filtered.filter(
        booking =>
          booking.hamsterName.toLowerCase().includes(searchText.toLowerCase()) ||
          booking.bookingId.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Filter by cage type
    if (cageTypeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.cageTypeName === cageTypeFilter);
    }

    setFilteredHistory(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'orange';
      case 'BOOKED':
        return 'blue';
      case 'NO-SHOW':
        return 'volcano';
      case 'IN_PROGRESS':
        return 'processing';
      case 'CHECK_OUT':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'BOOKED':
        return 'Đã đặt';
      case 'NO-SHOW':
        return 'Không đến';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'CHECK_OUT':
        return 'Hoàn tất';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status.replace('_', ' ');
    }
  };

  const handleViewDetails = (booking: BookingHistoryItem) => {
    navigate(`/boarding-schedule/${booking.bookingId}`);
  };

  const renderBookingCard = (booking: BookingHistoryItem) => (
    <Card
      key={booking.bookingId}
      className="booking-card"
      hoverable
      style={{ marginBottom: 16 }}
    >
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
            <Tag color="blue"  className="cage-tag">
              {booking.cageTypeName}
            </Tag>
          </div>
        </Col>

        {/* Check-in Date */}
        <Col xs={12} sm={4}>
          <div className="booking-info-section">
            <div className="info-label">
              <CalendarOutlined style={{ marginRight: 4, color: '#1890ff' }} />
              Ngày nhận
            </div>
            <div className="info-value">
              {new Date(booking.startDate).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </Col>

        {/* Check-out Date */}
        <Col xs={12} sm={4}>
          <div className="booking-info-section">
            <div className="info-label">
              <CalendarOutlined style={{ marginRight: 4, color: '#52c41a' }} />
              Ngày trả
            </div>
            <div className="info-value">
              {new Date(booking.endDate).toLocaleDateString('vi-VN')}
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
                minWidth: '80px', 
                textAlign: 'center',
                fontSize: '13px',
                padding: '4px 8px'
              }}
            >
              {getStatusText(booking.status)}
            </Tag>
          </div>
        </Col>

        {/* Action Button */}
        <Col xs={12} sm={4}>
          <div className="booking-actions">
            <Button 
              type="primary" 
              size="middle"
              style={{ width: '100%' }}
              onClick={() => handleViewDetails(booking)}
            >
              Chi tiết
            </Button>
          </div>
        </Col>
      </Row>
    </Card>
  );



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
      <Card style={{ overflow: 'visible', height: 'auto' }}>
        <div className="boarding-history-header">
          <Title level={2}>Lịch sử đặt gửi hộ</Title>
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Statistics Cards */}
        {/* <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Bookings"
                value={stats.total}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Confirmed"
                value={stats.confirmed}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Pending"
                value={stats.pending}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Spent"
                value={stats.totalAmount}
                formatter={(value) => getFormattedPrice(Number(value))}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row> */}

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
                style={{ width: '100%' }}
                placeholder="Lọc theo trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                suffixIcon={<FilterOutlined />}
                loading={loading}
              >
                <Option value="all">Tất cả trạng thái</Option>
                {availableStatuses.map(status => (
                  <Option key={status} value={status}>
                    {getStatusText(status)}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Lọc theo loại chuồng"
                value={cageTypeFilter}
                onChange={setCageTypeFilter}
                suffixIcon={<FilterOutlined />}
                loading={loading}
              >
                <Option value="all">Tất cả loại chuồng</Option>
                {availableCageTypes.map(cageType => (
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
            <Card style={{ textAlign: 'center', padding: '40px' }}>
              <Space direction="vertical" size="large">
                <CalendarOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                <div>
                  <Title level={4} type="secondary">Không có lịch sử đặt phòng</Title>
                  <Typography.Text type="secondary">
                    Bạn chưa có bất kỳ đặt phòng nào. Hãy đặt phòng cho hamster của bạn ngay!
                  </Typography.Text>
                </div>
              </Space>
            </Card>
          ) : (
            filteredHistory.map(booking => renderBookingCard(booking))
          )}
        </div>
      </Card>
    </div>
  );
};

export default BoardingHistory;
