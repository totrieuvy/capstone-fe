import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Tag,
  Spin,
  message,
  Descriptions,
  Divider,
  Avatar,
  Space,
  Modal,
  Image,
  Select,
  Form,
  Alert,
  Table,
  Tooltip,
  Badge,
  Collapse,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  FileImageOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
  ExperimentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { 
  getAppointmentById, 
  updateAppointmentStatus,
  type AppointmentDetail,
  type AppointmentItemDetail,
  type MedicalRecord
} from '../../../services/MedicalService';
import ProfileHamsterService, { type Species } from '../../../services/ProfileHamsterService';
import { toast } from 'react-toastify';

import './VetAppointmentDetail.scss';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

const VetAppointmentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Tiến hành button loading state
  const [progressLoading, setProgressLoading] = useState<boolean>(false);
  
  // Medical record modal states
  const [medicalRecordModalVisible, setMedicalRecordModalVisible] = useState<boolean>(false);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<MedicalRecord | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string>('');

  // Species update modal states
  const [speciesUpdateModalVisible, setSpeciesUpdateModalVisible] = useState<boolean>(false);
  const [speciesLoading, setSpeciesLoading] = useState<boolean>(false);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('');
  const [updateHamsterLoading, setUpdateHamsterLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Fetch appointment details
  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;
    
    setLoading(true);
    try {
      const response = await getAppointmentById(appointmentId);
      setAppointment(response.data);
    } catch (error) {
      message.error('Không thể tải thông tin cuộc hẹn. Vui lòng thử lại.');
      console.error('Error fetching appointment details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'BOOKED':
        return 'blue';
      case 'CHECKED_IN':
      case 'CHECK_IN':
        return 'cyan';
      case 'IN_PROGRESS':
        return 'orange';
      case 'CHECK_OUT':
      case 'CHECKED_OUT':
        return 'green';
      case 'NO-SHOW':
        return 'volcano';
      case 'CANCELLED':
        return 'red';
      case 'COMPLETED':
        return 'green';
      case 'FAILED':
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
      case 'CHECK_IN':
        return 'Đã check-in';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'CHECK_OUT':
        return 'Hoàn thành';
      case 'NO-SHOW':
        return 'Không đến';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CONFIRMED':
        return 'Đã xác nhận';
        case 'FAILED':
          return 'Thanh toán thất bại';
      default:
        return status.replace('_', ' ');
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };





  // Handle medical record modal
  const handleMedicalRecordClick = (item: AppointmentItemDetail) => {
    if (item.medicalRecord) {
      setSelectedMedicalRecord(item.medicalRecord);
      setSelectedServiceName(item.serviceName);
      setMedicalRecordModalVisible(true);
    } else {
      message.info('Dịch vụ này chưa có hồ sơ bệnh án');
    }
  };





  // Fetch species list
  const fetchSpeciesList = async () => {
    setSpeciesLoading(true);
    try {
      const species = await ProfileHamsterService.getSpecies();
      setSpeciesList(species);
    } catch (error) {
      message.error('Không thể tải danh sách loài. Vui lòng thử lại.');
      console.error('Error fetching species:', error);
    } finally {
      setSpeciesLoading(false);
    }
  };

  // Open species update modal
  const openSpeciesUpdateModal = () => {
    if (!appointment) return;
    
    // Find current species name from the species list or get it from appointment
    fetchSpeciesList();
    setSelectedSpeciesId(appointment.speciesId);
    setSpeciesUpdateModalVisible(true);
  };

  // Handle species update
  const handleSpeciesUpdate = async () => {
    if (!appointment || !selectedSpeciesId) {
      message.error('Vui lòng chọn loài hamster!');
      return;
    }

    setUpdateHamsterLoading(true);
    try {
      // Use the specific change species API
      await ProfileHamsterService.changeSpecies({
        hamsterId: appointment.hamsterId,
        speciesId: selectedSpeciesId,
      });
      
      toast.success('Cập nhật loài hamster thành công!');
      setSpeciesUpdateModalVisible(false);
      
      // Refresh appointment data to get updated species
      await fetchAppointmentDetails();
      
    } catch (error) {
      message.error('Cập nhật thất bại! Vui lòng thử lại.');
      console.error('Error updating hamster species:', error);
    } finally {
      setUpdateHamsterLoading(false);
    }
  };

  // Get species name by ID
  const getSpeciesNameById = (speciesId: string) => {
    const species = speciesList.find(s => s.id === speciesId);
    return species ? species.speciesName : 'Chưa xác định';
  };

  // Handle progress status update and redirect to examination
  const handleProgress = async () => {
    if (!appointmentId) {
      message.error('Không tìm thấy ID cuộc hẹn!');
      return;
    }

    setProgressLoading(true);
    try {
      // If status is already IN_PROGRESS, just redirect without API call
      if (appointment?.status === 'IN_PROGRESS') {
        message.success('Chuyển đến trang thực hiện khám bệnh!');
        navigate(`/VET/examination/${appointmentId}`);
      } else {
        // If status is CHECK_IN or CHECKED_IN, update to IN_PROGRESS first
        await updateAppointmentStatus(appointmentId, 'IN_PROGRESS');
        message.success('Đã chuyển trạng thái sang đang thực hiện!');
        
        // Redirect to examination page
        navigate(`/VET/examination/${appointmentId}`);
      }
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại! Vui lòng thử lại.');
      console.error('Error updating appointment status:', error);
    } finally {
      setProgressLoading(false);
    }
  };



  useEffect(() => {
    fetchAppointmentDetails();
    fetchSpeciesList();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="veterinarian-appointment-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="veterinarian-appointment-detail-error">
        <Card>
          <Title level={4}>Không tìm thấy thông tin cuộc hẹn</Title>
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/VET/lich-kham-hom-nay')}
          >
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="veterinarian-appointment-detail">
      <Card className="veterinarian-appointment-detail-container">
        {/* Header */}
        <div className="veterinarian-detail-header">
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/VET/lich-kham-hom-nay')}
                >
                  Quay lại
                </Button>
                <Title level={2} style={{ margin: 0 }}>
                  Chi tiết cuộc hẹn khám
                </Title>
              </Space>
            </Col>
            <Col>
              <Tag color={getStatusColor(appointment.status)} className="veterinarian-status-tag-large">
                {getStatusText(appointment.status)}
              </Tag>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* Main Content */}
        <Row gutter={[24, 24]}>
          {/* Customer & Hamster Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Thông tin khách hàng & thú cưng</span>
                </Space>
              }
              className="veterinarian-info-card"
            >
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Tên khách hàng">
                  <Text strong>{appointment.customerName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tên hamster">
                  <Space>
                    <Text strong>{appointment.hamsterName}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Loài hamster">
                  <Space>
                    <Text strong>{getSpeciesNameById(appointment.speciesId)}</Text>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={openSpeciesUpdateModal}
                      style={{ padding: 0 }}
                    >
                      Chỉnh sửa
                    </Button>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Appointment Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  <span>Thông tin cuộc hẹn</span>
                </Space>
              }
              className="veterinarian-info-card"
            >
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Ngày hẹn">
                  <Text strong>
                  <Text strong>{dayjs(appointment.appointmentTime, "DD-MM-YYYY").tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY")}</Text>
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Giờ hẹn">
                  <Text strong>
                    {appointment.slotStart} - {appointment.slotEnd}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian tạo">
                  {dayjs(appointment.createdAt).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Veterinarian Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <MedicineBoxOutlined />
                  <span>Thông tin bác sĩ thú y</span>
                </Space>
              }
              className="veterinarian-info-card"
            >
              {appointment.veterinarian ? (
                <div className="veterinarian-info">
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div className="vet-header">
                      <Space>
                        <Avatar size="large" icon={<UserOutlined />} />
                        <div>
                          <Text strong style={{ fontSize: '16px' }}>
                            {appointment.veterinarian.name}
                          </Text>
                          <br />
                          <Text type="secondary">
                            {appointment.veterinarian.gender === 'MALE' ? 'Nam' : 'Nữ'}
                          </Text>
                        </div>
                      </Space>
                    </div>
                    
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Kinh nghiệm">
                        {appointment.veterinarian.experienceYears} năm
                      </Descriptions.Item>
                      <Descriptions.Item label="Chuyên môn">
                        {appointment.veterinarian.specialization}
                      </Descriptions.Item>
                      <Descriptions.Item label="Dịch vụ tốt nhất">
                        <div className="best-services">
                          {appointment.veterinarian.bestServices.map((service, index) => (
                            <Tag key={index} color="blue">
                              {service}
                            </Tag>
                          ))}
                        </div>
                      </Descriptions.Item>
                    </Descriptions>
                  </Space>
                </div>
              ) : (
                <Text type="secondary">Chưa được phân công bác sĩ</Text>
              )}
            </Card>
          </Col>

          {/* Payment Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>Thông tin thanh toán</span>
                </Space>
              }
              className="veterinarian-info-card"
            >
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Tổng tiền ban đầu">
                  <Text strong style={{ color: '#1890ff' }}>
                    {formatPrice(appointment.totalAmount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền sau giảm giá">
                  <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                    {formatPrice(appointment.totalAmountAfter)}
                  </Text>
                </Descriptions.Item>
                {appointment.additionalAmount && (
                  <>
                    <Descriptions.Item label="Phụ phí">
                      <Text style={{ color: '#faad14' }}>
                        {formatPrice(appointment.additionalAmount)}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={`Phụ phí sau giảm (${appointment.discountPercent}%)`}>
                      <Text style={{ color: '#52c41a' }}>
                        {formatPrice(appointment.additionalAmount * (1 - appointment.discountPercent / 100))}
                      </Text>
                    </Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label="Phương thức thanh toán">
                  <Tag color={appointment.paymentMethod === 'PAID_AFTER' ? 'orange' : 'green'}>
                    {appointment.paymentMethod === 'PAID_AFTER' ? 'Thanh toán sau' : 'Đã thanh toán'}
                  </Tag>
                </Descriptions.Item>
                {/* <Descriptions.Item label="Thời gian giao dịch">
                  {appointment.transactionTime}
                </Descriptions.Item> */}
              </Descriptions>
            </Card>
          </Col>

          {/* Services Information */}
          <Col span={24}>
            <Collapse 
              defaultActiveKey={['services']} 
              className="veterinarian-services-card"
            >
              <Collapse.Panel 
                header={
                  <Space>
                    <MedicineBoxOutlined />
                    <span>Dịch vụ đã đăng ký</span>
                  </Space>
                } 
                key="services"
              >
              <Row gutter={[16, 16]}>
                {appointment.items.map((item) => (
                  <Col xs={24} md={12} lg={8} key={item.id}>
                    <Card 
                      size="small" 
                      className="veterinarian-service-item"
                      hoverable={!!item.medicalRecord}
                      onClick={() => handleMedicalRecordClick(item)}
                      style={{ 
                        cursor: item.medicalRecord ? 'pointer' : 'default',
                        border: item.medicalRecord ? '2px solid #52c41a' : '2px solid #f0f0f0'
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text strong style={{ fontSize: '16px', flex: 1 }}>
                            {item.serviceName}
                          </Text>
                          {item.medicalRecord && (
                            <Tag color="green" icon={<FileTextOutlined />}>
                              Có hồ sơ
                            </Tag>
                          )}
                        </div>
                        <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                          {formatPrice(item.price)}
                        </Text>
                        {item.serviceComboName && (
                          <Tag color="purple">Combo: {item.serviceComboName}</Tag>
                        )}
                        {item.medicalRecord && (
                          <div style={{ marginTop: '8px' }}>
                            <Space>
                              <EyeOutlined style={{ color: '#1890ff' }} />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Nhấn để xem hồ sơ bệnh án
                              </Text>
                            </Space>
                          </div>
                        )}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
              </Collapse.Panel>
            </Collapse>
          </Col>

          {/* Prescription Section */}
          {appointment.prescription && appointment.prescription.medicines.length > 0 && (
            <Col span={24}>
              <Collapse 
                defaultActiveKey={['prescription']} 
                className="veterinarian-prescription-card"
              >
                <Collapse.Panel 
                  header={
                    <Space>
                      <ExperimentOutlined style={{ color: "#722ed1" }} />
                      <span>Đơn thuốc</span>
                      <Badge 
                        count={appointment.prescription.medicines.length} 
                        style={{ backgroundColor: '#722ed1' }}
                      />
                    </Space>
                  } 
                  key="prescription"
                  extra={
                    appointment.prescription?.prescriptionUrl && (
                      <Button
                        type="primary"
                        icon={<FileTextOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(appointment.prescription!.prescriptionUrl!, "_blank");
                        }}
                        style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                        size="small"
                      >
                        Xem đơn thuốc (PDF)
                      </Button>
                    )
                  }
                >
                <div style={{ marginBottom: "20px" }}>
                  <Alert
                    message="Thông tin đơn thuốc"
                    description="Đơn thuốc được kê bởi bác sĩ thú y cho cuộc hẹn này. Vui lòng tuân thủ đúng liều dùng và thời gian dùng thuốc."
                    type="info"
                    showIcon
                    style={{ border: '1px solid #d6e4ff', background: '#f6f9ff' }}
                  />
                </div>

                <Table
                  dataSource={appointment.prescription.medicines.map((medicine, index) => ({
                    key: medicine.id,
                    index: index + 1,
                    ...medicine
                  }))}
                  pagination={false}
                  size="middle"
                  bordered
                  style={{ 
                    background: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                  scroll={{ x: 800 }}
                  columns={[
                    {
                      title: '#',
                      dataIndex: 'index',
                      key: 'index',
                      width: 50,
                      align: 'center',
                      render: (index: number) => (
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #722ed1, #9254de)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            margin: '0 auto'
                          }}
                        >
                          {index}
                        </div>
                      ),
                    },
                    {
                      title: (
                        <Space>
                          <MedicineBoxOutlined style={{ color: '#722ed1' }} />
                          <span>Tên thuốc</span>
                        </Space>
                      ),
                      dataIndex: 'medicineName',
                      key: 'medicineName',
                      width: 200,
                      render: (name: string) => (
                        <Text strong style={{ color: '#262626', fontSize: '14px' }}>
                          {name}
                        </Text>
                      ),
                    },
                    {
                      title: (
                        <Space>
                          <ExperimentOutlined style={{ color: '#1890ff' }} />
                          <span>Liều dùng</span>
                        </Space>
                      ),
                      dataIndex: 'dosage',
                      key: 'dosage',
                      width: 150,
                      render: (dosage: string) => (
                        <Tag 
                          color="blue" 
                          style={{ 
                            fontSize: '13px', 
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          {dosage}
                        </Tag>
                      ),
                    },
                    {
                      title: (
                        <Space>
                          <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                          <span>Thời gian</span>
                        </Space>
                      ),
                      dataIndex: 'durationDays',
                      key: 'durationDays',
                      width: 120,
                      align: 'center',
                      render: (days: number) => (
                        <Tag 
                          color="orange" 
                          style={{ 
                            fontSize: '13px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: '500'
                          }}
                        >
                          {days} ngày
                        </Tag>
                      ),
                    },
                    {
                      title: (
                        <Space>
                          <FileTextOutlined style={{ color: '#52c41a' }} />
                          <span>Ghi chú</span>
                        </Space>
                      ),
                      dataIndex: 'note',
                      key: 'note',
                      ellipsis: true,
                      render: (note: string) => (
                        note ? (
                          <Tooltip title={note} placement="topLeft">
                            <Text 
                              style={{ 
                                color: '#52c41a', 
                                fontStyle: 'italic',
                                fontSize: '13px'
                              }}
                            >
                              {note}
                            </Text>
                          </Tooltip>
                        ) : (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Không có ghi chú
                          </Text>
                        )
                      ),
                    },
                  ]}
                />
                </Collapse.Panel>
              </Collapse>
            </Col>
          )}

          {/* Notes */}
          {appointment.notes && (
            <Col span={24}>
              <Card title="Ghi chú" className="veterinarian-notes-card">
                <Text>{appointment.notes}</Text>
              </Card>
            </Col>
          )}

          {/* Action Buttons */}
          {appointment.status !== 'COMPLETED' && (
            <Col span={24}>
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Space size="large">
                  {/* Tiến hành Button - Show for CHECK_IN, CHECKED_IN and IN_PROGRESS status */}
                  {(appointment.status === 'CHECK_IN' || appointment.status === 'CHECKED_IN' || appointment.status === 'IN_PROGRESS') && (
                    <Button
                      type="primary"
                      size="large"
                      icon={<PlayCircleOutlined />}
                      loading={progressLoading}
                      onClick={handleProgress}
                      style={{
                        backgroundColor: '#1890ff',
                        borderColor: '#1890ff',
                        fontSize: '16px',
                        height: '48px',
                        padding: '0 32px',
                      }}
                    >
                      Tiến hành
                    </Button>
                  )}
                </Space>
              </div>
            </Col>
          )}
        </Row>



        {/* Medical Record Modal */}
        <Modal
          open={medicalRecordModalVisible}
          title={
            <Space>
              <FileTextOutlined style={{ color: '#52c41a' }} />
              <span>Hồ sơ bệnh án - {selectedServiceName}</span>
            </Space>
          }
          footer={[
            <Button
              key="close"
              type="primary"
              onClick={() => setMedicalRecordModalVisible(false)}
            >
              Đóng
            </Button>
          ]}
          onCancel={() => setMedicalRecordModalVisible(false)}
          width={800}
          className="veterinarian-medical-record-modal"
        >
          {selectedMedicalRecord && (
            <div style={{ padding: '16px 0' }}>
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <MedicineBoxOutlined style={{ color: '#1890ff' }} />
                        <span>Thông tin chẩn đoán</span>
                      </Space>
                    }
                    style={{ marginBottom: '16px' }}
                  >
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Triệu chứng">
                        <Text>{selectedMedicalRecord.symptom || 'Không có thông tin'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Chẩn đoán">
                        <Text strong style={{ color: '#fa8c16' }}>
                          {selectedMedicalRecord.diagnosis || 'Chưa có chẩn đoán'}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Tình trạng sức khỏe">
                        <Tag 
                          color={
                            selectedMedicalRecord.healthStatus === 'Good' ? 'green' :
                            selectedMedicalRecord.healthStatus === 'Normal' ? 'blue' :
                            selectedMedicalRecord.healthStatus === 'Poor' ? 'red' : 'default'
                          }
                          style={{ fontSize: '14px', padding: '4px 8px' }}
                        >
                          {selectedMedicalRecord.healthStatus || 'Chưa xác định'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                {selectedMedicalRecord.linkResult && (
                  <Col span={24}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <FileImageOutlined style={{ color: '#722ed1' }} />
                          <span>Hình ảnh kết quả</span>
                        </Space>
                      }
                    >
                      <div style={{ textAlign: 'center' }}>
                        <Image
                          src={selectedMedicalRecord.linkResult}
                          alt="Kết quả xét nghiệm"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '400px',
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9'
                          }}
                          preview={{
                            mask: (
                              <div style={{ textAlign: 'center' }}>
                                <EyeOutlined style={{ fontSize: '20px', marginBottom: '8px' }} />
                                <div>Xem ảnh phóng to</div>
                              </div>
                            )
                          }}
                        />
                      </div>
                    </Card>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Modal>

        {/* Species Update Modal */}
        <Modal
          title="Cập nhật loài hamster"
          open={speciesUpdateModalVisible}
          onOk={handleSpeciesUpdate}
          onCancel={() => setSpeciesUpdateModalVisible(false)}
          confirmLoading={updateHamsterLoading}
          okText="Cập nhật"
          cancelText="Hủy"
          okButtonProps={{ 
            disabled: !selectedSpeciesId || selectedSpeciesId === appointment?.speciesId 
          }}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Loài hamster hiện tại">
              <Text strong>{getSpeciesNameById(appointment?.speciesId || '')}</Text>
            </Form.Item>
            <Form.Item label="Chọn loài mới" required>
              <Select
                value={selectedSpeciesId}
                onChange={setSelectedSpeciesId}
                placeholder="Chọn loài hamster"
                loading={speciesLoading}
                style={{ width: '100%' }}
              >
                {speciesList.map((species) => (
                  <Select.Option key={species.id} value={species.id}>
                    {species.speciesName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default VetAppointmentDetail;
