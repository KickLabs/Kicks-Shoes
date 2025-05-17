import React, { useEffect, useRef, useState } from "react";
import {
  DownOutlined,
  FireFilled,
  MenuOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Input, Layout, Menu, Button } from "antd";
import logo from "@assets/Logo.svg";
import "./Header.css";
import { Link, useNavigate, useLocation } from "react-router-dom";

const { Header } = Layout;

const NotificationBadgeOnly = ({ count = 0 }) => (
  <div>{count > 99 ? "99+" : count}</div>
);

const products = [
  { id: 1, name: "Nike Air Max", image: "nike-air-max.jpg" },
  { id: 2, name: "Adidas Ultraboost", image: "adidas-ultraboost.jpg" },
  { id: 3, name: "Jordan Retro", image: "jordan-retro.jpg" },
  { id: 4, name: "New Balance 990", image: "new-balance-990.jpg" },
];

const AppHeader = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFiltered([]);
      setShowDropdown(false);
      return;
    }
    const result = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
    setShowDropdown(true);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
        setShowInput(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSeeAllProducts = () => {
    navigate("/dashboard/products");
    setShowDropdown(false);
    setShowInput(false);
  };

  // Menu items using the new API
  const menuItems = [
    {
      key: "new",
      icon: <FireFilled style={{ color: "orange", marginRight: 4 }} />,
      label: "New Drops",
    },
    {
      key: "men",
      label: (
        <span>
          Men <DownOutlined style={{ fontSize: 10 }} />
        </span>
      ),
      children: [
        {
          key: "sneakers",
          label: "Sneakers",
        },
        {
          key: "apparel",
          label: "Apparel",
        },
      ],
    },
    {
      key: "women",
      label: (
        <span>
          Women <DownOutlined style={{ fontSize: 10 }} />
        </span>
      ),
      children: [
        {
          key: "sneakers-w",
          label: "Sneakers",
        },
        {
          key: "accessories",
          label: "Accessories",
        },
      ],
    },
  ];

  // Dropdown menu items
  const dropdownItems = [
    {
      key: "new",
      icon: <FireFilled style={{ color: "orange", marginRight: 4 }} />,
      label: "New Drops",
    },
    {
      key: "men",
      label: "Men",
      children: [
        {
          key: "sneakers",
          label: "Sneakers",
        },
        {
          key: "apparel",
          label: "Apparel",
        },
      ],
    },
    {
      key: "women",
      label: "Women",
      children: [
        {
          key: "sneakers-w",
          label: "Sneakers",
        },
        {
          key: "accessories",
          label: "Accessories",
        },
      ],
    },
  ];

  return (
    <Header className="app-header">
      {showInput && showDropdown && (
        <div
          onClick={() => {
            setShowDropdown(false);
            setShowInput(false);
            setSearch("");
          }}
        />
      )}

      <div className="header-left">
        {isMobile ? (
          <Dropdown menu={{ items: dropdownItems }} trigger={["click"]}>
            <MenuOutlined className="menu-icon" />
          </Dropdown>
        ) : (
          <Menu mode="horizontal" className="header-menu" items={menuItems} />
        )}
      </div>

      <Link to={"/"} className="header-center">
        <img src={logo} alt="Logo" className="logo-img" />
      </Link>

      <div className="header-right" ref={wrapperRef}>
        {isMobile ? (
          <>
            {!showInput && (
              <SearchOutlined
                className="header-icon"
                onClick={() => setShowInput(true)}
              />
            )}
            {showInput && (
              <Input
                ref={inputRef}
                placeholder="Search products..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search && setShowDropdown(true)}
                style={{ width: 180, borderRadius: 8, marginRight: 8 }}
                allowClear
              />
            )}
            <Avatar icon={<UserOutlined />} className="header-avatar" />
          </>
        ) : (
          <>
            {!showInput && (
              <SearchOutlined
                className="header-icon"
                onClick={() => setShowInput(true)}
              />
            )}
            {showInput && (
              <Input
                ref={inputRef}
                placeholder="Search products..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search && setShowDropdown(true)}
                style={{ width: 220, borderRadius: 8, marginRight: 8 }}
                allowClear
              />
            )}
            {showInput && showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: 72,
                  right: 160,
                  width: 320,
                  background: "#fff",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  borderRadius: 16,
                  zIndex: 100,
                  padding: 20,
                }}
              >
                <div
                  style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}
                >
                  Products
                </div>
                {filtered.length === 0 ? (
                  <div style={{ color: "#888", padding: "16px 0" }}>
                    No products found.
                  </div>
                ) : (
                  filtered.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: 16,
                      }}
                    >
                      <img
                        src={`/assets/images/${p.image}`}
                        alt={p.name}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          objectFit: "cover",
                        }}
                      />
                      <span style={{ fontWeight: 500, fontSize: 18 }}>
                        {p.name}
                      </span>
                    </div>
                  ))
                )}
                <Button
                  type="link"
                  style={{ color: "#2d5bff", fontWeight: 600, padding: 0 }}
                  onClick={handleSeeAllProducts}
                >
                  See all products
                </Button>
              </div>
            )}
            <Avatar icon={<UserOutlined />} className="header-avatar" />
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#ff9800",
                marginLeft: 12,
              }}
            >
              <NotificationBadgeOnly count={8} />
            </div>
          </>
        )}
      </div>
    </Header>
  );
};

export default AppHeader;
