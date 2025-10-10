import React, { useState, useEffect } from "react";
import {
  PoweroffOutlined,
  AreaChartOutlined,
  ShoppingOutlined,
  UserOutlined,
  SkinOutlined,
  HomeOutlined,
  ScheduleOutlined,
  ClockCircleOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { GiPawPrint } from "react-icons/gi";
import { BiCategory } from "react-icons/bi";
import { Layout, Menu, Button, theme } from "antd";
import type { ItemType } from "antd/es/menu/interface";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/features/userSlice";
import logo from "../../assets/logo.png";
import "./Sidebar.scss";

interface User {
  id: number;
  role: "ADMIN" | "STAFF" | "VETERINARIAN" | "SHIPPER" | string;
}

interface RootState {
  user: User | null;
}

const { Sider, Content } = Layout;

type MenuItem = Required<ItemType>;

const getItem = (label: React.ReactNode, key: string, icon?: React.ReactNode, children?: MenuItem[]): MenuItem => {
  if (children) {
    return {
      key,
      icon,
      children,
      label,
    } as MenuItem;
  }
  return {
    key,
    icon,
    label: <Link to={key}>{label}</Link>,
  } as MenuItem;
};

const SideBar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const user = useSelector((state: RootState) => state.user);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    let items: MenuItem[] = [];

    if (user?.role === "ADMIN") {
      items = [
        getItem("Quản lí loài hamster", "quan-li-loai-hamster", <GiPawPrint />),
        getItem("Quản lí danh mục sản phẩm", "quan-li-danh-muc-san-pham", <BiCategory />),
        getItem("Quản lí sản phẩm", "quan-li-san-pham", <TagOutlined />),
        getItem("Quản lí loại chuồng", "quan-li-loai-chuong", <GiPawPrint />),
        getItem("Thống kê", "thong-ke", <AreaChartOutlined />),
        getItem("Quản lí tài khoản", "quan-li-tai-khoan", <UserOutlined />),
        getItem("Quản lí đơn hàng", "quan-li-don-hang", <ShoppingOutlined />),
      ];
    } else if (user?.role === "STAFF") {
      items = [
        getItem("Grooming", "grooming", <SkinOutlined />, [
          getItem("Quản lí dịch vụ grooming", "quan-li-dich-vu-grooming"),
          getItem("Lịch đặt grooming", "lich-dat-grooming"),
        ]),
        getItem("Boarding", "boarding", <HomeOutlined />, [
          getItem("Quản lí dịch vụ boarding", "quan-li-dich-vu-boarding"),
          getItem("Lịch đặt boarding", "lich-dat-boarding"),
        ]),
      ];
    } else if (user?.role === "VETERINARIAN") {
      items = [
        getItem("Lịch khám của tui", "lich-kham", <ScheduleOutlined />),
        getItem("Lịch đặt khám", "lich-dat-kham", <ClockCircleOutlined />),
      ];
    }

    setMenuItems(items);
  }, [user?.role, user?.id]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={270}
        className="Sidebar"
        style={{ background: colorBgContainer }}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        breakpoint="lg"
        collapsedWidth="80"
      >
        <div className={`Sidebar__logo ${collapsed ? "collapsed" : ""}`}>
          <img src={logo} alt="Logo" />
        </div>

        <Menu mode="inline" className="Sidebar__menu" items={menuItems} />

        <div className="Sidebar__logout">
          <Button type="primary" danger icon={<PoweroffOutlined />} onClick={handleLogout}>
            {!collapsed && "Đăng xuất"}
          </Button>
        </div>
      </Sider>

      <Layout>
        <Content
          style={{
            margin: "16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default SideBar;
