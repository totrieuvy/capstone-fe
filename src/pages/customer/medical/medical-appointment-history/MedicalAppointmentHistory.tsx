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
    FilterOutlined,
    UserOutlined,
    MedicineBoxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { getMedicalAppointmentHistory } from '../../../../services/MedicalService';
import type { Appointment } from '../../../../services/MedicalService';
import './MedicalAppointmentHistory.scss';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const MedicalAppointmentHistory: React.FC = () => {
    const navigate = useNavigate();
    const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchAppointmentHistory();
    }, []);

    useEffect(() => {
        filterAppointments();
    }, [appointmentHistory, searchText, statusFilter]);

    const fetchAppointmentHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getMedicalAppointmentHistory();
            setAppointmentHistory(response.data.content);
        } catch (err) {
            setError('Failed to fetch appointment history. Please try again.');
            console.error('Error fetching appointment history:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterAppointments = () => {
        let filtered = [...appointmentHistory];

        // Filter by search text (hamster name or appointment ID)
        if (searchText) {
            filtered = filtered.filter(
                appointment =>
                    appointment.hamsterName.toLowerCase().includes(searchText.toLowerCase()) ||
                    appointment.id.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(appointment => appointment.status === statusFilter);
        }

        setFilteredHistory(filtered);
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'BOOKED':
                return 'blue';
            case 'CHECKED_IN':
                return 'cyan';
            case 'IN_PROGRESS':
                return 'orange';
            case 'NO-SHOW':
                return 'volcano';
            case 'CANCELLED':
                return 'red';
            case 'CHECK_OUT':
                return 'green';
            case 'CONFIRMED':
                return 'success';
            case 'PAID':
                return 'blue';
            case 'CHECK_IN':
                return 'cyan';
            case 'COMPLETED':
                return 'green';
                case 'FAILED':
                return 'red';
                case 'INCIDENT':
                return 'red';
                case 'NO_SHOW':
                return 'red';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toUpperCase()) {
            case 'BOOKED':
                return 'Đã đặt';
            case 'CHECKED_IN':
                return 'Đã check-in';
            case 'IN_PROGRESS':
                return 'Đang thực hiện';
            case 'NO-SHOW':
                return 'Không đến';
            case 'CANCELLED':
                return 'Đã hủy';
            case 'CHECK_OUT':
                return 'Hoàn tất';
            case 'CONFIRMED':
                return 'Đã xác nhận';
            case 'PAID':
                return 'Đã thanh toán';
            case 'CHECK_IN':
                return 'Đã check-in';
            case 'COMPLETED':
                return 'Hoàn thành';
                case 'FAILED':
                return 'Thanh toán thất bại';
                case 'INCIDENT':
                return 'Có sự cố';
                case 'NO_SHOW':
                return 'Không đến';
            default:
                return status.replace('_', ' ');
        }
    };

    const handleViewDetails = (appointment: Appointment) => {
        // Navigate to appointment details page (you may need to adjust this route)
        navigate(`/lich-su-kham/${appointment.id}`);
    };

    const renderAppointmentCard = (appointment: Appointment) => (
        <Card
            key={appointment.id}
            className="appointment-card"
            hoverable
            style={{ marginBottom: 16 }}
        >
            <Row gutter={[16, 16]} align="middle">
                {/* Hamster Name */}
                <Col xs={24} sm={4}>
                    <div className="appointment-info-section">
                        <div className="info-label">Tên hamster</div>
                        <div className="hamster-name">{appointment.hamsterName}</div>
                    </div>
                </Col>

                {/* Appointment Date & Time */}
                <Col xs={12} sm={5}>
                    <div className="appointment-info-section">
                        <div className="info-label">
                            <CalendarOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                            Ngày khám
                        </div>
                        <div className="info-value">
                            {dayjs(appointment.appointmentTime).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')}
                        </div>
                    </div>
                </Col>

                {/* Veterinarian */}
                <Col xs={12} sm={4}>
                    <div className="appointment-info-section">
                        <div className="info-label">
                            <UserOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                            Bác sĩ
                        </div>
                        <div className="info-value">
                            {appointment.veterinarianName || 'Chưa phân công'}
                        </div>
                    </div>
                </Col>

                {/* Status */}
                <Col xs={12} sm={4}>
                    <div className="appointment-info-section">
                        {/* <div className="info-label">Trạng thái</div> */}
                        <Tag
                            color={getStatusColor(appointment.status)}
                            style={{
                                minWidth: '80px',
                                textAlign: 'center',
                                fontSize: '13px',
                                padding: '4px 8px'
                            }}
                        >
                            {getStatusText(appointment.status)}
                        </Tag>
                    </div>
                </Col>

                {/* Action Button */}
                <Col xs={12} sm={4}>
                    <div className="appointment-actions">
                        <Button
                            type="primary"
                            size="middle"
                            style={{ width: '100%' }}
                            onClick={() => handleViewDetails(appointment)}
                        >
                            Chi tiết
                        </Button>
                    </div>
                </Col>
            </Row>
        </Card>
    );

    if (loading) {
        return (
            <div className="medical-history-loading">
                <Spin size="large" />
                <p>Loading appointment history...</p>
            </div>
        );
    }

    return (
        <div className="medical-appointment-history">
            <Card style={{ overflow: 'visible', height: 'auto' }}>
                <div className="medical-history-header">
                    <Title level={2}>Lịch sử khám bệnh</Title>
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

                {/* Filters */}
                <Card size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16} align="middle">
                        <Col xs={24} sm={10}>
                            <Search
                                placeholder="Tìm kiếm theo tên hamster hoặc mã lịch hẹn"
                                allowClear
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                prefix={<SearchOutlined />}
                            />
                        </Col>
                        <Col xs={24} sm={8}>
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Lọc theo trạng thái"
                                value={statusFilter}
                                onChange={setStatusFilter}
                                suffixIcon={<FilterOutlined />}
                            >
                                <Option value="all">Tất cả trạng thái</Option>
                                <Option value="CONFIRMED">Confirmed</Option>
                                <Option value="PAID">Paid</Option>
                                <Option value="CHECK_IN">Check-in</Option>
                                <Option value="IN_PROGRESS">In Progress</Option>
                                <Option value="COMPLETED">Completed</Option>
                                <Option value="CANCELLED">Cancelled</Option>
                                <Option value="NO-SHOW">No Show</Option>
                            </Select>
                        </Col>
                    </Row>
                </Card>

                {/* Appointment Cards */}
                <div className="appointment-cards-container">
                    {filteredHistory.length === 0 ? (
                        <Card style={{ textAlign: 'center', padding: '40px' }}>
                            <Space direction="vertical" size="large">
                                <MedicineBoxOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                                <div>
                                    <Title level={4} type="secondary">Không có lịch sử khám bệnh</Title>
                                    <Text type="secondary">
                                        Bạn chưa có bất kỳ lịch hẹn khám bệnh nào. Hãy đặt lịch khám cho hamster của bạn ngay!
                                    </Text>
                                </div>
                            </Space>
                        </Card>
                    ) : (
                        filteredHistory.map(appointment => renderAppointmentCard(appointment))
                    )}
                </div>
            </Card>
        </div>
    );
};

export default MedicalAppointmentHistory;
