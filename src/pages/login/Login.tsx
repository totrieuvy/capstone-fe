import { Form, Input, Button } from "antd";
import { Link } from "react-router-dom";
import "./Login.scss";
import { useEffect } from "react";

const LoginForm = () => {
  useEffect(() => {
    document.title = "Login";
  }, []);

  return (
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-form">
        <h2>Đăng nhập</h2>
        <Form name="login_form" initialValues={{ remember: true }} layout="vertical">
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
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu của bạn!" }]}
          >
            <Input.Password placeholder="Nhập mật khẩu của bạn" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              Đăng nhập
            </Button>
          </Form.Item>

          <div className="form-links">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
            <Link to="/register">Đăng ký</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginForm;
