import { useState, useEffect } from 'react';
import { Card, Spin, Alert, Button, Dropdown, Modal, DatePicker, message, type MenuProps } from 'antd';
import { LeftOutlined, RightOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';
import { boardingService, type BookingByDateRange } from '../../../services/BoardingService';

// Set Vietnamese locale for dayjs
dayjs.locale('vi');
import './BoardingSchedule.scss';
import { toast } from 'react-toastify';

interface Booking {
  id: string;
  cageId: string;
  cageType: string;
  startDate: number;
  endDate: number;
  customerName: string;
  hamsterName: string;
  status: string;
}

const BoardingSchedule = () => {
  const navigate = useNavigate();

  // State for current month and API data
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [bookings, setBookings] = useState<BookingByDateRange[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for extend booking modal
  const [extendModalVisible, setExtendModalVisible] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newEndDate, setNewEndDate] = useState<Dayjs | null>(null);
  const [extendLoading, setExtendLoading] = useState<boolean>(false);

  // Context menu handlers
  const handleViewDetails = (booking: Booking) => {
    navigate(`/STAFF/booking-detail/${booking.id}`);
  };

  const handleExtend = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewEndDate(null);
    setExtendModalVisible(true);
  };

  // Handle extend booking submission
  const handleExtendBooking = async () => {
    if (!selectedBooking || !newEndDate) {
      message.error('Vui lòng chọn ngày kết thúc mới');
      return;
    }

    // Get the current effective end date (prioritize newEndDate if exists)
    const currentBookingData = bookings.find(b => b.bookingId === selectedBooking.id);
    const currentEffectiveEndDate = currentBookingData?.newEndDate && currentBookingData.newEndDate !== null && currentBookingData.newEndDate !== ''
      ? dayjs(currentBookingData.newEndDate)
      : dayjs(currentBookingData?.endDate);

    if (!newEndDate.isAfter(currentEffectiveEndDate)) {
      message.error('Ngày kết thúc mới phải sau ngày kết thúc hiện tại');
      return;
    }

    try {
      setExtendLoading(true);

      const extendResponse = await boardingService.extendBooking({
        bookingId: selectedBooking.id,
        newEndDate: newEndDate.format('YYYY-MM-DD')
      });

      // Update local state with the new end date from API response
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.bookingId === selectedBooking.id
            ? { ...booking, newEndDate: extendResponse.newEndDate }
            : booking
        )
      );

      toast.success('Gia hạn thành công');
      setExtendModalVisible(false);
      setSelectedBooking(null);
      setNewEndDate(null);

    } catch (error) {
      console.error('Error extending booking:', error);
      message.error('Không thể gia hạn đặt lịch. Vui lòng thử lại.');
    } finally {
      setExtendLoading(false);
    }
  };

  // Handle modal cancel
  const handleExtendModalCancel = () => {
    setExtendModalVisible(false);
    setSelectedBooking(null);
    setNewEndDate(null);
  };

  // Create context menu items
  const getContextMenuItems = (booking: Booking): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'viewDetails',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: () => handleViewDetails(booking),
      },
    ];

    // Allow extending bookings that are in progress, checked out, or checked in
    // These are the statuses where extension makes sense
    if (booking.status === 'IN_PROGRESS' || booking.status === 'CHECK_OUT' || booking.status === 'CHECK_IN') {
      items.push({
        key: 'extend',
        label: 'Gia hạn',
        icon: <ClockCircleOutlined />,
        onClick: () => handleExtend(booking),
      });
    }

    return items;
  };

  // Fetch bookings for the current month
  const fetchBookings = async (month: Dayjs) => {
    try {
      setLoading(true);
      setError(null);

      // Expand the date range to include bookings that might span into this month
      // Fetch from 2 months before to 2 months after to capture cross-month bookings
      const startDate = month.subtract(2, 'month').startOf('month').format('YYYY-MM-DD');
      const endDate = month.add(2, 'month').endOf('month').format('YYYY-MM-DD');

      const data = await boardingService.getBookingsByDateRange({
        startDate,
        endDate
      });

      // Filter bookings to only include those that actually overlap with the current month
      const monthStart = month.startOf('month');
      const monthEnd = month.endOf('month');
      
      const filteredBookings = data.filter(booking => {
        const bookingStartDate = dayjs(booking.startDate);
        const effectiveEndDate = booking.newEndDate && booking.newEndDate !== null && booking.newEndDate !== ''
          ? dayjs(booking.newEndDate)
          : dayjs(booking.endDate);
        
        // Include booking if it overlaps with the current month
        return (bookingStartDate.isBefore(monthEnd, 'day') || bookingStartDate.isSame(monthEnd, 'day')) && 
               (effectiveEndDate.isAfter(monthStart, 'day') || effectiveEndDate.isSame(monthStart, 'day'));
      });

      setBookings(filteredBookings);
    } catch (err) {
      setError('Không thể tải dữ liệu lịch ký gửi. Vui lòng thử lại.');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Map cage type names to standard types
  const mapCageType = (apiCageTypeName: string): string => {
    const lowerName = apiCageTypeName.toLowerCase();
    if (lowerName.includes('cơ bản') || lowerName.includes('basic')) return 'Cơ bản';
    if (lowerName.includes('tiêu chuẩn') || lowerName.includes('standard')) return 'Tiêu chuẩn';
    if (lowerName.includes('đầy đủ') || lowerName.includes('full')) return 'Đầy đủ';
    if (lowerName.includes('vip')) return 'Vip';

    // Additional mapping for Vietnamese cage type names from API
    if (lowerName.includes('chuồng cơ bản')) return 'Cơ bản';
    if (lowerName.includes('chuồng tiêu chuẩn')) return 'Tiêu chuẩn';
    if (lowerName.includes('Chuồng đầy đủ')) return 'Đầy đủ';
    if (lowerName.includes('chuồng vip')) return 'Vip';

    return 'Cơ bản'; // Default fallback
  };

  // Convert API data to display format
  const convertToDisplayBookings = (apiBookings: BookingByDateRange[]): Booking[] => {
    return apiBookings.map(booking => {
      const bookingStartDate = dayjs(booking.startDate);
      // Prioritize newEndDate if it exists and is not null/empty, otherwise use endDate
      const effectiveEndDate = booking.newEndDate && booking.newEndDate !== null && booking.newEndDate !== ''
        ? booking.newEndDate
        : booking.endDate;
      const bookingEndDate = dayjs(effectiveEndDate);
      
      // Calculate the visible start and end dates within the current month
      const monthStart = currentMonth.startOf('month');
      const monthEnd = currentMonth.endOf('month');
      
      // Determine the start date to display (either booking start or month start, whichever is later)
      const displayStartDate = bookingStartDate.isBefore(monthStart) ? monthStart : bookingStartDate;
      
      // Determine the end date to display (either booking end or month end, whichever is earlier)
      const displayEndDate = bookingEndDate.isAfter(monthEnd) ? monthEnd : bookingEndDate;
      
      const startDay = displayStartDate.date();
      const endDay = displayEndDate.date();
      const cageType = mapCageType(booking.cageTypeName);

      return {
        id: booking.bookingId,
        cageId: booking.cageName, // Use the actual cage name from API
        cageType,
        startDate: startDay,
        endDate: endDay,
        customerName: booking.customerName,
        hamsterName: booking.hamsterName,
        status: booking.status
      };
    });
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchBookings(currentMonth);
  }, [currentMonth]);

  // Separate bookings by status
  // First table: Bookings that are checked in or in progress (CHECK_IN, IN_PROGRESS, CHECK_OUT)
  const checkedInBookings = convertToDisplayBookings(
    bookings.filter(booking =>
      booking.status === 'CHECK_IN' ||
      booking.status === 'IN_PROGRESS' ||
      booking.status === 'CHECK_OUT'
    )
  );

  // Second table: Bookings that are booked but not yet checked in or no-shows (BOOKED, NO-SHOW), CANCELLED
  const notCheckedInBookings = convertToDisplayBookings(
    bookings.filter(booking =>
      booking.status === 'BOOKED' ||
      booking.status === 'NO-SHOW' ||
      booking.status === 'CANCELLED'
    )
  );

  // Generate dates for the current month
  const daysInMonth = currentMonth.daysInMonth();
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const CELL_WIDTH = 80;

  // Month navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => prev.subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => prev.add(1, 'month'));
  };

  const getCageTypeClass = (cageType: string) => {
    const classes: Record<string, string> = {
      'Cơ bản': 'cage-type-basic',
      'Tiêu chuẩn': 'cage-type-standard',
      'Đầy đủ': 'cage-type-full',
      'Vip': 'cage-type-vip'
    };
    return classes[cageType] || 'cage-type-basic';
  };

  // Helper function to check if a booking has been extended
  const isBookingExtended = (bookingId: string): boolean => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    return booking?.newEndDate !== null && booking?.newEndDate !== undefined && booking?.newEndDate !== '';
  };

  const renderCheckedInGrid = () => {
    return (
      <Card
        className="schedule-card"
        title={<div className="card-title">Bảng theo dõi danh sách đã check in</div>}
        headStyle={{ background: 'linear-gradient(to right, #15803d, #16a34a)', border: 'none' }}
        bodyStyle={{ padding: 0 }}
      >
        <div className="table-container">
          <div className="table-wrapper">
            {/* Date Header Row */}
            <div className="header-row">
              <div className="cage-id-header">Tên chuồng</div>
              {dates.map(date => (
                <div key={date} className="date-cell" style={{ width: `${CELL_WIDTH}px` }}>
                  <div>{String(date).padStart(2, '0')}/{String(currentMonth.month() + 1).padStart(2, '0')}</div>
                </div>
              ))}
            </div>

            {/* Cage Type Sections */}
            {[...new Set(checkedInBookings.map(booking => booking.cageType))].sort().map((cageType) => {
              // Get unique cage names for this cage type from actual bookings
              const cagesWithBookings = [...new Set(
                checkedInBookings
                  .filter(booking => booking.cageType === cageType)
                  .map(booking => booking.cageId)
              )].sort();

              return (
                <div key={cageType}>
                  {/* Cage Type Header Row - Only show if there are bookings */}
                  {cagesWithBookings.length > 0 && (
                    <div className={`cage-type-row ${getCageTypeClass(cageType)}`}>
                      <div className="cage-type-label">{cageType}</div>
                      {dates.map(date => (
                        <div key={date} className="empty-cell" style={{ width: `${CELL_WIDTH}px` }} />
                      ))}
                    </div>
                  )}

                  {/* Cage Rows - Show actual cage names from API */}
                  {cagesWithBookings.map((cageId) => {
                    const cageBookings = checkedInBookings.filter(b => b.cageId === cageId);

                    // Function to detect overlapping bookings on the same date
                    const getBookingLayers = (bookings: Booking[]) => {
                      const layers: { [key: number]: Booking[] } = {};

                      bookings.forEach(booking => {
                        for (let date = booking.startDate; date <= booking.endDate; date++) {
                          if (!layers[date]) {
                            layers[date] = [];
                          }
                          layers[date].push(booking);
                        }
                      });

                      return layers;
                    };

                    const bookingLayers = getBookingLayers(cageBookings);

                    // Calculate maximum overlapping bookings for this cage to determine row height
                    const maxOverlappingBookings = Math.max(
                      1, // At least 1 booking
                      ...Object.values(bookingLayers).map(bookingsOnDate => bookingsOnDate.length)
                    );

                    // Calculate row height based on number of overlapping bookings
                    const baseRowHeight = 48; // Original row height
                    const bookingBarHeight = 36; // Standard booking bar height
                    const rowHeight = Math.max(baseRowHeight, maxOverlappingBookings * (bookingBarHeight + 4) + 8);

                    return (
                      <div key={cageId} className="cage-row" style={{ minHeight: `${rowHeight}px` }}>
                        <div className="cage-id-cell" style={{ minHeight: `${rowHeight}px` }}>{cageId}</div>
                        <div className="date-grid" style={{ minHeight: `${rowHeight}px` }}>
                          {/* Date cells as background */}
                          {dates.map(date => (
                            <div key={date} className="grid-cell" style={{ width: `${CELL_WIDTH}px`, minHeight: `${rowHeight}px` }} />
                          ))}

                          {/* Booking bars as overlays */}
                          {cageBookings.map((booking, index) => {
                            const duration = booking.endDate - booking.startDate + 1;
                            const leftPosition = (booking.startDate - 1) * CELL_WIDTH;
                            const barWidth = duration * CELL_WIDTH;

                            // Check if booking extends beyond current month boundaries
                            const originalBooking = bookings.find(b => b.bookingId === booking.id);
                            const bookingStartDate = dayjs(originalBooking?.startDate);
                            const effectiveEndDate = originalBooking?.newEndDate && originalBooking.newEndDate !== null && originalBooking.newEndDate !== ''
                              ? dayjs(originalBooking.newEndDate)
                              : dayjs(originalBooking?.endDate);
                            
                            const monthStart = currentMonth.startOf('month');
                            const monthEnd = currentMonth.endOf('month');
                            const continuesFromPrevious = bookingStartDate.isBefore(monthStart, 'day');
                            const continuesIntoNext = effectiveEndDate.isAfter(monthEnd, 'day');

                            // Calculate the layer position for this booking
                            let bookingLayer = 0;
                            for (let date = booking.startDate; date <= booking.endDate; date++) {
                              const bookingsOnDate = bookingLayers[date] || [];
                              if (bookingsOnDate.length > 1) {
                                bookingLayer = bookingsOnDate.findIndex(b => b.id === booking.id);
                                break;
                              }
                            }

                            // Calculate vertical position based on layer
                            const topOffset = 4 + (bookingLayer * (bookingBarHeight + 4));

                            return (
                              <Dropdown
                                key={booking.id}
                                menu={{ items: getContextMenuItems(booking) }}
                                trigger={['contextMenu']}
                              >
                                <div
                                  className={`booking-bar ${
                                    isBookingExtended(booking.id) 
                                      ? 'booking-bar-extended' 
                                      : booking.status === 'IN_PROGRESS'
                                        ? 'booking-bar-blue'
                                        : booking.status === 'CHECK_OUT'
                                          ? 'booking-bar-green'
                                          : 'booking-bar-green'
                                  } ${continuesFromPrevious ? 'continues-from-previous' : ''} ${continuesIntoNext ? 'continues-into-next' : ''}`}
                                  style={{
                                    left: `${leftPosition + 4}px`,
                                    width: `${barWidth - 8}px`,
                                    height: `${bookingBarHeight}px`,
                                    top: `${topOffset}px`,
                                    position: 'absolute',
                                    zIndex: 10 + index,
                                  }}
                                >
                                  <div className="booking-text">
                                    {continuesFromPrevious && <span className="continuation-indicator">◀ </span>}
                                    {booking.customerName} - {booking.hamsterName}
                                    {isBookingExtended(booking.id) && <span className="extended-indicator"> (Đã gia hạn)</span>}
                                    {continuesIntoNext && <span className="continuation-indicator"> ▶</span>}
                                  </div>
                                </div>
                              </Dropdown>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  };

  const renderNotCheckedInGrid = () => {
    return (
      <Card
        className="schedule-card"
        title={<div className="card-title">Bảng theo dõi danh sách chưa check in</div>}
        headStyle={{ background: 'linear-gradient(to right, #c2410c, #ea580c)', border: 'none' }}
        bodyStyle={{ padding: 0 }}
      >
        <div className="table-container">
          <div className="table-wrapper">
            {/* Date Header Row */}
            <div className="header-row">
              <div className="cage-id-header">Loại chuồng</div>
              {dates.map(date => (
                <div key={date} className="date-cell" style={{ width: `${CELL_WIDTH}px` }}>
                  <div>{String(date).padStart(2, '0')}/{String(currentMonth.month() + 1).padStart(2, '0')}</div>
                </div>
              ))}
            </div>

            {/* Booking Rows */}
            {notCheckedInBookings.map((booking) => {
              const duration = booking.endDate - booking.startDate + 1;
              const leftPosition = (booking.startDate - 1) * CELL_WIDTH;
              const barWidth = duration * CELL_WIDTH;

              // Check if booking extends beyond current month boundaries
              const originalBooking = bookings.find(b => b.bookingId === booking.id);
              const bookingStartDate = dayjs(originalBooking?.startDate);
              const effectiveEndDate = originalBooking?.newEndDate && originalBooking.newEndDate !== null && originalBooking.newEndDate !== ''
                ? dayjs(originalBooking.newEndDate)
                : dayjs(originalBooking?.endDate);
              
              const monthStart = currentMonth.startOf('month');
              const monthEnd = currentMonth.endOf('month');
              const continuesFromPrevious = bookingStartDate.isBefore(monthStart, 'day');
              const continuesIntoNext = effectiveEndDate.isAfter(monthEnd, 'day');

              return (
                <div key={booking.id} className="cage-row">
                  <div className={`cage-type-cell ${getCageTypeClass(booking.cageType)}`}>
                    {booking.cageType}
                  </div>
                  <div className="date-grid">
                    {/* Date cells as background */}
                    {dates.map(date => (
                      <div key={date} className="grid-cell" style={{ width: `${CELL_WIDTH}px` }} />
                    ))}

                    {/* Booking bar as overlay */}
                    <Dropdown
                      menu={{ items: getContextMenuItems(booking) }}
                      trigger={['contextMenu']}
                    >
                      <div
                        className={`booking-bar ${
                          // CANCELLED or NO-SHOW bookings get red bar
                          booking.status === 'NO-SHOW'
                            ? 'booking-bar-red'
                            : booking.status === 'CANCELLED'
                              ? 'booking-bar-red'
                              : booking.status === 'IN_PROGRESS'
                                ? 'booking-bar-blue'
                                : booking.status === 'CHECK_OUT'
                                  ? 'booking-bar-green'
                                  : (isBookingExtended(booking.id) ? 'booking-bar-extended' : 'booking-bar-orange')
                          } ${continuesFromPrevious ? 'continues-from-previous' : ''} ${continuesIntoNext ? 'continues-into-next' : ''}`}
                        style={{
                          left: `${leftPosition + 4}px`,
                          width: `${barWidth - 8}px`,
                        }}
                      >
                        <div className="booking-text">
                          {continuesFromPrevious && <span className="continuation-indicator">◀ </span>}
                          {booking.customerName} - {booking.hamsterName}
                          {isBookingExtended(booking.id) && <span className="extended-indicator"> (Đã gia hạn)</span>}
                          {continuesIntoNext && <span className="continuation-indicator"> ▶</span>}
                        </div>
                      </div>
                    </Dropdown>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="boarding-schedule">
        <div className="schedule-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px' }}>Đang tải dách sách lịch ký gửi...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="boarding-schedule">
        <div className="schedule-container">
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => fetchBookings(currentMonth)}>
                Thử lại
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="boarding-schedule">
      <div className="schedule-container">
        <div className="page-header">
          <h1 className="page-title">Quản lí Lịch Ký Gửi Hamster</h1>
          <p className="page-subtitle">Theo dõi và Quản lí lịch trình ký gửi theo thời gian thực</p>

          {/* Month Navigation */}
          <div className="month-navigation" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '16px'
          }}>
            <Button
              type="default"
              icon={<LeftOutlined />}
              onClick={goToPreviousMonth}
            >
              Tháng trước
            </Button>
            <h2 style={{ margin: 0, minWidth: '200px', textAlign: 'center' }}>
              {currentMonth.format('MM/YYYY')}
            </h2>
            <Button
              type="default"
              icon={<RightOutlined />}
              onClick={goToNextMonth}
            >
              Tháng sau
            </Button>
          </div>
        </div>

        {renderCheckedInGrid()}
        {renderNotCheckedInGrid()}
      </div>

      {/* Extend Booking Modal */}
      <Modal
        title="Gia hạn đặt lịch"
        open={extendModalVisible}
        onOk={handleExtendBooking}
        onCancel={handleExtendModalCancel}
        confirmLoading={extendLoading}
        okText="Gia hạn"
        cancelText="Hủy"
        width={500}
      >
        {selectedBooking && (
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Khách hàng:</strong> {selectedBooking.customerName}</p>
            <p><strong>Hamster:</strong> {selectedBooking.hamsterName}</p>
            <p><strong>Loại lồng:</strong> {selectedBooking.cageType}</p>
            <p><strong>Ngày kết thúc hiện tại:</strong> {(() => {
              // Get the current booking data to check for newEndDate
              const currentBookingData = bookings.find(b => b.bookingId === selectedBooking.id);
              const effectiveEndDate = currentBookingData?.newEndDate && currentBookingData.newEndDate !== null && currentBookingData.newEndDate !== ''
                ? dayjs(currentBookingData.newEndDate)
                : dayjs().year(currentMonth.year()).month(currentMonth.month()).date(selectedBooking.endDate);
              return effectiveEndDate.format('DD/MM/YYYY');
            })()}</p>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Chọn ngày kết thúc mới:
          </label>
          <DatePicker
            value={newEndDate}
            onChange={setNewEndDate}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày kết thúc mới"
            style={{ width: '100%' }}
            disabledDate={(current) => {
              if (!selectedBooking) return true;
              // Get the current booking data to check for newEndDate
              const currentBookingData = bookings.find(b => b.bookingId === selectedBooking.id);
              const effectiveEndDate = currentBookingData?.newEndDate && currentBookingData.newEndDate !== null && currentBookingData.newEndDate !== ''
                ? dayjs(currentBookingData.newEndDate)
                : dayjs().year(currentMonth.year()).month(currentMonth.month()).date(selectedBooking.endDate);
              // Disable dates that are on or before the current end date
              return current && (current.isBefore(effectiveEndDate, 'day') || current.isSame(effectiveEndDate, 'day'));
            }}
          />
        </div>

        <Alert
          message="Lưu ý"
          description="Ngày kết thúc mới phải sau ngày kết thúc hiện tại. Phí gia hạn sẽ được tính theo số ngày gia hạn."
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Modal>
    </div>
  );
};

export default BoardingSchedule;