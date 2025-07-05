import './NewDropsSection.css';
import ProductCard from '../../../common/components/ProductCard';
import { useEffect, useState } from 'react';
import { Button } from 'antd';
import axiosInstance from '@/services/axiosInstance';
import { useNavigate } from 'react-router-dom';

export const NewDropsSection = () => {
  const navigate = useNavigate();
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
  const handleShopNewDrops = () => {
    navigate('/listing-page?isNew=true');
  };
  return (
    <div className="new-drops-wrapper">
      <div className="new-drops-header">
        <h4>
          <span className="line">Don't miss out </span>
          <span className="line">new drops</span>
        </h4>
        <Button onClick={handleShopNewDrops}>Shop new drops</Button>
      </div>

      <div className="recommend-grid">
        {newDrops.map(product => (
          <div className="card-wrapper" key={product._id || product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};
