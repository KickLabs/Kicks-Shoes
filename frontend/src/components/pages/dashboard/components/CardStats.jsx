import React, { useState, useEffect } from 'react';
import { Card, Spin, Alert } from 'antd';
import {
  ShoppingOutlined,
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { getShopStats } from '../../../../services/dashboardService';


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

  const statsData = [
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue?.value?.toLocaleString() || 0}`,
      percent: stats?.totalRevenue?.change || 0,
      icon: <ShoppingOutlined />,
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders?.value?.toLocaleString() || 0,
      percent: stats?.totalOrders?.change || 0,
      icon: <ShoppingOutlined />,
    },
    {
      title: 'Active Orders',
      value: stats?.activeOrders?.value?.toLocaleString() || 0,
      percent: stats?.activeOrders?.change || 0,
      icon: <ShoppingOutlined />,
    },
    {
      title: 'Shipped Orders',
      value: stats?.shippedOrders?.value?.toLocaleString() || 0,
      percent: stats?.shippedOrders?.change || 0,
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
            <span className="stat-card-value">{stat.value}</span>
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
