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
  isExtended?: boolean;
  isOriginalSegment?: boolean;
  isExtendedSegment?: boolean;
  hasTransfer?: boolean;
  originalBookingId?: string;
  // Added fields for extension support
  newEndDate?: string | null;
  newCageTypeId?: string | null;
  newCageTypeName?: string | null;
  newCageName?: string | null;
  cageTypeName?: string;
  cageName?: string;  
  isIncident?: boolean;
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
  
  // State for cage selection
  const [allCageTypes, setAllCageTypes] = useState<any[]>([]);
  const [selectedCageTypeId, setSelectedCageTypeId] = useState<string | null>(null);
  const [availableCages, setAvailableCages] = useState<any[]>([]);
  const [selectedCageId, setSelectedCageId] = useState<string | null>(null);
  const [loadingCages, setLoadingCages] = useState<boolean>(false);

  // State for transfer booking hover effect
  const [hoveredTransferBooking, setHoveredTransferBooking] = useState<string | null>(null);

  // Context menu handlers
  const handleViewDetails = (booking: Booking) => {
    const originalBookingId = booking.originalBookingId || booking.id;
    navigate(`/STAFF/booking-detail/${originalBookingId}`);
  };

  const handleExtend = async (booking: Booking) => {
    const originalBookingId = booking.originalBookingId || booking.id;
    setSelectedBooking({
      ...booking,
      id: originalBookingId
    });
    setNewEndDate(null);
    setSelectedCageId(null);
    
    try {
      // Get current booking data
      const currentBookingData = bookings.find(b => b.bookingId === originalBookingId);
      if (currentBookingData) {
      }
      
      // Load all cage types first
      await loadAllCageTypes();
      
      // Set current cage type as default
      if (currentBookingData) {
        const currentCageTypeId = currentBookingData.cageTypeId;
        setSelectedCageTypeId(currentCageTypeId);
        
        // Get the current effective end date
        const currentEffectiveEndDate = currentBookingData.newEndDate && currentBookingData.newEndDate !== null && currentBookingData.newEndDate !== ''
          ? currentBookingData.newEndDate
          : currentBookingData.endDate;
        
        // Calculate extension start date (end date + 1 day)
        // This prevents the current cage from showing as "In Use" for the extension period
        const extensionStartDate = dayjs(currentEffectiveEndDate).add(1, 'day').format('YYYY-MM-DD');
        
        // Load cages for current cage type with date range
        // Note: We'll load initially with a placeholder end date, actual filtering happens when user selects new end date
        const futureDate = dayjs(currentEffectiveEndDate).add(31, 'days').format('YYYY-MM-DD');
        await loadCagesForType(currentCageTypeId, extensionStartDate, futureDate);
      }
    } catch (error) {
      console.error('Error initializing extend modal:', error);
    }
    
    setExtendModalVisible(true);
  };

  // Function to load all cage types for dropdown
  const loadAllCageTypes = async () => {
    try {
      // Use a date range to get all available cage types
      const today = dayjs();
      const futureDate = today.add(30, 'days');
      
      const availabilityData = await boardingService.checkAvailability({
        startDate: today.format('YYYY-MM-DD'),
        endDate: futureDate.format('YYYY-MM-DD')
      });
      
      setAllCageTypes(availabilityData);
    } catch (error) {
      console.error('Error loading cage types:', error);
    }
  };
  // Function to load cages for selected cage type with date range
  const loadCagesForType = async (cageTypeId: string, startDate: string, endDate: string) => {
    try {
      setLoadingCages(true);
      const availableCagesForType = await boardingService.getAvailableCagesByType({
        cageTypeId,
        startDate,
        endDate
      });
      setAvailableCages(availableCagesForType);
    } catch (error) {
      console.error('Error loading cages for type:', error);
      message.error('Không thể tải danh sách chuồng.');
    } finally {
      setLoadingCages(false);
    }
  };

  // Handle cage type selection
  const handleCageTypeSelect = async (cageTypeId: string) => {
    setSelectedCageTypeId(cageTypeId);
    setSelectedCageId(null); // Reset cage selection
    
    // Get the current booking data to determine date range
    if (selectedBooking) {
      const currentBookingData = bookings.find(b => b.bookingId === selectedBooking.id);
      if (currentBookingData) {
        // Get the current effective end date
        const currentEffectiveEndDate = currentBookingData.newEndDate && currentBookingData.newEndDate !== null && currentBookingData.newEndDate !== ''
          ? currentBookingData.newEndDate
          : currentBookingData.endDate;
        
        // Calculate extension start date (end date + 1 day)
        const extensionStartDate = dayjs(currentEffectiveEndDate).add(1, 'day').format('YYYY-MM-DD');
        
        // If user has selected a new end date, use it; otherwise use a placeholder future date
        const extensionEndDate = newEndDate 
          ? newEndDate.format('YYYY-MM-DD')
          : dayjs(currentEffectiveEndDate).add(31, 'days').format('YYYY-MM-DD');
        
        await loadCagesForType(cageTypeId, extensionStartDate, extensionEndDate);
      }
    }
  };

  // Handle extend booking submission
  const handleExtendBooking = async () => {
    if (!selectedBooking || !newEndDate || !selectedCageTypeId || !selectedCageId) {
      message.error('Vui lòng chọn đầy đủ thông tin: ngày kết thúc, loại chuồng và chuồng cụ thể');
      return;
    }

    // Get the current booking data
    const currentBookingData = bookings.find(b => b.bookingId === selectedBooking.id);
    if (!currentBookingData) {
      message.error('Không tìm thấy thông tin đặt lịch hiện tại');
      return;
    }

    // Calculate the current effective end date
    const currentEffectiveEndDate = currentBookingData.newEndDate && currentBookingData.newEndDate !== null && currentBookingData.newEndDate !== ''
      ? dayjs(currentBookingData.newEndDate)
      : dayjs(currentBookingData.endDate);

    if (!newEndDate.isAfter(currentEffectiveEndDate)) {
      message.error('Ngày kết thúc mới phải sau ngày kết thúc hiện tại');
      return;
    }

    try {
      setExtendLoading(true);

      // Fetch current booking details to get existing services
      let existingServiceIds: string[] = [];
      try {
        const bookingDetails = await boardingService.getBookingDetails(selectedBooking.id);
        console.log('Booking details:', bookingDetails);
        
        // Extract service IDs from current booking, but only carry over FOOD services
        if (bookingDetails.services && Array.isArray(bookingDetails.services)) {
          existingServiceIds = bookingDetails.services
            .filter((service: any) => service.serviceType === 'FOOD')
            .map((service: any) => service.serviceId);
        }
        
        // Remove duplicates (if any)
        existingServiceIds = [...new Set(existingServiceIds)];
        console.log('Existing FOOD services to carry over:', existingServiceIds);
      } catch (detailsError) {
        console.warn('Could not fetch booking details, proceeding without service carryover:', detailsError);
      }

      // Prepare extend request
      const extendRequest: any = {
        bookingId: selectedBooking.id,
        newEndDate: newEndDate.format('YYYY-MM-DD')
      };

      // Include existing FOOD services in the extension if any exist
      if (existingServiceIds.length > 0) {
        extendRequest.serviceIds = existingServiceIds;
        console.log('Including existing FOOD services in extension:', existingServiceIds);
      }

      // Determine scenario based on current vs selected cage info
      const currentCageName = currentBookingData.cageName;
      const currentCageTypeId = currentBookingData.cageTypeId;
      const selectedCage = availableCages.find(cage => cage.cageId === selectedCageId);
      const selectedType = allCageTypes.find(type => type.cageTypeId === selectedCageTypeId);

      if (!selectedCage) {
        message.error('Không tìm thấy thông tin chuồng được chọn');
        return;
      }

      // Always include CageTypeId and CageId in the extend request
      // The API expects these parameters to properly assign the cage for the extension period
      extendRequest.CageTypeId = selectedCageTypeId;
      extendRequest.CageId = selectedCageId;

      // Determine extension scenario for logging and UI update purposes
      const isSameCage = selectedCageTypeId === currentCageTypeId && selectedCage.cageName === currentCageName;
      const isSameCageType = selectedCageTypeId === currentCageTypeId && selectedCage.cageName !== currentCageName;
      const isDifferentCageType = selectedCageTypeId !== currentCageTypeId;

      if (isSameCage) {
        console.log('Extension: Same cage', selectedCageTypeId, selectedCageId);
      } else if (isSameCageType) {
        console.log('Extension: Same cage type, different cage', selectedCageTypeId, selectedCageId);
      } else if (isDifferentCageType) {
        console.log('Extension: Different cage type', selectedCageTypeId, selectedCageId);
      }

      console.log('Extend request:', extendRequest);
      const extendResponse = await boardingService.extendBooking(extendRequest);
      console.log('Extend response:', extendResponse);

      // Determine if this was a cage change extension
      const isCageChange = !isSameCage;
      
      // Update local state with the complete extension response
      setBookings(prevBookings =>
        prevBookings.map(booking => {
          if (booking.bookingId === selectedBooking.id) {
            const updatedBooking = {
              ...booking,
              newEndDate: extendResponse.newEndDate
            };
            
            // If cage transfer occurred, update the new cage information
            if (isCageChange) {
              updatedBooking.newCageTypeId = selectedCageTypeId;
              updatedBooking.newCageName = selectedCage.cageName;
              updatedBooking.newCageTypeName = selectedType?.typeName || null;
              console.log('Updated booking with cage transfer:', updatedBooking);
            } else {
              console.log('Updated booking without cage transfer:', updatedBooking);
            }
            
            return updatedBooking;
          }
          return booking;
        })
      );

      // Refresh the bookings data to ensure consistency with backend
      await fetchBookings(currentMonth);

      toast.success('Gia hạn thành công');
      handleExtendModalCancel();

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
    setAllCageTypes([]);
    setSelectedCageTypeId(null);
    setAvailableCages([]);
    setSelectedCageId(null);
  };

  // Fetch bookings for the current month
  const getContextMenuItems = (booking: Booking): MenuProps['items'] => {
    const items: MenuProps['items'] = [];
    // Always show 'Xem chi tiết'
    items.push({
      key: 'viewDetails',
      label: 'Xem chi tiết',
      icon: <EyeOutlined />,
      onClick: () => handleViewDetails(booking),
    });

    // Only show 'Gia hạn' if not extended, not CHECK_OUT, and not incident
    if (!booking.newEndDate && (booking.isIncident === false) && (booking.status === 'IN_PROGRESS' || booking.status === 'CHECKED_IN')) {
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

  // Convert API data to display format with support for cage transfers
  const convertToDisplayBookings = (apiBookings: BookingByDateRange[]): Booking[] => {
    const displayBookings: Booking[] = [];
    
    apiBookings.forEach(booking => {
      const bookingStartDate = dayjs(booking.startDate);
      const originalEndDate = dayjs(booking.endDate);
      const effectiveEndDate = booking.newEndDate && booking.newEndDate !== null && booking.newEndDate !== ''
        ? dayjs(booking.newEndDate)
        : originalEndDate;
      
      // Calculate the visible start and end dates within the current month
      const monthStart = currentMonth.startOf('month');
      const monthEnd = currentMonth.endOf('month');
      
      // Check if this booking has a cage transfer (different cage types or names)
      const hasCageTransfer = booking.newCageTypeId && 
        (booking.newCageTypeId !== booking.cageTypeId || 
         booking.newCageName !== booking.cageName);
      
      if (hasCageTransfer) {
        // Create two booking segments: original period and extended period
        
        // First segment: Original booking period in original cage
        const originalDisplayStartDate = bookingStartDate.isBefore(monthStart) ? monthStart : bookingStartDate;
        const originalDisplayEndDate = originalEndDate.isAfter(monthEnd) ? monthEnd : originalEndDate;
        
        if (originalDisplayStartDate.isBefore(originalDisplayEndDate) || originalDisplayStartDate.isSame(originalDisplayEndDate)) {
          const originalCageType = mapCageType(booking.cageTypeName);
          displayBookings.push({
            id: `${booking.bookingId}_original`,
            cageId: booking.cageName || 'N/A',
            cageType: originalCageType,
            startDate: originalDisplayStartDate.date(),
            endDate: originalDisplayEndDate.date(),
            customerName: booking.customerName,
            hamsterName: booking.hamsterName,
            status: booking.status,
            isOriginalSegment: true,
            hasTransfer: true,
            originalBookingId: booking.bookingId,
            newEndDate: booking.newEndDate,
            isIncident: booking.isIncident
          });
        }
        
        // Second segment: Extended period in new cage (only if extension goes beyond original end date)
        if (effectiveEndDate.isAfter(originalEndDate)) {
          const extendedStartDate = originalEndDate.add(1, 'day');
          const extendedDisplayStartDate = extendedStartDate.isBefore(monthStart) ? monthStart : extendedStartDate;
          const extendedDisplayEndDate = effectiveEndDate.isAfter(monthEnd) ? monthEnd : effectiveEndDate;
          
          if (extendedDisplayStartDate.isBefore(extendedDisplayEndDate) || extendedDisplayStartDate.isSame(extendedDisplayEndDate)) {
            const newCageType = mapCageType(booking.newCageTypeName || booking.cageTypeName);
            displayBookings.push({
              id: `${booking.bookingId}_extended`,
              cageId: booking.newCageName || booking.cageName || 'N/A',
              cageType: newCageType,
              startDate: extendedDisplayStartDate.date(),
              endDate: extendedDisplayEndDate.date(),
              customerName: booking.customerName,
              hamsterName: booking.hamsterName,
              status: booking.status,
              isExtendedSegment: true,
              hasTransfer: true,
              originalBookingId: booking.bookingId,
              newEndDate: booking.newEndDate,
              isIncident: booking.isIncident
            });
          }
        }
      } else {
        // Regular booking without cage transfer
        const displayStartDate = bookingStartDate.isBefore(monthStart) ? monthStart : bookingStartDate;
        const displayEndDate = effectiveEndDate.isAfter(monthEnd) ? monthEnd : effectiveEndDate;
        
        if (displayStartDate.isBefore(displayEndDate) || displayStartDate.isSame(displayEndDate)) {
          const cageType = mapCageType(booking.cageTypeName);
          displayBookings.push({
            id: booking.bookingId,
            cageId: booking.cageName || 'N/A',
            cageType,
            startDate: displayStartDate.date(),
            endDate: displayEndDate.date(),
            customerName: booking.customerName,
            hamsterName: booking.hamsterName,
            status: booking.status,
            isExtended: !!(booking.newEndDate && booking.newEndDate !== null && booking.newEndDate !== ''),
            originalBookingId: booking.bookingId,
            newEndDate: booking.newEndDate,
            isIncident: booking.isIncident
          });
        }
      }
    });
    
    return displayBookings;
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchBookings(currentMonth);
  }, [currentMonth]);

  // Reload cages when new end date is selected
  useEffect(() => {
    if (newEndDate && selectedCageTypeId && selectedBooking) {
      const currentBookingData = bookings.find(b => b.bookingId === selectedBooking.id);
      if (currentBookingData) {
        const currentEffectiveEndDate = currentBookingData.newEndDate && currentBookingData.newEndDate !== null && currentBookingData.newEndDate !== ''
          ? currentBookingData.newEndDate
          : currentBookingData.endDate;
        
        // Calculate extension start date (end date + 1 day)
        const extensionStartDate = dayjs(currentEffectiveEndDate).add(1, 'day').format('YYYY-MM-DD');
        
        // Reload cages with the new date range
        loadCagesForType(selectedCageTypeId, extensionStartDate, newEndDate.format('YYYY-MM-DD'));
      }
    }
  }, [newEndDate]);

  // Separate bookings by status
  // First table: Bookings that are checked in or in progress (CHECK_IN, IN_PROGRESS, CHECK_OUT, INCIDENT)
  const checkedInBookings = convertToDisplayBookings(
    bookings.filter(booking =>
      booking.status === 'CHECK_IN' ||
      booking.status === 'IN_PROGRESS' ||
      booking.status === 'CHECK_OUT' ||
      booking.isIncident === true
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

  // Helper function to get the transfer indicator for a booking segment
  const getTransferIndicator = (booking: Booking): string => {
    if (booking.hasTransfer) {
      if (booking.isOriginalSegment) {
        return ' (Đã gia hạn)';
      } else if (booking.isExtendedSegment) {
        return ' (Đã gia hạn)';
      }
    } else if (booking.isExtended) {
      return ' (Đã gia hạn)';
    }
    return '';
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

                    // Function to assign layers to bookings based on actual visual overlap
                    const assignBookingLayers = (bookings: Booking[]): Map<string, number> => {
                      const layerAssignments = new Map<string, number>();
                      
                      // Sort bookings by start date, then by end date
                      const sortedBookings = [...bookings].sort((a, b) => {
                        if (a.startDate !== b.startDate) {
                          return a.startDate - b.startDate;
                        }
                        return a.endDate - b.endDate;
                      });

                      // Track which layer is occupied until which date
                      const layerEndDates: number[] = [];

                      sortedBookings.forEach(booking => {
                        // Find the first available layer where the booking can fit
                        let assignedLayer = -1;
                        
                        for (let layer = 0; layer < layerEndDates.length; layer++) {
                          // A booking can use this layer if it starts AFTER the previous booking in this layer ends
                          // We don't consider same-day as overlap (allows consecutive bookings on same row)
                          if (booking.startDate > layerEndDates[layer]) {
                            assignedLayer = layer;
                            layerEndDates[layer] = booking.endDate;
                            break;
                          }
                        }

                        // If no available layer found, create a new one
                        if (assignedLayer === -1) {
                          assignedLayer = layerEndDates.length;
                          layerEndDates.push(booking.endDate);
                        }

                        layerAssignments.set(booking.id, assignedLayer);
                      });

                      return layerAssignments;
                    };

                    const bookingLayerMap = assignBookingLayers(cageBookings);
                    
                    // Calculate maximum number of layers needed
                    const maxLayers = Math.max(1, ...Array.from(bookingLayerMap.values()).map(layer => layer + 1));

                    // Calculate row height based on number of layers
                    const baseRowHeight = 48; // Original row height
                    const bookingBarHeight = 36; // Standard booking bar height
                    const rowHeight = Math.max(baseRowHeight, maxLayers * (bookingBarHeight + 4) + 8);

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

                            // Get the layer position for this booking
                            const bookingLayer = bookingLayerMap.get(booking.id) || 0;

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
                                    bookings.find(b => b.bookingId === (booking.originalBookingId || booking.id))?.isIncident
                                      ? 'booking-bar-red'
                                      : booking.status === 'CHECK_OUT'
                                        ? 'booking-bar-green'
                                        : booking.hasTransfer && booking.isExtendedSegment
                                          ? 'booking-bar-transfer-extended'
                                          : booking.hasTransfer && booking.isOriginalSegment
                                            ? 'booking-bar-transfer-original'
                                            : booking.isExtended
                                              ? 'booking-bar-cyan'
                                              : booking.status === 'IN_PROGRESS'
                                                ? 'booking-bar-blue'
                                                : 'booking-bar-green'
                                  } ${
                                    booking.hasTransfer && hoveredTransferBooking === booking.originalBookingId 
                                      ? 'transfer-booking-hovered' 
                                      : ''
                                  } ${continuesFromPrevious ? 'continues-from-previous' : ''} ${continuesIntoNext ? 'continues-into-next' : ''}`}
                                  style={{
                                    left: `${leftPosition + 4}px`,
                                    width: `${barWidth - 8}px`,
                                    height: `${bookingBarHeight}px`,
                                    top: `${topOffset}px`,
                                    position: 'absolute',
                                    zIndex: booking.hasTransfer && hoveredTransferBooking === booking.originalBookingId 
                                      ? 60 + index 
                                      : 10 + index,
                                  }}
                                  onMouseEnter={() => {
                                    if (booking.hasTransfer && booking.originalBookingId) {
                                      setHoveredTransferBooking(booking.originalBookingId);
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    if (booking.hasTransfer) {
                                      setHoveredTransferBooking(null);
                                    }
                                  }}
                                >
                                  <div className="booking-text">
                                    {continuesFromPrevious && <span className="continuation-indicator">◀ </span>}
                                    {booking.customerName} - {booking.hamsterName}
                                    {getTransferIndicator(booking) && <span className="extended-indicator">{getTransferIndicator(booking)}</span>}
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
                          bookings.find(b => b.bookingId === (booking.originalBookingId || booking.id))?.isIncident
                            ? 'booking-bar-red'
                            : booking.status === 'CANCELLED' || booking.status === 'NO-SHOW'
                              ? 'booking-bar-red'
                              : booking.status === 'CHECK_OUT'
                                ? 'booking-bar-green'
                                : booking.hasTransfer && booking.isExtendedSegment
                                  ? 'booking-bar-transfer-extended'
                                  : booking.hasTransfer && booking.isOriginalSegment
                                    ? 'booking-bar-transfer-original'
                                    : booking.isExtended
                                      ? 'booking-bar-cyan'
                                      : booking.status === 'IN_PROGRESS'
                                        ? 'booking-bar-blue'
                                        : 'booking-bar-orange'
                          } ${
                            booking.hasTransfer && hoveredTransferBooking === booking.originalBookingId 
                              ? 'transfer-booking-hovered' 
                              : ''
                          } ${continuesFromPrevious ? 'continues-from-previous' : ''} ${continuesIntoNext ? 'continues-into-next' : ''}`}
                        style={{
                          left: `${leftPosition + 4}px`,
                          width: `${barWidth - 8}px`,
                          zIndex: booking.hasTransfer && hoveredTransferBooking === booking.originalBookingId 
                            ? 60 
                            : 'auto',
                        }}
                        onMouseEnter={() => {
                          if (booking.hasTransfer && booking.originalBookingId) {
                            setHoveredTransferBooking(booking.originalBookingId);
                          }
                        }}
                        onMouseLeave={() => {
                          if (booking.hasTransfer) {
                            setHoveredTransferBooking(null);
                          }
                        }}
                      >
                        <div className="booking-text">
                          {continuesFromPrevious && <span className="continuation-indicator">◀ </span>}
                          {booking.customerName} - {booking.hamsterName}
                          {getTransferIndicator(booking) && <span className="extended-indicator">{getTransferIndicator(booking)}</span>}
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
      <div className="schedule-container" style={{ maxWidth: '1800px', width: '100%', margin: '0 auto' }}>
        <div className="page-header">
          <h1 className="page-title">Quản lí Lịch Ký Gửi Hamster</h1>
          {/* <p className="page-subtitle">Theo dõi và Quản lí lịch trình ký gửi theo thời gian thực</p> */}

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
          
          {/* Booking Status Legend */}
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '12px', color: '#1f2937' }}>Chú thích màu:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '20px',
                  height: '16px',
                  backgroundColor: '#f97316',
                  borderRadius: '4px'
                }}></div>
                <span>Chưa check in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '16px', 
                  backgroundColor: '#3b82f6', 
                  borderRadius: '4px' 
                }}></div>
                <span>Đang thực hiện</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '16px', 
                  backgroundColor: '#22c55e', 
                  borderRadius: '4px' 
                }}></div>
                <span>Hoàn tất</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '16px', 
                  backgroundColor: '#06b6d4', 
                  borderRadius: '4px' 
                }}></div>
                <span>Đã gia hạn</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '16px', 
                  backgroundColor: '#ef4444', 
                  borderRadius: '4px' 
                }}></div>
                <span>Sự cố</span>
              </div>
            </div>
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
        width={800}
        okButtonProps={{ 
          disabled: !newEndDate || !selectedCageTypeId || !selectedCageId 
        }}
      >
        {selectedBooking && (
          <div style={{ marginBottom: '24px' }}>
            {/* Booking Info Summary */}
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong>Khách hàng:</strong> {selectedBooking.customerName}
                </div>
                <div>
                  <strong>Hamster:</strong> {selectedBooking.hamsterName}
                </div>
                <div>
                  <strong>Chuồng hiện tại:</strong> {(() => {
                    const currentBookingData = bookings.find(b => b.bookingId === selectedBooking.id);
                    return currentBookingData?.cageName || '';
                  })()} ({(() => {
                    const currentBookingData = bookings.find(b => b.bookingId === selectedBooking.id);
                    return currentBookingData?.cageTypeName || '';
                  })()})
                </div>
                <div>
                  <strong>Ngày kết thúc hiện tại:</strong> {(() => {
                    const currentBookingData = bookings.find(b => b.bookingId === selectedBooking.id);
                    const currentEffectiveEndDate = currentBookingData?.newEndDate && currentBookingData.newEndDate !== null && currentBookingData.newEndDate !== ''
                      ? currentBookingData.newEndDate
                      : currentBookingData?.endDate;
                    return dayjs(currentEffectiveEndDate).format('DD/MM/YYYY');
                  })()} 
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                Chọn ngày kết thúc mới:
              </label>
              <DatePicker
                value={newEndDate}
                onChange={setNewEndDate}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày kết thúc mới"
                style={{ width: '100%', height: '40px' }}
                disabledDate={(current) => {
                  if (!selectedBooking) return true;
                  const currentBookingData = bookings.find(b => b.bookingId === selectedBooking.id);
                  const currentEffectiveEndDate = currentBookingData?.newEndDate && currentBookingData.newEndDate !== null && currentBookingData.newEndDate !== ''
                    ? dayjs(currentBookingData.newEndDate)
                    : dayjs(currentBookingData?.endDate);
                  return current && (current.isBefore(dayjs(), 'day') || current.isSame(currentEffectiveEndDate, 'day') || current.isBefore(currentEffectiveEndDate, 'day'));
                }}
              />
            </div>

            {/* Cage Type Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                Loại chuồng:
              </label>
              <select
                value={selectedCageTypeId || ''}
                onChange={(e) => handleCageTypeSelect(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Chọn loại chuồng</option>
                {allCageTypes.map(cageType => (
                  <option key={cageType.cageTypeId} value={cageType.cageTypeId}>
                    {cageType.typeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Available Cages */}
            {selectedCageTypeId && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  Chọn chuồng cụ thể:
                </label>
                
                {loadingCages ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin /> Đang tải danh sách chuồng...
                  </div>
                ) : availableCages.length > 0 ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: '12px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '4px'
                  }}>
                    {availableCages.map(cage => {
                      const isInUse = cage.status === 'In Use' || cage.status === 'IN_USE';
                      const isDisabled = isInUse;
                      
                      return (
                        <div
                          key={cage.cageId}
                          onClick={() => !isDisabled && setSelectedCageId(cage.cageId)}
                          style={{
                            padding: '12px 8px',
                            border: selectedCageId === cage.cageId 
                              ? '2px solid #1890ff' 
                              : isDisabled
                                ? '1px solid #ffccc7'
                                : '1px solid #d9d9d9',
                            borderRadius: '8px',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            textAlign: 'center',
                            backgroundColor: selectedCageId === cage.cageId 
                              ? '#e6f7ff' 
                              : isDisabled
                                ? '#fff1f0'
                                : 'white',
                            transition: 'all 0.2s',
                            position: 'relative',
                            opacity: isDisabled ? 0.6 : 1
                          }}
                        >
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            {cage.cageName}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: isInUse ? '#ff4d4f' : '#52c41a',
                            fontWeight: '500'
                          }}>
                            {isInUse ? 'Hết chỗ' : 'Có sẵn'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert
                    message="Không có chuồng khả dụng"
                    description="Không có chuồng nào của loại này khả dụng."
                    type="warning"
                    showIcon
                  />
                )}
              </div>
            )}
            
            {newEndDate && !selectedCageTypeId && (
              <Alert
                message="Lưu ý"
                description="Vui lòng chọn loại chuồng để tiếp tục."
                type="info"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BoardingSchedule;