import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Empty, Spin, message, Modal, Alert } from 'antd';
import {
  GiftOutlined,
  CopyOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { saveVoucher } from '../../../../services/dashboardService';
import axiosInstance from '../../../../services/axiosInstance';
import { useAuth } from '../../../../contexts/AuthContext';
import './VoucherGridSection.css';

export const VoucherGridSection = () => {
  const { user } = useAuth(); // Get current user from AuthContext
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedVoucher, setCopiedVoucher] = useState(null);
  const [savedVouchers, setSavedVouchers] = useState(new Set());
  const [loadingSavedVouchers, setLoadingSavedVouchers] = useState(true);

  // Load user's saved vouchers from API - Reload when user changes
  useEffect(() => {
    const loadSavedVouchers = async () => {
      try {
        setLoadingSavedVouchers(true);

        if (!user) {
          // User not logged in, clear saved vouchers
          console.log('❌ No user logged in, clearing saved vouchers');
          setSavedVouchers(new Set());
          setLoadingSavedVouchers(false);
          return;
        }

        console.log('🔄 Loading saved vouchers for user:', user._id, user.email);
        const response = await axiosInstance.get('/user-discounts');
        console.log('📦 User discounts response:', response.data);

        if (response.data.success && response.data.data) {
          // Get discount codes of saved vouchers (matching against voucher.code)
          const savedCodes = response.data.data
            .filter(ud => ud.status === 'saved')
            .map(ud => ud.code);

          console.log('✅ Loaded saved voucher codes:', savedCodes);
          console.log('📊 Total saved vouchers:', savedCodes.length);

          // Store codes to check against voucher.code later
          setSavedVouchers(new Set(savedCodes));
        } else {
          console.log('⚠️ No saved vouchers found');
          setSavedVouchers(new Set());
        }
      } catch (error) {
        console.error('❌ Error loading saved vouchers:', error);
        console.error('Error details:', error.response?.data);
        // Clear saved vouchers on error (e.g., 401 unauthorized after login change)
        setSavedVouchers(new Set());
      } finally {
        setLoadingSavedVouchers(false);
      }
    };
    loadSavedVouchers();
  }, [user?._id]); // ✅ Reload when user changes (login/logout/switch account)

  // Load available discounts from API
  useEffect(() => {
    const fetchShopDiscounts = async () => {
      try {
        setLoading(true);
        console.log('Fetching available discounts...');
        // Fetch available discounts for customers
        const response = await axiosInstance.get('/user-discounts/available');
        console.log('API Response:', response.data);

        // API already returns data in the correct format
        if (response.data.success && response.data.data) {
          console.log('Available vouchers:', response.data.data);
          setVouchers(response.data.data);
        } else {
          console.log('No data received');
          setVouchers([]);
        }
      } catch (error) {
        console.error('Error fetching shop discounts:', error);
        message.error('Unable to load vouchers. Please try again.');
        setVouchers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShopDiscounts();
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
              className={`voucher-save-btn ${savedVouchers.has(voucher.code) ? 'saved' : ''}`}
              onClick={() => handleSaveVoucher(voucher)}
              disabled={
                loadingSavedVouchers || // ✅ Disable while checking saved vouchers
                voucher.status !== 'active' ||
                savedVouchers.has(voucher.code) ||
                voucher.usedCount >= voucher.usageLimit ||
                savedVouchers.size > 0 // ✅ Disable all if user already has a saved voucher
              }
              title={
                loadingSavedVouchers
                  ? 'Checking saved vouchers...'
                  : savedVouchers.size > 0 && !savedVouchers.has(voucher.code)
                    ? 'You already have a saved voucher. Please use or remove it first.'
                    : ''
              }
              loading={loadingSavedVouchers}
            >
              {loadingSavedVouchers
                ? 'Checking...'
                : savedVouchers.has(voucher.code)
                  ? 'Saved'
                  : 'Save'}
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
      setTimeout(() => setCopiedVoucher(null), 2000);
    });
  };

  const handleSaveVoucher = async voucher => {
    // Debug log
    console.log('🎯 Attempting to save voucher:', {
      code: voucher.code,
      id: voucher.id,
      savedVouchersSize: savedVouchers.size,
      savedVouchersList: Array.from(savedVouchers),
      loadingSavedVouchers,
    });

    // Check if user already saved a voucher
    if (savedVouchers.size > 0) {
      const savedList = Array.from(savedVouchers).join(', ');
      message.warning(
        `You already have saved voucher(s): ${savedList}. Please use or remove it first.`
      );
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
            // Update local state with voucher code
            setSavedVouchers(prev => new Set([...prev, voucher.code]));

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
