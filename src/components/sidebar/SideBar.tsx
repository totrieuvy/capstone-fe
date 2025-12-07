import React, { useState, useEffect } from "react";
import {
  PoweroffOutlined,
  AreaChartOutlined,
  ShoppingOutlined,
  UserOutlined,
  SkinOutlined,
  HomeOutlined,
  ScheduleOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { GiCage } from "react-icons/gi";
import { BiPlusMedical } from "react-icons/bi";
import { Layout, Menu, Button, theme } from "antd";
import type { ItemType } from "antd/es/menu/interface";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/features/userSlice";
import logo from "../../assets/logo.png";
import "./Sidebar.scss";
import { VscFeedback } from "react-icons/vsc";
import { AiOutlineMedicineBox } from "react-icons/ai";
import { IoChatboxEllipsesOutline } from "react-icons/io5";

interface User {
  id: number;
  role: "ADMIN" | "STAFF" | "VET" | "SHIPPER" | string;
}
interface RootState {
  user: User | null;
}

const { Sider, Content } = Layout;
type MenuItem = Required<ItemType>;

const getItem = (label: React.ReactNode, key: string, icon?: React.ReactNode, children?: MenuItem[]): MenuItem => {
  if (children) {
    return { key, icon, children, label } as MenuItem;
  }
  return { key, icon, label: <Link to={key}>{label}</Link> } as MenuItem;
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
        getItem("Dashboard", "thong-ke", <AreaChartOutlined />),
        getItem("Quản lí sản phẩm", "product-management", <TagOutlined />, [
          getItem("Loài hamster", "quan-li-loai-hamster"),
          getItem("Danh mục sản phẩm", "quan-li-danh-muc-san-pham"),
          getItem("Sản phẩm", "quan-li-san-pham"),
        ]),
        getItem("Quản lí dịch vụ", "service-management", <BiPlusMedical />, [
          getItem("Dịch vụ y tế", "quan-li-dich-vu-y-te"),
          getItem("Grooming lẻ", "quan-li-dich-vu-grooming/grooming-le"),
          getItem("Grooming combo", "quan-li-dich-vu-grooming/grooming-combo"),
        ]),
        getItem("Cơ sở hạ tầng", "infrastructure", <GiCage />, [
          getItem("Loại chuồng", "quan-li-loai-chuong"),
          getItem("Chính sách", "chinh-sach"),
        ]),
        getItem("Vận hành kinh doanh", "business-operations", <ShoppingOutlined />, [
          getItem("Đơn hàng", "quan-li-don-hang"),
          getItem("Giao dịch", "quan-li-giao-dich"),
          getItem("Rút tiền", "don-rut-tien"),
        ]),
        getItem("Quản lí feedback", "quan-li-feedback", <VscFeedback />),

        getItem("Quản lí tài khoản", "tai-khoan", <UserOutlined />, [
          getItem("Nhân viên", "quan-li-nhan-vien"),
          getItem("Khách hàng", "quan-li-khach-hang"),
        ]),
        getItem("Quản lí sự cố", "quan-li-su-co", <AreaChartOutlined />),
      ];
    } else if (user?.role === "STAFF") {
      items = [
        getItem("Dịch vụ y tế", "medical-checkup", <BiPlusMedical />, [getItem("Lịch đặt khám", "lich-dat-kham")]),
        getItem("Làm đẹp", "grooming", <SkinOutlined />, [getItem("Lịch đặt làm đẹp", "lich-dat-grooming")]),
        getItem("Chat", "chat", <IoChatboxEllipsesOutline />, [getItem("Quản lí chat", "quan-li-chat")]),

        getItem("Boarding", "boarding", <HomeOutlined />, [
          getItem("Lịch đặt boarding", "lich-dat-boarding"),
          getItem("Sơ đồ chuồng", "so-do-chuong"),
        ]),
      ];
    } else if (user?.role === "VET") {
      items = [
        getItem("Lịch khám hôm nay", "lich-kham-hom-nay", <ScheduleOutlined />),
        getItem("Quản lí kê thuốc", "quan-li-ke-thuoc", <AiOutlineMedicineBox />),
      ];
    }
    setMenuItems(items);
  }, [user?.role, user?.id]);

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sider
        width={270}
        className="Sidebar"
        style={{
          background: colorBgContainer,
          height: "100vh",
          overflow: "hidden",
        }}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        breakpoint="lg"
        collapsedWidth="80"
      >
        <div className={`Sidebar__logo ${collapsed ? "collapsed" : ""}`}>
          <img src={logo} alt="Logo" />
        </div>

        <div className="Sidebar__scroll-area">
          <Menu mode="inline" className="Sidebar__menu" items={menuItems} inlineIndent={20} />
        </div>

        <div className="Sidebar__logout">
          <Button type="primary" danger icon={<PoweroffOutlined />} onClick={handleLogout}>
            {!collapsed && "Đăng xuất"}
          </Button>
        </div>
      </Sider>

      <Layout>
        <Content
          style={{
            margin: 0,
            padding: 24,
            height: "100vh",
            overflowY: "auto",
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
