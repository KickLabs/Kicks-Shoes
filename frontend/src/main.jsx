import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PersistGate } from 'redux-persist/integration/react';
import { App as AntApp } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { VideoCallProvider } from './contexts/VideoCallContext';
import { persistor, store } from './store/store';

// Common Components
import ChatPage from './components/common/components/ChatPage';
import OrderDetails from './components/common/components/OrderDetails';
import OrderList from './components/common/components/OrderList';
import CategoryDetails from './components/pages/categories/CategoryDetail';

// Layout
import App from './components/layout/App';

// Authentication Pages
import ChangePassword from './components/pages/authentication/pages/ChangePassword';
import ForgotPassword from './components/pages/authentication/pages/ForgotPassword';
import Login from './components/pages/authentication/pages/Login';
import LoginAdmin from './components/pages/authentication/pages/LoginAdmin';
import RegisterPage from './components/pages/authentication/pages/Register';

// Main Pages
import Account from './components/pages/account/Account';
import FavouritesTab from './components/pages/account/components/FavouritesTab';
import ProfileTab from './components/pages/account/components/ProfileTab';
import VoucherTab from './components/pages/account/components/VoucherTab';
import RewardPointsDetail from './components/pages/account/components/RewardPointsDetail';
import CartPage from './components/pages/cart/pages/CartPage';
import AllCategories from './components/pages/categories/AllCategories';
import CheckoutPage from './components/pages/checkout/CheckOut';
import HomePage from './components/pages/home/pages/HomePage';
import VoucherDiscoveryPage from './components/pages/voucher-discovery/VoucherDiscoveryPage';
import AccessoryPage from './components/pages/listing-page/pages/AccessoryPage';
import ClothingPage from './components/pages/listing-page/pages/ClothingPage';
import ListingPage from './components/pages/listing-page/pages/ListingPage';
import OtherPage from './components/pages/listing-page/pages/OtherPage';
import ShoesPage from './components/pages/listing-page/pages/ShoesPage';
import PaymentCancel from './components/pages/payment/PaymentCancel';
import PaymentStatus from './components/pages/payment/PaymentStatus';
import PaymentSuccess from './components/pages/payment/PaymentSuccess';
import ProductDetailPage from './components/pages/product/pages/ProductDetailPage';
import VisualSearch from './components/pages/shop/VisualSearch';

// New Role-Based Dashboard Components
import AdminDashboard from './components/pages/dashboard/AdminDashboard';
import DashboardLayout from './components/pages/dashboard/DashboardLayout';
import ShopDashboard from './components/pages/dashboard/ShopDashboard';

// Product Management Components
import AddNewProduct from './components/pages/dashboard/AddNewProduct';
import EditProduct from './components/pages/dashboard/EditProduct';
import FlashSaleManagement from './components/pages/dashboard/FlashSaleManagement';
import DeliveryReports from './components/pages/shop/delivery-reports/DeliveryReports';
import ShipperApplications from './components/pages/shop/shipper-applications/ShipperApplications';

// Styles
import { GoogleOAuthProvider } from '@react-oauth/google';
import ReportTab from './components/pages/account/components/ReportTab';
import Banned from './components/pages/authentication/pages/Banned';
import EmailVerification from './components/pages/authentication/pages/EmailVerification';
import EmailVerificationFailed from './components/pages/authentication/pages/EmailVerificationFailed';
import EmailVerified from './components/pages/authentication/pages/EmailVerified';
import ResetPasswordForm from './components/pages/authentication/pages/ResetPasswordForm';
import SetPassword from './components/pages/authentication/pages/SetPassword';
import DeleteUserData from './components/pages/privacy/DeleteUserData';
import PrivacyPolicy from './components/pages/privacy/PrivacyPolicy';
import './styles/index.css';

// LiveStream Components
import CreateLiveStream from './components/pages/livestream/CreateLiveStream';
import LiveStreamHost from './components/pages/livestream/LiveStreamHost';
import LiveStreamPage from './components/pages/livestream/LiveStreamPage';
import LiveStreamViewer from './components/pages/livestream/LiveStreamViewer';
// Blog
import BlogComposerPage from './components/pages/blog/BlogComposerPage';
import BlogDetailPage from './components/pages/blog/BlogDetailPage';
import BlogFeedPage from './components/pages/blog/BlogFeedPage';

// Shipper
import ShipperDashboard from './components/pages/shipper/ShipperDashboard';

const userInfo = localStorage.getItem('userInfo');
const user = userInfo ? JSON.parse(userInfo) : null;

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login-admin" replace />;
  }

  return children;
};

// New Role-Based Protected Routes
const AdminProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login-admin" replace />;
  }

  return children;
};

const ShopOwnerProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user || user.role !== 'shop') {
    return <Navigate to="/login-admin" replace />;
  }

  return children;
};

const AdminOrShopProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user || (user.role !== 'admin' && user.role !== 'shop')) {
    return <Navigate to="/login-admin" replace />;
  }

  return children;
};

const ShipperProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user || user.role !== 'shipper') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Dashboard redirect component based on user role
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login-admin" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === 'shop') {
    return <Navigate to="/shop" replace />;
  }

  // Default fallback
  return <Navigate to="/login-admin" replace />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    // errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: <HomePage />,
      },
      {
        path: 'dashboard',
        element: <DashboardRedirect />,
      },
      {
        path: 'verify-email',
        element: <EmailVerification />,
      },
      {
        path: 'email-verified',
        element: <EmailVerified />,
      },
      {
        path: 'email-verification-failed',
        element: <EmailVerificationFailed />,
      },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'cart',
        element: <CartPage />,
      },
      {
        path: 'login-admin',
        element: <LoginAdmin />,
      },
      {
        path: 'banned',
        element: <Banned />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'listing-page',
        element: <ListingPage />,
      },
      {
        path: 'shoes',
        element: <ShoesPage />,
      },
      {
        path: 'clothing',
        element: <ClothingPage />,
      },
      {
        path: 'accessories',
        element: <AccessoryPage />,
      },
      {
        path: 'other',
        element: <OtherPage />,
      },
      {
        path: 'product/:id',
        element: <ProductDetailPage />,
      },
      {
        path: 'shop/visual-search',
        element: <VisualSearch />,
      },
      {
        path: 'privacy-policy',
        element: <PrivacyPolicy />,
      },
      {
        path: 'delete-user-data',
        element: <DeleteUserData />,
      },
      // Admin Dashboard Routes
      {
        path: 'admin',
        element: <DashboardLayout />,
        children: [
          {
            path: '',
            element: (
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            ),
          },
          {
            path: 'dashboard',
            element: (
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            ),
          },
          {
            path: 'users',
            element: (
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            ),
          },
          {
            path: 'moderation',
            element: (
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            ),
          },
          {
            path: 'financial',
            element: (
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            ),
          },
          {
            path: 'feedback',
            element: (
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            ),
          },
          {
            path: 'categories',
            element: (
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            ),
          },
          {
            path: 'discounts',
            element: (
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            ),
          },
          {
            path: 'orders',
            element: (
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            ),
          },
          {
            path: 'orders/:orderId',
            element: (
              <AdminProtectedRoute>
                <OrderDetails />
              </AdminProtectedRoute>
            ),
          },
        ],
      },
      // Shop Owner Dashboard Routes
      {
        path: 'shop',
        element: <DashboardLayout />,
        children: [
          {
            path: '',
            element: (
              <ShopOwnerProtectedRoute>
                <ShopDashboard />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'dashboard',
            element: (
              <ShopOwnerProtectedRoute>
                <ShopDashboard />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'products',
            element: (
              <ShopOwnerProtectedRoute>
                <ShopDashboard />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'products/add-new',
            element: (
              <ShopOwnerProtectedRoute>
                <AddNewProduct />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'products/:productId/edit',
            element: (
              <ShopOwnerProtectedRoute>
                <EditProduct />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'orders',
            element: (
              <ShopOwnerProtectedRoute>
                <ShopDashboard />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'orders/:orderId',
            element: (
              <ShopOwnerProtectedRoute>
                <OrderDetails />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'feedback',
            element: (
              <ShopOwnerProtectedRoute>
                <ShopDashboard />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'discounts',
            element: (
              <ShopOwnerProtectedRoute>
                <ShopDashboard />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'flash-sales',
            element: (
              <ShopOwnerProtectedRoute>
                <FlashSaleManagement />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'chat',
            element: (
              <ShopOwnerProtectedRoute>
                <ChatPage />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'livestream',
            element: (
              <ShopOwnerProtectedRoute>
                <ShopDashboard />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'livestream/create',
            element: (
              <ShopOwnerProtectedRoute>
                <CreateLiveStream />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'potential-orders',
            element: (
              <ShopOwnerProtectedRoute>
                <ShopDashboard />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'delivery-reports',
            element: (
              <ShopOwnerProtectedRoute>
                <DeliveryReports />
              </ShopOwnerProtectedRoute>
            ),
          },
          {
            path: 'shipper-applications',
            element: (
              <ShopOwnerProtectedRoute>
                <ShipperApplications />
              </ShopOwnerProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'account',
        element: <Account />,
        children: [
          {
            path: '',
            element: <ProfileTab />,
          },
          {
            path: 'profile',
            element: <ProfileTab />,
          },
          {
            path: 'favourites',
            element: <FavouritesTab />,
          },
          {
            path: 'orders',
            element: <OrderList />,
          },
          {
            path: 'orders/:orderId',
            element: <OrderDetails />,
          },
          {
            path: 'voucher',
            element: <VoucherTab />,
          },
          {
            path: 'reward-points',
            element: <RewardPointsDetail />,
          },
          {
            path: 'chat',
            element: <ChatPage />,
          },
          {
            path: 'reports',
            element: <ReportTab />,
          },
        ],
      },
      {
        path: 'categories',
        element: <AllCategories />,
      },
      {
        path: 'categories/:storeId',
        element: <CategoryDetails />,
      },
      {
        path: 'shipper-dashboard',
        element: (
          <ShipperProtectedRoute>
            <ShipperDashboard />
          </ShipperProtectedRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: 'change-password',
        element: <ChangePassword />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordForm />,
      },
      {
        path: 'set-password',
        element: <SetPassword />,
      },
      {
        path: 'payment-status',
        element: <PaymentStatus />,
      },
      {
        path: 'payment/return',
        element: <PaymentStatus />,
      },
      {
        path: 'payment/success',
        element: <PaymentSuccess />,
      },
      {
        path: 'payment/cancel',
        element: <PaymentCancel />,
      },
      {
        path: 'livestream',
        element: <LiveStreamPage />,
      },
      {
        path: 'blog',
        element: <BlogFeedPage />,
      },
      {
        path: 'blog/:id',
        element: <BlogDetailPage />,
      },
      {
        path: 'blog/create',
        element: (
          <AdminOrShopProtectedRoute>
            <BlogComposerPage />
          </AdminOrShopProtectedRoute>
        ),
      },
      {
        path: 'blog/edit/:id',
        element: (
          <AdminOrShopProtectedRoute>
            <BlogComposerPage />
          </AdminOrShopProtectedRoute>
        ),
      },
      {
        path: 'voucher-discovery',
        element: <VoucherDiscoveryPage />,
      },
      {
        path: 'livestream/:roomId',
        element: <LiveStreamViewer />,
      },
      {
        path: 'shop/livestream/host/:roomId',
        element: (
          <ShopOwnerProtectedRoute>
            <LiveStreamHost />
          </ShopOwnerProtectedRoute>
        ),
      },
    ],
  },
]);

const Root = () => (
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <CartProvider>
            <VideoCallProvider>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
              <GoogleOAuthProvider
                clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id'}
              >
                <RouterProvider router={router} />
              </GoogleOAuthProvider>
            </VideoCallProvider>
          </CartProvider>
        </AuthProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
