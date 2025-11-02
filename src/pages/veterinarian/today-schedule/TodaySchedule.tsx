import { useState, useEffect } from 'react';
import { Button, Tag, DatePicker, message, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { getAppointments } from '../../../services/MedicalService';
import './TodaySchedule.scss';

// Configure dayjs plugins for timezone handling
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

interface Appointment {
  id: string;
  customerName: string;
  hamsterName: string;
  startTime: string;
  endTime: string;
  status: 'CHECKED_IN' | 'IN_PROGRESS' | 'CHECK_OUT';
  statusLabel: string;
}

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00'
];

const statusConfig = {
  'CHECKED_IN': { color: '#4DB6AC', bg: '#80CBC4', label: 'Đã nhận' },
  'IN_PROGRESS': { color: '#FDD835', bg: '#FFF59D', label: 'Đang khám' },
  'CHECK_OUT': { color: '#4CAF50', bg: '#A5D6A7', label: 'Hoàn thành' }
};

export default function HamsterSchedule() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs().tz('Asia/Ho_Chi_Minh'));
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Helper function to format time from API (HH:mm:ss) to display format (HH:mm)
  const formatTimeSlot = (timeString: string): string => {
    return timeString.substring(0, 5); // "09:00:00" -> "09:00"
  };

  // Handle navigation to appointment detail
  const handleViewDetail = (appointmentId: string) => {
    navigate(`/VET/lich-kham/${appointmentId}`);
  };

  // Fetch appointments for the selected date
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Format date in UTC+7 timezone
        const dateStr = selectedDate.tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
        const response = await getAppointments({
          date: dateStr,
          serviceType: 'MEDICAL'
        });

        // Transform API data to component format and filter only relevant statuses
        const transformedAppointments: Appointment[] = response.data.content
          .filter(apiApt => ['CHECKED_IN', 'IN_PROGRESS', 'CHECK_OUT'].includes(apiApt.status))
          .map(apiApt => ({
            id: apiApt.id,
            customerName: apiApt.customerName,
            hamsterName: apiApt.hamsterName,
            startTime: formatTimeSlot(apiApt.slotStart), // Convert "09:00:00" to "09:00"
            endTime: formatTimeSlot(apiApt.slotEnd),     // Convert "10:00:00" to "10:00"
            status: apiApt.status as 'CHECKED_IN' | 'IN_PROGRESS' | 'CHECK_OUT',
            statusLabel: statusConfig[apiApt.status as keyof typeof statusConfig]?.label || apiApt.status
          }));

        setAppointments(transformedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        message.error('Không thể tải lịch hẹn');
        setAppointments([]);
      }
    };

    fetchAppointments();
  }, [selectedDate]);

  const getAppointmentForTime = (time: string) => {
    return appointments.find(apt => apt.startTime === time);
  };

  const isBreakTime = (time: string) => {
    return time === '12:00';
  };

  const isAfterWork = (time: string) => {
    return time === '17:00';
  };

  const handlePrevDay = () => {
    setSelectedDate(selectedDate.subtract(1, 'day').tz('Asia/Ho_Chi_Minh'));
  };

  const handleNextDay = () => {
    setSelectedDate(selectedDate.add(1, 'day').tz('Asia/Ho_Chi_Minh'));
  };

  return (
    <div className="schedule-container">
      <div className="page-header">
        <Title level={2} style={{ margin: '0 0 24px 0', textAlign: 'center', color: '#1890ff' }}>
          Lịch khám hôm nay
        </Title>
      </div>
      
      <div className="schedule-header">
        <Button 
          icon={<LeftOutlined />} 
          onClick={handlePrevDay}
          className="nav-button"
        />
        <DatePicker 
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          format="DD/MM/YYYY"
          className="date-picker"
        />
        <Button 
          icon={<RightOutlined />} 
          onClick={handleNextDay}
          className="nav-button"
        />
      </div>

      <div className="schedule-grid">
        <div className="time-column">
          <div className="column-header">Giờ</div>
          {timeSlots.map(time => (
            <div key={time} className="time-slot">
              {time}
            </div>
          ))}
        </div>

        <div className="appointments-column">
          <div className="column-header">Khám</div>
          {timeSlots.map(time => {
            const appointment = getAppointmentForTime(time);
            
            if (isBreakTime(time)) {
              return (
                <div key={time} className="break-slot">
                  <span>Giải lao</span>
                </div>
              );
            }

            if (isAfterWork(time)) {
              return (
                <div key={time} className="break-slot">
                  <span>Tan việc</span>
                </div>
              );
            }

            if (!appointment) {
              return <div key={time} className="empty-slot" />;
            }

            const config = statusConfig[appointment.status];

            return (
              <div 
                key={appointment.id} 
                className="appointment-slot"
                style={{ 
                  backgroundColor: config.bg,
                  borderLeft: `4px solid ${config.color}`
                }}
              >
                <div className="appointment-info">
                  <div className="appointment-text">
                    <div><strong>Khách hàng:</strong> {appointment.customerName}</div>
                    <div><strong>Hamster:</strong> {appointment.hamsterName}</div>
                    <div className="time-range">{appointment.startTime} - {appointment.endTime}</div>
                  </div>
                  <div className="appointment-actions">
                    <Tag color={config.color} className="status-tag">
                      {appointment.statusLabel}
                    </Tag>
                    <Button 
                      size="small" 
                      className="action-btn secondary"
                      onClick={() => handleViewDetail(appointment.id)}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}