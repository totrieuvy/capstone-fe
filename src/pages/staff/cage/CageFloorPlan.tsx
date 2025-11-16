import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Card, 
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
  HomeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  FireOutlined,
  CloudOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { boardingService } from '../../../services/BoardingService';
import type { CageFloorPlanItem } from '../../../services/BoardingService';
import { cageTypeService } from '../../../services/CageTypeService';
import type { CageTypeResponse } from '../../../services/CageTypeService';
import { getTemperature } from '../../../services/IotService';
import type { TemperatureData } from '../../../services/IotService';
import { getFormattedPrice } from '../../../utils/formatPrice';
import './CageFloorPlan.scss';

const { Title, Text } = Typography;
const { Option } = Select;

interface CageDisplayItem extends CageFloorPlanItem {
  cageTypeInfo?: CageTypeResponse;
  temperatureData?: TemperatureData;
}

const CageFloorPlan: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cages, setCages] = useState<CageDisplayItem[]>([]);
  const [cageTypes, setCageTypes] = useState<CageTypeResponse[]>([]);
  const [selectedCageTypeId, setSelectedCageTypeId] = useState<string>('all');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cagesRef = useRef<CageDisplayItem[]>([]);

  // Keep cagesRef in sync with cages state
  useEffect(() => {
    cagesRef.current = cages;
  }, [cages]);

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load cages when cage type filter changes
  useEffect(() => {
    loadCages();
  }, [selectedCageTypeId]);

  // Function to update temperature data
  const updateTemperatureData = useCallback(async () => {
    const currentCages = cagesRef.current;
    if (currentCages.length === 0) return;

    try {
      const updatedCages = await Promise.all(
        currentCages.map(async (cage) => {
          if (cage.iotCode) {
            try {
              const temperatureData = await getTemperature(cage.iotCode);
              return {
                ...cage,
                temperatureData
              };
            } catch (error) {
              console.warn(`Failed to get temperature for IoT ${cage.iotCode}:`, error);
              return cage;
            }
          }
          return cage;
        })
      );
      setCages(updatedCages);
    } catch (error) {
      console.error('Error updating temperature data:', error);
    }
  }, []);

  // Update temperature data every 2 seconds
  useEffect(() => {
    // Set up interval to update temperature data every 2 seconds
    intervalRef.current = setInterval(updateTemperatureData, 2000);

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateTemperatureData]); // Include updateTemperatureData in dependency array

  const loadInitialData = async () => {
    try {
      // Load cage types first
      const types = await cageTypeService.getCageTypes();
      setCageTypes(types.filter(type => type.isActive));
      
      // Then load cage floor plan
      await loadCages();
    } catch (error) {
      console.error('Error loading initial data:', error);
      message.error('Không thể tải dữ liệu ban đầu');
    }
  };

  const loadCages = async () => {
    setLoading(true);
    try {
      // Get floor plan data
      const floorPlanData = await boardingService.getCageFloorPlan();
      
      // Filter by cage type if selected
      const filteredCages = selectedCageTypeId === 'all' 
        ? floorPlanData 
        : floorPlanData.filter(cage => cage.cageTypeId === selectedCageTypeId);
      
      // Add cage type info and temperature data to each cage
      const cagesWithInfo = await Promise.all(
        filteredCages.map(async (cage) => {
          // Add cage type info
          const cageTypeInfo = cageTypes.find(type => type.id === cage.cageTypeId);
          
          // Add temperature data if cage has IoT
          let temperatureData: TemperatureData | undefined;
          if (cage.iotCode) {
            try {
              temperatureData = await getTemperature(cage.iotCode);
            } catch (error) {
              console.warn(`Failed to get temperature for IoT ${cage.iotCode}:`, error);
            }
          }
          
          return {
            ...cage,
            cageTypeInfo,
            temperatureData
          };
        })
      );
      
      setCages(cagesWithInfo);
    } catch (error) {
      console.error('Error loading cages:', error);
      message.error('Không thể tải dữ liệu chuồng');
      setCages([]);
    } finally {
      setLoading(false);
    }
  };

  const availableCages = cages.filter(cage => !cage.bookingId);
  const occupiedCages = cages.filter(cage => cage.bookingId);

  return (
    <div className="cage-management">
      <div className="cage-management-container">
        {/* Header */}
        <div className="detail-header">
          <div className="header-content">
            <Title level={2} className="page-title">
              Sơ Đồ Chuồng
            </Title>
            <Text className="booking-id">
              Quản lí và theo dõi tình trạng chuồng theo thời gian thực
            </Text>
          </div>
        </div>

        {/* Filters */}
        <Card className="info-card" style={{ marginBottom: 24 }}>
          <div className="section-title">
            <HomeOutlined />
            <span>Bộ Lọc</span>
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
                <Option value="all">Tất cả loại chuồng</Option>
                {cageTypes.map(type => (
                  <Option key={type.id} value={type.id}>
                    {type.typeName} - {type.sizeDimensions}
                  </Option>
                ))}
              </Select>
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
                  <div className="stat-number in-use">{occupiedCages.length}</div>
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
                    {cages.length > 0 ? Math.round((occupiedCages.length / cages.length) * 100) : 0}%
                  </div>
                  <div className="stat-label">Tỷ Lệ Sử Dụng</div>
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* Cage Floor Plan */}
        <Card className="info-card">
          <div className="section-title">
            <HomeOutlined />
            <span>Sơ Đồ Chuồng</span>
            {selectedCageTypeId !== 'all' && cageTypes.find(t => t.id === selectedCageTypeId) && (
              <Tag color="blue" style={{ marginLeft: 'auto' }}>
                {cageTypes.find(t => t.id === selectedCageTypeId)?.typeName}
              </Tag>
            )}
          </div>
            <br/>
          {/* Floor Plan Legend */}
          <div className="floor-plan-legend">
            <div className="legend-title">Chú thích:</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-icon available"></div>
                <span>Có sẵn</span>
              </div>
              <div className="legend-item">
                <div className="legend-icon occupied"></div>
                <span>Đang sử dụng</span>
              </div>
              <div className="legend-item">
                <div className="legend-icon iot"></div>
                <span>Có cảm biến IoT</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <p>Đang tải dữ liệu chuồng...</p>
            </div>
          ) : cages.length === 0 ? (
            <Empty 
              description="Không tìm thấy chuồng nào"
              style={{ margin: '40px 0' }}
            />
          ) : (
            <div className="cage-grid">
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {cages.map(cage => {
                  const isOccupied = cage.bookingId !== null;
                  const hasIoT = cage.iotCode !== null;
                  
                  return (
                    <Col xs={24} sm={12} md={8} lg={8} xl={8} key={cage.cageId}>
                      <Card 
                        className={`cage-card ${isOccupied ? 'occupied' : 'available'} ${hasIoT ? 'iot-enabled' : ''}`}
                        hoverable
                        style={{
                          borderLeft: `4px solid ${isOccupied ? '#ff4d4f' : '#52c41a'}`,
                          position: 'relative'
                        }}
                      >
                        <div className="cage-content">
                          <div className="cage-header">
                            <Title level={5} className="cage-id">
                              {cage.cageName}
                            </Title>
                            <Badge 
                              status={isOccupied ? 'error' : 'success'}
                              text={isOccupied ? 'Đang sử dụng' : 'Có sẵn'}
                            />
                          </div>
                          
                          <div className="cage-status">
                            <Tag 
                              color={isOccupied ? 'error' : 'success'}
                              icon={isOccupied ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                              className="status-tag"
                            >
                              {isOccupied ? 'Đang sử dụng' : 'Có sẵn'}
                            </Tag>
                            {hasIoT && (
                              <Tag color="blue" className="iot-tag">
                                IoT: {cage.iotCode}
                              </Tag>
                            )}
                          </div>

                          {/* Temperature and Humidity Display */}
                          {hasIoT && cage.temperatureData && (
                            <div className="iot-data">
                              <div className="iot-metric">
                                <FireOutlined style={{ color: '#ff7875' }} />
                                <span>{cage.temperatureData.temperature}°C</span>
                              </div>
                              <div className="iot-metric">
                                <CloudOutlined style={{ color: '#40a9ff' }} />
                                <span>{cage.temperatureData.humidity}%</span>
                              </div>
                            </div>
                          )}

                          {/* Cage Type Information */}
                          {cage.cageTypeInfo && (
                            <div className="cage-type-info">
                              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                <Text type="secondary">
                                  <strong>Loại:</strong> {cage.cageTypeInfo.typeName}
                                </Text>
                                <Text type="secondary">
                                  <strong>Kích thước:</strong> {cage.cageTypeInfo.sizeDimensions}
                                </Text>
                                <Text type="secondary">
                                  <strong>Giá:</strong> {getFormattedPrice(cage.cageTypeInfo.price)}/ngày
                                </Text>
                              </Space>
                            </div>
                          )}

                          {/* Booking Information */}
                          {isOccupied && (
                            <div className="booking-info">
                              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                {cage.customerName && (
                                  <Text type="secondary">
                                    <UserOutlined style={{ marginRight: 4 }} />
                                    <strong>Khách:</strong> {cage.customerName}
                                  </Text>
                                )}
                                {cage.hamsterName && (
                                  <Text type="secondary">
                                    <strong>Hamster:</strong> {cage.hamsterName}
                                  </Text>
                                )}
                                {cage.startDate && cage.endDate && (
                                  <Text type="secondary">
                                    <CalendarOutlined style={{ marginRight: 4 }} />
                                    <strong>Thời gian:</strong> {cage.startDate} đến {cage.endDate}
                                  </Text>
                                )}
                              </Space>
                            </div>
                          )}
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CageFloorPlan;
