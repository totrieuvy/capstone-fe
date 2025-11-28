import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  DatePicker,
  Select,
  Button,
  Typography,
  Row,
  Col,
  message,
  Tag,
  Spin,
} from 'antd';
import {  ClearOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getAppointments, getStaffByRole, type Appointment, type AppointmentFilters, type StaffByRole } from '../../../../services/MedicalService';
import './manage-appointment.scss';

const { Title } = Typography;
const { Option } = Select;

const ManageAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]); // Store unfiltered data for filter options
  const [veterinarianOptions, setVeterinarianOptions] = useState<StaffByRole[]>([]); // Store vet list for filter
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filter states
  const [filters, setFilters] = useState<AppointmentFilters & { veterinarianName?: string }>({
    date: dayjs().format('YYYY-MM-DD'),
    serviceType: 'MEDICAL',
    sortDir: 'asc',
    page: 0,
    size: 10,
  });

  // Fetch appointments and veterinarians
  const fetchAppointments = async (newFilters?: Partial<AppointmentFilters & { veterinarianName?: string }>) => {
    setLoading(true);
    try {
      const filterParams = { ...filters, ...newFilters };
      // Separate veterinarianName from API filters since it's not supported by the API
      const { veterinarianName, ...apiFilters } = filterParams;

      // Fetch all appointments for the date without status filter to populate filter options
      const allAppointmentsForDate = await getAppointments({
        date: apiFilters.date,
        serviceType: apiFilters.serviceType,
        sortDir: apiFilters.sortDir,
        page: 0,
        size: 1000,
      });
      setAllAppointments(allAppointmentsForDate.data.content);

      // Fetch veterinarian list for filter options
      const vetRes = await getStaffByRole('VET');
      setVeterinarianOptions(vetRes.data || []);

      // Then fetch filtered appointments (with status filter if applied)
      const response = await getAppointments(apiFilters);
      let filteredAppointments = response.data.content;
      // Apply client-side filtering for veterinarian name (fullName)
      if (veterinarianName) {
        filteredAppointments = filteredAppointments.filter(appointment => 
          appointment.veterinarianName === veterinarianName
        );
      }
      setAppointments(filteredAppointments);
      setPagination({
        current: response.data.pageNumber + 1,
        pageSize: response.data.pageSize,
        total: veterinarianName ? filteredAppointments.length : response.data.totalElements,
      });
    } catch (error) {
      message.error('Không thể tải danh sách cuộc hẹn. Vui lòng thử lại.');
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof (AppointmentFilters & { veterinarianName?: string }), value: any) => {
    const newFilters = { ...filters, [key]: value, page: 0 };
    setFilters(newFilters);
    fetchAppointments(newFilters);
  };

  // Handle pagination changes
  const handleTableChange = (page: number, pageSize?: number) => {
    const newFilters = {
      ...filters,
      page: page - 1,
      size: pageSize || filters.size,
    };
    setFilters(newFilters);
    fetchAppointments(newFilters);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const defaultFilters = {
      date: dayjs().format('YYYY-MM-DD'),
      serviceType: 'MEDICAL' as const,
      sortDir: 'asc' as const,
      page: 0,
      size: 10,
      veterinarianName: undefined,
    };
    setFilters(defaultFilters);
    fetchAppointments(defaultFilters);
  };

  // Get status color
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
      case 'FAILED':
        return 'red';
        case 'NO_SHOW':
          return 'red';
      default:
        return 'default';
    }
  };

  // Get status text in Vietnamese
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
        return 'Hoàn thành';
        case 'FAILED':
        return 'Thanh toán thất bại';
        case 'NO_SHOW':
        return 'Khách không tới';
      default:
        return status.replace('_', ' ');
    }
  };

  // Use a fixed list of statuses for filtering
  const fixedStatusList = [
    { value: '', label: 'Tất cả Trạng thái' },
    { value: 'BOOKED', label: getStatusText('BOOKED') },
    { value: 'CHECKED_IN', label: getStatusText('CHECKED_IN') },
    { value: 'IN_PROGRESS', label: getStatusText('IN_PROGRESS') },
    { value: 'CHECK_OUT', label: getStatusText('CHECK_OUT') },
    { value: 'CANCELLED', label: getStatusText('CANCELLED') },
    { value: 'FAILED', label: getStatusText('FAILED') },
    { value: 'NO_SHOW', label: getStatusText('NO_SHOW') },
  ];

  // Veterinarian filter options from API
  const veterinarianFilterOptions = [
    { value: '', label: 'Tất cả Bác sĩ' },
    ...veterinarianOptions.map(vet => ({
      value: vet.fullName,
      label: vet.fullName
    }))
  ];

  // Use fixed status options and veterinarian options from API
  const statusOptions = fixedStatusList;
  const veterinarians = veterinarianFilterOptions;

  // Table columns
  const columns: ColumnsType<Appointment> = [
    {
      title: 'Tên Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: true,
      render: (text: string) => (
        <span className="customer-name">{text}</span>
      ),
    },
    {
      title: 'Tên Chuột hamster',
      dataIndex: 'hamsterName',
      key: 'hamsterName',
      render: (text: string) => (
        <span className="hamster-name">{text}</span>
      ),
    },
    {
      title: 'Thời gian Hẹn',
      dataIndex: 'appointmentTime',
      key: 'appointmentTime',
      render: (date: string) => (
        <span>{dayjs(date).format('DD/MM/YYYY ')}</span>
      ),
      sorter: true,
    },
    {
      title: 'Slot',
      dataIndex: 'slotStart',
      key: 'slotStart',
      render: (time: string) => (
        <span>{dayjs(time, 'HH:mm:ss').isValid() ? dayjs(time, 'HH:mm:ss').format('HH:mm') : time}</span>
      ),
    },
    {
      title: 'Bác sĩ Thú y',
      dataIndex: 'veterinarianName',
      key: 'veterinarianName',
      render: (text: string) => (
        <span className="veterinarian-name">{text || 'Chưa phân công'}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="status-tag">
          {getStatusText(status)}
        </Tag>
      ),
      filters: statusOptions.slice(1).map(option => ({
        text: option.label,
        value: option.value,
      })),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => navigate(`/STAFF/lich-dat-kham/${record.id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  // Initial load
  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="manage-appointment">
      <Card className="appointment-container">
        <div className="header-section">
          <Title level={2} className="page-title">
             Quản lí lịch khám
          </Title>
          
          {/* Filter Section */}
          <Card className="filter-card" size="small">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={8} md={6}>
                <div className="filter-item">
                    {/* Filter by date */}
                  <DatePicker
                    value={filters.date ? dayjs(filters.date) : dayjs()}
                    onChange={(date) => 
                      handleFilterChange('date', date ? date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'))
                    }
                    style={{ width: '100%' }}
                    placeholder="Chọn ngày"
                  />
                </div>
              </Col>
              
              <Col xs={24} sm={8} md={6}>
                <div className="filter-item">
                    {/* Filter by status */}
                  <Select
                    value={filters.status || ''}
                    onChange={(value) => handleFilterChange('status', value || undefined)}
                    style={{ width: '100%' }}
                    placeholder="Chọn trạng thái"
                  >
                    {statusOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              
              <Col xs={24} sm={8} md={6}>
                <div className="filter-item">
                    {/* Filter by veterinarian */}
                  <Select
                    value={filters.veterinarianName || ''}
                    onChange={(value) => handleFilterChange('veterinarianName', value || undefined)}
                    style={{ width: '100%' }}
                    placeholder="Chọn bác sĩ"
                  >
                    {veterinarians.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              
              <Col xs={24} sm={24} md={6}>
                <div className="filter-item">
                  <Button
                    type="default"
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    style={{ width: '100%' }}
                  >
                    Xóa Bộ lọc
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        {/* Table Section */}
        <Card className="table-card">
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={appointments}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} cuộc hẹn`,
                onChange: handleTableChange,
                onShowSizeChange: handleTableChange,
              }}
              className="appointments-table"
              scroll={{ x: 800 }}
              size="middle"
            />
          </Spin>
        </Card>
      </Card>
    </div>
  );
};

export default ManageAppointment;
