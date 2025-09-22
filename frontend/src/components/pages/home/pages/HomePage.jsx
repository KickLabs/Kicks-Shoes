import ProductCard from '../../../common/components/ProductCard';
import { HeroSection } from '../components/HeroSection';
import './HomePage.css';
import { NewDropsSection } from '../components/NewDropsSection';
import { CategoriesSection } from '../components/CategoriesSection';
import { FeaturedCollections } from '../components/FeaturedCollections';
import { TrendingSection } from '../components/TrendingSection';
import { ReviewSection } from '../components/ReviewSection';
import { FlashSaleSection } from '../components/FlashSaleSection';

const HomePage = () => {
  return (
    <div className="home-container">
      <HeroSection />
      <FlashSaleSection />
      <CategoriesSection />
      <NewDropsSection />
      {/* <TrendingSection /> */}
      {/* <FeaturedCollections /> */}
      <ReviewSection />
    </div>
  );
};

export default HomePage;
