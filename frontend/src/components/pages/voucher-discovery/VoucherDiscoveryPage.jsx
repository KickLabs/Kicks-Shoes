import ProductCard from '../../common/components/ProductCard';
import { VoucherHeroSection } from './components/VoucherHeroSection';
import './VoucherDiscoveryPage.css';
import { NewDropsSection } from '../home/components/NewDropsSection';
import { CategoriesSection } from '../home/components/CategoriesSection';
import { FeaturedCollections } from '../home/components/FeaturedCollections';
import { TrendingSection } from '../home/components/TrendingSection';
import { ReviewSection } from '../home/components/ReviewSection';
import { FlashSaleSection } from '../home/components/FlashSaleSection';
import { VoucherGridSection } from './components/VoucherGridSection';

const VoucherDiscoveryPage = () => {
  return (
    <div className="home-container">
      <VoucherHeroSection />
      <VoucherGridSection />
      <FlashSaleSection />
      <CategoriesSection />
      <NewDropsSection />
      <ReviewSection />
    </div>
  );
};

export default VoucherDiscoveryPage;
