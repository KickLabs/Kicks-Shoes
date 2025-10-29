import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Button, Empty, Spin, message, Modal, Tabs } from 'antd';
import {
  GiftOutlined,
  CopyOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import userDiscountService from '../../../../services/userDiscount.service';
import TabHeader from '../../../common/components/TabHeader';
import '../account.css';

const VoucherTab = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedVoucher, setCopiedVoucher] = useState(null);
  const [activeTab, setActiveTab] = useState('saved');

  // Load vouchers from API
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const response = await userDiscountService.getUserDiscounts();

        // Transform API response to match component expectations
        if (response.success && response.data) {
          // Backend already transforms the data, so we can use it directly
          setVouchers(response.data);
        } else {
          setVouchers([]);
        }
      } catch (error) {
        console.error('Error fetching user discounts:', error);
        message.error('Không thể tải danh sách discount. Vui lòng thử lại.');
        setVouchers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
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
      case 'saved':
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
      case 'saved':
        return 'Can be used';
      case 'expired':
        return 'Expired';
      case 'used':
        return 'Used';
      default:
        return 'Not determined';
    }
  };

  // Filter vouchers by status with additional date check
  const getVouchersByStatus = status => {
    const now = new Date();

    return vouchers.filter(voucher => {
      // ✅ Double-check: If backend says 'saved' but expired, treat as expired
      if (voucher.status === 'saved' && voucher.validTo) {
        const endDate = new Date(voucher.validTo);
        if (endDate < now) {
          // Voucher is expired but backend hasn't updated yet
          return status === 'expired';
        }
      }

      return voucher.status === status;
    });
  };

  // Render voucher item
  const renderVoucherItem = voucher => {
    // ✅ Check if voucher is expired
    const now = new Date();
    let actualStatus = voucher.status;
    if (voucher.status === 'saved' && voucher.validTo) {
      const endDate = new Date(voucher.validTo);
      if (endDate < now) {
        actualStatus = 'expired';
      }
    }

    return (
      <div key={voucher.id} className="voucher-item">
        <div className="voucher-item-header">
          <div className="voucher-code">
            <h4>{voucher.code}</h4>
            <Tag color={getStatusColor(actualStatus)}>{getStatusText(actualStatus)}</Tag>
          </div>
          <div className="voucher-discount">
            {voucher.discountType === 'percentage'
              ? `${voucher.discountValue}%`
              : formatCurrency(voucher.discountValue)}
          </div>
        </div>

        <div className="voucher-item-content">
          <h5>{voucher.title}</h5>
          <p>{voucher.description}</p>

          <div className="voucher-details">
            <div className="detail-item">
              <CalendarOutlined />
              <span>
                {formatDate(voucher.validFrom)} - {formatDate(voucher.validTo)}
              </span>
            </div>
            <div className="detail-item">
              <DollarOutlined />
              <span>Minimum order: {formatCurrency(voucher.minOrderAmount)}</span>
            </div>
            {voucher.discountType === 'percentage' && voucher.maxDiscountAmount && (
              <div className="detail-item">
                <span>Maximum discount: {formatCurrency(voucher.maxDiscountAmount)}</span>
              </div>
            )}
            {voucher.status === 'used' && voucher.usedAt && (
              <div className="detail-item">
                <CheckCircleOutlined />
                <span>Used at: {formatDate(voucher.usedAt)}</span>
              </div>
            )}
            {voucher.status === 'used' && voucher.discountAmount && (
              <div className="detail-item">
                <span>Economical saving: {formatCurrency(voucher.discountAmount)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="voucher-item-actions">
          {actualStatus === 'saved' && (
            <>
              <Button
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(voucher.code)}
                disabled={copiedVoucher === voucher.code}
                className="voucher-action-btn"
              >
                {copiedVoucher === voucher.code ? 'Đã copy' : 'Copy'}
              </Button>
              <Button
                type="primary"
                onClick={() => handleUseVoucher(voucher)}
                className="voucher-action-btn primary"
              >
                Use
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const copyToClipboard = code => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedVoucher(code);
      message.success(`Voucher code copied: ${code}`);
      setTimeout(() => setCopiedVoucher(null), 2000);
    });
  };

  const handleUseVoucher = voucher => {
    try {
      // Save code for cart/checkout auto-fill and navigate immediately
      localStorage.setItem('preselectedVoucherCode', voucher.code);
      copyToClipboard(voucher.code);
      navigate('/cart');
    } catch (error) {
      console.error('Error using discount:', error);
    }
  };

  if (loading) {
    return (
      <div className="voucher-loading">
        <Spin size="large" />
        <p>Loading discount list...</p>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'saved',
      label: (
        <span>
          <CheckCircleOutlined /> Can be used ({getVouchersByStatus('saved').length})
        </span>
      ),
      children: (
        <div className="voucher-list">
          {getVouchersByStatus('saved').length === 0 ? (
            <div className="empty-state">
              <GiftOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />{' '}
              <p>You do not have any vouchers that can be used yet.</p>
            </div>
          ) : (
            getVouchersByStatus('saved').map(renderVoucherItem)
          )}
        </div>
      ),
    },
    {
      key: 'used',
      label: (
        <span>
          <CheckCircleOutlined /> Used ({getVouchersByStatus('used').length})
        </span>
      ),
      children: (
        <div className="voucher-list">
          {getVouchersByStatus('used').length === 0 ? (
            <div className="empty-state">
              <CheckCircleOutlined
                style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}
              />
              <p>You have not used any vouchers yet</p>
            </div>
          ) : (
            getVouchersByStatus('used').map(renderVoucherItem)
          )}
        </div>
      ),
    },
    {
      key: 'expired',
      label: (
        <span>
          <CloseCircleOutlined /> Expired ({getVouchersByStatus('expired').length})
        </span>
      ),
      children: (
        <div className="voucher-list">
          {getVouchersByStatus('expired').length === 0 ? (
            <div className="empty-state">
              <CloseCircleOutlined
                style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}
              />
              <p>You do not have any expired vouchers</p>
            </div>
          ) : (
            getVouchersByStatus('expired').map(renderVoucherItem)
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <TabHeader breadcrumb="Voucher" />
      <div className="profile-tab-container">
        <div className="profile-sections">
          <div className="profile-section">
            <div
              className="profile-section-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div className="profile-section-title">
                <GiftOutlined /> My Discount List
              </div>
              <Button
                type="primary"
                icon={<GiftOutlined />}
                onClick={() => navigate('/voucher-discovery')}
                style={{
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)',
                  border: 'none',
                  height: 40,
                  boxShadow: '0 4px 12px rgba(67, 97, 238, 0.4)',
                }}
              >
                Find more vouchers
              </Button>
            </div>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              className="voucher-tabs"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default VoucherTab;
