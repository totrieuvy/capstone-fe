import { Result, Button } from "antd";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../../../redux/features/cartSlice";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearCart());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Button type="primary" key="home" onClick={() => navigate("/")}>
            Về trang chủ
          </Button>,
        ]}
      />
    </div>
  );
};

export default PaymentSuccess;
