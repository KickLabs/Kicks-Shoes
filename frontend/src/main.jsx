import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles/index.css";
import App from "./components/layout/App";
import ErrorPage from "./components/common/pages/Error";
import Dashboard, {
  DashboardContent,
} from "./components/pages/dashboard/Dashboard";
import HomePage from "./components/pages/home/pages/HomePage";
import AllProducts from "./components/pages/dashboard/AllProducts";
import OrderList from "./components/pages/dashboard/OrderList";
import OrderDetails from "./components/pages/dashboard/OrderDetails";
import ProductDetails from "./components/pages/dashboard/ProductDetails";
import DiscountListPage from "./components/pages/dashboard/DiscountListPage";
import ChatPage from "./components/pages/dashboard/ChatPage";
import UserManagementPage from "./components/pages/dashboard/UserManagementPage";
import CheckoutPage from "./components/pages/checkout/CheckOut";
import Login from "./components/pages/authentication/pages/Login";
import RegisterPage from "./components/pages/authentication/pages/Register";
import LoginAdmin from "./components/pages/authentication/pages/LoginAdmin";

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
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "login",
        element: <Login />,
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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
