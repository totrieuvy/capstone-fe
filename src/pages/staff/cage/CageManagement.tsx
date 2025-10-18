import React, { useState, useEffect } from 'react';
import { 
  Card, 
  DatePicker, 
  Select, 
  Spin, 
  Row, 
  Col, 
  Tag, 
  Typography, 
  Space, 
  Empty,
  Badge,
  message
} from 'antd';
import { 
  CalendarOutlined, 
  HomeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { cageService } from '../../../services/CageService';
import type { Cage } from '../../../services/CageService';
import { cageTypeService } from '../../../services/CageTypeService';
import type { CageTypeResponse } from '../../../services/CageTypeService';
import { getFormattedPrice } from '../../../utils/formatPrice';
import './CageManagement.scss';

const { Title, Text } = Typography;
const { Option } = Select;

interface CageDisplayItem extends Cage {
  cageTypeInfo?: CageTypeResponse;
}

const CageManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cages, setCages] = useState<CageDisplayItem[]>([]);
  const [cageTypes, setCageTypes] = useState<CageTypeResponse[]>([]);
  const [selectedCageTypeId, setSelectedCageTypeId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  // Load cage types on component mount
  useEffect(() => {
    loadCageTypes();
  }, []);

  // Load cages when cage type or date changes
  useEffect(() => {
    if (selectedCageTypeId && selectedDate) {
      loadCages();
    }
  }, [selectedCageTypeId, selectedDate]);

  const loadCageTypes = async () => {
    try {
      const types = await cageTypeService.getCageTypes();
      setCageTypes(types.filter(type => type.isActive));
      if (types.length > 0 && types[0].isActive) {
        setSelectedCageTypeId(types[0].id);
      }
    } catch (error) {
      console.error('Error loading cage types:', error);
      message.error('Không thể tải danh sách loại chuồng');
    }
  };

  const loadCages = async () => {
    if (!selectedCageTypeId || !selectedDate) return;

    setLoading(true);
    try {
      const response = await cageService.getCagesByTypeAndDate({
        cageTypeId: selectedCageTypeId,
        date: selectedDate.format('YYYY-MM-DD')
      });
      
      // Add cage type info to each cage
      const selectedCageType = cageTypes.find(type => type.id === selectedCageTypeId);
      const cagesWithTypeInfo = response.cages.map(cage => ({
        ...cage,
        cageTypeInfo: selectedCageType
      }));
      
      setCages(cagesWithTypeInfo);
    } catch (error) {
      console.error('Error loading cages:', error);
      message.error('Không thể tải dữ liệu chuồng');
      setCages([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Available' ? 'success' : 'error';
  };

  const getStatusIcon = (status: string) => {
    return status === 'Available' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
  };

  const availableCages = cages.filter(cage => cage.status === 'Available');
  const inUseCages = cages.filter(cage => cage.status === 'In Use');

  return (
    <div className="cage-management">
      <div className="cage-management-container">
        {/* Header */}
        <div className="detail-header">
          <div className="header-content">
            <Title level={2} className="page-title">
              <HomeOutlined style={{ marginRight: 12 }} />
              Quản Lý Chuồng
            </Title>
            <Text className="booking-id">
              Quản lý và theo dõi tình trạng chuồng
            </Text>
          </div>
        </div>

        {/* Filters */}
        <Card className="info-card" style={{ marginBottom: 24 }}>
          <div className="section-title">
            <CalendarOutlined />
            <span>Tùy Chọn Lọc</span>
          </div>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12}>
              <Text strong>Loại Chuồng:</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Chọn loại chuồng"
                value={selectedCageTypeId}
                onChange={setSelectedCageTypeId}
                loading={cageTypes.length === 0}
              >
                {cageTypes.map(type => (
                  <Option key={type.id} value={type.id}>
                    {type.typeName} - {type.sizeDimensions}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Ngày:</Text>
              <DatePicker
                style={{ width: '100%', marginTop: 8 }}
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
              />
            </Col>
          </Row>
        </Card>

        {/* Statistics */}
        {cages.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8} md={6}>
              <Card className="stat-card">
                <div className="stat-content">
                  <div className="stat-number available">{availableCages.length}</div>
                  <div className="stat-label">Có Sẵn</div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card className="stat-card">
                <div className="stat-content">
                  <div className="stat-number in-use">{inUseCages.length}</div>
                  <div className="stat-label">Đang Sử Dụng</div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card className="stat-card">
                <div className="stat-content">
                  <div className="stat-number total">{cages.length}</div>
                  <div className="stat-label">Tổng Số</div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card className="stat-card">
                <div className="stat-content">
                  <div className="stat-number occupancy">
                    {cages.length > 0 ? Math.round((inUseCages.length / cages.length) * 100) : 0}%
                  </div>
                  <div className="stat-label">Tỷ Lệ Sử Dụng</div>
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* Cage List */}
        <Card className="info-card">
          <div className="section-title">
            <HomeOutlined />
            <span>Trạng Thái Chuồng</span>
            {selectedCageTypeId && cageTypes.find(t => t.id === selectedCageTypeId) && (
              <Tag color="blue" style={{ marginLeft: 'auto' }}>
                {cageTypes.find(t => t.id === selectedCageTypeId)?.typeName}
              </Tag>
            )}
          </div>

          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <p>Đang tải dữ liệu chuồng...</p>
            </div>
          ) : cages.length === 0 ? (
            <Empty 
              description={
                !selectedCageTypeId || !selectedDate 
                  ? "Vui lòng chọn loại chuồng và ngày để xem danh sách chuồng"
                  : "Không tìm thấy chuồng phù hợp với tiêu chí đã chọn"
              }
              style={{ margin: '40px 0' }}
            />
          ) : (
            <div className="cage-grid">
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {cages.map(cage => (
                  <Col xs={24} sm={12} md={8} lg={6} key={cage.cageId}>
                    <Card 
                      className={`cage-card ${cage.status.toLowerCase().replace(' ', '-')}`}
                      hoverable
                    >
                      <div className="cage-content">
                        <div className="cage-header">
                          <Title level={5} className="cage-id">
                            {cage.cageName || `Chuồng ${cage.cageId}`}
                          </Title>
                          <Badge 
                            status={cage.status === 'Available' ? 'success' : 'error'}
                            text={cage.status === 'Available' ? 'Có sẵn' : 'Đang sử dụng'}
                          />
                        </div>
                        
                        <div className="cage-status">
                          <Tag 
                            color={getStatusColor(cage.status)}
                            icon={getStatusIcon(cage.status)}
                            className="status-tag"
                          >
                            {cage.status === 'Available' ? 'Có sẵn' : 'Đang sử dụng'}
                          </Tag>
                        </div>

                        <div className="cage-details">
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            {/* <Text type="secondary">
                              <strong>Cage ID:</strong> {cage.cageId}
                            </Text> */}
                            {cage.cageTypeInfo && (
                              <>
                                <Text type="secondary">
                                  <strong>Kích thước:</strong> {cage.cageTypeInfo.sizeDimensions}
                                </Text>
                                <Text type="secondary">
                                  <strong>Chất liệu:</strong> {cage.cageTypeInfo.material}
                                </Text>
                                <Text type="secondary">
                                  <strong>Giá:</strong> {getFormattedPrice(cage.cageTypeInfo.price)}/ngày
                                </Text>
                              </>
                            )}
                          </Space>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CageManagement;
