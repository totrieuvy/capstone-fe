import { Navigate, Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import Layout from "./layouts/Layout";
import Homepage from "./pages/homepage/Homepage";
import NotFoundPage from "./pages/not-found/NotFoundPage";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import ForgotPassword from "./pages/forgot-password/ForgotPassword";
import { useSelector } from "react-redux";
import SideBar from "./components/sidebar/SideBar";
import ManageAccount from "./pages/admin/account/ManageAccount";
import Dashboard from "./pages/admin/dashboard/Dashboard";

interface User {
  id: number;
  role: "ADMIN" | "STAFF" | "VETERINARIAN" | "SHIPPER" | string;
  token?: string;
}

interface RootState {
  user: User | null;
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
