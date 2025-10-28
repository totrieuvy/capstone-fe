import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./Panel.scss";

const Panel: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const menuItems = [
    { key: "1", to: "/grooming-history", text: "Lịch grooming" },
    { key: "2", to: "/appointment", text: "Lịch khám" },
    { key: "3", to: "/boarding-schedule", text: "Lịch gửi hộ" },
  ];

  return (
    <div className="Panel">
      <div className="Panel__left">
        <NavLink to="/profile" end className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
          <span role="img" aria-label="profile">
            👤
          </span>
          Hồ sơ của bạn
        </NavLink>

        <NavLink to="/profile/your-hamster" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
          <span role="img" aria-label="hamster">
            🐹
          </span>
          Hồ sơ hamster
        </NavLink>

        <NavLink to="/profile/wallet" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
          <span role="img" aria-label="wallet">
            💰
          </span>
          Ví của bạn
        </NavLink>

        <NavLink to="/your-orders" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
          <span role="img" aria-label="orders">
            📦
          </span>
          Đơn hàng của bạn
        </NavLink>

        <div
          className={`menu-item dropdown ${isDropdownOpen ? "open" : ""}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span role="img" aria-label="calendar">
            📅
          </span>
          Lịch
          <span className={`arrow ${isDropdownOpen ? "rotate" : ""}`} style={{ marginLeft: "auto" }}>
            ▼
          </span>
        </div>

        {isDropdownOpen && (
          <div className="submenu">
            {menuItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}
              >
                {item.text}
              </NavLink>
            ))}
          </div>
        )}
      </div>

      <div className="Panel__right">
        <Outlet />
      </div>
    </div>
  );
};

export default Panel;
