import { Form, Input, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import "./Login.scss";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { useForm } from "antd/es/form/Form";
import { AxiosError } from "axios";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { login } from "../../redux/features/userSlice";
import { messaging } from "../../config/firebase";
import { getToken } from "firebase/messaging";

interface LoginValues {
  email: string;
  password: string;
}

interface ApiError {
  message: string;
}

const LoginForm = () => {
  const [form] = useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    document.title = "Login";
  }, []);

  const getFcmToken = async () => {
    try {
      if (!("Notification" in window)) {
        console.warn("⚠️ Trình duyệt không hỗ trợ Notification API");
        return null;
      }

      const permission = await Notification.requestPermission();
      console.log("🔔 Notification permission:", permission);

      if (permission !== "granted") {
        console.warn("🚫 Người dùng chưa cấp quyền thông báo");
        return null;
      }

      const token = await getToken(messaging, {
        vapidKey: "BOYKZ4MFMfEBL8WJTLid1bmd-m0Hbq8Aru3jlJTbylPWiHpdxyiKlhU97BtPw3K44Uyn4BLqzzVmsptNvwatdRI",
      });

      if (token) {
        console.log("🎯 FCM Token:", token);
        return token;
      } else {
        console.warn("⚠️ Không lấy được token (có thể thiếu service worker)");
        return null;
      }
    } catch (err) {
      console.error("💥 Lỗi khi lấy FCM token:", err);
      return null;
    }
  };

  const handleLogin = async (values: LoginValues) => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", {
        email: values.email,
        password: values.password,
      });

      if (response.status === 200) {
        const token = response.data.data.accessToken;
        const user = response.data.data.user;
        const role = user.role;

        toast.success(response.data.message);

        localStorage.setItem("token", token);

        const userData = { ...user, token };
        dispatch(login(userData));

        const fcmToken = await getFcmToken();
        console.log("Thiết bị này có FCM token:", fcmToken);

        switch (role) {
          case "ADMIN":
            navigate("/ADMIN/thong-ke", { replace: true });
            break;
          case "STAFF":
            navigate("/STAFF/lich-dat-kham", { replace: true });
            break;
          case "VET":
            navigate("/VET/lich-kham-hom-nay", { replace: true });
            break;
          case "SHIPPER":
            navigate("/SHIPPER", { replace: true });
            break;
          default:
            navigate("/", { replace: true });
        }
      }
    } catch (error: unknown) {
      const err = error as AxiosError<ApiError>;
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
      form.resetFields();
    }
  };

  const handleLoginGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken;
      const response = await api.post("/api/auth/google", { token: idToken });
      const token = response.data.data.accessToken;
      const user = response.data.data.user;
      const role = user.role;

      toast.success(response.data.message);

      localStorage.setItem("token", token);

      const userData = { ...user, token };
      dispatch(login(userData));

      switch (role) {
        case "ADMIN":
          navigate("/ADMIN", { replace: true });
          break;
        case "STAFF":
          navigate("/STAFF", { replace: true });
          break;
        case "VET":
          navigate("/VET", { replace: true });
          break;
        case "SHIPPER":
          navigate("/SHIPPER", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }
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
        <Form form={form} name="login_form" initialValues={{ remember: true }} layout="vertical" onFinish={handleLogin}>
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
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
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
