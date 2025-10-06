import './NewDropsSection.css';
import ProductCard from '../../../common/components/ProductCard';
import { useEffect, useState } from 'react';
import { Button } from 'antd';
import axiosInstance from '@/services/axiosInstance';
import { useNavigate } from 'react-router-dom';

export const FlashSaleSection = () => {
  const navigate = useNavigate();
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  useEffect(() => {
    const fetchFlashSaleProducts = async () => {
      try {
        const response = await axiosInstance.get('/flash-sales/active/current');
        const flashSaleProducts = response.data.data || [];
        setFlashSaleProducts(flashSaleProducts.slice(0, 4));
        console.log('Flash Sale Products:', flashSaleProducts);
      } catch (error) {
        console.error('Error fetching flash sale products:', error);
        setFlashSaleProducts([]);
      }
    };
    fetchFlashSaleProducts();
  }, []);
  const handleShopFlashSale = () => {
    navigate('/listing-page?isFlashSale=true');
  };
  return (
    <div className="new-drops-wrapper">
      <div className="new-drops-header">
        <h4>
          <span className="line">Flash Sale </span>
        </h4>
        <Button onClick={handleShopFlashSale}>Shop flash sale</Button>
      </div>

      <div className="new-drops-list">
        {flashSaleProducts.map(product => (
          <div className="card-wrapper" key={product._id || product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};
