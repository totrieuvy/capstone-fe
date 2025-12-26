import { Link } from "react-router-dom";
import "./Footer.scss";
import logo from "../../assets/logo.png";
import { EnvironmentOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import Navigation from "../../constants/navigation";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <Link to="/">
            <img src={logo} alt="Hamster Logo" className="footer-logo-img" />
          </Link>
        </div>
        <div className="footer-services">
          <h3>CÁC DỊCH VỤ</h3>
          <ul>
            {Navigation.map((item) => (
              <li key={item.id}>
                <Link to={item.path ?? "/"}>{item.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-contact">
          <h3>LIÊN HỆ</h3>
          <p>
            <EnvironmentOutlined className="icon" /> Lô E2a-7, Đường D1, Long Thạnh Mỹ, TP. Thủ Đức, Hồ Chí Minh
          </p>
          <p>
            <MailOutlined className="icon" /> hamster@nls.io.vn
          </p>
          <p>
            <PhoneOutlined className="icon" /> 090811111
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
