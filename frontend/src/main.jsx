import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { store, persistor } from './store/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useAuth } from './contexts/AuthContext';

// Common Components
import ChatPage from './components/common/components/ChatPage';
import OrderDetails from './components/common/components/OrderDetails';
import OrderList from './components/common/components/OrderList';
import ProductDetails from './components/common/components/ProductDetails';
import ErrorPage from './components/common/pages/Error';
import CategoryDetails from './components/pages/categories/CategoryDetail';

// Layout
import App from './components/layout/App';

// Authentication Pages
import Login from './components/pages/authentication/pages/Login';
import LoginAdmin from './components/pages/authentication/pages/LoginAdmin';
import RegisterPage from './components/pages/authentication/pages/Register';
import ForgotPassword from './components/pages/authentication/pages/ForgotPassword';
import ChangePassword from './components/pages/authentication/pages/ChangePassword';

// Main Pages
import CartPage from './components/pages/cart/pages/CartPage';
import CheckoutPage from './components/pages/checkout/CheckOut';
import AllProducts from './components/pages/dashboard/AllProducts';
import DiscountListPage from './components/pages/dashboard/DiscountListPage';
import UserManagementPage from './components/pages/dashboard/UserManagementPage';
import HomePage from './components/pages/home/pages/HomePage';
import ListingPage from './components/pages/listing-page/pages/ListingPage';
import ProductDetailPage from './components/pages/product/pages/ProductDetailPage';
import Account from './components/pages/account/Account';
import ProfileTab from './components/pages/account/components/ProfileTab';
import RewardPointsDetail from './components/pages/account/components/RewardPointsDetail';
import FavouritesTab from './components/pages/account/components/FavouritesTab';
import AllCategories from './components/pages/categories/AllCategories';
import PaymentStatus from './components/pages/payment/PaymentStatus';

// New Role-Based Dashboard Components
import DashboardLayout from './components/pages/dashboard/DashboardLayout';
import AdminDashboard from './components/pages/dashboard/AdminDashboard';
import ShopDashboard from './components/pages/dashboard/ShopDashboard';
import RoleSwitcher from './components/pages/dashboard/RoleSwitcher';

// Product Management Components
import AddNewProduct from './components/pages/dashboard/AddNewProduct';
import EditProduct from './components/pages/dashboard/EditProduct';

// Styles
import './styles/index.css';
import EmailVerificationFailed from './components/pages/authentication/pages/EmailVerificationFailed';
import EmailVerified from './components/pages/authentication/pages/EmailVerified';
import EmailVerification from './components/pages/authentication/pages/EmailVerification';
import ResetPasswordForm from './components/pages/authentication/pages/ResetPasswordForm';
import { GoogleOAuthProvider } from '@react-oauth/google';
import SetPassword from './components/pages/authentication/pages/SetPassword';
import ReportTab from './components/pages/account/components/ReportTab';
import Banned from './components/pages/authentication/pages/Banned';
import PrivacyPolicy from './components/pages/privacy/PrivacyPolicy';
import DeleteUserData from './components/pages/privacy/DeleteUserData';

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
        path: 'role-switcher',
        element: <RoleSwitcher />,
      },
      {
        path: 'dashboard-new',
        element: <RoleSwitcher />,
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
        path: 'product/:id',
        element: <ProductDetailPage />,
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
            path: 'chat',
            element: (
              <ShopOwnerProtectedRoute>
                <ChatPage />
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
    ],
  },
]);

const Root = () => (
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <CartProvider>
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
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
              <RouterProvider router={router} />
            </GoogleOAuthProvider>
          </CartProvider>
        </AuthProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
