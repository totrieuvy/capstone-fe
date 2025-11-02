import React, { useState, useEffect } from 'react';
import {
  Steps,
  Card,
  Row,
  Col,
  Form,
  Select,
  Button,
  Typography,
  InputNumber,
  Space,
  Table,
  Tag,
  message,
  Divider,
  Alert,
  Spin,
  Input,
  Upload,
  Image,
  Progress,
  Collapse,
  theme,
  Modal
} from 'antd';
import {
  MedicineBoxOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  UploadOutlined,
  CaretRightOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getServicesBySpeciesAndType, type Service } from '../../../services/AdditionService';
import { 
  addServiceToAppointment, 
  getAppointmentById, 
  type AppointmentDetail,
  createMedicalRecord,
  type CreateMedicalRecordRequest
} from '../../../services/MedicalService';
import { getFormattedPrice } from '../../../utils/formatPrice';
import { storage } from '../../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { UploadProps } from 'antd';
import './Examination.scss';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SelectedService {
  key: string;
  serviceId: string;
  serviceName: string;
  price: number;
  displayPrice: string;
}

interface MedicalRecordForm {
  appointmentItemId: string;
  serviceName: string;
  diagnosis: string;
  symptom: string;
  linkResult: string;
  healthStatus: string;
  isCompleted: boolean;
}

interface UploadState {
  uploading: boolean;
  uploadProgress: number;
  imageUrl: string;
}

// Utility function to format date to UTC+7
const formatDateToUTC7 = (dateString: string): string => {
  const date = new Date(dateString);
  const utc7Date = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  return utc7Date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Parse a display price string (like "20,000 VND" or "₫20.000") into a number (in VND)
const parseDisplayPrice = (displayPrice?: string): number => {
  if (!displayPrice) return 0;
  // Remove all non-digit characters
  const digits = displayPrice.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  return Number(digits);
};

const Examination: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState<AppointmentDetail | null>(null);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [submittingServices, setSubmittingServices] = useState(false);
  
  // Medical records state
  const [medicalRecords, setMedicalRecords] = useState<Map<string, MedicalRecordForm>>(new Map());
  const [submittingRecords, setSubmittingRecords] = useState(false);
  const [uploadStates, setUploadStates] = useState<Map<string, UploadState>>(new Map());

  // Image preview modal states
  const [imagePreviewVisible, setImagePreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Steps configuration
  const steps = [
    {
      title: 'Dịch vụ bổ sung',
      icon: <PlusOutlined />,
      description: 'Thêm dịch vụ y tế nâng cao'
    },
    {
      title: 'Hồ sơ bệnh án',
      icon: <FileTextOutlined />,
      description: 'Nhập thông tin khám bệnh'
    },
    {
      title: 'Kê đơn thuốc',
      icon: <MedicineBoxOutlined />,
      description: 'Kê đơn thuốc điều trị'
    },
    {
      title: 'Tổng kết & Thanh toán',
      icon: <CheckCircleOutlined />,
      description: 'Xem lại và hoàn thành'
    }
  ];

  // Load appointment data on component mount
  useEffect(() => {
    if (appointmentId) {
      loadAppointmentData();
    }
  }, [appointmentId]);

  // Load available services when appointment data is loaded
  useEffect(() => {
    if (appointmentData?.speciesId) {
      loadAvailableServices(appointmentData.speciesId);
      initializeMedicalRecords();
    }
  }, [appointmentData]);

  // Initialize medical records for each appointment item
  const initializeMedicalRecords = () => {
    if (!appointmentData) return;
    
    const recordsMap = new Map<string, MedicalRecordForm>();
    appointmentData.items.forEach(item => {
      if (!item.medicalRecordId) { // Only create form for items without medical records
        recordsMap.set(item.id, {
          appointmentItemId: item.id,
          serviceName: item.serviceName,
          diagnosis: '',
          symptom: '',
          linkResult: '',
          healthStatus: 'normal',
          isCompleted: false
        });
      }
    });
    setMedicalRecords(recordsMap);
  };

  const loadAppointmentData = async () => {
    try {
      setLoading(true);
      const response = await getAppointmentById(appointmentId!);
      if (response.code === 200) {
        setAppointmentData(response.data);
      } else {
        message.error('Không thể tải thông tin cuộc hẹn');
        navigate('/veterinarian/appointments');
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      message.error('Lỗi khi tải thông tin cuộc hẹn');
      navigate('/veterinarian/appointments');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableServices = async (speciesId: string) => {
    try {
      setLoading(true);
      const response = await getServicesBySpeciesAndType(speciesId, 'MEDICAL');
      if (response.code === 200) {
        // Get existing service IDs from the appointment
        const existingServiceIds = appointmentData?.items.map(item => item.serviceId) || [];
        
        // Filter out services that are already in the appointment and inactive services
        const filteredServices = response.data.filter(service => 
          !existingServiceIds.includes(service.id) && 
          service.isActive &&
          service.serviceType === 'MEDICAL'
        );
        
        setAvailableServices(filteredServices);
      } else {
        message.error('Không thể tải danh sách dịch vụ');
      }
    } catch (error) {
      console.error('Error loading services:', error);
      message.error('Lỗi khi tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId);
    if (!service) return;

    // Check if service is already selected
    if (selectedServices.find(s => s.serviceId === serviceId)) {
      message.warning('Dịch vụ này đã được chọn');
      return;
    }

    // Try to extract a numeric price from the service.displayPrice and use it as the default
    const parsedPrice = parseDisplayPrice(service.displayPrice);

    const newService: SelectedService = {
      key: `${serviceId}-${Date.now()}`,
      serviceId: service.id,
      serviceName: service.serviceName,
      price: parsedPrice || 0, // Keep the full price internally for calculations
      displayPrice: service.displayPrice
    };

    setSelectedServices([...selectedServices, newService]);
    form.resetFields(['selectedService']);
  };

  const handleRemoveService = (key: string) => {
    setSelectedServices(selectedServices.filter(s => s.key !== key));
  };

  const handlePriceChange = (key: string, price: number) => {
    setSelectedServices(selectedServices.map(service =>
      service.key === key ? { ...service, price } : service
    ));
  };

  const handleSubmitAdditionalServices = async () => {
    if (selectedServices.length === 0) {
      // Skip this step if no services selected
      setCurrentStep(1);
      return;
    }

    // Validate that all selected services have prices
    const servicesWithoutPrice = selectedServices.filter(s => !s.price || s.price <= 0);
    if (servicesWithoutPrice.length > 0) {
      message.error('Vui lòng nhập giá cho tất cả dịch vụ đã chọn');
      return;
    }

    try {
      setSubmittingServices(true);
      
      const totalAdditionalAmount = selectedServices.reduce((sum, service) => sum + service.price, 0);
      
      const addServiceRequest = {
        appointmentId: appointmentId!,
        additionalAmount: totalAdditionalAmount,
        items: selectedServices.map(service => ({
          serviceId: service.serviceId,
          price: service.price
        }))
      };

      const response = await addServiceToAppointment(addServiceRequest);
      
      if (response.code === 200) {
        message.success('Đã thêm dịch vụ bổ sung thành công');
        // Reload appointment data to reflect changes
        await loadAppointmentData();
        setCurrentStep(1);
      } else {
        message.error('Không thể thêm dịch vụ bổ sung');
      }
    } catch (error) {
      console.error('Error adding services:', error);
      message.error('Lỗi khi thêm dịch vụ bổ sung');
    } finally {
      setSubmittingServices(false);
    }
  };

  // Handle file upload for medical record images using Firebase
  const handleFileUpload = async (file: File, appointmentItemId: string): Promise<string> => {
    try {
      // Validate file
      if (!file) {
        throw new Error('Không có file để tải lên');
      }

      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        throw new Error('Chỉ được phép tải lên file hình ảnh!');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('Kích thước file phải nhỏ hơn 10MB!');
      }

      // Update upload state
      setUploadStates(prev => new Map(prev.set(appointmentItemId, {
        uploading: true,
        uploadProgress: 50,
        imageUrl: ''
      })));

      console.log('Uploading file:', file.name, 'Size:', file.size);
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `medical-records/${appointmentItemId}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file to Firebase
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update upload state with success
      setUploadStates(prev => new Map(prev.set(appointmentItemId, {
        uploading: false,
        uploadProgress: 100,
        imageUrl: downloadURL
      })));

      console.log('File uploaded successfully:', downloadURL);
      message.success('Tải lên hình ảnh thành công');
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // More specific error messages
      let errorMessage = 'Lỗi khi tải lên hình ảnh';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      
      // Reset upload state
      setUploadStates(prev => new Map(prev.set(appointmentItemId, {
        uploading: false,
        uploadProgress: 0,
        imageUrl: ''
      })));
      
      throw error;
    }
  };

  // Handle image preview
  const handleImagePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl);
    setPreviewTitle(title);
    setImagePreviewVisible(true);
  };

  // Handle upload change for medical record images
  const handleImageUpload = (appointmentItemId: string): UploadProps['customRequest'] => 
    ({ file, onSuccess, onError }) => {
      if (file instanceof File) {
        handleFileUpload(file, appointmentItemId)
          .then((imageUrl) => {
            // Update the medical record with the image URL
            updateMedicalRecord(appointmentItemId, 'linkResult', imageUrl);
            onSuccess?.(file);
          })
          .catch((error) => {
            onError?.(error as Error);
          });
      }
    };

  // Update medical record data
  const updateMedicalRecord = (appointmentItemId: string, field: keyof MedicalRecordForm, value: any) => {
    setMedicalRecords(prev => {
      const newMap = new Map(prev);
      const record = newMap.get(appointmentItemId);
      if (record) {
        newMap.set(appointmentItemId, { ...record, [field]: value });
      }
      return newMap;
    });
  };

  // Submit all medical records
  const handleSubmitMedicalRecords = async () => {
    const recordsArray = Array.from(medicalRecords.values());
    
    // Validate all records are completed
    const incompleteRecords = recordsArray.filter(record => 
      !record.diagnosis.trim() || 
      !record.symptom.trim() || 
      !record.linkResult.trim() ||
      !record.healthStatus
    );

    if (incompleteRecords.length > 0) {
      message.error('Vui lòng hoàn thành tất cả hồ sơ bệnh án');
      return;
    }

    try {
      setSubmittingRecords(true);
      
      // Submit each medical record
      for (const record of recordsArray) {
        const medicalRecordData: CreateMedicalRecordRequest = {
          appointmentItemId: record.appointmentItemId,
          hamsterId: appointmentData!.hamsterId,
          diagnosis: record.diagnosis,
          symptom: record.symptom,
          linkResult: record.linkResult,
          healthStatus: record.healthStatus
        };

        const response = await createMedicalRecord(medicalRecordData);
        if (response.code !== 200) {
          throw new Error(`Failed to create medical record for ${record.serviceName}`);
        }
      }

      message.success('Đã tạo hồ sơ bệnh án thành công');
      // Reload appointment data to reflect changes
      await loadAppointmentData();
      setCurrentStep(2);
    } catch (error) {
      console.error('Error creating medical records:', error);
      message.error('Lỗi khi tạo hồ sơ bệnh án');
    } finally {
      setSubmittingRecords(false);
    }
  };

  // Generate collapse items for medical records
  const getMedicalRecordItems = () => {
    const panelStyle: React.CSSProperties = {
      marginBottom: 16,
      background: token.colorFillAlter,
      borderRadius: token.borderRadiusLG,
      border: 'none',
    };

    return Array.from(medicalRecords.entries()).map(([appointmentItemId, record]) => {
      const uploadState = uploadStates.get(appointmentItemId) || { uploading: false, uploadProgress: 0, imageUrl: '' };
      
      // Check if record is completed
      const isCompleted = record.diagnosis.trim() && record.symptom.trim() && record.linkResult.trim() && record.healthStatus;
      
      return {
        key: appointmentItemId,
        label: (
          <Space>
            <Text strong>{record.serviceName}</Text>
            {isCompleted && <Tag color="green">Hoàn thành</Tag>}
            {!isCompleted && <Tag color="orange">Chưa hoàn thành</Tag>}
          </Space>
        ),
        children: (
          <Form layout="vertical" style={{ padding: '8px 0' }}>
            <Row gutter={[16, 16]}>
              {/* Diagnosis */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Chẩn đoán"
                  required
                  help="Nhập chẩn đoán bệnh"
                >
                  <TextArea
                    rows={3}
                    placeholder="Nhập chẩn đoán chi tiết..."
                    value={record.diagnosis}
                    onChange={(e) => updateMedicalRecord(appointmentItemId, 'diagnosis', e.target.value)}
                  />
                </Form.Item>
              </Col>

              {/* Symptoms */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Triệu chứng"
                  required
                  help="Mô tả các triệu chứng quan sát được"
                >
                  <TextArea
                    rows={3}
                    placeholder="Nhập triệu chứng..."
                    value={record.symptom}
                    onChange={(e) => updateMedicalRecord(appointmentItemId, 'symptom', e.target.value)}
                  />
                </Form.Item>
              </Col>

              {/* Health Status */}
              <Col xs={24} md={8}>
                <Form.Item
                  label="Tình trạng sức khỏe"
                  required
                >
                  <Select
                    value={record.healthStatus}
                    onChange={(value) => updateMedicalRecord(appointmentItemId, 'healthStatus', value)}
                    placeholder="Chọn tình trạng"
                  >
                    <Option value="normal">Bình thường</Option>
                    <Option value="mild">Nhẹ</Option>
                    <Option value="moderate">Trung bình</Option>
                    <Option value="severe">Nghiêm trọng</Option>
                    <Option value="critical">Nguy kích</Option>
                  </Select>
                </Form.Item>
              </Col>

              {/* Image Upload */}
              <Col xs={24} md={16}>
                <Form.Item
                  label="Hình ảnh kết quả khám"
                  required
                  help="Tải lên hình ảnh kết quả khám bệnh"
                >
                  {uploadState.imageUrl ? (
                    <div className="image-upload-success">
                      <div className="image-preview">
                        <Image
                          src={uploadState.imageUrl}
                          alt="Kết quả khám"
                          width={80}
                          height={80}
                          style={{ objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                          preview={false}
                          onClick={() => handleImagePreview(uploadState.imageUrl, `Kết quả khám - ${record.serviceName}`)}
                        />
                        <div className="image-info">
                          <Text strong style={{ color: '#52c41a' }}>
                            ✓ Đã tải lên thành công
                          </Text>
                          <Button 
                            type="link" 
                            size="small"
                            onClick={() => {
                              updateMedicalRecord(appointmentItemId, 'linkResult', '');
                              setUploadStates(prev => new Map(prev.set(appointmentItemId, {
                                uploading: false,
                                uploadProgress: 0,
                                imageUrl: ''
                              })));
                            }}
                          >
                            Thay đổi ảnh
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      customRequest={handleImageUpload(appointmentItemId)}
                      disabled={uploadState.uploading}
                      className="compact-upload"
                    >
                      <Button 
                        icon={<UploadOutlined />} 
                        loading={uploadState.uploading}
                        style={{ width: '100%', height: '80px' }}
                      >
                        {uploadState.uploading ? (
                          <div>
                            <div>Đang tải lên...</div>
                            <Progress 
                              percent={uploadState.uploadProgress} 
                              size="small" 
                              style={{ margin: '8px 0 0 0' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <div>Chọn hình ảnh</div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              JPG, PNG, GIF (max 10MB)
                            </Text>
                          </div>
                        )}
                      </Button>
                    </Upload>
                  )}
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ),
        style: panelStyle,
      };
    });
  };

  const calculateTotalAdditional = () => {
    return selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
  };

  // Table columns for selected services
  const serviceColumns = [
    {
      title: 'Tên dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Giá gốc',
      dataIndex: 'displayPrice',
      key: 'displayPrice',
      render: (text: string) => (
        <Tag color="blue">{getFormattedPrice(Math.floor(parseDisplayPrice(text) / 100))}</Tag>
      )
    },
    {
      title: 'Giá thực tế',
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: SelectedService) => (
        <InputNumber
          min={10}
          step={10}
          value={Math.floor(price / 100)}
          onChange={(value) => handlePriceChange(record.key, (value || 0) * 100)}
          formatter={(value) => getFormattedPrice(Number(value) || 0).replace(' đ', '')}
          parser={(value) => Number(value!.replace(/\D/g, ''))}
          style={{ width: '100%' }}
          placeholder="Nhập giá"
          addonAfter="đ"
        />
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: SelectedService) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveService(record.key)}
          title="Xóa dịch vụ"
        />
      )
    }
  ];

  if (loading && !appointmentData) {
    return (
      <div className="examination-loading">
        <Spin size="large" />
        <Text>Đang tải thông tin cuộc hẹn...</Text>
      </div>
    );
  }

  if (!appointmentData) {
    return (
      <div className="examination-error">
        <Alert
          message="Không tìm thấy cuộc hẹn"
          description="Cuộc hẹn được yêu cầu không thể tìm thấy."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="examination">
      <div className="examination-container">
        {/* Header */}
        <Card className="examination-header">
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={3}>
                Khám bệnh - {appointmentData.hamsterName}
              </Title>
              <Text type="secondary">
                Khách hàng: {appointmentData.customerName} | 
                Lịch hẹn: {formatDateToUTC7(appointmentData.appointmentTime)}
              </Text>
            </Col>
            <Col>
              <Tag color="processing" className="status-tag-large">
                {appointmentData.status}
              </Tag>
            </Col>
          </Row>
        </Card>

        {/* Steps */}
        <Card className="steps-card">
          <Steps
            current={currentStep}
            items={steps}
            direction="horizontal"
            size="small"
          />
        </Card>

        {/* Step Content */}
        {currentStep === 0 && (
          <Card 
            title={
              <Space>
                <PlusOutlined />
                <span>Dịch vụ y tế nâng cao bổ sung</span>
              </Space>
            }
            className="step-content-card services-card"
          >
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Alert
                  message="Bước tùy chọn"
                  description="Bạn có thể thêm các dịch vụ y tế bổ sung cho cuộc khám này. Bước này có thể bỏ qua nếu không cần thiết."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </Col>

              <Col span={24}>
                <Form form={form} layout="vertical">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={18}>
                      <Form.Item
                        label="Chọn dịch vụ bổ sung"
                        name="selectedService"
                      >
                        <Select
                          placeholder="Chọn dịch vụ y tế bổ sung"
                          loading={loading}
                          showSearch
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            (option?.label?.toString() || '').toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                        >
                          {availableServices.map(service => (
                            <Option key={service.id} value={service.id}>
                              <Space direction="vertical" size={0}>
                                <Text strong>{service.serviceName}</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  Giá gốc: {getFormattedPrice(Math.floor(parseDisplayPrice(service.displayPrice) / 100))} | Thời gian: {service.durationMinutes} phút
                                </Text>
                              </Space>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Giá thực tế sẽ được tự động lấy từ Giá gốc khi thêm dịch vụ. Bạn vẫn có thể chỉnh sửa giá sau khi thêm.
                      </Text>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item label=" ">
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            const serviceId = form.getFieldValue('selectedService');
                            if (serviceId) {
                              handleAddService(serviceId);
                            } else {
                              message.warning('Vui lòng chọn dịch vụ trước');
                            }
                          }}
                          block
                        >
                          Thêm dịch vụ
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Col>

              {selectedServices.length > 0 && (
                <Col span={24}>
                  <Divider orientation="left">Dịch vụ bổ sung đã chọn</Divider>
                  <Table
                    dataSource={selectedServices}
                    columns={serviceColumns}
                    pagination={false}
                    size="middle"
                    className="selected-services-table"
                  />
                  
                  <Card size="small" style={{ marginTop: 16, background: '#f6ffed' }}>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Text strong>Tổng tiền bổ sung:</Text>
                      </Col>
                      <Col>
                        <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                          {getFormattedPrice(calculateTotalAdditional())}
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              )}

              <Col span={24}>
                <Divider />
                <Row justify="space-between">
                  <Col>
                    <Button onClick={() => navigate(-1)}>
                      Hủy
                    </Button>
                  </Col>
                  <Col>
                    <Space>
                      <Button
                        onClick={() => setCurrentStep(1)}
                        disabled={submittingServices}
                      >
                        Bỏ qua bước này
                      </Button>
                      <Button
                        type="primary"
                        icon={<DollarOutlined />}
                        onClick={handleSubmitAdditionalServices}
                        loading={submittingServices}
                        disabled={selectedServices.length === 0}
                      >
                        Thêm dịch vụ & Tiếp tục
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        )}

        {/* Placeholder for other steps */}
        {currentStep === 1 && (
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                <span>Hồ sơ bệnh án</span>
              </Space>
            }
            className="step-content-card"
          >
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Alert
                  message="Bước bắt buộc"
                  description="Vui lòng nhập thông tin khám bệnh cho tất cả các dịch vụ y tế trong cuộc hẹn này."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              </Col>

              {medicalRecords.size > 0 ? (
                <Col span={24}>
                  <Collapse
                    bordered={false}
                    defaultActiveKey={Array.from(medicalRecords.keys())}
                    expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                    style={{ background: token.colorBgContainer }}
                    items={getMedicalRecordItems()}
                    size="large"
                  />
                </Col>
              ) : (
                <Col span={24}>
                  <Alert
                    message="Không có dịch vụ y tế nào cần tạo hồ sơ bệnh án"
                    description="Tất cả các dịch vụ trong cuộc hẹn này đã có hồ sơ bệnh án hoặc không yêu cầu hồ sơ."
                    type="info"
                    showIcon
                  />
                </Col>
              )}

              <Col span={24}>
                <Divider />
                <Row justify="space-between">
                  <Col>
                    <Button onClick={() => setCurrentStep(0)}>
                      Quay lại
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={handleSubmitMedicalRecords}
                      loading={submittingRecords}
                      disabled={medicalRecords.size === 0}
                    >
                      Hoàn thành hồ sơ bệnh án
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        )}

        {currentStep === 2 && (
          <Card title="Kê đơn thuốc" className="step-content-card">
            <Alert
              message="Sắp có"
              description="Biểu mẫu kê đơn thuốc sẽ được triển khai tại đây."
              type="info"
              showIcon
            />
          </Card>
        )}

        {currentStep === 3 && (
          <Card title="Tổng kết & Thanh toán" className="step-content-card">
            <Alert
              message="Sắp có"
              description="Quy trình tổng kết và thanh toán sẽ được triển khai tại đây."
              type="info"
              showIcon
            />
          </Card>
        )}
      </div>

      {/* Image Preview Modal */}
      <Modal
        open={imagePreviewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setImagePreviewVisible(false)}
        width="80%"
        centered
        style={{ maxWidth: '800px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <img
            src={previewImage}
            alt={previewTitle}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Examination;
