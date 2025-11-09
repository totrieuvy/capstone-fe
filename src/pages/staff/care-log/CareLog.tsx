import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  message,
  Row,
  Col,
  Timeline,
  Typography,
  Spin,
  Alert,
  Image
} from 'antd';
import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  PlusOutlined,
  CalendarOutlined,
  EyeOutlined,
  StarOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload';
import { boardingService, type CareLogItem } from '../../../services/BoardingService';
import { storage } from '../../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './CareLog.scss';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CareLog: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // States
  const [careLogs, setCareLogs] = useState<CareLogItem[]>([]);
  const [careLogsLoading, setCareLogsLoading] = useState(true);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(''); // Add image preview like StaffBoardingDetail

  useEffect(() => {
    if (bookingId) {
      fetchCareLogs();
    }
  }, [bookingId]);

  const fetchCareLogs = async () => {
    try {
      setCareLogsLoading(true);
      const logs = await boardingService.getCareLogsByBookingId(bookingId!);
      setCareLogs(logs);
    } catch (error) {
      message.error('Không thể tải lịch sử báo cáo chăm sóc');
      console.error('Error fetching care logs:', error);
    } finally {
      setCareLogsLoading(false);
    }
  };

  // Handle image file selection and upload (similar to StaffBoardingDetail approach)
  const handleImageUpload = async (file: RcFile | File): Promise<string> => {
    try {
      setUploading(true);
      console.log('Starting image upload for file:', file.name);
      
      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ được phép tải lên file hình ảnh!');
        throw new Error('Invalid file type');
      }

      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Kích thước file phải nhỏ hơn 5MB!');
        throw new Error('File too large');
      }
      
      // Create a unique filename with timestamp (consistent with StaffBoardingDetail)
      const timestamp = Date.now();
      const fileName = `care-logs/${bookingId}_${timestamp}`;
      console.log('Upload path:', fileName);
      
      // Create a storage reference
      const storageRef = ref(storage, fileName);
      
      // Upload the file to Firebase Storage
      console.log('Uploading to Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload successful, getting download URL...');
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      setUploadedImageUrl(downloadURL);
      toast.success('Tải ảnh lên thành công!');
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image to Firebase:', error);
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
      throw error;
    } finally {
      setUploading(false);
    }
  };



  const handleCustomUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      console.log('🔵 Custom upload triggered');
      console.log('📁 File object:', file);
      console.log('📋 File type:', typeof file);
      console.log('✅ Is File instance:', file instanceof File);
      
      // File should always be a File object from Ant Design Upload
      if (!(file instanceof File)) {
        const errorMsg = 'Invalid file object - not a File instance';
        console.error('❌', errorMsg, typeof file, file);
        message.error(errorMsg);
        onError?.(new Error(errorMsg) as any);
        return;
      }

      console.log('📊 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Create preview (similar to StaffBoardingDetail)
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload the file to Firebase
      await handleImageUpload(file);
      
      onSuccess?.(file);
      console.log('Upload completed successfully');
    } catch (error) {
      console.error('Error in custom upload:', error);
      setUploadedImageUrl('');
      setImagePreview(''); // Reset preview on error
      onError?.(error as any);
    }
  };

  const onFinish = async (values: { report: string }) => {
    console.log('Form submitted with values:', values);
    console.log('Uploaded image URL:', uploadedImageUrl);
    
    if (!uploadedImageUrl) {
      message.warning('Vui lòng tải ảnh lên trước khi gửi báo cáo');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Creating care log for booking:', bookingId);
      
      const careLogData = {
        bookingId: bookingId!,
        report: values.report,
        photoUrl: uploadedImageUrl
      };
      console.log('Care log data:', careLogData);
      
      await boardingService.createCareLog(careLogData);
      console.log('Care log created successfully');

      toast.success('Tạo báo cáo chăm sóc thành công!');
      
      // Reset form and image
      form.resetFields();
      setUploadedImageUrl('');
      setImagePreview(''); // Reset preview like StaffBoardingDetail
      
      // Refresh care logs
      await fetchCareLogs();
    } catch (error) {
      console.error('Error creating care log:', error);
      message.error('Không thể tạo báo cáo. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadButton = (
    <div>
      {uploading ? <Spin /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>
        {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
      </div>
    </div>
  );

  return (
    <div className="care-log">
      {/* Header */}
      <div className="care-log-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)} 
          className="back-button"
        >
          Quay về
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          Tạo báo cáo chăm sóc
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Create Care Log Form */}
        <Col xs={24} lg={12}>
          <Card title="Tạo báo cáo mới" className="create-care-log-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              className="care-log-form"
            >
              <Form.Item
                name="report"
                label="Nội dung báo cáo"
                rules={[
                  { required: true, message: 'Vui lòng nhập nội dung báo cáo!' },
                  { min: 10, message: 'Báo cáo phải có ít nhất 10 ký tự!' }
                ]}
              >
                <TextArea
                  rows={6}
                  placeholder="Nhập nội dung báo cáo về tình trạng chăm sóc hamster hôm nay..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                label="Hình ảnh minh họa"
                required
              >
                <div className="care-log-uploader">
                  {imagePreview ? (
                    <div className="image-preview-container">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          maxWidth: 400,
                          maxHeight: 300,
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: '1px solid #d9d9d9'
                        }}
                      />
                      <div style={{ marginTop: 12, textAlign: 'center' }}>
                        <Upload
                          name="image"
                          showUploadList={false}
                          customRequest={handleCustomUpload}
                          accept="image/*"
                        >
                          <Button type="dashed" icon={<PlusOutlined />}>
                            Thay đổi hình ảnh
                          </Button>
                        </Upload>
                      </div>
                    </div>
                  ) : (
                    <Upload
                      name="image"
                      listType="picture-card"
                      showUploadList={false}
                      customRequest={handleCustomUpload}
                      accept="image/*"
                      className="upload-dragger"
                    >
                      {uploadButton}
                    </Upload>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                  Chấp nhận file hình ảnh. Kích thước tối đa 5MB.
                </Text>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  block
                  icon={<CloudUploadOutlined />}
                  disabled={uploading}
                >
                  Tạo báo cáo
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Right Column - Care Log History Timeline */}
        <Col xs={24} lg={12}>
          <Card title="Lịch sử báo cáo chăm sóc" className="care-log-history-card">
            {careLogsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Đang tải lịch sử báo cáo...</Text>
                </div>
              </div>
            ) : careLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Alert
                  message="Chưa có báo cáo nào"
                  description="Chưa có báo cáo chăm sóc nào được tạo cho booking này."
                  type="info"
                  showIcon
                />
              </div>
            ) : (
              <Timeline className="daily-timeline">
                {careLogs.map((log) => (
                  <Timeline.Item 
                    key={log.logId} 
                    dot={<StarOutlined style={{ fontSize: 16 }} />} 
                    className="timeline-item"
                  >
                    <div className="report-date">
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      {new Date(log.logDate).toLocaleDateString("vi-VN")}
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {log.logTime} - {log.staffName}
                      </Text>
                    </div>
                    <div className="report-content">
                      <Text>{log.report}</Text>
                    </div>
                    {log.photoUrl && (
                      <div className="report-image">
                        <Image
                          width={300}
                          height={200}
                          src={log.photoUrl}
                          alt={`Care log ${log.logDate}`}
                          style={{ borderRadius: 8 }}
                          placeholder={
                            <div
                              style={{
                                width: 300,
                                height: 200,
                                background: "#f0f0f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 8,
                              }}
                            >
                              <EyeOutlined style={{ fontSize: 32, color: "#d9d9d9" }} />
                            </div>
                          }
                        />
                      </div>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CareLog;