import { Navigate, Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import Layout from "./layouts/Layout";
import Homepage from "./pages/homepage/Homepage";
import NotFoundPage from "./pages/not-found/NotFoundPage";
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
import Species from "./pages/admin/species/Species";

interface User {
  id: number;
  role: "ADMIN" | "STAFF" | "VETERINARIAN" | "SHIPPER" | string;
  token?: string;
}

interface RootState {
  user: User | null;
}

interface DecodedToken {
  exp: number;
}

interface PrivateRouteProps {
  role?: "ADMIN" | "STAFF" | "VETERINARIAN" | "SHIPPER";
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
            localStorage.removeItem("token");
            window.location.href = "/";
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          dispatch(logout());
          localStorage.removeItem("token");
          window.location.href = "/";
        }
      }
    };

    const intervalId = setInterval(checkTokenExpiration, 30 * 1000);

    checkTokenExpiration();

    return () => clearInterval(intervalId);
  }, [dispatch]);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "/", element: <Homepage /> },
        { path: "*", element: <NotFoundPage /> },
        { path: "/login", element: <Login /> },
        { path: "/register", element: <Register /> },
        { path: "/forgot-password", element: <ForgotPassword /> },
        {
          path: "/profile/your-hamster",
          element: <Panel />,
          children: [
            {
              path: "",
              element: <ProfileHamster />,
            },
          ],
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
            { path: "quan-li-tai-khoan", element: <ManageAccount /> },
            { path: "thong-ke", element: <Dashboard /> },
            { path: "quan-li-loai-hamster", element: <Species /> },
          ],
        },
      ],
    },
    {
      path: "/STAFF",
      element: <PrivateRoute role="STAFF" />,
      children: [{ path: "", element: <SideBar /> }],
    },
    {
      path: "/VETERINARIAN",
      element: <PrivateRoute role="VETERINARIAN" />,
      children: [{ path: "", element: <SideBar /> }],
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
