import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Tabs,
  Statistic,
  Row,
  Col,
  Space,
  Badge,
} from 'antd';
import {
  TruckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import shipperService from '../../../services/shipperService';
import { useAuth } from '../../../contexts/AuthContext';
import './ShipperDashboard.css';

const { Content } = Layout;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ShipperDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState('');

  // Helper function to determine if a status option should be disabled
  const isStatusDisabled = (optionStatus, currentStatus) => {
    // Status progression order: picked_up -> in_transit -> delivered/failed
    const statusOrder = {
      picked_up: 1,
      in_transit: 2,
      delivered: 3,
      failed: 3, // Failed is same level as delivered
    };

    // If no current status, allow all
    if (!currentStatus) return false;

    // Can't go back to previous statuses
    const currentOrder = statusOrder[currentStatus] || 0;
    const optionOrder = statusOrder[optionStatus] || 0;

    // Disable if option is earlier in progression than current status
    if (optionOrder < currentOrder) return true;

    // If current status is delivered or failed, disable everything (can't change after final status)
    if (currentStatus === 'delivered' || currentStatus === 'failed') return true;

    return false;
  };

  useEffect(() => {
    fetchAssignedOrders();
    fetchDeliveryHistory();
    fetchStats();
  }, []);

  const fetchAssignedOrders = async () => {
    setLoading(true);
    try {
      const response = await shipperService.getAssignedOrders();
      setOrders(response.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch assigned orders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryHistory = async () => {
    try {
      const response = await shipperService.getDeliveryHistory();
      setDeliveryHistory(response.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch delivery history');
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await shipperService.getStats();
      setStats(response.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch statistics');
      console.error(error);
    }
  };

  const handleUpdateStatus = async values => {
    try {
      // If status is delivered, proof of delivery is required
      if (values.status === 'delivered' && !proofImageUrl) {
        message.error('Please upload proof of delivery image for delivered status');
        return;
      }

      // Add proof image URL if available
      const payload = {
        ...values,
        ...(proofImageUrl && { proofOfDelivery: proofImageUrl }),
      };

      await shipperService.updateDeliveryStatus(selectedOrder.order._id, payload);
      message.success('Delivery status updated successfully');
      setIsUpdateModalVisible(false);
      form.resetFields();
      setSelectedStatus(null);
      setFileList([]);
      setProofImageUrl('');
      fetchAssignedOrders();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update status');
      console.error(error);
    }
  };

  const customUploadRequest = async ({ file, onSuccess, onError, onProgress }) => {
    const token = localStorage.getItem('accessToken');
    console.log('Custom upload request, token:', token ? 'exists' : 'NO TOKEN');

    if (!token) {
      message.error('Please login again. No authentication token found.');
      onError(new Error('No token'));
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          onProgress({ percent });
        }
      };

      xhr.onload = () => {
        try {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            onSuccess(response, xhr);
          } else {
            // Try to parse error response
            let errorData;
            try {
              errorData = JSON.parse(xhr.responseText);
            } catch (parseError) {
              // If response is not JSON (e.g., HTML error page)
              errorData = {
                error: 'Upload failed',
                message: `Server returned ${xhr.status}: ${xhr.statusText}`,
                details: xhr.responseText.substring(0, 200),
              };
            }
            onError(errorData);
          }
        } catch (error) {
          console.error('Error processing upload response:', error);
          onError({
            error: 'Upload failed',
            message: error.message || 'Failed to process server response',
          });
        }
      };

      xhr.onerror = () => {
        onError(new Error('Network error during upload'));
      };

      xhr.open('POST', '/api/upload/delivery-proof');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      onError(error);
    }
  };

  const handleUploadChange = info => {
    let newFileList = [...info.fileList];
    // Limit to only 1 file
    newFileList = newFileList.slice(-1);
    setFileList(newFileList);

    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
      // Get URL from response
      if (info.file.response && info.file.response.url) {
        setProofImageUrl(info.file.response.url);
      }
    } else if (info.file.status === 'error') {
      // Handle different error formats
      let errorMsg = 'Upload failed';

      if (info.file.response) {
        // Try to extract error message from various formats
        if (typeof info.file.response === 'string') {
          errorMsg = info.file.response;
        } else if (info.file.response.message) {
          errorMsg = info.file.response.message;
        } else if (info.file.response.error) {
          errorMsg = info.file.response.error;
          if (info.file.response.message) {
            errorMsg += `: ${info.file.response.message}`;
          }
        }
      }

      if (
        errorMsg.includes('401') ||
        errorMsg.includes('Unauthorized') ||
        errorMsg.includes('token')
      ) {
        message.error('Session expired. Please login again.');
      } else if (errorMsg.includes('File too large') || errorMsg.includes('LIMIT_FILE_SIZE')) {
        message.error('File is too large. Maximum size is 10MB.');
      } else {
        message.error(`Upload failed: ${errorMsg}`);
      }

      console.error('Upload error details:', info.file.response);
    }
  };

  const beforeUpload = file => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleStatusChange = value => {
    setSelectedStatus(value);
    // Reset proof image when changing status
    if (value !== 'delivered') {
      setFileList([]);
      setProofImageUrl('');
    }
  };

  const getStatusColor = status => {
    const colors = {
      assigned: 'blue',
      picked_up: 'cyan',
      in_transit: 'orange',
      delivered: 'green',
      failed: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusText = status => {
    const texts = {
      assigned: 'Assigned',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      failed: 'Failed',
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: ['order', 'orderNumber'],
      key: 'orderNumber',
      render: text => <strong>{text}</strong>,
    },
    {
      title: 'Customer',
      dataIndex: ['order', 'user', 'fullName'],
      key: 'customer',
    },
    {
      title: 'Address',
      dataIndex: ['order', 'shippingAddress'],
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: 'Assigned At',
      dataIndex: 'assignedAt',
      key: 'assignedAt',
      render: date => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setSelectedOrder(record);
            setIsUpdateModalVisible(true);
          }}
          disabled={record.status === 'delivered'}
        >
          Update Status
        </Button>
      ),
    },
  ];

  const historyColumns = [
    {
      title: 'Order Number',
      dataIndex: ['order', 'orderNumber'],
      key: 'orderNumber',
    },
    {
      title: 'Total Price',
      dataIndex: ['order', 'totalPrice'],
      key: 'totalPrice',
      render: price => `${price?.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: 'Delivered At',
      dataIndex: 'deliveredAt',
      key: 'deliveredAt',
      render: date => (date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'),
    },
    {
      title: 'Duration',
      dataIndex: 'deliveryDuration',
      key: 'deliveryDuration',
      render: duration => (duration ? `${Math.floor(duration / 60)} hours` : 'N/A'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>
          <TruckOutlined /> Shipper Dashboard
        </h1>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Deliveries"
                value={stats.activeDeliveries}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Today's Deliveries"
                value={stats.todayDeliveries}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="This Month"
                value={stats.monthDeliveries}
                prefix={<TruckOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Success Rate"
                value={stats.successRate}
                suffix="%"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <Card>
          <Tabs defaultActiveKey="active">
            <TabPane tab={<Badge count={orders.length}>Active Orders</Badge>} key="active">
              <Table
                columns={columns}
                dataSource={orders}
                loading={loading}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
            <TabPane tab="Delivery History" key="history">
              <Table
                columns={historyColumns}
                dataSource={deliveryHistory}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
          </Tabs>
        </Card>

        {/* Update Status Modal */}
        <Modal
          title="Update Delivery Status"
          open={isUpdateModalVisible}
          onCancel={() => {
            setIsUpdateModalVisible(false);
            form.resetFields();
            setSelectedStatus(null);
            setFileList([]);
            setProofImageUrl('');
          }}
          footer={null}
          width={600}
        >
          <Form form={form} onFinish={handleUpdateStatus} layout="vertical">
            <Form.Item
              name="status"
              label={
                <span>
                  <span style={{ color: 'red', marginRight: 4 }}>*</span>
                  Status
                </span>
              }
              rules={[{ required: true, message: 'Please select a status' }]}
            >
              <Select placeholder="Select status" onChange={handleStatusChange}>
                <Select.Option
                  value="picked_up"
                  disabled={isStatusDisabled('picked_up', selectedOrder?.status)}
                >
                  Picked Up
                </Select.Option>
                <Select.Option
                  value="in_transit"
                  disabled={isStatusDisabled('in_transit', selectedOrder?.status)}
                >
                  In Transit
                </Select.Option>
                <Select.Option
                  value="delivered"
                  disabled={isStatusDisabled('delivered', selectedOrder?.status)}
                >
                  Delivered
                </Select.Option>
                <Select.Option
                  value="failed"
                  disabled={isStatusDisabled('failed', selectedOrder?.status)}
                >
                  Failed
                </Select.Option>
              </Select>
            </Form.Item>

            {/* Show proof upload when status is delivered */}
            {selectedStatus === 'delivered' && (
              <Form.Item
                label={
                  <span>
                    <span style={{ color: 'red', marginRight: 4 }}>*</span>
                    Proof of Delivery
                  </span>
                }
                required
                help="Required: Upload a photo as proof of delivery"
              >
                <Upload
                  name="image"
                  customRequest={customUploadRequest}
                  listType="picture-card"
                  fileList={fileList}
                  onChange={handleUploadChange}
                  beforeUpload={beforeUpload}
                  maxCount={1}
                >
                  {fileList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload Photo</div>
                    </div>
                  )}
                </Upload>
                {proofImageUrl && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      background: '#f0f2f5',
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                    Image uploaded successfully
                  </div>
                )}
              </Form.Item>
            )}

            <Form.Item name="note" label="Note">
              <TextArea rows={3} placeholder="Add a note (optional)" />
            </Form.Item>

            <Form.Item
              name="recipientName"
              label="Recipient Name"
              rules={
                selectedStatus === 'delivered'
                  ? [{ required: true, message: 'Recipient name is required for delivered status' }]
                  : []
              }
            >
              <Input placeholder="Name of person who received the package" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={uploading}
                  disabled={selectedStatus === 'delivered' && !proofImageUrl}
                >
                  Update
                </Button>
                <Button
                  onClick={() => {
                    setIsUpdateModalVisible(false);
                    form.resetFields();
                    setSelectedStatus(null);
                    setFileList([]);
                    setProofImageUrl('');
                  }}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ShipperDashboard;
