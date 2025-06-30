import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Table, Tag, Button, Avatar, Space, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import axiosInstance from '../../../../services/axiosInstance';
import EmptyState from './EmptyState';

const StatusTag = React.memo(({ status }) => (
  <Tag color={status === 'active' ? 'green' : 'red'} style={{ borderRadius: 10, fontWeight: 500 }}>
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: status === 'active' ? '#52c41a' : '#ff4d4f',
          marginRight: 6,
        }}
      />
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  </Tag>
));

StatusTag.propTypes = {
  status: PropTypes.string.isRequired,
};

const RoleTag = React.memo(({ role }) => {
  const roleConfig = {
    admin: { color: 'red', text: 'Admin' },
    shop: { color: 'blue', text: 'Shop Owner' },
    customer: { color: 'green', text: 'Customer' },
  };

  const config = roleConfig[role] || { color: 'default', text: role };

  return (
    <Tag color={config.color} style={{ borderRadius: 8, fontWeight: 500 }}>
      {config.text}
    </Tag>
  );
});

RoleTag.propTypes = {
  role: PropTypes.string.isRequired,
};

const TableUsers = ({ title, users, onReload }) => {
  const [loading, setLoading] = useState(false);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/api/users/${userId}/status`, {
        status: currentStatus === 'active' ? 'inactive' : 'active',
      });
      message.success(`User ${currentStatus === 'active' ? 'banned' : 'unbanned'} successfully`);
      onReload();
    } catch (err) {
      console.error('Failed to update user status:', err);
      message.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async userId => {
    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          await axiosInstance.delete(`/api/users/${userId}`);
          message.success('User deleted successfully');
          onReload();
        } catch (err) {
          console.error('Failed to delete user:', err);
          message.error('Failed to delete user');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: 'User',
        dataIndex: 'fullName',
        key: 'user',
        render: (fullName, record) => (
          <Space>
            <Avatar src={record.avatar} icon={<UserOutlined />} size={40} />
            <div>
              <div style={{ fontWeight: 600 }}>{fullName || 'Unknown'}</div>
              <div style={{ color: '#666', fontSize: 12 }}>{record.email}</div>
            </div>
          </Space>
        ),
      },
      {
        title: 'Phone',
        dataIndex: 'phone',
        key: 'phone',
        render: phone => phone || 'N/A',
      },
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        render: role => <RoleTag role={role} />,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => <StatusTag status={status ? 'active' : 'inactive'} />,
      },
      {
        title: 'Join Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: date => new Date(date).toLocaleDateString(),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              title="Edit User"
            />
            <Button
              type="link"
              danger={record.status === true}
              onClick={() => handleToggleStatus(record._id, record.status ? 'active' : 'inactive')}
              title={record.status ? 'Ban User' : 'Unban User'}
            >
              {record.status ? 'Ban' : 'Unban'}
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record._id)}
              title="Delete User"
            />
          </Space>
        ),
      },
    ],
    [handleToggleStatus, handleDelete]
  );

  const handleEdit = user => {
    // TODO: Implement edit modal or navigate to edit page
    console.log('Edit user:', user);
    message.info('Edit functionality will be implemented soon');
  };

  return (
    <div className="recent-orders" style={{ marginTop: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h4>{title}</h4>
        <Button type="default" icon={<UserOutlined />}>
          Add New User
        </Button>
      </div>
      {users.length === 0 ? (
        <EmptyState
          title="No Users Found"
          description="There are no users registered in the system yet."
          actionText="Add New User"
          onAction={() => message.info('Add user functionality will be implemented soon')}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={users}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
          }}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 'max-content' }}
        />
      )}
    </div>
  );
};

TableUsers.propTypes = {
  title: PropTypes.string.isRequired,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      fullName: PropTypes.string,
      email: PropTypes.string.isRequired,
      phone: PropTypes.string,
      role: PropTypes.string.isRequired,
      status: PropTypes.bool,
      avatar: PropTypes.string,
      createdAt: PropTypes.string.isRequired,
    })
  ).isRequired,
  onReload: PropTypes.func.isRequired,
};

export default React.memo(TableUsers);
