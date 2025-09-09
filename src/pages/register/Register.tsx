import { Form, Input, Button } from "antd";
import { Link } from "react-router-dom";
import "./Register.scss";
import { useEffect } from "react";

const Register = () => {
  useEffect(() => {
    document.title = "Register";
  }, []);

  return (
    <div className="signup-container">
      <div className="signup-background"></div>
      <div className="signup-form">
        <h2>Đăng kí</h2>
        <Form name="signup_form" initialValues={{ remember: true }} layout="vertical">
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
            rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu của bạn!" }]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu của bạn" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
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
