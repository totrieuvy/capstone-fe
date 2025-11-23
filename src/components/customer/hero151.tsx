import { AspectRatio } from "@/components/ui/aspect-ratio";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatars: Array<{
    image: string;
    fallback: string;
  }>;
}

interface Hero151Props {
  heading?: string;
  description?: string;
  button?: {
    text: string;
    url: string;
  };
  testimonial?: Testimonial;
  images: {
    first: string;
    second: string;
    third: string;
    fourth: string;
  };
}

const Hero151 = ({
  heading = "Chăm sóc hamster cho mọi nhà",
  // chagne description to include medical, grooming hamster service
  description = "Dịch vụ chăm sóc sức khỏe, làm đẹp và giữ hộ hamster tận tâm và chuyên nghiệp cho thú cưng của bạn. Chung tôi cam kết mang đến môi trường an toàn và thoải mái nhất cho những người bạn nhỏ của bạn.",
//   button = {
//     text: "Explore Now",
//     url: "/properties",
//   },
    //   testimonial = {
    //     quote: "Found my dream vacation home within minutes. The photos were exactly as advertised!",
    //     author: "Sarah Chen",
    //     role: "Verified Guests",
    //     company: "5★ Rating",
    //     avatars: [
    //       { image: "/images/HomePage/Avatars/Sarah-Chen.jpg", fallback: "AB" },
    //       { image: "/images/HomePage/Avatars/BillGates.webp", fallback: "CD" },
    //       { image: "/images/HomePage/Avatars/Jeff-Bezos.jpg", fallback: "EF" },
    //       { image: "/images/HomePage/Avatars/Woman-1.jpg", fallback: "GH" },
    //       { image: "/images/HomePage/Avatars/Woman-2.jpg", fallback: "GH" },
    //       { image: "/images/HomePage/Avatars/Man-1.jpg", fallback: "GH" },
    //       { image: "/images/HomePage/Avatars/Man-2.jpg", fallback: "GH" },
    //       { image: "", fallback: "+254" },

    //     ],
    //   },
  images = {
    first: "/images/Home/Hamster1.jpg",
    second: "/images/Home/Cage1.jpg",
    third: "/images/Home/Grooming1.jpg",
    fourth: "/images/Home/Healthcare1.jpg",
  },
}: Hero151Props) => {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto ">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="flex-1">
            <div className="flex flex-col gap-4 lg:gap-8">
              <h1 className="max-w-[80%] text-4xl leading-tight font-semibold text-foreground lg:text-5xl xl:text-7xl">
                {heading}
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground xl:text-2xl">
                {description}
              </p>
            </div>
            {/* <div className="my-6 lg:my-10">
              <Button asChild size="lg">
                <a href={button.url}>{button.text}</a>
              </Button>
            </div> */}
            <br/>
            {/* <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex -space-x-[1rem]">
                {testimonial.avatars.map((avatar, index) => (
                  <Avatar
                    key={index}
                    className={`relative z-${index + 1}0 flex h-12 w-12 shrink-0 rounded-full border-2 border-black object-cover`}
                  >
                    <AvatarImage src={avatar.image} alt="" />
                    <AvatarFallback>{avatar.fallback}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div>
                <p className="mb-1 text-sm text-muted-2-foreground italic">
                  &quot;{testimonial.quote}&quot;
                </p>
                <p className="text-sm font-medium text-muted-2-foreground">
                  {testimonial.role} @
                  {testimonial.company}
                </p>
              </div>
            </div> */}
          </div>
          <div className="w-full flex-1">
            <div className="w-full">
              <AspectRatio ratio={1 / 1} className="h-full w-full">
                <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-4">
                  <div className="overflow-hidden rounded-lg border border-muted bg-muted">
                    <img
                      src={images.first}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-muted bg-muted">
                    <img
                      src={images.second}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-muted bg-muted">
                    <img
                      src={images.third}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-muted bg-muted">
                    <img
                      src={images.fourth}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Hero151 };
