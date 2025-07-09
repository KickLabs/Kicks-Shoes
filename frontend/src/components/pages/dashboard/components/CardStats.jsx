import React, { useState, useEffect } from 'react';
import { Card, Spin, Alert } from 'antd';
import {
  ShoppingOutlined,
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { getShopStats } from '../../../../services/dashboardService';
import { formatCompactVND } from '../../../../utils/currency';

export default function CardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getShopStats();
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
      // Fallback data if API fails
      setStats({
        totalRevenue: { value: 0, change: 0 },
        totalOrders: { value: 0, change: 0 },
        activeOrders: { value: 0, change: 0 },
        shippedOrders: { value: 0, change: 0 },
        totalProducts: { value: 0, change: 0 },
        lowStockProducts: { value: 0, change: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-stats">
        {[1, 2, 3].map(i => (
          <Card key={i} className="stat-card" variant="outlined">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-stats">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      </div>
    );
  }

  // Function to format large numbers with abbreviations
  const formatNumber = num => {
    return formatCompactVND(num, { showSymbol: false });
  };

  // Function to determine font size based on value length
  const getFontSize = value => {
    const length = value.toString().length;
    if (length > 12) return '14px';
    if (length > 8) return '16px';
    if (length > 6) return '18px';
    return '20px';
  };

  const statsData = [
    {
      title: 'Total Revenue',
      value: formatCompactVND(stats?.totalRevenue?.value || 0),
      percent: Math.round((stats?.totalRevenue?.change || 0) * 100) / 100,
      icon: <ShoppingOutlined />,
    },
    {
      title: 'Total Orders',
      value: formatNumber(stats?.totalOrders?.value || 0),
      percent: Math.round((stats?.totalOrders?.change || 0) * 100) / 100,
      icon: <ShoppingOutlined />,
    },
    {
      title: 'Active Orders',
      value: formatNumber(stats?.activeOrders?.value || 0),
      percent: Math.round((stats?.activeOrders?.change || 0) * 100) / 100,
      icon: <ShoppingOutlined />,
    },
    {
      title: 'Shipped Orders',
      value: formatNumber(stats?.shippedOrders?.value || 0),
      percent: Math.round((stats?.shippedOrders?.change || 0) * 100) / 100,
      icon: <ShoppingOutlined />,
    },
  ];

  return (
    <div className="card-stats">
      {statsData.map((stat, i) => (
        <Card className="stat-card" key={i} variant="outlined">
          <div className="stat-card-row">
            <div className="stat-card-icon">{stat.icon}</div>
            <MoreOutlined className="stat-card-more" />
          </div>
          <div className="stat-card-title">{stat.title}</div>
          <div className="stat-card-main">
            <span className="stat-card-value" style={{ fontSize: getFontSize(stat.value) }}>
              {stat.value}
            </span>
            <span className={`stat-card-percent ${stat.percent >= 0 ? 'positive' : 'negative'}`}>
              {stat.percent >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(stat.percent)}%
            </span>
          </div>
          <div className="stat-card-desc">Compared to last month</div>
        </Card>
      ))}
    </div>
  );
}
