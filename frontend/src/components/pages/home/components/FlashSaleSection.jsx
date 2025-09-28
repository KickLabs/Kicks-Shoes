import './NewDropsSection.css';
import ProductCard from '../../../common/components/ProductCard';
import { useEffect, useState } from 'react';
import { Button } from 'antd';
import axiosInstance from '@/services/axiosInstance';
import { useNavigate } from 'react-router-dom';

export const FlashSaleSection = () => {
  const navigate = useNavigate();
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchFlashSaleProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/flash-sales/active/current');
        const products = response.data.data || [];

        if (isMounted) {
          setFlashSaleProducts(products.slice(0, 4));
          console.log('Flash Sale Products:', products);
        }
      } catch (error) {
        console.error('Error fetching flash sale products:', error);
        if (isMounted) {
          setFlashSaleProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFlashSaleProducts();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once
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
        {isLoading ? (
          <div>Loading flash sale products...</div>
        ) : (
          flashSaleProducts.map(product => (
            <div className="card-wrapper" key={product._id || product.id}>
              <ProductCard product={product} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
