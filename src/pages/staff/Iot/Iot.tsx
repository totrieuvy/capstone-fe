import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Alert, Button, Typography, Space } from 'antd';
import { ArrowLeftOutlined, ExperimentOutlined, CloudOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getTemperature } from '../../../services/IotService';
import './Iot.scss';

const { Title, Text } = Typography;

interface TemperatureData {
  humidity: number;
  temperature: number;
}

const Iot: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TemperatureData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTemperatureData = async () => {
    try {
      setError(null);
      const temperatureData = await getTemperature();
      setData(temperatureData);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError('Không thể tải dữ liệu cảm biến. Vui lòng thử lại.');
      console.error('Error fetching temperature data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTemperatureData();
    
    // Set up continuous refresh every 2 seconds
    const interval = setInterval(fetchTemperatureData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const getTemperatureStatus = (temp: number) => {
    if (temp < 18) return { status: 'Quá lạnh', color: '#1890ff', level: 'low' };
    if (temp <= 24) return { status: 'Lý tưởng', color: '#52c41a', level: 'optimal' };
    if (temp <= 28) return { status: 'Bình thường', color: '#faad14', level: 'normal' };
    if (temp <= 32) return { status: 'Ấm', color: '#fa8c16', level: 'warm' };
    return { status: 'Quá nóng', color: '#f5222d', level: 'hot' };
  };

  const getHumidityStatus = (humidity: number) => {
    if (humidity < 40) return { status: 'Quá khô', color: '#fa8c16', level: 'low' };
    if (humidity <= 60) return { status: 'Lý tưởng', color: '#52c41a', level: 'optimal' };
    if (humidity <= 80) return { status: 'Bình thường', color: '#faad14', level: 'normal' };
    return { status: 'Quá ẩm', color: '#1890ff', level: 'high' };
  };

  const getTemperaturePercent = (temp: number) => {
    return Math.min((temp / 50) * 100, 100);
  };

  if (error && !data) {
    return (
      <div className="iot-container">
        <div className="iot-header">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            type="text"
            size="large"
            className="back-button"
          >
            Quay lại
          </Button>
          <Title level={2}>
            <CloudOutlined /> Giám sát Môi trường
          </Title>
        </div>
        <Alert
          message="Lỗi kết nối"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={fetchTemperatureData}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="iot-container">
      <div className="iot-header">
        <div className="header-left">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            type="text"
            size="large"
            className="back-button"
          >
            Quay lại
          </Button>
          <div>
            <Title level={2}>
              <CloudOutlined /> Giám sát Môi trường
            </Title>
            <Text type="secondary">
              Theo dõi nhiệt độ và độ ẩm trong khu vực chăm sóc hamster
            </Text>
          </div>
        </div>
        <div className="header-right">
          {lastUpdated && (
            <Text type="secondary" className="last-updated">
              Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
            </Text>
          )}
          <div className="auto-refresh-indicator">
            <div className="pulse-dot"></div>
            <Text type="secondary">Tự động cập nhật</Text>
          </div>
        </div>
      </div>

      <Row gutter={[24, 24]} className="gauge-row">
        <Col xs={24} lg={12}>
          <Card 
            className="sensor-card temperature-card"
            title={
              <Space>
                <ExperimentOutlined />
                <span>Nhiệt độ</span>
              </Space>
            }
            extra={
              data && (
                <div className="status-badge">
                  <span 
                    className="status-indicator"
                    style={{ backgroundColor: getTemperatureStatus(data.temperature).color }}
                  />
                  <Text style={{ color: getTemperatureStatus(data.temperature).color }}>
                    {getTemperatureStatus(data.temperature).status}
                  </Text>
                </div>
              )
            }
          >
            {loading && !data ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="gauge-container">
                  <div className="custom-gauge">
                    <div className="gauge-wrapper">
                      <svg width="280" height="280" viewBox="0 0 280 280">
                        <circle
                          cx="140"
                          cy="140"
                          r="120"
                          fill="none"
                          stroke="#f0f0f0"
                          strokeWidth="12"
                        />
                        <circle
                          cx="140"
                          cy="140"
                          r="120"
                          fill="none"
                          stroke={data ? getTemperatureStatus(data.temperature).color : '#d9d9d9'}
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${(data ? getTemperaturePercent(data.temperature) : 0) * 7.54} 754`}
                          transform="rotate(-90 140 140)"
                          className="progress-circle"
                        />
                      </svg>
                      <div className="gauge-content">
                        <div className="gauge-value">
                          {data ? `${data.temperature}` : '--'}
                        </div>
                        <div className="gauge-unit">°C</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="gauge-info">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div className="info-item">
                        <Text type="secondary">Tối thiểu</Text>
                        <div className="info-value">18°C</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="info-item">
                        <Text type="secondary">Lý tưởng</Text>
                        <div className="info-value">20-24°C</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="info-item">
                        <Text type="secondary">Tối đa</Text>
                        <div className="info-value">28°C</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            className="sensor-card humidity-card"
            title={
              <Space>
                <CloudOutlined />
                <span>Độ ẩm</span>
              </Space>
            }
            extra={
              data && (
                <div className="status-badge">
                  <span 
                    className="status-indicator"
                    style={{ backgroundColor: getHumidityStatus(data.humidity).color }}
                  />
                  <Text style={{ color: getHumidityStatus(data.humidity).color }}>
                    {getHumidityStatus(data.humidity).status}
                  </Text>
                </div>
              )
            }
          >
            {loading && !data ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="gauge-container">
                  <div className="custom-gauge">
                    <div className="gauge-wrapper">
                      <svg width="280" height="280" viewBox="0 0 280 280">
                        <circle
                          cx="140"
                          cy="140"
                          r="120"
                          fill="none"
                          stroke="#f0f0f0"
                          strokeWidth="12"
                        />
                        <circle
                          cx="140"
                          cy="140"
                          r="120"
                          fill="none"
                          stroke={data ? getHumidityStatus(data.humidity).color : '#d9d9d9'}
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${(data ? data.humidity : 0) * 7.54} 754`}
                          transform="rotate(-90 140 140)"
                          className="progress-circle"
                        />
                      </svg>
                      <div className="gauge-content">
                        <div className="gauge-value">
                          {data ? `${data.humidity}` : '--'}
                        </div>
                        <div className="gauge-unit">%</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="gauge-info">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div className="info-item">
                        <Text type="secondary">Tối thiểu</Text>
                        <div className="info-value">40%</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="info-item">
                        <Text type="secondary">Lý tưởng</Text>
                        <div className="info-value">40-60%</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="info-item">
                        <Text type="secondary">Tối đa</Text>
                        <div className="info-value">80%</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert
          message="Cảnh báo"
          description={error}
          type="warning"
          showIcon
          closable
          className="error-alert"
        />
      )}
    </div>
  );
};

export default Iot;
