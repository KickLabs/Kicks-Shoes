import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ChatPage from "./components/common/components/ChatPage";
import OrderDetails from "./components/common/components/OrderDetails";
import OrderList from "./components/common/components/OrderList";
import ProductDetails from "./components/common/components/ProductDetails";
import ErrorPage from "./components/common/pages/Error";
import App from "./components/layout/App";
import Login from "./components/pages/authentication/pages/Login";
import LoginAdmin from "./components/pages/authentication/pages/LoginAdmin";
import RegisterPage from "./components/pages/authentication/pages/Register";
import CartPage from "./components/pages/cart/pages/CartPage";
import CheckoutPage from "./components/pages/checkout/CheckOut";
import AllProducts from "./components/pages/dashboard/AllProducts";
import Dashboard, {
  DashboardContent
} from "./components/pages/dashboard/Dashboard";
import DiscountListPage from "./components/pages/dashboard/DiscountListPage";
import UserManagementPage from "./components/pages/dashboard/UserManagementPage";
import HomePage from "./components/pages/home/pages/HomePage";
import ListingPage from "./components/pages/listing-page/pages/ListingPage";
import ProductDetailPage from "./components/pages/product/pages/ProductDetailPage";
import "./styles/index.css";
import Account from "./components/pages/account/Account";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <HomePage />
      },
      {
        path: "checkout",
        element: <CheckoutPage />
      },
      {
        path: "login",
        element: <Login />
      },
      {
        path: "cart",
        element: <CartPage />
      },
      {
        path: "login-admin",
        element: <LoginAdmin />
      },
      {
        path: "register",
        element: <RegisterPage />
      },
      {
        path: "listing-page",
        element: <ListingPage />
      },
      {
        path: "product/:id",
        element: <ProductDetailPage />
      },
      {
        path: "dashboard",
        element: <Dashboard />,
        children: [
          {
            path: "",
            element: <DashboardContent />
          },
          {
            path: "products",
            element: <AllProducts />
          },
          {
            path: "orders",
            element: <OrderList />
          },
          {
            path: "orders/:orderId",
            element: <OrderDetails />
          },
          {
            path: "products/:productId",
            element: <ProductDetails />
          },
          {
            path: "products/add-new",
            element: <ProductDetails isAddNew={true} />
          },
          {
            path: "discounts",
            element: <DiscountListPage />
          },
          {
            path: "chat",
            element: <ChatPage />
          },
          {
            path: "users",
            element: <UserManagementPage />
          }
        ]
      },
      {
        path: "account",
        element: <Account />,
        children: [
          {
            path: "null",
            element: <>null</>
          },
          {
            path: "orders",
            element: <OrderList />
          },
          {
            path: "orders/:orderId",
            element: <OrderDetails />
          },
          {
            path: "chat",
            element: <ChatPage />
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
