import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles/index.css";
import App from "./components/layout/App";
import ErrorPage from "./components/common/pages/Error";
import AppHeader from "./components/common/components/Header";
import Dashboard, {
  DashboardContent,
} from "./components/pages/dashboard/Dashboard";
import HomePage from "./components/pages/home/pages/HomePage";
import AllProducts from "./components/pages/dashboard/AllProducts";
import OrderList from "./components/pages/dashboard/OrderList";
import OrderDetails from "./components/pages/dashboard/OrderDetails";
import ProductDetails from "./components/pages/dashboard/ProductDetails";

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
        path: "dashboard",
        element: (
          <>
            <AppHeader />
            <Dashboard />
          </>
        ),
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