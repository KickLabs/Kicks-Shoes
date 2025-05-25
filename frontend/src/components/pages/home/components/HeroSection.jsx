import { LandingSlogan } from "./LandingSlogan";
import heroImage from "../../../../assets/images/HomePage/hero-image.png";
import heroPreview1 from "../../../../assets/images/HomePage/hero-preview1.png";
import heroPreview2 from "../../../../assets/images/HomePage/hero-preview2.png";
import "./HeroSection.css";
import { Button } from "antd";

export const HeroSection = () => {
  return (
    <>
      <LandingSlogan />
      <div className="hero-preview-wrapper">
        <img id="bg-img" src={heroImage} alt="Nike Max Air" />
        <div className="thumbnail-preview">
          <div className="text">
            <h4>Nike air max</h4>
            <p>Nike introducing the new air max for everyone's comfort</p>
          </div>
          <Button>Shop Now</Button>
        </div>
        <div className="right-stick">
          <p>Nike product of the year</p>
        </div>
        <div className="preview-image">
          <img src={heroPreview1} alt="preview-image" />
          <img src={heroPreview2} alt="preview-image" />
        </div>
      </div>
    </>
  );
};
