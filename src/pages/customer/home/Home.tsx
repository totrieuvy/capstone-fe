import { Hero151 } from "@/components/customer/hero151";
import { Hero45 } from "@/components/customer/hero45";


export default function Home() {
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
      {/* <Hero1 heading="Turn Your Property into Profit" description="Join thousands of successful hosts who are earning extra income by sharing their spaces. List your property today and start welcoming guests from around the world." image={{ src: "/images/HomePage/HostDashboard.jpg", alt: "Host dashboard showing property management interface" }} /> */}
    </>
  )
}