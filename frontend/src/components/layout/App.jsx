import { ConfigProvider } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "./../common/components/Footer";
import AppHeader from "./../common/components/Header";
import ScrollToTop from "../../utils/ScrollToTop";

function App() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isLoginAdmin = location.pathname.startsWith("/login-admin");

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemSelectedColor: "white",
            itemSelectedBg: "#4A69E2",
          },
          Button: {
            defaultBg: "#ffffff",
            defaultColor: "#232321",
            defaultBorderColor: "#232321",
            defaultHoverBg: "#232321",
            defaultHoverColor: "#ffffff",
            defaultHoverBorderColor: "#232321",
            defaultActiveBg: "#232321",
            defaultActiveColor: "#ffffff",
            defaultActiveBorderColor: "#232321",
            defaultFocusColor: "#232321",
            outline: "none",
            outlineWidth: 0,
            defaultShadow: "none",
          },
          Pagination: {
            itemSize: 38,
          },
        },
      }}
    >
      <div>
        <ScrollToTop />
        {!isDashboard && !isLoginAdmin && <AppHeader />}
        <Outlet />
        {!isDashboard && !isLoginAdmin && <Footer />}
      </div>
    </ConfigProvider>
  );
}

export default App;
