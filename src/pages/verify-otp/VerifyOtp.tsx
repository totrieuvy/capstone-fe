import { Button, Form } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./VerifyOtp.scss";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

interface ApiResponse {
  code: number;
  message: string;
}

const VerifyOtp = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    document.title = "Verify OTP";
    if (!token) {
      toast.error("Invalid or missing token");
      navigate("/login");
    }
  }, [token, navigate]);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse>(`/api/auth/confirm-email?token=${token}`);
      toast.success(response.data.message);
      navigate("/login");
    } catch (error: unknown) {
      const err = error as AxiosError<ApiResponse>;
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-background"></div>
      <div className="verify-form">
        <h2>Xác minh Email</h2>
        <p>Vui lòng nhấn nút dưới đây để xác minh email của bạn.</p>
        <Form form={form} name="verify_form" layout="vertical" onFinish={handleVerify}>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              Xác minh
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default VerifyOtp;
