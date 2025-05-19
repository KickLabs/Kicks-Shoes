import { ConfigProvider } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "./../common/components/Footer";
import AppHeader from "./../common/components/Header";

function App() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

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
            defaultColor: "#000000",
            defaultBorderColor: "#000000",
            defaultHoverBg: "#000000",
            defaultHoverColor: "#ffffff",
            defaultHoverBorderColor: "#000000",
            defaultActiveBg: "#000000",
            defaultActiveColor: "#ffffff",
            defaultActiveBorderColor: "#000000",
            defaultFocusColor: "#000000",
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
        {!isDashboard && <AppHeader />}
        <Outlet />
        {!isDashboard && <Footer />}
      </div>
    </ConfigProvider>
  );
}

export default App;
