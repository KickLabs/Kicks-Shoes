import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Empty, Spin, message, Modal } from 'antd';
import {
  GiftOutlined,
  CopyOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { getActiveDiscounts } from '../../../../services/discountService';
import { saveVoucher } from '../../../../services/dashboardService';
import './VoucherGridSection.css';

export const VoucherGridSection = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedVoucher, setCopiedVoucher] = useState(null);
  const [savedVouchers, setSavedVouchers] = useState(new Set());

  // Load public active discounts (shop + admin) from API
  useEffect(() => {
    const fetchPublicDiscounts = async () => {
      try {
        setLoading(true);
        console.log('Fetching active public discounts...');
        // Fetch active discounts (no auth) and filter by source
        const response = await getActiveDiscounts();
        console.log('API Response:', response);

        // Transform API response to match component expectations
        if (response.success && response.data) {
          // Only include vouchers from shop or admin (exclude reward points)
          const transformedVouchers = response.data
            .filter(discount => ['shop', 'admin'].includes(discount.source))
            .map(discount => ({
              id: discount._id,
              code: discount.code,
              title: discount.description || `Discount ${discount.code}`,
              description:
                discount.description ||
                `Get ${discount.type === 'percentage' ? discount.value + '%' : discount.value + ' VND'} off`,
              discountType: discount.type,
              discountValue: discount.value,
              minOrderAmount: discount.minPurchase || 0,
              maxDiscountAmount: discount.maxDiscount,
              validFrom: discount.startDate,
              validTo: discount.endDate,
              status: discount.status,
              usageLimit: discount.usageLimit || 1,
              usedCount: discount.usedCount || 0,
              source: discount.source,
            }));
          console.log('Transformed vouchers:', transformedVouchers);
          setVouchers(transformedVouchers);
        } else {
          console.log('No data received');
          setVouchers([]);
        }
      } catch (error) {
        console.error('Error fetching active discounts:', error);
        message.error('Unable to load vouchers. Please try again.');
        setVouchers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicDiscounts();
  }, []);

  const formatCurrency = amount => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'green';
      case 'expired':
        return 'red';
      case 'used':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'active':
        return 'Có thể sử dụng';
      case 'expired':
        return 'Đã hết hạn';
      case 'used':
        return 'Đã sử dụng';
      default:
        return 'Không xác định';
    }
  };

  // Render voucher ticket card
  const renderVoucherCard = voucher => (
    <Col xs={24} sm={12} lg={8} xl={6} key={voucher.id}>
      <div className={`voucher-ticket voucher-ticket-${voucher.status}`}>
        <div className="voucher-ticket-left">
          <div className="voucher-logo">
            <div className="voucher-logo-text">
              <div className="voucher-logo-main">VOUCHER</div>
              <div className="voucher-logo-sub">XTRA</div>
            </div>
            <div className="voucher-logo-stars">
              <span className="star">✦</span>
              <span className="star">✦</span>
              <span className="star">✦</span>
            </div>
          </div>
          <div className="voucher-shop-info">
            <div className="voucher-shop-name">KICKS</div>
            <div className="voucher-shop-name">SHOP</div>
          </div>
        </div>

        <div className="voucher-ticket-right">
          <div className="voucher-discount-info">
            <div className="voucher-discount-percent">
              Save{' '}
              {voucher.discountType === 'percentage'
                ? `${voucher.discountValue}%`
                : `${voucher.discountValue}₫`}
            </div>
            <div className="voucher-discount-details">
              {voucher.discountType === 'percentage' && voucher.maxDiscountAmount && (
                <div className="voucher-detail-line">
                  Max discount {formatCurrency(voucher.maxDiscountAmount)}
                </div>
              )}
              <div className="voucher-detail-line">
                Min order {formatCurrency(voucher.minOrderAmount)}
              </div>
            </div>
          </div>

          <div className="voucher-actions">
            <Button
              className={`voucher-save-btn ${savedVouchers.has(voucher.id) ? 'saved' : ''}`}
              onClick={() => handleSaveVoucher(voucher)}
              disabled={
                voucher.status !== 'active' ||
                savedVouchers.has(voucher.id) ||
                voucher.usedCount >= voucher.usageLimit
              }
            >
              {savedVouchers.has(voucher.id) ? 'Saved' : 'Save'}
            </Button>
            <div className="voucher-conditions">
              <a href="#" onClick={e => e.preventDefault()}>
                Terms
              </a>
            </div>
          </div>
        </div>

        <div className="voucher-quantity-badge">x{voucher.usageLimit - voucher.usedCount}</div>
      </div>
    </Col>
  );

  const copyToClipboard = code => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedVoucher(code);
      message.success(`Voucher code copied: ${code}`);
      setTimeout(() => setCopiedVoucher(null), 2000);
    });
  };

  const handleSaveVoucher = async voucher => {
    // Check if user already saved a voucher
    if (savedVouchers.size > 0) {
      message.warning('You can only save one voucher at a time.');
      return;
    }

    // Check if voucher still has available usage
    if (voucher.usedCount >= voucher.usageLimit) {
      message.error('This voucher is no longer available.');
      return;
    }

    Modal.confirm({
      title: 'Save Voucher',
      content: `Are you sure you want to save voucher "${voucher.title}"? This will reduce the available quantity by 1.`,
      async onOk() {
        try {
          console.log('Attempting to save voucher:', voucher.id);

          // Check authentication
          const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
          const userInfo = localStorage.getItem('userInfo');
          console.log('Auth check:', {
            hasToken: !!token,
            tokenLength: token?.length,
            userInfo: userInfo ? JSON.parse(userInfo) : null,
          });

          // Call API to save voucher
          const response = await saveVoucher(voucher.id);
          console.log('Save voucher response:', response);

          if (response.success) {
            // Update local state
            setSavedVouchers(prev => new Set([...prev, voucher.id]));

            // Update the voucher's usedCount locally
            setVouchers(prevVouchers =>
              prevVouchers.map(v =>
                v.id === voucher.id ? { ...v, usedCount: v.usedCount + 1 } : v
              )
            );

            message.success('Voucher saved successfully!');
            copyToClipboard(voucher.code);
          }
        } catch (error) {
          console.error('Error saving voucher:', error);
          console.error('Error response:', error.response);
          console.error('Error status:', error.response?.status);
          console.error('Error data:', error.response?.data);

          if (error.response?.data?.message) {
            message.error(error.response.data.message);
          } else if (error.response?.status === 401) {
            message.error('Please login to save vouchers');
          } else if (error.response?.status === 404) {
            message.error('API endpoint not found. Please check backend server.');
          } else if (error.response?.status >= 500) {
            message.error('Server error. Please try again later.');
          } else {
            // Show the actual error message from backend
            const errorMsg =
              error.response?.data?.message || 'Unable to save voucher. Please try again.';
            message.error(errorMsg);
            console.log('Full error details:', error.response?.data);
          }
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="voucher-grid-section">
        <div className="voucher-grid-header">
          <h2>Shop Vouchers</h2>
          <p>Discover attractive vouchers from shop owners</p>
        </div>
        <div className="voucher-loading">
          <Spin size="large" />
          <p>Loading shop vouchers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voucher-grid-section">
      <div className="voucher-grid-header">
        <h2>SHOP VOUCHERS</h2>
        <p>Discover attractive vouchers from shop owners to save maximum when shopping</p>
      </div>
      <Row gutter={[16, 16]}>
        {vouchers.length === 0 ? (
          <Col span={24}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No shop vouchers available"
              style={{ padding: '3rem 0' }}
            />
          </Col>
        ) : (
          vouchers.map(renderVoucherCard)
        )}
      </Row>
    </div>
  );
};
