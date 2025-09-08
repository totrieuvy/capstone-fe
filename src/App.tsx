import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Layout from "./layouts/Layout";
import Homepage from "./pages/homepage/Homepage";
import NotFoundPage from "./pages/not-found/NotFoundPage";
import Login from "./pages/login/Login";

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Homepage />,
        },
        {
          path: "*",
          element: <NotFoundPage />,
        },
        {
          path: "/login",
          element: <Login />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
