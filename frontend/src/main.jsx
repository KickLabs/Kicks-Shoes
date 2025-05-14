import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles/index.css";
import App from "./components/layout/App";
import ErrorPage from "./components/common/pages/Error";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <App />,
      },
      {
        path: "shop",
        element: <>Shop</>,
      },
      {
        path: `shop/product/:id`,
        element: <>Shop</>,
      },
      {
        path: "profile",
        element: <>Shop</>,
      },
      {
        path: "checkout",
        element: <>Shop</>,
      },
      {
        path: "cart",
        element: <>Shop</>,
      },
      {
        path: "contact",
        element: <>Shop</>,
      },
      {
        path: "blogs",
        element: <>Shop</>,
      },
      {
        path: `/blogs/:id`,
        element: <>Shop</>,
      },
      {
        path: `/favorites`,
        element: <>Shop</>,
      },
      {
        path: `/dashboard`,
        element: <>Shop</>,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
