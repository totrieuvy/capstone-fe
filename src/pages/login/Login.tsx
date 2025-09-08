import { Form, Input, Button } from "antd";
import { Link } from "react-router-dom";
import "./Login.scss";

const LoginForm = () => {
  return (
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-form">
        <h2>Sign In</h2>
        <Form name="login_form" initialValues={{ remember: true }} layout="vertical">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input placeholder="Enter your email" size="large" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="Enter your password" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              Sign In
            </Button>
          </Form.Item>

          <div className="form-links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <Link to="/sign-up">Sign Up</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginForm;
