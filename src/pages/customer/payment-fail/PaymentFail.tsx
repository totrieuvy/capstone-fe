import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

const PaymentFail: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#fff2f0",
      }}
    >
      <Result
        status="error"
        title="Thanh toán thất bại"
        subTitle={"Giao dịch không thành công. Vui lòng thử lại."}
        extra={[
          <Button key="home" type="primary" onClick={() => navigate("/")}>
            Về trang chủ
          </Button>,
        ]}
      />
    </div>
  );
};

export default PaymentFail;
