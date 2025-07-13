import React, { useState, createContext } from 'react';
import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../common/components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import { ActiveTabContext } from '../../common/components/ActiveTabContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  DashboardOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  WalletOutlined,
  MessageOutlined,
  UserOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CommentOutlined,
} from '@ant-design/icons';

const { Content } = Layout;

// Dashboard tabs configuration
const dashboardTabs = [
  { key: '1', name: 'Dashboard', icon: <DashboardOutlined />, path: '/dashboard' },
  { key: '2', name: 'Products', icon: <AppstoreOutlined />, path: '/products' },
  { key: '3', name: 'Orders', icon: <UnorderedListOutlined />, path: '/orders' },
  { key: '4', name: 'Discounts', icon: <WalletOutlined />, path: '/discounts' },
  { key: '5', name: 'Feedback', icon: <MessageOutlined />, path: '/feedback' },
];

// Admin-specific tabs
const adminTabs = [
  { key: '1', name: 'Dashboard', icon: <DashboardOutlined />, path: '/admin' },
  { key: '2', name: 'Users', icon: <UserOutlined />, path: '/admin/users' },
  { key: '3', name: 'Moderation', icon: <ExclamationCircleOutlined />, path: '/admin/moderation' },
  { key: '4', name: 'Financial', icon: <BarChartOutlined />, path: '/admin/financial' },
  { key: '5', name: 'Feedback', icon: <MessageOutlined />, path: '/admin/feedback' },
  { key: '6', name: 'Categories', icon: <AppstoreOutlined />, path: '/admin/categories' },
  { key: '7', name: 'Discounts', icon: <WalletOutlined />, path: '/admin/discounts' },
];

// Shop-specific tabs
const shopTabs = [
  { key: '1', name: 'Dashboard', icon: <DashboardOutlined />, path: '/shop' },
  { key: '2', name: 'Products', icon: <AppstoreOutlined />, path: '/shop/products' },
  { key: '3', name: 'Orders', icon: <UnorderedListOutlined />, path: '/shop/orders' },
  { key: '4', name: 'Feedback', icon: <MessageOutlined />, path: '/shop/feedback' },
  { key: '5', name: 'Discounts', icon: <WalletOutlined />, path: '/shop/discounts' },
  { key: '6', name: 'Chat', icon: <CommentOutlined />, path: '/shop/chat' },
];

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('1');
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Determine which tabs to show based on current path
  const getTabs = () => {
    if (location.pathname.startsWith('/admin')) {
      return adminTabs;
    } else if (location.pathname.startsWith('/shop')) {
      return shopTabs;
    } else {
      return dashboardTabs;
    }
  };

  const tabs = getTabs();

  return (
    <ActiveTabContext.Provider value={{ activeTab, setActiveTab }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
        <Layout>
          <Header />
          <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
            <Outlet />
          </Content>
          <Footer />
        </Layout>
        {chatOpen && (
          <div
            style={{
              position: 'fixed',
              bottom: 90,
              right: 32,
              width: 400,
              height: 600,
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              zIndex: 2002,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: 8,
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 16 }}>Shop Chat</span>
              <button
                style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}
                onClick={() => setChatOpen(false)}
              >
                Đóng
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ChatPage role="shop" shopId={user?._id} />
            </div>
          </div>
        )}
      </Layout>
    </ActiveTabContext.Provider>
  );
}
