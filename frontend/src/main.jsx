import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

// Common Components
import ChatPage from "./components/common/components/ChatPage";
import OrderDetails from "./components/common/components/OrderDetails";
import OrderList from "./components/common/components/OrderList";
import ProductDetails from "./components/common/components/ProductDetails";
import ErrorPage from "./components/common/pages/Error";

// Layout
import App from "./components/layout/App";

// Authentication Pages
import Login from "./components/pages/authentication/pages/Login";
import LoginAdmin from "./components/pages/authentication/pages/LoginAdmin";
import RegisterPage from "./components/pages/authentication/pages/Register";
import ForgotPassword from "./components/pages/authentication/pages/ForgotPassword";
import ChangePassword from "./components/pages/authentication/pages/ChangePassword";

// Main Pages
import CartPage from "./components/pages/cart/pages/CartPage";
import CheckoutPage from "./components/pages/checkout/Checkout";
import AllProducts from "./components/pages/dashboard/AllProducts";
import Dashboard, {
  DashboardContent,
} from "./components/pages/dashboard/Dashboard";
import DiscountListPage from "./components/pages/dashboard/DiscountListPage";
import UserManagementPage from "./components/pages/dashboard/UserManagementPage";
import HomePage from "./components/pages/home/pages/HomePage";
import ListingPage from "./components/pages/listing-page/pages/ListingPage";
import ProductDetailPage from "./components/pages/product/pages/ProductDetailPage";
import Account from "./components/pages/account/Account";
import ProfileTab from "./components/pages/account/components/ProfileTab";

// Styles
import "./styles/index.css";
import EmailVerificationFailed from "./components/pages/authentication/pages/EmailVerificationFailed";
import EmailVerified from "./components/pages/authentication/pages/EmailVerified";
import EmailVerification from "./components/pages/authentication/pages/EmailVerification";
import ResetPasswordForm from "./components/pages/authentication/pages/ResetPasswordForm";

const userInfo = localStorage.getItem("userInfo");
const user = userInfo ? JSON.parse(userInfo) : null;

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <HomePage />,
      },
      {
        path: "verify-email",
        element: <EmailVerification />,
      },
      {
        path: "email-verified",
        element: <EmailVerified />,
      },
      {
        path: "email-verification-failed",
        element: <EmailVerificationFailed />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },
      {
        path: "login-admin",
        element: <LoginAdmin />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "listing-page",
        element: <ListingPage />,
      },
      {
        path: "product/:id",
        element: <ProductDetailPage />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
        children: [
          {
            path: "",
            element: <DashboardContent />,
          },
          {
            path: "products",
            element: <AllProducts />,
          },
          {
            path: "orders",
            element: <OrderList />,
          },
          {
            path: "orders/:orderId",
            element: <OrderDetails />,
          },
          {
            path: "products/:productId",
            element: <ProductDetails />,
          },
          {
            path: "products/add-new",
            element: <ProductDetails isAddNew={true} />,
          },
          {
            path: "discounts",
            element: <DiscountListPage />,
          },
          {
            path: "chat",
            element: <ChatPage />,
          },
          {
            path: "users",
            element: <UserManagementPage />,
          },
        ],
      },
      {
        path: "account",
        element: <Account />,
        children: [
          {
            path: "",
            element: <ProfileTab />,
          },
          {
            path: "profile",
            element: <ProfileTab />,
          },
          {
            path: "orders",
            element: <OrderList />,
          },
          {
            path: "orders/:orderId",
            element: <OrderDetails />,
          },
          {
            path: "chat",
            element: <ChatPage />,
          },
        ],
      },
      {
        path: "change-password",
        element: <ChangePassword />,
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordForm />,
      },
    ],
  },
]);

const Root = () => (
  <React.StrictMode>
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
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
