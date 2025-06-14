import React from "react";
import { Table, Button, Space, Tag, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import moment from "moment";

const TableDiscounts = ({ title, discounts, loading, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "warning";
      case "expired":
        return "error";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={type === "percentage" ? "blue" : "green"}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (value, record) => 
        record.type === "percentage" ? `${value}%` : `$${value}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Valid Period",
      key: "period",
      render: (_, record) => (
        <>
          {moment(record.startDate).format("DD/MM/YYYY")}
          <br />
          to
          <br />
          {moment(record.endDate).format("DD/MM/YYYY")}
        </>
      ),
    },
    {
      title: "Usage",
      key: "usage",
      render: (_, record) => `${record.usedCount}/${record.usageLimit}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this discount?"
            onConfirm={() => onDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="table-responsive">
      <Table
        title={() => <h2>{title}</h2>}
        columns={columns}
        dataSource={discounts}
        rowKey="_id"
        loading={loading}
        pagination={false}
      />
    </div>
  );
};

TableDiscounts.propTypes = {
  title: PropTypes.string.isRequired,
  discounts: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      description: PropTypes.string,
      type: PropTypes.oneOf(["percentage", "fixed"]).isRequired,
      value: PropTypes.number.isRequired,
      maxDiscount: PropTypes.number,
      minPurchase: PropTypes.number,
      startDate: PropTypes.string.isRequired,
      endDate: PropTypes.string.isRequired,
      usageLimit: PropTypes.number.isRequired,
      usedCount: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default React.memo(TableDiscounts);
