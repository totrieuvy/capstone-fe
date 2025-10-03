import { Form, Input, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import "./ForgotPassword.scss";
import { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

interface ApiResponse {
  code: number;
  message: string;
}

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Forgot Password";
  }, []);

  const handleForgotPassword = async (values: { email: string }) => {
    setLoading(true);
    try {
      const response = await api.post<ApiResponse>("/api/auth/forget-password", {
        email: values.email,
      });
      toast.success(response.data.message);
      navigate("/login");
    } catch (error: unknown) {
      const err = error as AxiosError<ApiResponse>;
      toast.error(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-background"></div>
      <div className="forgot-password-form">
        <h2>Quên mật khẩu</h2>
        <Form
          form={form}
          name="forgot_password_form"
          initialValues={{ remember: true }}
          layout="vertical"
          onFinish={handleForgotPassword}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email của bạn!" },
              { type: "email", message: "Vui lòng nhập email hợp lệ!" },
            ]}
          >
            <Input placeholder="Nhập email của bạn" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              Gửi đặt lại mật khẩu
            </Button>
          </Form.Item>

          <div className="form-links">
            <Link to="/login">Quay lại đăng nhập</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPassword;
