import { Outlet } from "react-router-dom";
import Header from "../components/header/header";

function Layout() {
  return (
    <div>
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
