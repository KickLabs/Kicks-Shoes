import React from 'react';
import { Button } from 'antd';
import { GiftOutlined, StarOutlined, FireOutlined } from '@ant-design/icons';
import './VoucherHeroSection.css';

export const VoucherHeroSection = () => {
  return (
    <div className="voucher-hero-section">
      <div className="voucher-hero-content">
        <div className="voucher-hero-text">
          <h1 className="voucher-hero-title">
            <span className="voucher-title-main">DISCOVER</span>
            <span className="voucher-title-accent">AMAZING VOUCHERS</span>
          </h1>
          <p className="voucher-hero-subtitle">
            Search and use attractive vouchers to save maximum when shopping
          </p>
          <div className="voucher-hero-features">
            <div className="feature-item">
              <GiftOutlined className="feature-icon" />
              <span>Diverse Vouchers</span>
            </div>
            <div className="feature-item">
              <StarOutlined className="feature-icon" />
              <span>Exclusive Offers</span>
            </div>
            <div className="feature-item">
              <FireOutlined className="feature-icon" />
              <span>Hottest Deals</span>
            </div>
          </div>
        </div>
        <div className="voucher-hero-visual">
          <div className="voucher-preview-cards">
            <div className="preview-card preview-card-1">
              <div className="preview-discount">-20%</div>
              <div className="preview-code">SAVE20</div>
            </div>
            <div className="preview-card preview-card-2">
              <div className="preview-discount">-50K</div>
              <div className="preview-code">SAVE50</div>
            </div>
            <div className="preview-card preview-card-3">
              <div className="preview-discount">-15%</div>
              <div className="preview-code">NEW15</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
