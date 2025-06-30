import './RecommendSection.css';
import ProductCard from '../../../common/components/ProductCard';
import { useEffect, useState } from 'react';
import { Button } from 'antd';
import axiosInstance from '@/services/axiosInstance';

export const RecommendSection = () => {
  const [newDrops, setNewDrops] = useState([]);
  useEffect(() => {
    const fetchNewDrops = async () => {
      const newProducts = await axiosInstance.get('/products/new-drops').then(res => res.data);
      setNewDrops(
        newProducts.data.slice(0, 4).map(product => ({
          ...product,
          price: {
            ...product.price,
            isOnSale: product.price.discountPercent > 0,
          },
        }))
      );
      console.log(newProducts);
    };
    fetchNewDrops();
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
        {newDrops.map(product => (
          <div className="card-wrapper">
            <ProductCard key={product.id} product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};
