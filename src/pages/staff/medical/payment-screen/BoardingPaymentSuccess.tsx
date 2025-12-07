import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { CheckCircleOutlined, DashboardOutlined } from '@ant-design/icons';

const BoardingPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/STAFF/lich-dat-boarding');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '72px' }} />}
        title={
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#262626',
            margin: '24px 0'
          }}>
            Thanh toán thành công
          </h1>
        }
        subTitle="Giao dịch đã được xử lý thành công. Cảm ơn bạn đã sử dụng dịch vụ!"
        extra={
          <Button
            type="primary"
            size="large"
            icon={<DashboardOutlined />}
            onClick={handleBackToDashboard}
            style={{
              height: '50px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '25px',
              padding: '0 32px',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
            }}
          >
            Về danh sách đặt lịch boarding
          </Button>
        }
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          maxWidth: '600px',
          width: '100%'
        }}
      />
    </div>
  );
};

export default BoardingPaymentSuccess;
