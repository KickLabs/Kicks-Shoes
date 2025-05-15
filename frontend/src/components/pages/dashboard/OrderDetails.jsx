import React, { useContext, useEffect } from "react";
import {
  Card,
  Button,
  Tag,
  Table,
  Avatar,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  HomeOutlined,
  CreditCardOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ActiveTabContext } from "./Dashboard";
import "./order-details.css";
import TabHeader from "./components/TabHeader";

const { Option } = Select;

const order = {
  id: 6743,
  status: "Pending",
  date: ["Feb 16,2022", "Feb 20,2022"],
  customer: {
    name: "Jane Cooper",
    email: "janecooper@gmail.com",
    phone: "+900 231 1212",
  },
  shipping: {
    address: "Santa Ana, Illinois 85342 2345 Westheimer Rd. Block 9A",
  },
  payment: {
    card: "**** **** **** 6557",
    business: "Jane Cooper",
    phone: "+900 231 1212",
  },
  products: [
    {
      key: 1,
      name: "Adidas ultra boost",
      orderId: "#25421",
      quantity: 2,
      total: 800.4,
      image: "/img/shoe.png",
    },
    {
      key: 2,
      name: "Adidas ultra boost",
      orderId: "#25421",
      quantity: 2,
      total: 800.4,
      image: "/img/shoe.png",
    },
    {
      key: 3,
      name: "Adidas ultra boost",
      orderId: "#25421",
      quantity: 2,
      total: 800.4,
      image: "/img/shoe.png",
    },
    {
      key: 4,
      name: "Adidas ultra boost",
      orderId: "#25421",
      quantity: 2,
      total: 800.4,
      image: "/img/shoe.png",
    },
  ],
  subtotal: 3201.6,
  tax: 640.32,
  discount: 0,
  total: 3841.92,
};

const columns = [
  {
    title: "",
    dataIndex: "checkbox",
    key: "checkbox",
    render: () => <input type="checkbox" />,
    width: 40,
  },
  {
    title: "Product Name",
    dataIndex: "name",
    key: "name",
    render: (text, record) => (
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar src={record.image} shape="square" size={32} /> {text}
      </span>
    ),
  },
  {
    title: "Order ID",
    dataIndex: "orderId",
    key: "orderId",
    render: (id) => <b style={{ color: "#232321" }}>{id}</b>,
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    key: "quantity",
  },
  {
    title: "Total",
    dataIndex: "total",
    key: "total",
    render: (val) => `$${val.toFixed(2)}`,
  },
];

export default function OrderDetails() {
  const { setActiveTab } = useContext(ActiveTabContext);

  useEffect(() => {
    setActiveTab("3");
  }, [setActiveTab]);

  return (
    <>
      <TabHeader
        breadcrumb="Order Details"
        anotherBreadcrumb={`Orders ID: #${order.id}`}
      />
      <div className="order-details-container">
        <div className="order-details-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="order-details-title">
              Orders ID: <span className="order-details-id">#{order.id}</span>
            </span>
            <Tag color="orange" className="order-details-status">
              {order.status}
            </Tag>
            <DatePicker.RangePicker
              value={order.date.map((d) => dayjs(d, "MMM DD,YYYY"))}
              disabled
            />
          </div>
          <div className="order-details-header-actions">
            <Select defaultValue={order.status} style={{ width: 140 }}>
              <Option value="Pending">Pending</Option>
              <Option value="Delivered">Delivered</Option>
              <Option value="Canceled">Canceled</Option>
            </Select>
            <Button icon={<DownloadOutlined />} />
            <Button type="default">Save</Button>
          </div>
        </div>

        <Row gutter={[16, 16]} className="order-details-info-row">
          <Col span={8}>
            <Card bordered={false} className="order-details-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <UserOutlined style={{ fontSize: 28, color: "#4A69E2" }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Customer</div>
                  <div>Full Name: {order.customer.name}</div>
                  <div>Email: {order.customer.email}</div>
                  <div>Phone: {order.customer.phone}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered={false} className="order-details-card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Order Info</div>
              <div>Shipping: Next express</div>
              <div>Payment Method: Paypal</div>
              <div>
                Status: <Tag color="orange">Pending</Tag>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered={false} className="order-details-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <HomeOutlined style={{ fontSize: 28, color: "#4A69E2" }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Deliver to</div>
                  <div>Address: {order.shipping.address}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered={false} className="order-details-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CreditCardOutlined
                  style={{ fontSize: 28, color: "#E94E3C" }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>Payment Info</div>
                  <div>Master Card {order.payment.card}</div>
                  <div>Business name: {order.payment.business}</div>
                  <div>Phone: {order.payment.phone}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={16}>
            <Card bordered={false} className="order-details-card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Note</div>
              <Input.TextArea
                placeholder="Type some notes"
                autoSize={{ minRows: 3, maxRows: 3 }}
              />
            </Card>
          </Col>
        </Row>

        <div className="order-details-actions">
          <Button block>View Customer Profile</Button>
          <Button icon={<DownloadOutlined />} block>
            Download Order Info
          </Button>
          <Button block>View Delivery Address</Button>
        </div>

        <div className="order-details-products">
          <div className="order-details-products-title">Products</div>
          <Table
            columns={columns}
            dataSource={order.products}
            pagination={false}
            className="order-details-table"
          />
          <div className="order-details-summary">
            <div className="order-details-summary-row">
              <span>Subtotal</span>
              <span>${order.subtotal.toLocaleString()}</span>
            </div>
            <div className="order-details-summary-row">
              <span>Tax (20%)</span>
              <span>${order.tax.toLocaleString()}</span>
            </div>
            <div className="order-details-summary-row">
              <span>Discount</span>
              <span>${order.discount}</span>
            </div>
            <div className="order-details-total">
              <span>Total</span>
              <span>${order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
