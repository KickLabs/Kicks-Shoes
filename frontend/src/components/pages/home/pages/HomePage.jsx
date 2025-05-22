import ProductCard from "../../../common/components/ProductCard";
import { getAllProducts } from "../../../../data/mockData";

// DUMMY DATA FOR TESTING LIST PRODUCTS
const products = getAllProducts();

const HomePage = () => {
  return (
    // DUMMY DATA FOR TESTING LIST PRODUCTS
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        padding: 32,
        gap: 24,
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default HomePage;