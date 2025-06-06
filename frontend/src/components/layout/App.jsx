import { ConfigProvider } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "./../common/components/Footer";
import AppHeader from "./../common/components/Header";
import ScrollToTop from "../../utils/ScrollToTop";
import { AuthProvider } from "../../contexts/AuthContext";

function App() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isLoginAdmin = location.pathname.startsWith("/login-admin");

  return (
    <AuthProvider>
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
            Input: {
              colorPrimary: "#52c41a",
              colorError: "#ff4d4f",
              colorWarning: "#faad14",
              colorBgContainerDisabled: "rgba(0,0,0,0.04)",
              colorTextDisabled: "rgba(0,0,0,0.25)",
              colorBorder: "#d9d9d9",
              colorBorderError: "#ff4d4f",
              colorBorderSuccess: "#52c41a",
              colorBorderHover: "#4096ff",
              colorTextPlaceholder: "#bfbfbf",
              colorText: "rgba(0,0,0,0.88)",
              inputFontSize: 14,
              inputFontSizeLG: 16,
              inputFontSizeSM: 14,
              paddingBlock: 4,
              paddingBlockLG: 7,
              paddingBlockSM: 0,
              paddingInline: 11,
              paddingInlineLG: 11,
              paddingInlineSM: 7,
              borderRadius: 6,
              borderRadiusLG: 8,
              borderRadiusSM: 4,
              controlHeight: 32,
              controlHeightLG: 40,
              controlHeightSM: 24,
              activeBg: "#ffffff",
              activeBorderColor: "#1677ff",
              activeShadow: "0 0 0 2px rgba(5,145,255,0.1)",
              errorActiveShadow: "0 0 0 2px rgba(255,38,5,0.06)",
              warningActiveShadow: "0 0 0 2px rgba(255,215,5,0.1)",
              hoverBg: "#ffffff",
              hoverBorderColor: "#4096ff",
              addonBg: "rgba(0,0,0,0.02)",
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
    </AuthProvider>
  );
}

export default App;
