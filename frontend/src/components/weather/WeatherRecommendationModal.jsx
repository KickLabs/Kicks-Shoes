import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WeatherRecommendationModal.css';
import { useWeatherRecommendation } from '../../contexts/WeatherRecommendationContext';

const WeatherRecommendationModal = ({ weather, onClose }) => {
  const [gender, setGender] = useState('unisex');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const {
    getRecommendation,
    isCached,
    refreshRecommendations,
    getCacheAge,
    loading: contextLoading,
  } = useWeatherRecommendation();

  useEffect(() => {
    // Load from cache instantly or show loading
    const cached = getRecommendation(gender);
    if (cached) {
      // ⚡ Instant load from cache
      setRecommendations(cached);
      setError(null);
      setLoading(false);
      console.log(`✅ Loaded ${gender} recommendations from cache instantly`);
    } else if (contextLoading) {
      // Still loading in background
      setLoading(true);
      setError(null);

      // Poll for cache
      const checkCache = setInterval(() => {
        const newCache = getRecommendation(gender);
        if (newCache) {
          setRecommendations(newCache);
          setLoading(false);
          console.log(`✅ ${gender} recommendations ready from background fetch`);
        }
      }, 500);

      // Cleanup interval on unmount or gender change
      const timeout = setTimeout(() => {
        clearInterval(checkCache);
        if (!getRecommendation(gender)) {
          setLoading(false);
          setError('No recommendation data available. Please reload.');
        }
      }, 30000);

      return () => {
        clearInterval(checkCache);
        clearTimeout(timeout);
      };
    } else {
      // Cache not available and not loading
      setError('No recommendation data available. Please reload.');
      setLoading(false);
    }
  }, [gender, contextLoading, getRecommendation]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshRecommendations();
      // Wait a bit then check cache
      setTimeout(() => {
        const cached = getRecommendation(gender);
        if (cached) {
          setRecommendations(cached);
          setError(null);
        } else {
          setError('Unable to reload recommendations.');
        }
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Unable to reload. Please try again.');
      setLoading(false);
    }
  };

  const formatPrice = price => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleProductClick = productId => {
    navigate(`/product/${productId}`);
    onClose();
  };

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="weather-recommendation-modal"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="weather-recommendation-modal__content">
        {/* Header */}
        <div className="weather-recommendation-modal__header">
          <div className="weather-recommendation-modal__header-top">
            <h2 className="weather-recommendation-modal__title">Outfit Recommend</h2>
            <button
              className="weather-recommendation-modal__close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          {/* Weather Info */}
          <div className="weather-recommendation-modal__weather">
            <div className="weather-recommendation-modal__weather-icon">
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
              />
            </div>
            <div className="weather-recommendation-modal__weather-info">
              <div className="weather-recommendation-modal__weather-temp">
                {weather.temperature}°C
              </div>
              <div className="weather-recommendation-modal__weather-location">
                {weather.location}
              </div>
              <div className="weather-recommendation-modal__weather-description">
                {weather.description}
              </div>
            </div>
            <div className="weather-recommendation-modal__weather-details">
              <div className="weather-recommendation-modal__weather-detail">
                <span className="weather-recommendation-modal__weather-detail-label">Humidity</span>
                <span className="weather-recommendation-modal__weather-detail-value">
                  {weather.humidity}%
                </span>
              </div>
              <div className="weather-recommendation-modal__weather-detail">
                <span className="weather-recommendation-modal__weather-detail-label">Wind</span>
                <span className="weather-recommendation-modal__weather-detail-value">
                  {weather.windSpeed} m/s
                </span>
              </div>
            </div>
          </div>

          {/* Gender Filter */}
          <div className="weather-recommendation-modal__filter">
            <label className="weather-recommendation-modal__filter-label">
              Gender:
              {getCacheAge() !== null && (
                <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '8px' }}>
                  (Loaded {getCacheAge()} min ago)
                </span>
              )}
            </label>
            <div className="weather-recommendation-modal__filter-buttons">
              <button
                className={`weather-recommendation-modal__filter-btn ${
                  gender === 'male' ? 'weather-recommendation-modal__filter-btn--active' : ''
                }`}
                onClick={() => setGender('male')}
              >
                Male {isCached('male') && '✓'}
              </button>
              <button
                className={`weather-recommendation-modal__filter-btn ${
                  gender === 'female' ? 'weather-recommendation-modal__filter-btn--active' : ''
                }`}
                onClick={() => setGender('female')}
              >
                Female {isCached('female') && '✓'}
              </button>
              <button
                className={`weather-recommendation-modal__filter-btn ${
                  gender === 'unisex' ? 'weather-recommendation-modal__filter-btn--active' : ''
                }`}
                onClick={() => setGender('unisex')}
              >
                Unisex {isCached('unisex') && '✓'}
              </button>
            </div>
          </div>

          {/* Refresh Button */}
          {!contextLoading && getCacheAge() > 0 && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                onClick={handleRefresh}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Reload Suggestions
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="weather-recommendation-modal__body">
          {loading && (
            <div className="weather-recommendation-modal__loading">
              <div className="weather-recommendation-modal__spinner"></div>
              <p>Analyzing and finding suitable products...</p>
            </div>
          )}

          {error && (
            <div className="weather-recommendation-modal__error">
              <svg className="weather-recommendation-modal__error-icon" viewBox="0 0 24 24">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                  fill="currentColor"
                />
              </svg>
              <p>{error}</p>
              <button className="weather-recommendation-modal__retry-btn" onClick={handleRefresh}>
                Reload
              </button>
            </div>
          )}

          {!loading && !error && recommendations && (
            <>
              {/* AI Advice */}
              <div className="weather-recommendation-modal__advice">
                <div className="weather-recommendation-modal__advice-icon">🤖</div>
                <p className="weather-recommendation-modal__advice-text">
                  {recommendations.advice}
                </p>
              </div>

              {/* Products Grid */}
              <div className="weather-recommendation-modal__products">
                {recommendations.products.map(product => (
                  <div
                    key={product._id}
                    className="weather-recommendation-modal__product-card"
                    onClick={() => handleProductClick(product._id)}
                  >
                    <div className="weather-recommendation-modal__product-image">
                      <img
                        src={
                          product.images && product.images.length > 0
                            ? product.images[0].startsWith('http')
                              ? product.images[0]
                              : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${product.images[0]}`
                            : product.image
                              ? product.image.startsWith('http')
                                ? product.image
                                : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${product.image}`
                              : 'https://via.placeholder.com/300x300?text=No+Image'
                        }
                        alt={product.name}
                        loading="lazy"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                        }}
                      />
                      {(() => {
                        const regularPrice =
                          typeof product.price === 'object' ? product.price.regular : product.price;
                        const finalPrice =
                          typeof product.finalPrice === 'object'
                            ? product.finalPrice.regular
                            : product.finalPrice || regularPrice;
                        return finalPrice < regularPrice ? (
                          <div className="weather-recommendation-modal__product-badge">Sale</div>
                        ) : null;
                      })()}
                    </div>
                    <div className="weather-recommendation-modal__product-info">
                      <h3 className="weather-recommendation-modal__product-name">{product.name}</h3>
                      <p className="weather-recommendation-modal__product-reason">
                        {product.reason}
                      </p>
                      <div className="weather-recommendation-modal__product-footer">
                        <div className="weather-recommendation-modal__product-price">
                          {(() => {
                            // Handle both price structures
                            const regularPrice =
                              typeof product.price === 'object'
                                ? product.price.regular
                                : product.price;
                            const finalPrice =
                              typeof product.finalPrice === 'object'
                                ? product.finalPrice.regular
                                : product.finalPrice || regularPrice;

                            return (
                              <>
                                {finalPrice < regularPrice && (
                                  <span className="weather-recommendation-modal__product-price-old">
                                    {formatPrice(regularPrice)}
                                  </span>
                                )}
                                <span className="weather-recommendation-modal__product-price-current">
                                  {formatPrice(finalPrice)}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        {product.rating > 0 && (
                          <div className="weather-recommendation-modal__product-rating">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            <span>{product.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherRecommendationModal;
