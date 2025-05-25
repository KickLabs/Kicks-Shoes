import ProductCard from "../../../common/components/ProductCard";
import { getAllProducts } from "../../../../data/mockData";
import { HeroSection } from "../components/HeroSection";
import './HomePage.css'
import { NewDropsSection } from "../components/NewDropsSection";
import { CategoriesSection } from "../components/CategoriesSection";
import { ReviewSection } from "../components/ReviewSection";


const products = getAllProducts();

const HomePage = () => {
  return (
    <div className="home-container">
    <HeroSection/>
    <NewDropsSection/>
    <CategoriesSection/>
    <ReviewSection/>
    
    </div>
  );
};

export default HomePage;