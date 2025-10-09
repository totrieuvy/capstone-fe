import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f6ffed",
      }}
    >
      <Result
        status="success"
        title="Thanh toán thành công!"
        subTitle="Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý."
        extra={[
          <Button type="primary" key="home" onClick={() => navigate("/")}>
            Về trang chủ
          </Button>,
          <Button key="order" onClick={() => navigate("/order-history")}>
            Xem đơn hàng
          </Button>,
        ]}
      />
    </div>
  );
};

export default PaymentSuccess;
