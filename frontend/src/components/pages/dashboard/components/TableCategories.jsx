import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  Tag,
  Button,
  Image,
  Space,
  Modal,
  message,
  Form,
  Input,
  Switch,
  Upload,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  activateCategory,
  deactivateCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../../../services/dashboardService';
import EmptyState from './EmptyState';

const StatusTag = React.memo(({ status }) => (
  <Tag color={status ? 'green' : 'red'} style={{ borderRadius: 10, fontWeight: 500 }}>
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: status ? '#52c41a' : '#ff4d4f',
          marginRight: 6,
        }}
      />
      {status ? 'Active' : 'Inactive'}
    </span>
  </Tag>
));

StatusTag.propTypes = {
  status: PropTypes.bool.isRequired,
};

const TableCategories = ({ title, categories, onReload }) => {
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form] = Form.useForm();

  const handleView = category => {
    setSelectedCategory(category);
    setViewModalVisible(true);
  };

  const handleAdd = () => {
    form.resetFields();
    setAddModalVisible(true);
  };

  const handleEdit = category => {
    setSelectedCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setEditModalVisible(true);
  };

  const handleToggleStatus = async (categoryId, currentStatus) => {
    try {
      setLoading(true);
      if (currentStatus) {
        await deactivateCategory(categoryId);
        message.success('Category deactivated successfully');
      } else {
        await activateCategory(categoryId);
        message.success('Category activated successfully');
      }
      onReload();
    } catch (err) {
      console.error('Failed to update category status:', err);
      message.error('Failed to update category status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async categoryId => {
    Modal.confirm({
      title: 'Delete Category',
      content: 'Are you sure you want to delete this category? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          await deleteCategory(categoryId);
          message.success('Category deleted successfully');
          onReload();
        } catch (err) {
          console.error('Failed to delete category:', err);
          message.error(err.response?.data?.message || 'Failed to delete category');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleAddSubmit = async values => {
    try {
      setLoading(true);
      await createCategory(values);
      message.success('Category added successfully');
      setAddModalVisible(false);
      onReload();
    } catch (err) {
      console.error('Failed to add category:', err);
      message.error(err.response?.data?.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async values => {
    try {
      setLoading(true);
      await updateCategory(selectedCategory._id, values);
      message.success('Category updated successfully');
      setEditModalVisible(false);
      onReload();
    } catch (err) {
      console.error('Failed to update category:', err);
      message.error(err.response?.data?.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Image',
        dataIndex: 'image',
        key: 'image',
        render: image => (
          <Image
            width={50}
            height={50}
            src={image || '/placeholder-category.png'}
            alt="Category"
            style={{ borderRadius: 8, objectFit: 'cover' }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
        ),
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        render: name => <span style={{ fontWeight: 600 }}>{name}</span>,
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: description => (
          <span style={{ color: '#666' }}>
            {description?.length > 50 ? `${description.substring(0, 50)}...` : description}
          </span>
        ),
      },
      {
        title: 'Products Count',
        dataIndex: 'productsCount',
        key: 'productsCount',
        render: count => (
          <Tag color="blue" style={{ borderRadius: 8 }}>
            {count || 0} products
          </Tag>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => <StatusTag status={status} />,
      },
      {
        title: 'Created Date',
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
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              title="View Category Details"
            />
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              title="Edit Category"
            />
            <Button
              type="link"
              danger={record.status}
              onClick={() => handleToggleStatus(record._id, record.status)}
              title={record.status ? 'Deactivate' : 'Activate'}
            >
              {record.status ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record._id)}
              title="Delete Category"
            />
          </Space>
        ),
      },
    ],
    [handleToggleStatus, handleDelete, handleView, handleEdit]
  );

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
        <Button type="default" icon={<PlusOutlined />} onClick={handleAdd}>
          Add New Category
        </Button>
      </div>
      {categories.length === 0 ? (
        <EmptyState
          title="No Categories Found"
          description="There are no categories created in the system yet."
          actionText="Add New Category"
          onAction={() => handleAdd()}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={categories}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories`,
          }}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 'max-content' }}
        />
      )}
      <Modal
        title="Category Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedCategory && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <Image
                width={80}
                height={80}
                src={selectedCategory.image || '/placeholder-category.png'}
                alt={selectedCategory.name}
                style={{ borderRadius: 8, objectFit: 'cover', marginRight: 16 }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
              />
              <div>
                <h3 style={{ margin: 0, marginBottom: 4 }}>{selectedCategory.name}</h3>
                <StatusTag status={selectedCategory.status} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Description</h4>
              <p style={{ color: '#666', margin: 0 }}>
                {selectedCategory.description || 'No description available'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <h4 style={{ marginBottom: 8 }}>Products Count</h4>
                <Tag color="blue" style={{ borderRadius: 8, fontSize: 14 }}>
                  {selectedCategory.productsCount || 0} products
                </Tag>
              </div>
              <div>
                <h4 style={{ marginBottom: 8 }}>Created Date</h4>
                <span style={{ color: '#666' }}>
                  {new Date(selectedCategory.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {selectedCategory.slug && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 8 }}>Slug</h4>
                <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: 4 }}>
                  {selectedCategory.slug}
                </code>
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* Add Category Modal */}
      <Modal
        title="Add New Category"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddSubmit}
          initialValues={{ status: true }}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter category description" rows={4} />
          </Form.Item>

          <Form.Item name="image" label="Image URL">
            <Input placeholder="Enter image URL (optional)" />
          </Form.Item>

          <Form.Item name="status" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Add Category
              </Button>
              <Button onClick={() => setAddModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        title="Edit Category"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter category description" rows={4} />
          </Form.Item>

          <Form.Item name="image" label="Image URL">
            <Input placeholder="Enter image URL (optional)" />
          </Form.Item>

          <Form.Item name="status" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Category
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

TableCategories.propTypes = {
  title: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      image: PropTypes.string,
      status: PropTypes.bool.isRequired,
      productsCount: PropTypes.number,
      createdAt: PropTypes.string.isRequired,
    })
  ).isRequired,
  onReload: PropTypes.func.isRequired,
};

export default React.memo(TableCategories);
