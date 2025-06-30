import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const EmptyState = ({
  title = 'No Data Available',
  description = 'There are no items to display at the moment.',
  actionText = 'Add New Item',
  onAction,
  icon = null,
}) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            <h3 style={{ marginBottom: 8, color: '#666' }}>{title}</h3>
            <p style={{ color: '#999', marginBottom: 24 }}>{description}</p>
            {onAction && (
              <Button type="primary" icon={<PlusOutlined />} onClick={onAction} size="large">
                {actionText}
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
};

export default EmptyState;
