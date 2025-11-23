export type NavItem = {
  id: number;
  name: string;
  path: string;
};

const Navigation: NavItem[] = [
  {id: 0, name: "Trang chủ", path: "/" },
  { id: 1, name: "Mua hàng", path: "/mua-hang" },
  { id: 2, name: "Đặt lịch khám", path: "/dich-vu-y-te" },
  { id: 3, name: "Đặt lịch làm đẹp", path: "/dich-vu-lam-dep" },
  { id: 4, name: "Đặt lịch giữ hộ", path: "/dat-lich-giu-ho" },
  { id: 5, name: "Chat", path: "/chat" },
];

export default Navigation;
