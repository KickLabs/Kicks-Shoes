import ProductCard from '../../../common/components/ProductCard';
import { HeroSection } from '../components/HeroSection';
import './HomePage.css';
import { NewDropsSection } from '../components/NewDropsSection';
import { CategoriesSection } from '../components/CategoriesSection';
import { FeaturedCollections } from '../components/FeaturedCollections';
import { TrendingSection } from '../components/TrendingSection';
import { ReviewSection } from '../components/ReviewSection';

const HomePage = () => {
  return (
    <div className="home-container">
      <HeroSection />
      <NewDropsSection />
      <CategoriesSection />
      {/* <TrendingSection /> */}
      {/* <FeaturedCollections /> */}
      <ReviewSection />
    </div>
  );
};

export default HomePage;
