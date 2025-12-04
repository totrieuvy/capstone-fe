import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Image, Alert, Tag, Divider } from 'antd';
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined, 
  CreditCardOutlined,
  DollarOutlined,
  CalendarOutlined,
  PictureOutlined
} from '@ant-design/icons';
import type { BookingCheckOutResponse } from '../../../services/BoardingService';
import './StaffCheckOut.scss';

const StaffCheckOut: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const checkOutData = location.state?.checkOutData as BookingCheckOutResponse;

  // If no checkout data, redirect back
  if (!checkOutData) {
    return (
      <div className="staff-checkout">
        <div className="staff-checkout-container">
          <Alert
            message="Không tìm thấy thông tin check-out"
            description="Vui lòng thực hiện check-out lại từ trang chi tiết booking."
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => navigate(-1)}>
                Quay lại
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePayment = () => {
    if (checkOutData.paymentUrl) {
      window.location.href = checkOutData.paymentUrl;
    }
  };

  return (
    <div className="staff-checkout">
      <div className="staff-checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            className="back-button"
          >
            Quay lại
          </Button>
          <div className="header-content">
            <h1 className="page-title">
              <CheckCircleOutlined className="success-icon" />
              Check-out thành công
            </h1>
            <p className="booking-id">Booking ID: {checkOutData.bookingId}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="checkout-content">
          {/* Check-out Image */}
          <Card
            title={
              <div className="section-title">
                <PictureOutlined />
                <span>Hình ảnh Check-out</span>
              </div>
            }
            className="checkout-image-card"
          >
            <div className="image-container">
              <Image
                src={checkOutData.checkOutImageUrl}
                alt="Check-out Image"
                width="100%"
                style={{ maxHeight: 400, objectFit: 'cover', borderRadius: 8 }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN4BMghAuFTBQSIQTBcAEQMDHhpZQOgQStWN8+dG1yoGaFNTTLRQ5YZJ1pHIqKqLZRrGaVe7P2XZ8w+zn7K/r1D8TL/xN8fhsAAAAAAAA="
              />
            </div>
          </Card>

          {/* Booking Information */}
          <Card
            title={
              <div className="section-title">
                <CalendarOutlined />
                <span>Thông tin Check-out</span>
              </div>
            }
            className="checkout-info-card"
          >
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="Ngày Check-out" span={2}>
                <Tag color="blue" className="date-tag">
                  {formatDate(checkOutData.actualCheckOutDate)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={
                  checkOutData.status === 'CHECK_OUT' ? 'green' : 
                  checkOutData.status === 'IN_PROGRESS' ? 'processing' : 
                  'default'
                }>
                  {checkOutData.status === 'CHECK_OUT' ? 'Hoàn tất' : 
                   checkOutData.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 
                   checkOutData.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">
                <Tag color="orange">{checkOutData.paymentMethod}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Payment Information */}
          <Card
            title={
              <div className="section-title">
                <DollarOutlined />
                <span>Thông tin Thanh toán</span>
              </div>
            }
            className="payment-info-card"
          >
            <div className="payment-summary">
              <div className="payment-row">
                <span className="payment-label">Tổng tiền ban đầu:</span>
                <span className="payment-value">{formatPrice(checkOutData.totalAmount)}</span>
              </div>
              
              <div className="payment-row">
                <span className="payment-label">Tổng tiền sau điều chỉnh:</span>
                <span className="payment-value">{formatPrice(checkOutData.totalAmountAfter)}</span>
              </div>
              
              {checkOutData.additionalPayment > 0 && (
                <>
                  <Divider dashed />
                  <div className="payment-row additional-payment">
                    <span className="payment-label">
                      <CreditCardOutlined style={{ marginRight: 8 }} />
                      Phí bổ sung cần thanh toán:
                    </span>
                    <span className="payment-value highlight">
                      {formatPrice(checkOutData.additionalPayment)}
                    </span>
                  </div>
                </>
              )}
            </div>

        

            {/* No Additional Payment Alert */}
            {!checkOutData.requiresPayment && (
              <Alert
                message="Hoàn tất thanh toán"
                description="Booking đã được check-out thành công. Không có phí bổ sung."
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </Card>

          {/* Payment Button */}
          {checkOutData.requiresPayment && checkOutData.paymentUrl && (
            <div className="payment-action">
              <Button
                type="primary"
                size="large"
                icon={<CreditCardOutlined />}
                onClick={handlePayment}
                className="payment-button"
              >
                Thanh toán {formatPrice(checkOutData.additionalPayment)}
              </Button>
              <p className="payment-note">
                Bạn sẽ được chuyển đến trang thanh toán để hoàn tất giao dịch.
              </p>
            </div>
          )}

          {/* Success Action */}
          {!checkOutData.requiresPayment && (
            <div className="success-action">
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() => navigate('/STAFF/lich-dat-boarding')}
                className="success-button"
              >
                Xác nhận thanh toán
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffCheckOut;
