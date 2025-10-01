import { Link } from "react-router-dom";
import { FaUserCircle, FaUser, FaSignOutAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import "./header.scss";
import logo from "../../assets/logo.png";
import Navigation from "../../constants/navigation";
import { useEffect } from "react";
import { logout } from "../../redux/features/userSlice";

type RootState = {
  user: { fullName: string; role: string } | null;
};

function Header() {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector(".header");
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add("header--scrolled");
        } else {
          header.classList.remove("header--scrolled");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const user = useSelector((state: RootState) => state.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="header">
      <div className="header__left">
        <Link to="/">
          <img src={logo} alt="logo" className="header__left__logo" />
        </Link>
      </div>
      <div className="header__middle">
        {Navigation.map((item) => (
          <Link key={item.id} to={item.path}>
            {item.name}
          </Link>
        ))}
      </div>
      <div className="header__right">
        {user && user?.role === "CUSTOMER" ? (
          <div className="dropdown">
            <span className="dropdown-toggle">
              <FaUserCircle /> Welcome {user?.fullName}
            </span>
            <div className="dropdown-menu">
              <Link to="/profile/your-hamster" className="dropdown-item">
                <FaUser /> Thông tin cá nhân
              </Link>
              <Link to="/" className="dropdown-item" onClick={handleLogout}>
                <FaSignOutAlt /> Đăng xuất
              </Link>
            </div>
          </div>
        ) : (
          <Link to="/login">
            <FaUserCircle style={{ fontSize: "35px", color: "#e0732f" }} />
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
