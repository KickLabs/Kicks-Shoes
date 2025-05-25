import "./RecommendSection.css";
import ProductCard from "../../../common/components/ProductCard";
import { useEffect, useState } from "react";
import { newProducts } from "../../../../data/homepageData";
import { Button } from "antd";

export const RecommendSection = () => {
  const [newDrops, setNewDrops] = useState([]);
  useEffect(() => {
    setNewDrops(newProducts);
  }, []);
  return (
    <div className="recommend-wrapper">
      <div className="recommend-header">
        <h4>
          <span className="line">You May Also Like </span>
        </h4>
        <Button>See all products</Button>
      </div>

      <div className="recommend-list">
        {newDrops.map((product) => (
          <div className="card-wrapper">
            <ProductCard key={product.id} product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};
