import React, { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Table, Tag, Button } from "antd";

const StatusTag = React.memo(({ status }) => (
  <Tag
    color={
      status === "Active" ? "rgb(59 130 246 / 30%)" : "rgb(245 158 66 / 30%)"
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
          background: status === "Active" ? "#3b82f6" : "#f59e42",
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

const TableDiscounts = ({ title, discounts }) => {
  const columns = useMemo(
    () => [
      {
        title: "Discount Code",
        dataIndex: "code",
        key: "code",
      },
      {
        title: "Percentage",
        dataIndex: "percentage",
        key: "percentage",
        render: (percentage) => `${percentage}%`,
      },
      {
        title: "Total Discount",
        dataIndex: "totalDiscount",
        key: "totalDiscount",
        render: (amount) => `${amount}`,
      },
      {
        title: "Total Used",
        dataIndex: "totalUsed",
        key: "totalUsed",
      },
      {
        title: "Minimum Amount",
        dataIndex: "minimumAmount",
        key: "minimumAmount",
        render: (amount) => `${amount.toFixed(2)}đ`,
      },
      {
        title: "Maximum Discount",
        dataIndex: "maximumDiscount",
        key: "maximumDiscount",
        render: (amount) => `${amount.toFixed(2)}đ`,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => <StatusTag status={status} />,
      },
      {
        title: "Action",
        key: "action",
        render: (_, record) => (
          <Button type="link" onClick={() => handleEdit(record.id)}>
            Edit
          </Button>
        ),
      },
    ],
    []
  );

  const handleEdit = (id) => {
    // Handle edit action
    console.log("Edit discount:", id);
  };

  return (
    <div className="recent-orders" style={{ marginTop: 24 }}>
      <h4>{title}</h4>
      <Table
        columns={columns}
        dataSource={discounts}
        pagination={false}
        rowKey="id"
      />
    </div>
  );
};

TableDiscounts.propTypes = {
  title: PropTypes.string.isRequired,
  discounts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      code: PropTypes.string.isRequired,
      percentage: PropTypes.number.isRequired,
      totalDiscount: PropTypes.number.isRequired,
      totalUsed: PropTypes.number.isRequired,
      minimumAmount: PropTypes.number.isRequired,
      maximumDiscount: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default React.memo(TableDiscounts);
