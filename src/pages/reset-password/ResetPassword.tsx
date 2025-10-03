import { Button, Form, Input } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./ResetPassword.scss";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

interface ApiResponse {
  code: number;
  message: string;
}

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    document.title = "Reset Password";
    if (!token) {
      toast.error("Invalid or missing token");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const handleReset = async (values: { password: string }) => {
    setLoading(true);
    try {
      const response = await api.post<ApiResponse>("/api/auth/reset-password", {
        token,
        password: values.password,
      });
      toast.success(response.data.message);
      navigate("/login");
    } catch (error: unknown) {
      const err = error as AxiosError<ApiResponse>;
      toast.error(err.response?.data?.message || "Reset password failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-background"></div>
      <div className="reset-password-form">
        <h2>Đặt lại mật khẩu</h2>
        <p>Vui lòng nhập mật khẩu mới để đặt lại mật khẩu của bạn.</p>
        <Form form={form} name="reset_password_form" layout="vertical" onFinish={handleReset}>
          <Form.Item
            label="Mật khẩu mới"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" size="large" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirm"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              Đặt lại mật khẩu
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

export default ResetPassword;
