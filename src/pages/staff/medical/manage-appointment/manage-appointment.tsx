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
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getAppointments, type Appointment, type AppointmentFilters } from '../../../../services/MedicalService';
import './manage-appointment.scss';

const { Title } = Typography;
const { Option } = Select;

const ManageAppointment: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Veterinarian options (can be fetched from API later)
  const veterinarians = [
    { value: '', label: 'Tất cả Bác sĩ' },
    // Add more veterinarians as needed
  ];

  // Filter states
  const [filters, setFilters] = useState<AppointmentFilters>({
    date: dayjs().format('YYYY-MM-DD'),
    serviceType: 'MEDICAL',
    sortDir: 'asc',
    page: 0,
    size: 10,
  });

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'Tất cả Trạng thái' },
    { value: 'BOOKED', label: 'Đã đặt' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  // Fetch appointments
  const fetchAppointments = async (newFilters?: Partial<AppointmentFilters>) => {
    setLoading(true);
    try {
      const filterParams = { ...filters, ...newFilters };
      const response = await getAppointments(filterParams);
      
      setAppointments(response.data.content);
      setPagination({
        current: response.data.pageNumber + 1,
        pageSize: response.data.pageSize,
        total: response.data.totalElements,
      });
    } catch (error) {
      message.error('Không thể tải danh sách cuộc hẹn. Vui lòng thử lại.');
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof AppointmentFilters, value: any) => {
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
    };
    setFilters(defaultFilters);
    fetchAppointments(defaultFilters);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'booked':
        return 'blue';
      case 'confirmed':
        return 'cyan';
      case 'in_progress':
        return 'orange';
      case 'completed':
        return 'green';
      case 'cancelled':
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
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status.replace('_', ' ');
    }
  };

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
        <span>{dayjs(date).format('DD/MM/YYYY HH:mm')}</span>
      ),
      sorter: true,
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
            <FilterOutlined /> Quản lý Cuộc hẹn Y tế
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
                    value={filters.veterinarianId || ''}
                    onChange={(value) => handleFilterChange('veterinarianId', value || undefined)}
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
