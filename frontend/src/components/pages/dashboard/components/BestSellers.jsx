import React, { useState, useEffect } from 'react';
import { Button, Spin, Alert, Card, List, Avatar, Tag, Space } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { getShopStats } from '../../../../services/dashboardService';
import { formatPrice } from '../../../../utils/StringFormat';

export default function BestSellers() {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBestSellers();
  }, []);

  const fetchBestSellers = async () => {
    try {
      setLoading(true);
      const response = await getShopStats();
      setBestSellers(response.data?.bestSellers || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching best sellers:', err);
      setError('Failed to load best sellers');
      setBestSellers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="best-sellers">
        <div className="best-sellers-header">
          <h4 className="best-seller-title">Best Sellers</h4>
          <MoreOutlined className="best-sellers-more" />
        </div>
        <div className="best-sellers-list" style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="best-sellers">
        <div className="best-sellers-header">
          <h4 className="best-seller-title">Best Sellers</h4>
          <MoreOutlined className="best-sellers-more" />
        </div>
        <div className="best-sellers-list">
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="best-sellers">
      <div className="best-sellers-header">
        <h4 className="best-seller-title">Best Sellers</h4>
        <MoreOutlined className="best-sellers-more" />
      </div>
      <div className="best-sellers-list">
        {bestSellers.length > 0 ? (
          bestSellers.map(item => (
            <div className="best-seller-item" key={item._id || item.id}>
              <img
                className="best-seller-avatar"
                src={item.mainImage || item.image || '/placeholder.svg'}
                alt={item.name}
                onError={e => {
                  e.target.src = '/placeholder.svg';
                }}
              />
              <div className="best-seller-info">
                <div className="best-seller-name">{item.name}</div>
                <div className="best-seller-price">
                  {formatPrice(item.finalPrice || item.price?.regular || item.price || 0)}
                </div>
              </div>
              <div className="best-seller-meta">
                <div className="best-seller-price-bold">
                  {formatPrice(item.finalPrice || item.price?.regular || item.price || 0)}
                </div>
                <div className="best-seller-sales">{item.sales || 0} sales</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            No best sellers data available
          </div>
        )}
      </div>
      <Button className="best-seller-report" block>
        VIEW ALL PRODUCTS
      </Button>
    </div>
  );
}
