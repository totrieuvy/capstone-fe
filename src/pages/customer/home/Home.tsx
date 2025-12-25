import AiChat from "@/components/ai-chat/AiChat";
import { Hero151 } from "@/components/customer/hero151";
import { Hero45 } from "@/components/customer/hero45";
import { Gallery6 } from "@/components/customer/gallery";
import { useEffect } from "react";
export default function Home() {
  useEffect(() => {
    document.title = "Trang chủ";
  }, []);

  return (
    <>
      <Hero151
        images={{
          first: "/images/Home/Hamster1.jpg",
          second: "/images/Home/Cage1.jpg",
          third: "/images/Home/Grooming1.jpg",
          fourth: "/images/Home/Healthcare1.jpg",
        }}
      />
      <Hero45 heading="Trải nghiệm dịch vụ chăm sóc hamster tốt nhất" />
      <Gallery6 />
      <AiChat />
    </>
  );
}
