import { Outlet } from "react-router-dom";
import Header from "../components/header/header";
import Footer from "../components/footer/Footer";
import AiChat from "@/components/ai-chat/AiChat";

function Layout() {
  return (
    <div>
      <Header />
      <main>
        <Outlet />
        <AiChat />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
