import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { CloseCircleOutlined, DashboardOutlined } from '@ant-design/icons';

const GroomingPaymentFailure: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/STAFF/lich-dat-grooming');
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
        icon={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '72px' }} />}
        title={
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#262626',
            margin: '24px 0'
          }}>
            Thanh toán thất bại
          </h1>
        }
        subTitle="Giao dịch không thể hoàn tất. Vui lòng thử lại hoặc liên hệ hỗ trợ."
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
            Về danh sách đặt lịch grooming
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

export default GroomingPaymentFailure;
