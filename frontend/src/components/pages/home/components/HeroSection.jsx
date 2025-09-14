import { LandingSlogan } from './LandingSlogan';
import heroImage from '../../../../assets/images/HomePage/hero-image.png';
import heroPreview1 from '../../../../assets/images/HomePage/hero-preview1.png';
import heroPreview2 from '../../../../assets/images/HomePage/hero-preview2.png';
import './HeroSection.css';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div style={{ margin: '1vw' }}>
      <LandingSlogan />
      <div className="hero-preview-wrapper">
        <img id="bg-img" src={heroImage} alt="Featured Product" />
        <div className="thumbnail-preview">
          <div className="text">
            <h4>Premium Collection</h4>
            <p>
              Discover our curated selection of shoes, clothing, and accessories for every style
            </p>
          </div>
          <Button type="primary" size="large" onClick={() => navigate('/listing-page')}>
            Shop Now
          </Button>
        </div>
        <div className="right-stick">
          <p>Featured Products</p>
        </div>
        <div className="preview-image">
          <img src={heroPreview1} alt="preview-image" />
          <img src={heroPreview2} alt="preview-image" />
        </div>
      </div>
    </div>
  );
};
