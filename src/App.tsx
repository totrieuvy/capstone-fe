import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Header from "./components/header/header";

const App = () => {
  const router = createBrowserRouter([
    {
      path: "*",
      element: <Header />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
