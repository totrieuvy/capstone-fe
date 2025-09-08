import { useEffect, useState } from "react";
import "./Banner.scss";

const demoImages = [
  "https://i.pinimg.com/736x/d9/68/98/d9689879968181f45f9d093834e31e39.jpg",
  "https://i.pinimg.com/736x/85/72/64/85726483542c98e8dfd5490df6307356.jpg",
  "https://i.pinimg.com/736x/08/00/0d/08000d8801942b1361523a7bc75be253.jpg",
  "https://i.pinimg.com/736x/68/dd/f9/68ddf917578febc5bd3046052149e32f.jpg",
  "https://i.pinimg.com/1200x/3f/24/9a/3f249a2e56af310771389da4cddff832.jpg",
];

function Banner() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex === demoImages.length - 1 ? 0 : prevIndex + 1;
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="banner">
      {demoImages.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Banner ${index + 1}`}
          className={index === currentImageIndex ? "active" : ""}
        />
      ))}
      <div className="banner-text">Chất lượng làm nên thương hiệu của chúng tôi</div>
    </div>
  );
}

export default Banner;
