import React from "react";
import { Row, Col, Input, Button, Typography, List, Divider } from "antd";
import { FaFacebookF, FaInstagram, FaTwitter, FaTiktok } from "react-icons/fa";
import "./Footer.css";

const { Title, Text, Link } = Typography;

const Footer = () => {
  const categoryLinks = ["Runner", "Sneakers", "Basketball", "Outdoor", "Golf", "Hiking"];
  const companyLinks = ["About", "Contact", "Blogs"];

  return (
    <footer className="footer-container">
      <div className="newsletter-section">
        <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ width: "100%" }}>
          <Col xs={24} md={12} className="newsletter-content">
            <Title level={2} style={{ color: "white", marginBottom: "0.5rem" }}>
              Subscribe to our newsletter
            </Title>
            <Text style={{ color: "white", display: "block", marginBottom: "1rem" }}>
              Stay updated with the latest news and exclusive offers!
            </Text>
            <div className="input-group">
              <Input placeholder="Enter your email" style={{ width: 200 }} />
              <Button type="primary">Submit</Button>
            </div>
          </Col>
          <Col xs={24} md={10} className="logo-area">
            <Title level={1} style={{ color: "white", margin: 0 }}>
              KICKS<span style={{ color: "orange" }}>+</span>
            </Title>
          </Col>
        </Row>
      </div>
      <div className="background">
      <div className="footer-links">
        <Row gutter={[32, 32]} style={{ width: "100%" }}>
          <Col xs={24} md={6}>
            <Title level={3} style={{ color: "orange" }}>
              About Us
            </Title>
            <Text style={{ color: "white", maxWidth: 300 }}>
              We are the biggest hyperstore in the universe.
              We got you all cover with our exclusive collection and latest drops.
            </Text>
          </Col>
          <Col xs={24} md={6}>
            <Title level={3} style={{ color: "orange" }}>
              Categories
            </Title>
            <List
              dataSource={categoryLinks}
              renderItem={(item) => (
                <List.Item style={{ padding: "0.3rem 0", border: "none" }}>
                  <Link style={{ color: "white" }}>{item}</Link>
                </List.Item>
              )}
            />
          </Col>
          <Col xs={24} md={6}>
            <Title level={3} style={{ color: "orange" }}>
              Company
            </Title>
            <List
              dataSource={companyLinks}
              renderItem={(item) => (
                <List.Item style={{ padding: "0.3rem 0", border: "none" }}>
                  <Link style={{ color: "white" }}>{item}</Link>
                </List.Item>
              )}
            />
          </Col>
          <Col xs={24} md={6}>
            <Title level={3} style={{ color: "orange" }}>
              Follow Us
            </Title>
            <div className="social-icons">
              <FaFacebookF style={{ marginRight: "0.5rem", fontSize: "1.2rem", color: "white" }} />
              <FaInstagram style={{ marginRight: "0.5rem", fontSize: "1.2rem", color: "white" }} />
              <FaTwitter style={{ marginRight: "0.5rem", fontSize: "1.2rem", color: "white" }} />
              <FaTiktok style={{ marginRight: "0.5rem", fontSize: "1.2rem", color: "white" }} />
            </div>
          </Col>
        </Row>
        
      </div>
      </div>
      <div className="footer-bottom">
        <Text style={{ color: "#1e1e1e" }}>
          © {new Date().getFullYear()} KICKS+. All rights reserved. |{" "}
          <Link href="#" style={{ color: "#0077cc" }}>
            Privacy Policy
          </Link>
        </Text>
      </div>
    </footer>
  );
};

export default Footer;