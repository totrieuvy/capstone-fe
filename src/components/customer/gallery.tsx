"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface GalleryItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
}

interface Gallery6Props {
  heading?: string;
  demoUrl?: string;
  items?: GalleryItem[];
}

const Gallery6 = ({
  heading = "Các dịch vụ nổi bật",
  items = [
    {
        // Provide hamster product description title, summary, url
      id: "item-1",
      title: "Khám phá sản phẩm hamster",
      summary:
        "Tìm hiểu về các sản phẩm hamster chất lượng cao, từ thức ăn đến phụ kiện chăm sóc, giúp thú cưng của bạn luôn khỏe mạnh và hạnh phúc.",
      url: "/mua-hang",
      image: "/images/Home/HamsterProduct.jpg",
    },
    {
        // Provide healthcare service description title, summary, url
      id: "item-2",
      title: "Chăm sóc sức khỏe hamster",
      summary:
        "Cung cấp các dịch vụ chăm sóc sức khỏe chuyên nghiệp cho hamster, bao gồm kiểm tra sức khỏe và khám chuyên sâu",
      url: "/dich-vu-y-te",
      image: "/images/Home/HamsterHealthcare.jpg",
    },
    {
        // Provide grooming service description title, summary, url
      id: "item-3",
      title: "Làm đẹp, vệ sinh hamster",
      summary:
        "Cung cấp các dịch vụ làm đẹp, vệ sinh cho hamster, bao gồm tỉa lông, tắm rửa và chăm sóc da.",
      url: "/dich-vu-lam-dep",
      image: "/images/Home/Grooming1.jpg",
    },
    {
        // Provide boarding service description title, summary, url
      id: "item-4",
      title: "Dịch vụ lưu trú hamster",
      summary:
        "Cung cấp các dịch vụ lưu trú an toàn và tiện nghi cho hamster trong thời gian bạn vắng nhà.",
      url: "/dat-lich-giu-ho",
      image: "/images/Home/Cage1.jpg",
    }
  ],
}: Gallery6Props) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);
  return (
    <section className="py-16">
      <div className="container mx-auto px-13 max-w-7xl">
        <div className="mb-8 flex flex-col justify-center md:mb-14 lg:mb-16">
          <div>
            <h2 className="mb-3 text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 text-center">
              {heading}
            </h2>
          </div>
          <div className="mt-2 flex shrink-0 items-center justify-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                carouselApi?.scrollPrev();
              }}
              disabled={!canScrollPrev}
              className="disabled:pointer-events-auto"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                carouselApi?.scrollNext();
              }}
              disabled={!canScrollNext}
              className="disabled:pointer-events-auto"
            >
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full max-w-full px-4 md:px-8 lg:px-12">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            breakpoints: {
              "(max-width: 768px)": {
                dragFree: true,
              },
            },
          }}
          className="w-full"
        >
          <CarouselContent className="hide-scrollbar -ml-4 md:-ml-6">
            {items.map((item) => (
              <CarouselItem key={item.id} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3">
                <a
                  href={item.url}
                  className="group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-3/2 flex overflow-clip rounded-xl">
                      <div className="flex-1">
                        <div className="relative h-full w-full origin-bottom transition duration-300 group-hover:scale-105">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 line-clamp-3 break-words pt-4 text-lg font-medium md:mb-3 md:pt-4 md:text-xl lg:pt-4 lg:text-2xl">
                    {item.title}
                  </div>
                  <div className="text-muted-foreground mb-8 line-clamp-2 text-sm md:mb-12 md:text-base lg:mb-9">
                    {item.summary}
                  </div>
                  <div className="flex items-center text-sm">
                    Xem thêm{" "}
                    <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export { Gallery6 };