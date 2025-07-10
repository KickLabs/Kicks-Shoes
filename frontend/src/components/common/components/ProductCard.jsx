import './ProductCard.css';
import { formatPrice } from '../../../utils/StringFormat';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { favouriteService } from '../../../services/favouriteService';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [isFavourite, setIsFavourite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const displayPrice = product.finalPrice || product.price?.regular || 0;

  useEffect(() => {
    const checkFavouriteStatus = async () => {
      try {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
          setIsFavourite(false);
          return;
        }
        const response = await favouriteService.checkFavourite(product._id);
        setIsFavourite(response.isFavourite);
      } catch (error) {
        console.error('Error checking favourite status:', error);
        setIsFavourite(false);
      }
    };

    checkFavouriteStatus();
  }, [product._id]);

  const handleFavouriteToggle = async () => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        window.location.href = '/login';
        return;
      }
      setIsLoading(true);
      if (isFavourite) {
        await favouriteService.removeFromFavourites(product._id);
        setIsFavourite(false);
      } else {
        await favouriteService.addToFavourites(product._id);
        setIsFavourite(true);
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      if (error.message?.includes('Not authorized') || error.message?.includes('401')) {
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="product-card">
      <div className="product-card__image-container">
        {product.isNew ? (
          <div className="product-card__badge">New</div>
        ) : (
          product.price.isOnSale && (
            <div
              style={{ backgroundColor: '#FFA52F', width: '70px' }}
              className="product-card__badge"
            >
              {product.price.discountPercent}% off
            </div>
          )
        )}

        <img
          src={Array.isArray(product.mainImage) ? product.mainImage[0] : product.mainImage}
          alt={product.name}
          className="product-card__image"
        />

        {/* Favourite button */}
        <button
          className="product-card__favourite-button"
          onClick={handleFavouriteToggle}
          disabled={isLoading}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: isFavourite ? '#ff4757' : '#666',
            transition: 'all 0.2s ease',
          }}
        >
          {isFavourite ? '♥' : '♡'}
        </button>
      </div>

      <div className="product-card__info">
        <h2 className="product-card__name">{product.name}</h2>
      </div>

      <div className="product-card__footer">
        <button className="product-card__button">
          <div
            className="product-card__button-inner"
            onClick={() => navigate(`/product/${product._id}`)}
          >
            <span>VIEW PRODUCT -</span>
            <span className="product-card__price">{formatPrice(displayPrice)}</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
