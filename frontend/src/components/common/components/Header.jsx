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
import { getAllProducts } from "../../../data/mockData";

const { Header } = Layout;

const NotificationBadgeOnly = ({ count = 0 }) => (
  <div>{count > 99 ? "99+" : count}</div>
);

const products = getAllProducts();

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
    navigate("/listing-page");
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
      key: "products",
      label: "Products",
    },
  ];

  // Dropdown menu items (for mobile)
  const dropdownItems = [
    {
      key: "new",
      icon: <FireFilled style={{ color: "orange", marginRight: 4 }} />,
      label: "New Drops",
    },
    {
      key: "products",
      label: "Products",
    },
  ];

  const handleMenuClick = (e) => {
    if (e.key === "new") {
      navigate("/listing-page");
    } else if (e.key === "products") {
      navigate("/listing-page");
    }
  };

  const handleClickAvatar = () => {
    console.log("Avatar clicked");
    navigate(`/account`);
  };

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
          <Dropdown
            menu={{ items: dropdownItems, onClick: handleMenuClick }}
            trigger={["click"]}
          >
            <MenuOutlined className="menu-icon" />
          </Dropdown>
        ) : (
          <Menu
            mode="horizontal"
            className="header-menu"
            items={menuItems}
            onClick={handleMenuClick}
          />
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
            <div
              onClick={handleClickAvatar}
              style={{ display: "inline-block", cursor: "pointer" }}
            >
              <Avatar icon={<UserOutlined />} className="header-avatar" />
            </div>
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
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        setShowDropdown(false);
                        setShowInput(false);
                        setSearch("");
                      }}
                      key={p.id}
                      className="header-search-result-item"
                    >
                      <img
                        src={`${p.images[0]}`}
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
            <div
              onClick={handleClickAvatar}
              style={{ display: "inline-block", cursor: "pointer" }}
            >
              <Avatar icon={<UserOutlined />} className="header-avatar" />
            </div>
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
