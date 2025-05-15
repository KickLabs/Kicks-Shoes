import React, { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Table, Tag, Avatar, Checkbox } from "antd";

const StatusTag = React.memo(({ status }) => (
  <Tag
    color={
      status === "Completed" ? "rgb(59 130 246 / 30%)" : "rgb(245 158 66 / 30%)"
    }
    style={{ borderRadius: 10, fontWeight: 500 }}
  >
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: status === "Completed" ? "#3b82f6" : "#f59e42",
          marginRight: 6,
        }}
      />
      {status}
    </span>
  </Tag>
));

StatusTag.propTypes = {
  status: PropTypes.string.isRequired,
};

const CustomerCell = React.memo(({ name }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span>{name}</span>
  </div>
));

CustomerCell.propTypes = {
  name: PropTypes.string.isRequired,
};

const TableOrders = ({ title, orders }) => {
  const columns = useMemo(
    () => [
      {
        title: <Checkbox />,
        dataIndex: "checkbox",
        key: "checkbox",
        width: 40,
        render: (_, record) => <Checkbox />,
      },
      {
        title: "Product",
        dataIndex: "items",
        key: "product",
        render: (items) => items[0]?.name || "N/A",
      },
      { title: "Order ID", dataIndex: "id", key: "id" },
      { title: "Date", dataIndex: "date", key: "date" },
      {
        title: "Customer Name",
        dataIndex: "customer",
        key: "customer",
        render: (name) => <CustomerCell name={name} />,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => <StatusTag status={status} />,
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        render: (amount) => `$${amount.toFixed(2)}`,
      },
    ],
    []
  );

  return (
    <div className="recent-orders" style={{ marginTop: 24 }}>
      <h4>{title}</h4>
      <Table
        columns={columns}
        dataSource={orders}
        pagination={false}
        onRow={(record) => ({
          onClick: () => {
            window.location.href = `/dashboard/orders/${record.id}`;
          },
          style: { cursor: "pointer" },
        })}
      />
    </div>
  );
};

TableOrders.propTypes = {
  title: PropTypes.string.isRequired,
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      customer: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          productId: PropTypes.number.isRequired,
          name: PropTypes.string.isRequired,
          quantity: PropTypes.number.isRequired,
          price: PropTypes.number.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
};

export default React.memo(TableOrders);
