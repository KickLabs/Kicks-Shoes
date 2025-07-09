import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Tag,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import {
  getAllDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from '../../../services/discountService';
import { formatVND } from '../../../utils/currency';

const { Option } = Select;
const { TextArea } = Input;

export default function DiscountListPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await getAllDiscounts();
      setDiscounts(response.data || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      message.error('Failed to fetch discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDiscount(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = record => {
    setEditingDiscount(record);
    form.setFieldsValue({
      code: record.code,
      description: record.description,
      type: record.type,
      value: record.value,
      maxDiscount: record.maxDiscount,
      minPurchase: record.minPurchase,
      startDate: record.startDate ? new Date(record.startDate) : null,
      endDate: record.endDate ? new Date(record.endDate) : null,
      usageLimit: record.usageLimit,
      status: record.status,
      perUserLimit: record.perUserLimit,
    });
    setModalVisible(true);
  };

  const handleDelete = async id => {
    try {
      await deleteDiscount(id);
      message.success('Discount deleted successfully');
      fetchDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      message.error('Failed to delete discount');
    }
  };

  const handleSubmit = async values => {
    try {
      const discountData = {
        ...values,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      };

      if (editingDiscount) {
        await updateDiscount(editingDiscount._id, discountData);
        message.success('Discount updated successfully');
      } else {
        await createDiscount(discountData);
        message.success('Discount created successfully');
      }

      setModalVisible(false);
      fetchDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
      message.error('Failed to save discount');
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'orange';
      case 'expired':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: code => <span style={{ fontWeight: 600 }}>{code}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type, record) => (
        <span>{type === 'percentage' ? `${record.value}%` : formatVND(record.value)}</span>
      ),
    },
    {
      title: 'Max Discount',
      dataIndex: 'maxDiscount',
      key: 'maxDiscount',
      render: value => (value ? formatVND(value) : '-'),
    },
    {
      title: 'Min Purchase',
      dataIndex: 'minPurchase',
      key: 'minPurchase',
      render: value => (value > 0 ? formatVND(value) : 'No minimum'),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => (
        <span>
          {record.usedCount} / {record.usageLimit}
        </span>
      ),
    },
    {
      title: 'Per User',
      dataIndex: 'perUserLimit',
      key: 'perUserLimit',
      render: value => value || 1,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={getStatusColor(status)}>{status.charAt(0).toUpperCase() + status.slice(1)}</Tag>
      ),
    },
    {
      title: 'Valid Period',
      key: 'validPeriod',
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>From: {new Date(record.startDate).toLocaleDateString()}</div>
          <div>To: {new Date(record.endDate).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: desc => <span style={{ fontSize: 12 }}>{desc}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this discount?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Manage Discounts"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Discount
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={discounts}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={editingDiscount ? 'Edit Discount' : 'Create Discount'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'percentage',
            status: 'active',
            usageLimit: 100,
            minPurchase: 0,
            perUserLimit: 1,
          }}
        >
          <Form.Item
            name="code"
            label="Discount Code"
            rules={[{ required: true, message: 'Please enter discount code' }]}
          >
            <Input placeholder="e.g., SUMMER20" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={2} placeholder="Discount description" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Discount Type"
            rules={[{ required: true, message: 'Please select discount type' }]}
          >
            <Select>
              <Option value="percentage">Percentage</Option>
              <Option value="fixed">Fixed Amount</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="value"
            label="Discount Value"
            rules={[{ required: true, message: 'Please enter discount value' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              placeholder="20"
              formatter={value => {
                const type = form.getFieldValue('type');
                return type === 'percentage' ? `${value}%` : formatVND(value);
              }}
              parser={value => value.replace(/[^\d]/g, '')}
            />
          </Form.Item>

          <Form.Item name="maxDiscount" label="Maximum Discount (Optional)">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="Maximum discount amount"
              formatter={value => formatVND(value)}
              parser={value => value.replace(/[^\d]/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="minPurchase"
            label="Minimum Purchase Amount"
            rules={[{ required: true, message: 'Please enter minimum purchase amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="0"
              formatter={value => formatVND(value)}
              parser={value => value.replace(/[^\d]/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="usageLimit"
            label="Usage Limit"
            rules={[{ required: true, message: 'Please enter usage limit' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="100" />
          </Form.Item>

          <Form.Item
            name="perUserLimit"
            label="Per User Limit"
            rules={[{ required: true, message: 'Please enter per user limit' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="1" />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true, message: 'Please select end date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="applicableProducts" label="Applicable Products (IDs, comma separated)">
            <Input placeholder="Leave blank for all products" />
          </Form.Item>

          <Form.Item
            name="applicableCategories"
            label="Applicable Categories (IDs, comma separated)"
          >
            <Input placeholder="Leave blank for all categories" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingDiscount ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
