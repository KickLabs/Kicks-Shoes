import { ConfigProvider } from "antd";
import { Outlet } from "react-router-dom";

function App() {
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
        },
      }}
    >
      <div>
        {/* Có thể thêm header/sidebar ở đây nếu muốn */}
        <Outlet />
      </div>
    </ConfigProvider>
  );
}

export default App;