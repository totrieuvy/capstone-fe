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
  type CreateMedicalRecordRequest,
  createPrescription,
  type CreatePrescriptionRequest,
  type PrescriptionMedicine
} from '../../../services/MedicalService';
import MedicineService, { type Medicine } from '../../../services/MedicineService';
import { getFormattedPrice } from '../../../utils/formatPrice';
import { storage } from '../../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { UploadProps } from 'antd';
import { toast } from 'react-toastify';
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
  // Remove all non-digit characters except dots and commas for decimal handling
  const cleanPrice = displayPrice.replace(/[^\d.,]/g, '');
  if (!cleanPrice) return 0;
  
  // Handle different decimal separators and thousand separators
  // Convert to standard format: remove commas used as thousand separators, keep dots as decimals
  let normalized = cleanPrice;
  
  // If there are multiple dots or commas, treat the last one as decimal separator
  const lastDotIndex = cleanPrice.lastIndexOf('.');
  const lastCommaIndex = cleanPrice.lastIndexOf(',');
  
  if (lastDotIndex > lastCommaIndex) {
    // Dot is decimal separator, remove commas
    normalized = cleanPrice.replace(/,/g, '');
  } else if (lastCommaIndex > lastDotIndex) {
    // Comma is decimal separator, replace with dot and remove other commas
    normalized = cleanPrice.replace(/,(?=.*,)/g, '').replace(',', '.');
  } else {
    // No decimal separator or only one, remove all non-digits
    normalized = cleanPrice.replace(/[^\d]/g, '');
  }
  
  const result = parseFloat(normalized) || 0;
  return Math.round(result); // Ensure integer for VND currency
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

  // Prescription state
  const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);
  const [prescriptionMedicines, setPrescriptionMedicines] = useState<PrescriptionMedicine[]>([]);
  const [submittingPrescription, setSubmittingPrescription] = useState(false);

  // Image preview modal states
  const [imagePreviewVisible, setImagePreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Steps configuration
  const steps = [
    {
      title: 'Dịch vụ bổ sung',
      icon: <PlusOutlined />,
      description: 'Thêm dịch vụ y tế nâng cao (Tùy chọn)'
    },
    {
      title: 'Hồ sơ bệnh án',
      icon: <FileTextOutlined />,
      description: 'Nhập thông tin khám bệnh (Bắt buộc)'
    },
    {
      title: 'Kê đơn thuốc',
      icon: <MedicineBoxOutlined />,
      description: 'Kê đơn thuốc điều trị (Tùy chọn)'
    },
    {
      title: 'Tổng kết',
      icon: <CheckCircleOutlined />,
      description: 'Xem lại thông tin khám bệnh'
    }
  ];

  // Load appointment data on component mount
  useEffect(() => {
    if (appointmentId) {
      loadAppointmentData();
    }
  }, [appointmentId]);

  // Load medicines on component mount
  useEffect(() => {
    loadAvailableMedicines();
  }, []);

  // Load available services when appointment data is loaded
  useEffect(() => {
    if (appointmentData?.speciesId) {
      loadAvailableServices(appointmentData.speciesId);
      initializeMedicalRecords();
      // Always start from step 0 (services step) regardless of completion status
      // Users should see existing data but go through all steps
    }
  }, [appointmentData]);

  // Initialize medical records for each appointment item
  const initializeMedicalRecords = () => {
    if (!appointmentData) return;
    
    const recordsMap = new Map<string, MedicalRecordForm>();
    appointmentData.items.forEach(item => {
      if (!item.medicalRecord) { // Check for medicalRecord object instead of medicalRecordId
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

  // Helper function to check if all medical records exist
  const hasAllMedicalRecords = (): boolean => {
    if (!appointmentData) return false;
    return appointmentData.items.every(item => item.medicalRecord !== null);
  };

  // Helper function to check if prescription exists
  const hasPrescription = (): boolean => {
    return appointmentData?.prescription !== null;
  };

  // Load available medicines
  const loadAvailableMedicines = async () => {
    try {
      const response = await MedicineService.getMedicines();
      if (response.code === 200) {
        setAvailableMedicines(response.data);
      } else {
        toast.error('Không thể tải danh sách thuốc');
      }
    } catch (error) {
      console.error('Error loading medicines:', error);
      toast.error('Lỗi khi tải danh sách thuốc');
    }
  };

  // Add medicine to prescription
  const handleAddMedicine = () => {
    const newMedicine: PrescriptionMedicine = {
      medicineId: '',
      dosage: '',
      note: '',
      durationDays: 1
    };
    setPrescriptionMedicines([...prescriptionMedicines, newMedicine]);
  };

  // Remove medicine from prescription
  const handleRemoveMedicine = (index: number) => {
    const updatedMedicines = prescriptionMedicines.filter((_, i) => i !== index);
    setPrescriptionMedicines(updatedMedicines);
  };

  // Update medicine in prescription
  const handleUpdateMedicine = (index: number, field: keyof PrescriptionMedicine, value: string | number) => {
    const updatedMedicines = prescriptionMedicines.map((medicine, i) => 
      i === index ? { ...medicine, [field]: value } : medicine
    );
    setPrescriptionMedicines(updatedMedicines);
  };

  // Submit prescription
  const handleSubmitPrescription = async () => {
    // Validate prescription medicines
    const incompleteMedicines = prescriptionMedicines.filter(medicine => 
      !medicine.medicineId || !medicine.dosage || medicine.durationDays <= 0
    );

    if (incompleteMedicines.length > 0) {
      toast.error('Vui lòng hoàn thành thông tin tất cả các thuốc');
      return;
    }

    try {
      setSubmittingPrescription(true);
      
      const prescriptionData: CreatePrescriptionRequest = {
        appointmentId: appointmentId!,
        medicines: prescriptionMedicines
      };

      const response = await createPrescription(prescriptionData);
      
      if (response.code === 200) {
        toast.success('Đã tạo đơn thuốc thành công');
        // Reload appointment data to reflect changes
        await loadAppointmentData();
        setCurrentStep(3);
      } else {
        toast.error('Không thể tạo đơn thuốc');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Lỗi khi tạo đơn thuốc');
    } finally {
      setSubmittingPrescription(false);
    }
  };

  const loadAppointmentData = async () => {
    try {
      setLoading(true);
      const response = await getAppointmentById(appointmentId!);
      if (response.code === 200) {
        setAppointmentData(response.data);
      } else {
        toast.error('Không thể tải thông tin cuộc hẹn');
        navigate('/VET/lich-kham-hom-nay');
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Lỗi khi tải thông tin cuộc hẹn');
      navigate('/VET/lich-kham-hom-nay');
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
        toast.error('Không thể tải danh sách dịch vụ');
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Lỗi khi tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId);
    if (!service) return;

    // Check if service is already selected
    if (selectedServices.find(s => s.serviceId === serviceId)) {
      toast.warning('Dịch vụ này đã được chọn');
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
      toast.error('Vui lòng nhập giá cho tất cả dịch vụ đã chọn');
      return;
    }

    try {
      setSubmittingServices(true);
      
      // Calculate additionalAmount from original service displayPrice, not user-modified prices
      const totalAdditionalAmount = selectedServices.reduce((sum, service) => {
        const originalService = availableServices.find(s => s.id === service.serviceId);
        const displayPrice = originalService ? parseDisplayPrice(originalService.displayPrice) : 0;
        return sum + displayPrice;
      }, 0);
      
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
        toast.success('Đã thêm dịch vụ bổ sung thành công');
        // Reload appointment data to reflect changes
        await loadAppointmentData();
        setCurrentStep(1);
      } else {
        toast.error('Không thể thêm dịch vụ bổ sung');
      }
    } catch (error) {
      console.error('Error adding services:', error);
      toast.error('Lỗi khi thêm dịch vụ bổ sung');
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
      toast.success('Tải lên hình ảnh thành công');
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // More specific error messages
      let errorMessage = 'Lỗi khi tải lên hình ảnh';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
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
      toast.error('Vui lòng hoàn thành tất cả hồ sơ bệnh án');
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

      toast.success('Đã tạo hồ sơ bệnh án thành công');
      // Reload appointment data to reflect changes
      await loadAppointmentData();
      setCurrentStep(2);
    } catch (error) {
      console.error('Error creating medical records:', error);
      toast.error('Lỗi khi tạo hồ sơ bệnh án');
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

  // Generate display for existing medical records
  const getExistingMedicalRecordsDisplay = () => {
    if (!appointmentData) return [];

    const panelStyle: React.CSSProperties = {
      marginBottom: 16,
      background: token.colorFillAlter,
      borderRadius: token.borderRadiusLG,
      border: 'none',
    };

    const existingRecords = appointmentData.items.filter(item => item.medicalRecord);

    return existingRecords.map((item) => {
      const record = item.medicalRecord!;
      
      return {
        key: item.id,
        label: (
          <Space>
            <Text strong>{item.serviceName}</Text>
            <Tag color="green">Đã hoàn thành</Tag>
          </Space>
        ),
        children: (
          <div style={{ padding: '8px 0' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div>
                  <Text strong>Chẩn đoán:</Text>
                  <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                    <Text>{record.diagnosis}</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div>
                  <Text strong>Triệu chứng:</Text>
                  <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                    <Text>{record.symptom}</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div>
                  <Text strong>Tình trạng sức khỏe:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color={record.healthStatus === 'normal' ? 'green' : record.healthStatus === 'critical' ? 'red' : 'orange'}>
                      {record.healthStatus === 'normal' ? 'Bình thường' :
                       record.healthStatus === 'mild' ? 'Nhẹ' :
                       record.healthStatus === 'moderate' ? 'Trung bình' :
                       record.healthStatus === 'severe' ? 'Nghiêm trọng' : 'Nguy kích'}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={16}>
                <div>
                  <Text strong>Hình ảnh kết quả:</Text>
                  <div style={{ marginTop: 8 }}>
                    {record.linkResult && (
                      <Image
                        src={record.linkResult}
                        alt="Kết quả khám"
                        width={80}
                        height={80}
                        style={{ objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                        onClick={() => handleImagePreview(record.linkResult, `Kết quả khám - ${item.serviceName}`)}
                      />
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        ),
        style: panelStyle,
      };
    });
  };

  const calculateTotalAdditional = () => {
    // Calculate from original service displayPrice, consistent with additionalAmount calculation
    return selectedServices.reduce((sum, service) => {
      const originalService = availableServices.find(s => s.id === service.serviceId);
      const displayPrice = originalService ? parseDisplayPrice(originalService.displayPrice) : 0;
      return sum + displayPrice;
    }, 0);
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
        <Tag color="blue">{text}</Tag>
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
                  description="Bạn có thể thêm các dịch vụ y tế bổ sung cho cuộc khám này. Nếu không cần thêm dịch vụ, bạn có thể bỏ qua bước này."
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
                              toast.warning('Vui lòng chọn dịch vụ trước');
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
                          {getFormattedPrice(Math.floor(calculateTotalAdditional() / 100))}
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
                {hasAllMedicalRecords() ? (
                  <Alert
                    message="Tất cả hồ sơ bệnh án đã hoàn thành"
                    description="Các hồ sơ bệnh án cho cuộc hẹn này đã được tạo trước đó. Bạn có thể xem chi tiết bên dưới."
                    type="success"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                ) : medicalRecords.size > 0 ? (
                  <Alert
                    message="Bước bắt buộc"
                    description="Vui lòng nhập thông tin khám bệnh cho tất cả các dịch vụ y tế trong cuộc hẹn này."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                ) : (
                  <Alert
                    message="Không có dịch vụ y tế nào cần tạo hồ sơ bệnh án"
                    description="Tất cả các dịch vụ trong cuộc hẹn này đã có hồ sơ bệnh án hoặc không yêu cầu hồ sơ."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                )}
              </Col>

              {/* Display existing medical records */}
              {hasAllMedicalRecords() && (
                <Col span={24}>
                  <Divider orientation="left">Hồ sơ bệnh án đã hoàn thành</Divider>
                  <Collapse
                    bordered={false}
                    defaultActiveKey={appointmentData?.items.filter(item => item.medicalRecord).map(item => item.id)}
                    expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                    style={{ background: token.colorBgContainer }}
                    items={getExistingMedicalRecordsDisplay()}
                    size="large"
                  />
                </Col>
              )}

              {/* Display form for new medical records */}
              {!hasAllMedicalRecords() && medicalRecords.size > 0 && (
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
              )}

              {!hasAllMedicalRecords() && medicalRecords.size === 0 && (
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
                    {hasAllMedicalRecords() ? (
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => setCurrentStep(2)}
                      >
                        Tiếp tục kê đơn thuốc
                      </Button>
                    ) : medicalRecords.size > 0 ? (
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={handleSubmitMedicalRecords}
                        loading={submittingRecords}
                      >
                        Hoàn thành hồ sơ bệnh án
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        onClick={() => setCurrentStep(2)}
                      >
                        Tiếp tục kê đơn thuốc
                      </Button>
                    )}
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        )}

        {currentStep === 2 && (
          <Card 
            title={
              <Space>
                <MedicineBoxOutlined />
                <span>Kê đơn thuốc</span>
              </Space>
            }
            className="step-content-card"
          >
            <Row gutter={[24, 24]}>
              <Col span={24}>
                {hasPrescription() ? (
                  <Alert
                    message="Đơn thuốc đã được kê"
                    description="Đơn thuốc cho cuộc hẹn này đã được tạo trước đó. Bạn có thể xem chi tiết bên dưới."
                    type="success"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                ) : (
                  <Alert
                    message="Kê đơn thuốc (Tùy chọn)"
                    description="Bạn có thể kê đơn thuốc cho bệnh nhân nếu cần thiết. Bước này có thể bỏ qua."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                )}
              </Col>

              {/* Display existing prescription */}
              {hasPrescription() && appointmentData?.prescription && (
                <Col span={24}>
                  <Divider orientation="left">Đơn thuốc đã kê</Divider>
                  <Card size="small" style={{ background: '#f6ffed' }}>
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Text strong style={{ fontSize: '16px' }}>Mã đơn thuốc: {appointmentData.prescription.id}</Text>
                      </Col>
                      {appointmentData.prescription.medicines.map((medicine, index) => (
                        <Col span={24} key={medicine.id}>
                          <Card size="small" style={{ marginBottom: 8, border: '1px solid #d9f7be' }}>
                            <Row gutter={[16, 8]} align="middle">
                              <Col xs={24} md={6}>
                                <Text strong style={{ color: '#389e0d' }}>Thuốc {index + 1}:</Text>
                                <div>{medicine.medicineName}</div>
                              </Col>
                              <Col xs={24} md={6}>
                                <Text strong>Liều dùng:</Text>
                                <div>{medicine.dosage}</div>
                              </Col>
                              <Col xs={24} md={4}>
                                <Text strong>Thời gian:</Text>
                                <div>{medicine.durationDays} ngày</div>
                              </Col>
                              <Col xs={24} md={8}>
                                <Text strong>Ghi chú:</Text>
                                <div>{medicine.note || 'Không có ghi chú'}</div>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
              )}

              {/* Display prescription form for new prescription */}
              {!hasPrescription() && (
                <Col span={24}>
                  <Divider orientation="left">Kê đơn thuốc mới</Divider>
                  <Form layout="vertical">
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <div style={{ marginBottom: 16 }}>
                          <Button 
                            type="dashed" 
                            icon={<PlusOutlined />}
                            onClick={handleAddMedicine}
                            block
                          >
                            Thêm thuốc vào đơn
                          </Button>
                        </div>
                      </Col>

                      {prescriptionMedicines.map((medicine, index) => (
                        <Col span={24} key={index}>
                          <Card 
                            size="small" 
                            style={{ marginBottom: 16 }}
                            title={`Thuốc ${index + 1}`}
                            extra={
                              <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveMedicine(index)}
                              >
                                Xóa
                              </Button>
                            }
                          >
                            <Row gutter={[16, 16]}>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  label="Tên thuốc"
                                  required
                                >
                                  <Select
                                    placeholder="Chọn thuốc"
                                    value={medicine.medicineId || undefined}
                                    onChange={(value) => handleUpdateMedicine(index, 'medicineId', value)}
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                      (option?.label?.toString() || '').toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }
                                  >
                                    {availableMedicines.map(med => (
                                      <Option key={med.id} value={med.id} label={med.medicationName}>
                                        {med.medicationName}
                                      </Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  label="Liều dùng"
                                  required
                                >
                                  <Input
                                    placeholder="VD: 1 viên/ngày, 2 lần/ngày"
                                    value={medicine.dosage}
                                    onChange={(e) => handleUpdateMedicine(index, 'dosage', e.target.value)}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={8}>
                                <Form.Item
                                  label="Số ngày"
                                  required
                                >
                                  <InputNumber
                                    min={1}
                                    max={365}
                                    value={medicine.durationDays}
                                    onChange={(value) => handleUpdateMedicine(index, 'durationDays', value || 1)}
                                    placeholder="Số ngày"
                                    style={{ width: '100%' }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={16}>
                                <Form.Item
                                  label="Ghi chú"
                                >
                                  <TextArea
                                    rows={2}
                                    placeholder="Ghi chú cách sử dụng..."
                                    value={medicine.note}
                                    onChange={(e) => handleUpdateMedicine(index, 'note', e.target.value)}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Form>
                </Col>
              )}

              <Col span={24}>
                <Divider />
                <Row justify="space-between">
                  <Col>
                    <Button onClick={() => setCurrentStep(1)}>
                      Quay lại
                    </Button>
                  </Col>
                  <Col>
                    <Space>
                      {!hasPrescription() && (
                        <>
                          <Button
                            type="default"
                            onClick={() => setCurrentStep(3)}
                          >
                            Bỏ qua kê đơn thuốc
                          </Button>
                          {prescriptionMedicines.length > 0 && (
                            <Button
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              onClick={handleSubmitPrescription}
                              loading={submittingPrescription}
                            >
                              Tạo đơn thuốc & Tiếp tục
                            </Button>
                          )}
                        </>
                      )}
                      {hasPrescription() && (
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => setCurrentStep(3)}
                        >
                          Tiếp tục tổng kết
                        </Button>
                      )}
                    </Space>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        )}

        {currentStep === 3 && (
          <Card 
            title={
              <Space>
                <CheckCircleOutlined />
                <span>Tổng kết thông tin khám bệnh</span>
              </Space>
            }
            className="step-content-card"
          >
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Alert
                  message="Tổng kết quá trình khám bệnh"
                  description="Quá trình khám bệnh đã hoàn thành. Thông tin chi tiết được hiển thị bên dưới."
                  type="success"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              </Col>

              <Col span={24}>
                <Divider orientation="left">Trạng thái hoàn thành</Divider>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <PlusOutlined style={{ fontSize: '24px', color: availableServices.length > 0 ? '#1890ff' : '#52c41a' }} />
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Dịch vụ bổ sung</Text>
                      </div>
                      <div>
                        <Tag color={availableServices.length > 0 ? 'blue' : 'green'}>
                          {availableServices.length > 0 ? 'Có thể thêm' : 'Hoàn thành'}
                        </Tag>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <FileTextOutlined style={{ fontSize: '24px', color: hasAllMedicalRecords() ? '#52c41a' : '#faad14' }} />
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Hồ sơ bệnh án</Text>
                      </div>
                      <div>
                        <Tag color={hasAllMedicalRecords() ? 'green' : 'orange'}>
                          {hasAllMedicalRecords() ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                        </Tag>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <MedicineBoxOutlined style={{ fontSize: '24px', color: hasPrescription() ? '#52c41a' : '#faad14' }} />
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Đơn thuốc</Text>
                      </div>
                      <div>
                        <Tag color={hasPrescription() ? 'green' : 'orange'}>
                          {hasPrescription() ? 'Đã kê đơn' : 'Chưa kê đơn'}
                        </Tag>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Col>

              <Col span={24}>
                <Divider orientation="left">Thông tin thanh toán</Divider>
                <Card size="small" style={{ background: '#f0f9ff' }}>
                  <Row gutter={[16, 8]}>
                    <Col xs={24} md={12}>
                      <Text strong>Tổng tiền gốc:</Text>
                      <div style={{ fontSize: '16px' }}>{appointmentData ? getFormattedPrice(Math.floor(appointmentData.totalAmount / 100)) : '0 đ'}</div>
                    </Col>
                    <Col xs={24} md={12}>
                      <Text strong>Tổng tiền sau giảm giá:</Text>
                      <div style={{ fontSize: '16px', color: '#52c41a' }}>{appointmentData ? getFormattedPrice(Math.floor(appointmentData.totalAmountAfter / 100)) : '0 đ'}</div>
                    </Col>
                    {appointmentData?.additionalAmount && (
                      <Col xs={24} md={12}>
                        <Text strong>Tiền dịch vụ bổ sung:</Text>
                        <div style={{ fontSize: '16px', color: '#1890ff' }}>{getFormattedPrice(Math.floor(appointmentData.additionalAmount / 100))}</div>
                      </Col>
                    )}
                    <Col xs={24}>
                      <Divider style={{ margin: '12px 0' }} />
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text strong style={{ fontSize: '18px' }}>Tổng cần thanh toán:</Text>
                        </Col>
                        <Col>
                          <Text strong style={{ fontSize: '20px', color: '#f5222d' }}>
                            {appointmentData ? getFormattedPrice(
                              Math.floor(appointmentData.totalAmountAfter / 100) + Math.floor((appointmentData.additionalAmount || 0) / 100)
                            ) : '0 đ'}
                          </Text>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={24}>
                <Divider />
                <Row justify="space-between">
                  <Col>
                    <Button onClick={() => setCurrentStep(2)}>
                      Quay lại
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      onClick={() => navigate('/VET/lich-kham-hom-nay')}
                    >
                      Hoàn thành khám bệnh
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
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
