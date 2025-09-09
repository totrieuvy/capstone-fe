import { Form, Input, Button } from "antd";
import { Link } from "react-router-dom";
import "./ForgotPassword.scss";

const ForgotPassword = () => {
  return (
    <div className="forgot-password-container">
      <div className="forgot-password-background"></div>
      <div className="forgot-password-form">
        <h2>Quên mật khẩu</h2>
        <Form name="forgot_password_form" initialValues={{ remember: true }} layout="vertical">
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
            <Button type="primary" htmlType="submit" size="large" block>
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
