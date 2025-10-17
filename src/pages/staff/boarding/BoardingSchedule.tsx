import { useState, useEffect } from 'react';
import { Card, Spin, Alert, Button, Dropdown, type MenuProps } from 'antd';
import { LeftOutlined, RightOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';
import { boardingService, type BookingByDateRange } from '../../../services/BoardingService';

// Set Vietnamese locale for dayjs
dayjs.locale('vi');
import './BoardingSchedule.scss';

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
  const cagesByType = {
    'Cơ bản': ['CB-001', 'CB-002', 'CB-003'],
    'Tiêu chuẩn': ['TC-001', 'TC-002', 'TC-003'],
    'Đầy đủ': ['DD-001', 'DD-002', 'DD-003'],
    'Vip': ['VIP-001', 'VIP-002', 'VIP-003']
  };

  // State for current month and API data
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [bookings, setBookings] = useState<BookingByDateRange[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Context menu handlers
  const handleViewDetails = (booking: Booking) => {
    navigate(`/STAFF/booking-detail/${booking.id}`);
  };

  const handleExtend = (booking: Booking) => {
    console.log('Extend booking:', booking);
    // TODO: Implement extend booking functionality
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

    // Only show extend button if status is not PAID, CONFIRMED, CHECK_IN or CHECK_OUT
    if (booking.status !== 'PAID' && booking.status !== 'CONFIRMED' && booking.status !== 'CHECK_IN' && booking.status !== 'CHECK_OUT') {
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
      
      const startDate = month.startOf('month').format('YYYY-MM-DD');
      const endDate = month.endOf('month').format('YYYY-MM-DD');
      
      const data = await boardingService.getBookingsByDateRange({
        startDate,
        endDate
      });
      
      setBookings(data);
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
    return 'Cơ bản'; // Default fallback
  };

  // Convert API data to display format
  const convertToDisplayBookings = (apiBookings: BookingByDateRange[]): Booking[] => {
    const cageAssignments: { [key: string]: number } = {};
    
    return apiBookings.map(booking => {
      const startDay = dayjs(booking.startDate).date();
      const endDay = dayjs(booking.endDate).date();
      const cageType = mapCageType(booking.cageTypeName);
      
      // Assign virtual cage IDs based on cage type
      const typePrefix = cageType === 'Cơ bản' ? 'CB' : 
                        cageType === 'Tiêu chuẩn' ? 'TC' : 
                        cageType === 'Đầy đủ' ? 'DD' : 'VIP';
      
      if (!cageAssignments[cageType]) {
        cageAssignments[cageType] = 1;
      }
      
      const cageNumber = cageAssignments[cageType];
      cageAssignments[cageType]++;
      
      return {
        id: booking.bookingId,
        cageId: `${typePrefix}-${String(cageNumber).padStart(3, '0')}`,
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
  // First table: Bookings that are checked in or in progress (CHECKED_IN, IN_PROGRESS, CHECK_OUT)
  const checkedInBookings = convertToDisplayBookings(
    bookings.filter(booking => 
      booking.status === 'IN_PROGRESS' || 
      booking.status === 'CHECK_OUT'
    )
  );
  
  // Second table: Bookings that are paid or confirmed but not yet checked in (PAID, CONFIRMED)
  const notCheckedInBookings = convertToDisplayBookings(
    bookings.filter(booking => 
      booking.status === 'PAID' || 
      booking.status === 'CHECK_IN' ||
      booking.status === 'CONFIRMED'
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
              <div className="cage-id-header">Mã Lồng</div>
              {dates.map(date => (
                <div key={date} className="date-cell" style={{ width: `${CELL_WIDTH}px` }}>
                  <div>{String(date).padStart(2, '0')}/{String(currentMonth.month() + 1).padStart(2, '0')}</div>
                </div>
              ))}
            </div>

            {/* Cage Type Sections */}
            {Object.entries(cagesByType).map(([cageType, cages]) => {
              // Filter cages that have bookings for this cage type
              const cagesWithBookings = cages.filter(cageId => 
                checkedInBookings.some(booking => booking.cageId === cageId)
              );
              
              return (
                <div key={cageType}>
                  {/* Cage Type Header Row - Always show */}
                  <div className={`cage-type-row ${getCageTypeClass(cageType)}`}>
                    <div className="cage-type-label">{cageType}</div>
                    {dates.map(date => (
                      <div key={date} className="empty-cell" style={{ width: `${CELL_WIDTH}px` }} />
                    ))}
                  </div>

                  {/* Cage Rows - Only show cages with bookings */}
                  {cagesWithBookings.map((cageId) => {
                    const cageBookings = checkedInBookings.filter(b => b.cageId === cageId);
                    
                    return (
                      <div key={cageId} className="cage-row">
                        <div className="cage-id-cell">{cageId}</div>
                        <div className="date-grid">
                          {/* Date cells as background */}
                          {dates.map(date => (
                            <div key={date} className="grid-cell" style={{ width: `${CELL_WIDTH}px` }} />
                          ))}
                          
                          {/* Booking bars as overlays */}
                          {cageBookings.map(booking => {
                            const duration = booking.endDate - booking.startDate + 1;
                            const leftPosition = (booking.startDate - 1) * CELL_WIDTH;
                            const barWidth = duration * CELL_WIDTH;
                            
                            return (
                              <Dropdown
                                key={booking.id}
                                menu={{ items: getContextMenuItems(booking) }}
                                trigger={['contextMenu']}
                              >
                                <div
                                  className="booking-bar booking-bar-green"
                                  style={{
                                    left: `${leftPosition + 4}px`,
                                    width: `${barWidth - 8}px`,
                                  }}
                                >
                                  <div className="booking-text">
                                    {booking.customerName} - {booking.hamsterName}
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
              <div className="cage-id-header">Loại Lồng</div>
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
                        className={`booking-bar ${booking.status === 'CHECK_IN' ? 'booking-bar-green' : 'booking-bar-orange'}`}
                        style={{
                          left: `${leftPosition + 4}px`,
                          width: `${barWidth - 8}px`,
                        }}
                      >
                        <div className="booking-text">
                          {booking.customerName} - {booking.hamsterName}
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
          <h1 className="page-title">Quản Lý Lịch Ký Gửi Hamster</h1>
          <p className="page-subtitle">Theo dõi và quản lý lịch trình ký gửi theo thời gian thực</p>
          
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
              {currentMonth.format('MMMM YYYY')}
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
    </div>
  );
};

export default BoardingSchedule;