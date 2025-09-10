import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

import "./header.scss";
import logo from "../../assets/logo.png";
import Navigation from "../../constants/navigation";
import { useEffect } from "react";

function Header() {
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
        <Link to="/login">
          <FaUserCircle />
        </Link>
      </div>
    </header>
  );
}

export default Header;
