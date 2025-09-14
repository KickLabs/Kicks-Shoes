import React, { useEffect, useState } from 'react';
import { Button, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../../common/components/ProductCard';
import axiosInstance from '@/services/axiosInstance';
import './TrendingSection.css';

export const TrendingSection = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('shoes');
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(false);

  const tabs = [
    { key: 'shoes', label: 'Shoes', icon: '👟', route: '/shoes' },
    { key: 'clothing', label: 'Clothing', icon: '👕', route: '/clothing' },
    { key: 'accessory', label: 'Accessories', icon: '🎒', route: '/accessories' },
    { key: 'other', label: 'Other', icon: '✨', route: '/other' },
  ];

  const fetchProductsByType = async productType => {
    if (products[productType]) return; // Already loaded

    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/products?productType=${productType}&limit=8&sortBy=createdAt&order=desc`
      );
      setProducts(prev => ({
        ...prev,
        [productType]: response.data.data?.products || [],
      }));
    } catch (error) {
      console.error(`Error fetching ${productType} products:`, error);
      setProducts(prev => ({
        ...prev,
        [productType]: [],
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsByType(activeTab);
  }, [activeTab]);

  const currentProducts = products[activeTab] || [];
  const currentTab = tabs.find(tab => tab.key === activeTab);

  return (
    <section className="trending-section">
      <div className="trending-header">
        <h2>Trending Now</h2>
        <p>Discover what's popular across all categories</p>
      </div>

      <div className="trending-tabs">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          centered
          items={tabs.map(tab => ({
            key: tab.key,
            label: (
              <span className="tab-label">
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </span>
            ),
          }))}
        />
      </div>

      <div className="trending-content">
        {loading ? (
          <div className="trending-loading">
            <div className="loading-spinner"></div>
            <p>Loading trending {currentTab?.label?.toLowerCase()}...</p>
          </div>
        ) : (
          <>
            <div className="trending-products">
              {currentProducts.length > 0 ? (
                currentProducts.map(product => (
                  <div key={product._id} className="trending-product-card">
                    <ProductCard product={product} />
                  </div>
                ))
              ) : (
                <div className="no-trending-products">
                  <div className="no-products-icon">{currentTab?.icon}</div>
                  <h3>No trending {currentTab?.label?.toLowerCase()} yet</h3>
                  <p>Be the first to discover amazing {currentTab?.label?.toLowerCase()}</p>
                  <Button type="primary" onClick={() => navigate(currentTab?.route)}>
                    Explore {currentTab?.label}
                  </Button>
                </div>
              )}
            </div>

            {currentProducts.length > 0 && (
              <div className="trending-view-all">
                <Button type="primary" size="large" onClick={() => navigate(currentTab?.route)}>
                  View All {currentTab?.label}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
