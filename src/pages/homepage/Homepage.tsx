import { useEffect } from "react";
import Banner from "../../components/banner/Banner";
import "./Homepage.scss";

function Homepage() {
  useEffect(() => {
    document.title = "The Hamster";
  }, []);

  return (
    <div className="Homepage">
      <div>
        <Banner />
      </div>
      <div>Homepage</div>
    </div>
  );
}

export default Homepage;
