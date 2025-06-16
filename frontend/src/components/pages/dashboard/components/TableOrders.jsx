import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Table, Tag } from 'antd';

const StatusTag = React.memo(({ status }) => (
  <Tag
    color={
      status === 'delivered'
        ? 'rgb(59 130 246 / 30%)'
        : status === 'cancelled' || status === 'refunded'
          ? 'rgb(239 68 68 / 30%)'
          : 'rgb(245 158 66 / 30%)'
    }
    style={{ borderRadius: 10, fontWeight: 500 }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background:
            status === 'delivered'
              ? '#3b82f6'
              : status === 'cancelled' || status === 'refunded'
                ? '#ef4444'
                : '#f59e42',
          marginRight: 6,
        }}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  </Tag>
));

StatusTag.propTypes = {
  status: PropTypes.string.isRequired,
};

const CustomerCell = React.memo(({ name }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span>{name}</span>
  </div>
));

CustomerCell.propTypes = {
  name: PropTypes.string.isRequired,
};

const TableOrders = ({
  title,
  orders = [],
  dashboard = false,
  loading = false,
  onOrderSelect = () => {},
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: 'Order ID',
        dataIndex: 'orderNumber',
        key: 'id',
      },
      {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'date',
        render: date => new Date(date).toLocaleDateString(),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => <StatusTag status={status} />,
      },
      {
        title: 'Amount',
        dataIndex: 'totalPrice',
        key: 'amount',
        render: amount => `$${amount?.toFixed(2) || '0.00'}`,
      },
    ];

    if (dashboard) {
      baseColumns.splice(4, 0, {
        title: 'Customer Name',
        dataIndex: 'user',
        key: 'customer',
        render: user => <CustomerCell name={user?.fullName || 'N/A'} />,
      });
    }

    return baseColumns;
  }, [dashboard]);

  const dataSource = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.map(order => ({
      ...order,
      key: order._id || order.orderNumber,
    }));
  }, [orders]);

  const rowSelection = {
    selectedRowKeys,
    onChange: selectedKeys => {
      setSelectedRowKeys(selectedKeys);
      if (selectedKeys.length === 1) {
        onOrderSelect?.(selectedKeys[0]);
      } else {
        onOrderSelect?.(null);
      }
    },
  };

  return (
    <div className="recent-orders" style={{ marginTop: 24 }}>
      <h4>{title}</h4>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        loading={loading}
        rowKey={record => record._id || record.orderNumber}
        rowSelection={dashboard ? rowSelection : undefined}
        onRow={record => ({
          onClick: () => {
            if (dashboard) {
              window.location.href = `/dashboard/orders/${record._id}`;
            } else {
              window.location.href = `/account/orders/${record._id}`;
            }
          },
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
};

TableOrders.propTypes = {
  title: PropTypes.string.isRequired,
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      orderNumber: PropTypes.string,
      user: PropTypes.shape({
        fullName: PropTypes.string,
      }),
      status: PropTypes.string,
      totalPrice: PropTypes.number,
      createdAt: PropTypes.string,
      items: PropTypes.array,
    })
  ),
  dashboard: PropTypes.bool,
  loading: PropTypes.bool,
  onOrderSelect: PropTypes.func,
};

export default React.memo(TableOrders);
