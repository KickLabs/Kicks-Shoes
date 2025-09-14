import React, { useEffect, useState } from 'react';
import { Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../../common/components/ProductCard';
import axiosInstance from '@/services/axiosInstance';
import './FeaturedCollections.css';

export const FeaturedCollections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState({
    shoes: [],
    clothing: [],
    accessory: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);

        // Fetch products for each category
        const [shoesRes, clothingRes, accessoryRes] = await Promise.all([
          axiosInstance.get('/products?productType=shoes&limit=3'),
          axiosInstance.get('/products?productType=clothing&limit=3'),
          axiosInstance.get('/products?productType=accessory&limit=3'),
        ]);

        setCollections({
          shoes: shoesRes.data.data?.products || [],
          clothing: clothingRes.data.data?.products || [],
          accessory: accessoryRes.data.data?.products || [],
        });
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const collectionData = [
    {
      title: 'Trending Shoes',
      subtitle: 'Step into style',
      products: collections.shoes,
      route: '/shoes',
      color: '#4a69e2',
      icon: '👟',
    },
    {
      title: 'Fashion Clothing',
      subtitle: 'Dress to impress',
      products: collections.clothing,
      route: '/clothing',
      color: '#52c41a',
      icon: '👕',
    },
    {
      title: 'Premium Accessories',
      subtitle: 'Complete your look',
      products: collections.accessory,
      route: '/accessories',
      color: '#fa8c16',
      icon: '🎒',
    },
  ];

  if (loading) {
    return (
      <div className="featured-collections-loading">
        <Spin size="large" />
        <p>Loading collections...</p>
      </div>
    );
  }

  return (
    <section className="featured-collections">
      <div className="featured-collections-header">
        <h2>Featured Collections</h2>
        <p>Discover our curated selection across all categories</p>
      </div>

      {collectionData.map((collection, index) => (
        <div key={index} className="collection-section">
          <div className="collection-header">
            <div className="collection-title-group">
              <span className="collection-icon" style={{ color: collection.color }}>
                {collection.icon}
              </span>
              <div>
                <h3>{collection.title}</h3>
                <p className="collection-subtitle">{collection.subtitle}</p>
              </div>
            </div>
            <Button
              type="primary"
              onClick={() => navigate(collection.route)}
              style={{
                background: collection.color,
                borderColor: collection.color,
              }}
            >
              View All
            </Button>
          </div>

          <div className="collection-products">
            {collection.products.length > 0 ? (
              collection.products.map(product => (
                <div key={product._id} className="collection-product-card">
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <div className="no-products">
                <p>No products available in this category yet.</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
};
