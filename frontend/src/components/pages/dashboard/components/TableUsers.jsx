import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Table, Tag, Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
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

const TableUsers = ({ title, users }) => {
  const columns = useMemo(
    () => [
      {
        title: "User ID",
        dataIndex: "id",
        key: "id",
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
      },
      {
        title: "Phone",
        dataIndex: "phone",
        key: "phone",
      },
      {
        title: "Role",
        dataIndex: "role",
        key: "role",
        render: (role) => (
          <Tag color={role === "Admin" ? "blue" : "green"}>{role}</Tag>
        ),
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
          <div style={{ display: "flex", gap: "8px" }}>
            <Button type="link" onClick={() => handleEdit(record.id)}>
              <EditOutlined />
            </Button>
            <Button type="link" danger onClick={() => handleDelete(record.id)}>
              <DeleteOutlined />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const handleEdit = (id) => {
    // Handle edit action
    console.log("Edit user:", id);
  };

  const handleDelete = (id) => {
    // Handle delete action
    console.log("Delete user:", id);
  };

  return (
    <div className="recent-orders" style={{ marginTop: 24 }}>
      <h4>{title}</h4>
      <Table
        columns={columns}
        dataSource={users}
        pagination={false}
        rowKey="id"
      />
    </div>
  );
};

TableUsers.propTypes = {
  title: PropTypes.string.isRequired,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default React.memo(TableUsers);
