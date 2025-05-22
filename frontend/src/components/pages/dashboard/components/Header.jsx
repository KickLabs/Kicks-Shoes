import React, { useState, useRef, useEffect } from "react";
import { Layout, Button, Input } from "antd";
import {
  SearchOutlined,
  BellOutlined,
  LogoutOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { products } from "../../../../data/mockData";
const { Header: AntHeader } = Layout;

export default function Header() {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const wrapperRef = useRef(null);
  const adminBtnRef = useRef(null);
  const adminMenuRef = useRef(null);

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
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        (!adminMenuRef.current ||
          !adminMenuRef.current.contains(event.target)) &&
        (!adminBtnRef.current || !adminBtnRef.current.contains(event.target))
      ) {
        setShowDropdown(false);
        setShowInput(false);
        setSearch("");
        setShowAdminMenu(false);
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

  const handleSearchIconClick = () => {
    setShowInput(true);
  };

  const handleInputClear = () => {
    setSearch("");
    setShowDropdown(false);
    setShowInput(false);
  };

  const handleOverlayClick = () => {
    setShowDropdown(false);
    setShowInput(false);
    setSearch("");
    setShowAdminMenu(false);
  };

  return (
    <AntHeader
      className="header"
      style={{
        background: "#fff",
        margin: 0,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        borderRadius: "0px",
        padding: "0 24px",
        position: "relative",
        zIndex: 10,
      }}
    >
      {(showInput && showDropdown) || showAdminMenu ? (
        <div
          onClick={handleOverlayClick}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.18)",
            zIndex: 99,
          }}
        />
      ) : null}
      <div
        ref={wrapperRef}
        style={{
          position: "relative",
          marginRight: 16,
          display: "flex",
          alignItems: "center",
        }}
      >
        {!showInput && (
          <SearchOutlined
            style={{ fontSize: 20, cursor: "pointer" }}
            onClick={handleSearchIconClick}
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
            style={{ width: 220, borderRadius: 8, marginLeft: 4 }}
            allowClear
            onBlur={() => {
              // setShowInput(false); // Đã xử lý bằng click outside
            }}
            onClear={handleInputClear}
          />
        )}
        {showInput && showDropdown && (
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: 40,
              left: 0,
              width: 320,
              background: "#fff",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              borderRadius: 16,
              zIndex: 100,
              padding: 20,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>
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
            <a
              href="/dashboard/products"
              style={{ color: "#2d5bff", fontWeight: 600 }}
            >
              See all products
            </a>
          </div>
        )}
      </div>
      <BellOutlined style={{ fontSize: 20, marginRight: 24 }} />
      <Button
        type="default"
        ref={adminBtnRef}
        style={{ fontWeight: 600, letterSpacing: 1, borderRadius: 8 }}
        onClick={() => setShowAdminMenu((v) => !v)}
      >
        ADMIN <span style={{ marginLeft: 4 }}>▼</span>
      </Button>
      {showAdminMenu && (
        <div
          ref={adminMenuRef}
          style={{
            position: "absolute",
            top: 56,
            right: 20,
            width: 280,
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            borderRadius: 16,
            zIndex: 200,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 22 }}>Admin</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontWeight: 500,
              fontSize: 16,
              cursor: "pointer",
              justifyContent: "space-between",
              height: 40,
            }}
            onClick={() => {
              /* TODO: handle change password */
            }}
          >
            CHANGE PASSWORD <RightOutlined />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontWeight: 500,
              fontSize: 16,
              color: "#222",
              cursor: "pointer",
              gap: 8,
              height: 40,
            }}
            onClick={() => {
              /* TODO: handle logout */
            }}
          >
            LOG OUT <LogoutOutlined />
          </div>
        </div>
      )}
    </AntHeader>
  );
}
