import { Form, Input, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import "./Register.scss";
import { useEffect, useState } from "react";
import { useForm } from "antd/es/form/Form";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

// 👉 Đặt interface ở đây
interface RegisterValues {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  citizenId: string;
  password: string;
  confirm: string;
}

interface ApiError {
  message: string;
}

const Register = () => {
  const [form] = useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Register";
  }, []);

  const handleRegister = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/register", {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        citizenId: values.citizenId,
        password: values.password,
      });
      toast.success(response.data.data);
      navigate("/login");
    } catch (error: unknown) {
      const err = error as AxiosError<ApiError>;
      toast.error(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-background"></div>
      <div className="signup-form">
        <h2>Đăng kí</h2>
        <Form
          form={form}
          name="signup_form"
          initialValues={{ remember: true }}
          layout="vertical"
          onFinish={handleRegister}
        >
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên của bạn!" }]}
          >
            <Input placeholder="Nhập họ và tên của bạn" size="large" />
          </Form.Item>

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

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại của bạn!" },
              { pattern: /^[0-9]{10}$/, message: "Vui lòng nhập số điện thoại hợp lệ 10 chữ số!" },
            ]}
          >
            <Input placeholder="Nhập số điện thoại của bạn" size="large" />
          </Form.Item>

          <Form.Item
            label="Địa chỉ nhà"
            name="address"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ nhà của bạn!" }]}
          >
            <Input placeholder="Nhập địa chỉ nhà của bạn" size="large" />
          </Form.Item>

          <Form.Item
            label="Số căn cước công dân"
            name="citizenId"
            rules={[{ required: true, message: "Vui lòng nhập cố căn cước công dân của bạn!" }]}
          >
            <Input placeholder="Nhập cố căn cước công dân của bạn" size="large" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu của bạn!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu của bạn" size="large" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirm"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu của bạn!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu của bạn" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              Đăng ký
            </Button>
          </Form.Item>

          <div className="form-links">
            <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Register;
