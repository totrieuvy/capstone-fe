import { Button, Typography } from "antd";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircleFilled } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

function BookingSuccess() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        backgroundColor: "#fff9f8",
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
        style={{
          color: "#ff6f61",
          fontSize: 100,
          marginBottom: 16,
        }}
      >
        <CheckCircleFilled />
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{ textAlign: "center" }}
      >
        <Title level={2} style={{ color: "#ff6f61" }}>
          Đặt lịch thành công!
        </Title>
        <Paragraph style={{ color: "#555", fontSize: 16 }}>
          Cảm ơn bạn đã tin tưởng sử dụng dịch vụ. Hẹn gặp bạn và bé sớm nhé!
        </Paragraph>

        <Button
          type="primary"
          size="large"
          style={{
            marginTop: 20,
            backgroundColor: "#ff6f61",
            borderColor: "#ff6f61",
            borderRadius: 8,
          }}
          onClick={() => navigate("/")}
        >
          Về trang chủ
        </Button>
      </motion.div>
    </div>
  );
}

export default BookingSuccess;
