import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

const GroomingPaymentSuccess = () => {
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
        extra={[
          <Button type="primary" key="home" onClick={() => navigate("/STAFF/lich-dat-grooming")}>
            Quay về danh sách đặt lịch grooming
          </Button>,
        ]}
      />
    </div>
  );
};

export default GroomingPaymentSuccess;
