import { Navigate, Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import Layout from "./layouts/Layout";
import Homepage from "./pages/homepage/Homepage";
import NotFoundPage from "./pages/not-found/customer/NotFoundPage";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import ForgotPassword from "./pages/forgot-password/ForgotPassword";
import { useSelector, useDispatch } from "react-redux";
import SideBar from "./components/sidebar/SideBar";
import ManageAccount from "./pages/admin/account/ManageAccount";
import Dashboard from "./pages/admin/dashboard/Dashboard";
import { useEffect } from "react";
import { logout } from "./redux/features/userSlice";
import { jwtDecode } from "jwt-decode";
import Panel from "./components/panel/Panel";
import ProfileHamster from "./pages/customer/profile-hamster/ProfileHamster";
import VerifyOtp from "./pages/verify-otp/VerifyOtp";
import Species from "./pages/admin/species/Species";
import ResetPassword from "./pages/reset-password/ResetPassword";
import Category from "./pages/admin/category-product/Category";
import ManageProduct from "./pages/admin/product/ManageProduct";
import BoardingHamster from "./pages/customer/boarding/boarding-booking/BoardingHamster";
import ProductDetail from "./pages/product-detail/ProductDetail";
import { clearCart } from "./redux/features/cartSlice";
import Checkout from "./pages/customer/checkout/Checkout";
import PaymentSuccess from "./pages/customer/payment-success/PaymentSuccess";
import TrackOrder from "./pages/customer/track-order/track-order-overall/TrackOrder";
import TrackOrderDetail from "./pages/customer/track-order/track-order-detail/TrackOrderDetail";
import CageType from "./pages/admin/cage-type/CageType";
import ViewProfile from "./pages/customer/profile/ProfileCustomer";
import WalletCustomer from "./pages/customer/wallet-customer/WalletCustomer";
import PaymentFail from "./pages/customer/payment-fail/PaymentFail";
import ManageOrder from "./pages/admin/manage-orders/orders/ManageOrder";
import ManageOrderDetail from "./pages/admin/manage-orders/detail-orders/ManageOrderDetail";
import ManageTransaction from "./pages/admin/manage-transaction/ManageTransaction";
import BoardingHistory from "./pages/customer/boarding/boarding-history/BoardingHistory";
import BoardingDetail from "./pages/customer/boarding/boarding-history-detail/CustomerBoardingDetail";
import BoardingSchedule from "./pages/staff/boarding/BoardingSchedule";
import StaffBoardingDetail from "./pages/staff/boarding-detail/StaffBoardingDetail";
import StaffCheckOut from "./pages/staff/checkout/StaffCheckOut";
import StaffNotFoundPage from "./pages/not-found/staff/StaffNotFoundPage";
import AdminNotFoundPage from "./pages/not-found/admin/AdminNotFoundPage";
import BoardingPaymentSuccess from "./pages/staff/medical/payment-screen/BoardingPaymentSuccess";
import BoardingPaymentFailure from "./pages/staff/medical/payment-screen/BoardingPaymentFailure";
import GroomingPage from "./pages/customer/grooming/dich-vu-lam-dep/GroomingPage";
import ManageGroomingService from "./pages/admin/manage-grooming-service/ManageGroomingService";
import CareLog from "./pages/staff/care-log/CareLog";
import Iot from "./pages/staff/Iot/Iot";
import ManageComboGrooming from "./pages/admin/manage-grooming-service/manage-combo-grooming/ManageComboGrooming";
import ManageComboGroomingDetail from "./pages/admin/manage-grooming-service/manage-combo-grooming-detail/ManageComboGroomingDetail";
import ManageGroomingServiceDetail from "./pages/admin/manage-grooming-service/manage-grooming-single-detail/ManageGroomingServiceDetail";
import BookingGroomingService from "./pages/customer/grooming/dat-dich-vu-lam-dep/BookingGroomingService";
import BookingSuccess from "./components/booking-success/BookingSuccess";
import MedicalList from "./pages/customer/medical/medical-list/MedicalList";
import ManageMedical from "./pages/admin/manage-medical-services/ManageMedical";
import HistoryGrooming from "./pages/admin/manage-grooming-service/history-grooming/HistoryGrooming";
import HistoryGroomingDetail from "./pages/staff/grooming/HistoryGroomingDetail";
import MedicalBooking from "./pages/customer/medical/medical-booking/MedicalBooking";
import TrackGrooming from "./pages/customer/grooming/history/track-grooming/TrackGrooming";
import TrackGroomingDetail from "./pages/customer/grooming/history/track-grooming-detail/TrackGroomingDetail";
import GroomingPaymentSuccess from "./pages/customer/grooming/payment-success/GroomingPaymentSuccess";
import ManageAppointment from "./pages/staff/medical/manage-appointment/manage-appointment";
import ManageAppointmentDetail from "./pages/staff/medical/manage-appointment-detail/manage-appointment-detail";
import MedicalAppointmentHistory from "./pages/customer/medical/medical-appointment-history/MedicalAppointmentHistory";
import MedicalAppointmentHistoryDetail from "./pages/customer/medical/medical-appointment-history-detail/MedicalAppointmentHistoryDetail";
import VetNotFoundPage from "./pages/not-found/veterinarian/VetNotFoundPage";
import HamsterSchedule from "./pages/veterinarian/today-schedule/TodaySchedule";
import VetAppointmentDetail from "./pages/veterinarian/vet-appointment-detail/VetAppointmentDetail";
import Examination from "./pages/veterinarian/examination/Examination";
import ManageMedicine from "./pages/veterinarian/manage-medicine/ManageMedicine";
import MedicalPaymentFailure from "./pages/staff/medical/payment-screen/MedicalPaymentFailure";
import MedicalPaymentSuccess from "./pages/staff/medical/payment-screen/MedicalPaymentSuccess";
import CageFloorPlan from "./pages/staff/cage/CageFloorPlan";
import Policy from "./pages/admin/policy/Policy";
import WithDraw from "./pages/admin/withdraw/WithDraw";
import HistoryMedicalHamster from "./pages/customer/profile-hamster/HistoryMedicalHamster";
import ManageFeedback from "./pages/admin/feedback/ManageFeedback";

interface User {
  id: number;
  role: "ADMIN" | "STAFF" | "VET" | "SHIPPER" | string;
  token?: string;
}

interface RootState {
  user: User | null;
}

interface DecodedToken {
  exp: number;
}

interface PrivateRouteProps {
  role?: "ADMIN" | "STAFF" | "VET" | "SHIPPER";
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ role }) => {
  const user = useSelector((state: RootState) => state.user);
  const isAuthenticated = !!user?.token;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && role !== user?.role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded: DecodedToken = jwtDecode(token);
          const currentTime = Math.floor(Date.now() / 1000);
          if (decoded.exp < currentTime) {
            dispatch(logout());
            dispatch(clearCart());
            window.location.href = "/";
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          dispatch(logout());
          window.location.href = "/";
        }
      } else {
        dispatch(logout());
        dispatch(clearCart());
      }
    };

    checkTokenExpiration();

    const intervalId = setInterval(checkTokenExpiration, 30 * 1000);

    return () => clearInterval(intervalId);
  }, [dispatch]);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "/", element: <Homepage /> },
        { path: "/product/:id", element: <ProductDetail /> },
        { path: "*", element: <NotFoundPage /> },
        { path: "/login", element: <Login /> },
        { path: "/register", element: <Register /> },
        { path: "/forgot-password", element: <ForgotPassword /> },
        { path: "/verify-otp", element: <VerifyOtp /> },
        { path: "/reset-password", element: <ResetPassword /> },
        { path: "/checkout", element: <Checkout /> },
        { path: "/payment-success", element: <PaymentSuccess /> },
        { path: "/payment-failure", element: <PaymentFail /> },
        { path: "/dich-vu-lam-dep", element: <GroomingPage /> },
        {
          path: "/booking-success",
          element: <BookingSuccess />,
        },
        { path: "/dich-vu-lam-dep/dat-dich-vu", element: <BookingGroomingService /> },
        {
          path: "/profile",
          element: <Panel />,
          children: [
            {
              path: "",
              element: <ViewProfile />,
            },
          ],
        },
        {
          path: "/your-orders",
          element: <Panel />,
          children: [
            { path: "", element: <TrackOrder /> },
            { path: ":orderId", element: <TrackOrderDetail /> },
          ],
        },
        { path: "/dat-lich-giu-ho", element: <BoardingHamster /> },
        {
          path: "/profile/wallet",
          element: <Panel />,
          children: [
            {
              path: "",
              element: <WalletCustomer />,
            },
          ],
        },
        {
          path: "/profile/your-hamster",
          element: <Panel />,
          children: [
            {
              path: "",
              element: <ProfileHamster />,
            },
            {
              path: "medical/:hamsterId",
              element: <HistoryMedicalHamster />,
            },
          ],
        },
        {
          path: "/grooming-history",
          element: <Panel />,
          children: [
            {
              path: "",
              element: <TrackGrooming />,
            },
            {
              path: ":id",
              element: <TrackGroomingDetail />,
            },
          ],
        },
        {
          path: "/boarding-schedule",
          element: <Panel />,
          children: [
            {
              path: "",
              element: <BoardingHistory />,
            },
            {
              path: ":bookingId",
              element: <BoardingDetail />,
            },
          ],
        },
        {
          path: "/lich-su-kham",
          element: <Panel />,
          children: [
            {
              path: "",
              element: <MedicalAppointmentHistory />,
            },
          ],
        },
        {
          path: "/lich-su-kham",
          element: <Panel />,
          children: [
            {
              path: "",
              element: <MedicalAppointmentHistory />,
            },
            {
              path: ":appointmentId",
              element: <MedicalAppointmentHistoryDetail />,
            },
          ],
        },
        {
          path: "/dich-vu-y-te",
          element: <MedicalList />,
        },
        {
          path: "/dich-vu-y-te/dat-dich-vu",
          element: <MedicalBooking />,
        },
      ],
    },
    {
      path: "/ADMIN",
      element: <PrivateRoute role="ADMIN" />,
      children: [
        {
          path: "",
          element: <SideBar />,
          children: [
            { path: "quan-li-feedback", element: <ManageFeedback /> },
            { path: "don-rut-tien", element: <WithDraw /> },
            { path: "quan-li-tai-khoan", element: <ManageAccount /> },
            { path: "thong-ke", element: <Dashboard /> },
            { path: "quan-li-loai-hamster", element: <Species /> },
            { path: "quan-li-danh-muc-san-pham", element: <Category /> },
            { path: "quan-li-loai-chuong", element: <CageType /> },
            { path: "quan-li-dich-vu-y-te", element: <ManageMedical /> },
            { path: "quan-li-dich-vu-grooming/grooming-le", element: <ManageGroomingService /> },
            { path: "chinh-sach", element: <Policy /> },
            { path: "quan-li-dich-vu-grooming/grooming-le/:id", element: <ManageGroomingServiceDetail /> },
            {
              path: "quan-li-dich-vu-grooming/grooming-combo",
              element: <ManageComboGrooming />,
            },
            {
              path: "quan-li-dich-vu-grooming/grooming-combo/:id",
              element: <ManageComboGroomingDetail />,
            },
            {
              path: "quan-li-san-pham",
              element: <ManageProduct />,
            },
            {
              path: "quan-li-don-hang",
              children: [
                { path: "", element: <ManageOrder /> },
                { path: ":orderId", element: <ManageOrderDetail /> },
              ],
            },
            {
              path: "quan-li-giao-dich",
              element: <ManageTransaction />,
            },
            {
              path: "*",
              element: <AdminNotFoundPage />,
            },
          ],
        },
      ],
    },
    {
      path: "/STAFF",
      element: <PrivateRoute role="STAFF" />,
      children: [
        {
          path: "",
          element: <SideBar />,
          children: [
            { path: "lich-dat-boarding", element: <BoardingSchedule /> },
            { path: "booking-detail/:bookingId", element: <StaffBoardingDetail /> },
            { path: "care-log/:bookingId", element: <CareLog /> },
            { path: "checkout", element: <StaffCheckOut /> },
            { path: "so-do-chuong", element: <CageFloorPlan /> },
            { path: "*", element: <StaffNotFoundPage /> },
            { path: "thong-so-iot", element: <Iot /> },
            { path: "lich-dat-grooming", element: <HistoryGrooming /> },
            { path: "groomingpayment-success", element: <GroomingPaymentSuccess /> },
            { path: "lich-dat-grooming/:id", element: <HistoryGroomingDetail /> },
            { path: "*", element: <StaffNotFoundPage /> },
            { path: "lich-dat-kham", element: <ManageAppointment /> },
            { path: "lich-dat-kham/:appointmentId", element: <ManageAppointmentDetail /> },
          ],
        },
        {
          path: "boardingpayment-success",
          element: <BoardingPaymentSuccess />,
        },
        {
          path: "boardingpayment-failure",
          element: <BoardingPaymentFailure />,
        },
        {
          path: "medical-payment-success",
          element: <MedicalPaymentSuccess />,
        },
        {
          path: "medical-payment-failure",
          element: <MedicalPaymentFailure />,
        },
      ],
    },
    {
      path: "/VET",
      element: <PrivateRoute role="VET" />,
      children: [
        {
          path: "",
          element: <SideBar />,
          children: [
            { path: "lich-kham-hom-nay", element: <HamsterSchedule /> },
            { path: "lich-kham/:appointmentId", element: <VetAppointmentDetail /> },
            { path: "examination/:appointmentId", element: <Examination /> },
            { path: "quan-li-ke-thuoc", element: <ManageMedicine /> },
            { path: "*", element: <VetNotFoundPage /> },
          ],
        },
      ],
    },
    {
      path: "/SHIPPER",
      element: <PrivateRoute role="SHIPPER" />,
      children: [{ path: "", element: <SideBar /> }],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
