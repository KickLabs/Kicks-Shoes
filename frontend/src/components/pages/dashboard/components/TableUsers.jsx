import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Table, Tag, Button } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
const StatusTag = React.memo(({ status }) => (
  <Tag
    color={status === 'Active' ? 'rgb(59 130 246 / 30%)' : 'rgb(245 158 66 / 30%)'}
    style={{ borderRadius: 10, fontWeight: 500 }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: status === 'Active' ? '#3b82f6' : '#f59e42',
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

const TableUsers = ({ title, users, onReload }) => {
  const columns = useMemo(
  () => [
    {
      title: 'User ID',
      dataIndex: 'id',
      key: 'id',
  render: (id) => (
    <span title={id}>
      {id.length > 8 ? `${id.slice(0, 8)}...` : id}
    </span>
  ),
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: role => <Tag color={role === 'admin' ? 'blue' : 'green'}>{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusTag status={status ? 'Active' : 'Inactive'} />,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
        type="link"
        danger={record.status === true}
        onClick={() => handleToggleStatus(record.id, !record.status)}
      >
        {record.status ? "Ban" : "Unban"}
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


  const handleToggleStatus = (userId, currentStatus) => {
  axios
    .patch(`/api/users/${userId}/status`, { status: !currentStatus })
    .then((res) => {
      console.log("User status updated:", res.data);
      // Ví dụ: reload lại danh sách nếu cần
      onReload()
    })
    .catch((err) => {
      console.error("Failed to update status:", err);
    });
};


  const handleDelete = id => {
    // Handle delete action
    console.log('Delete user:', id);
  };

  return (
    <div className="recent-orders" style={{ marginTop: 24 }}>
      <h4>{title}</h4>
      <Table columns={columns} dataSource={users} pagination={false} rowKey="id" scroll={{ x: 'max-content' }}/>
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
