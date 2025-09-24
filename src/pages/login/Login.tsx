import { Form, Input, Button } from "antd";
import { Link } from "react-router-dom";
import "./Login.scss";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";

const LoginForm = () => {
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    document.title = "Login";
  }, []);

  const handleLoginGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);

      const credential = GoogleAuthProvider.credentialFromResult(result);
      console.log(credential);
    } catch (error) {
      console.error("Google login error:", error);
    } finally {
      setLoading(false);
    }
  };

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

          <div className="separator">
            <span className="separator-line"></span>
            <span className="separator-text">Or</span>
            <span className="separator-line"></span>
          </div>

          <Form.Item>
            <Button size="large" block className="google-login-button" onClick={handleLoginGoogle} loading={loading}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/250px-Google_Favicon_2025.svg.png"
                alt="Google logo"
                className="google-logo"
              />
              Đăng nhập với Google
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
