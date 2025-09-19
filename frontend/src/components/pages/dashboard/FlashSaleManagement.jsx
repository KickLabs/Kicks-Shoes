import React, { useState, useEffect } from 'react';
import './FlashSaleManagement.css';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  Divider,
  Tooltip,
    Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import {
  getFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  updateFlashSaleStatus,
  getFlashSaleStats,
  getProductsForFlashSale,
  getCategories,
} from '../../../services/flashSaleService';
import axiosInstance from '../../../services/axiosInstance';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function FlashSaleManagement() {
  const [flashSales, setFlashSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFlashSale, setEditingFlashSale] = useState(null);
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch data
  useEffect(() => {
    fetchFlashSales();
    fetchStats();
    fetchCategories();
  }, []);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await getFlashSales({ limit: 50 });
      setFlashSales(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error('Error loading flash sale list');
      setFlashSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getFlashSaleStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      console.log('Categories response:', response);
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = {
        search: productSearch,
        category: selectedCategory,
        limit: 100,
      };
      const response = await getProductsForFlashSale(params);
      console.log('Products response:', response);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Error loading product list');
      setProducts([]);
    }
  };

  useEffect(() => {
    if (productModalVisible) {
      fetchProducts();
    }
  }, [productModalVisible, productSearch, selectedCategory]);

  // Status configuration
  const statusConfig = {
    upcoming: { color: 'blue', icon: <ClockCircleOutlined />, text: 'Incoming' },
    active: { color: 'green', icon: <CheckCircleOutlined />, text: 'Active' },
    ended: { color: 'default', icon: <CloseCircleOutlined />, text: 'Ended' },
    cancelled: { color: 'red', icon: <ExclamationCircleOutlined />, text: 'Cancelled' },
  };

  // Table columns
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
        render: (text) => (
          <div style={{ fontWeight: 600 }}>{text}</div>
        ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text) => text ? (text.length > 50 ? `${text.substring(0, 50)}...` : text) : '-',
    },
    {
      title: 'Products',
      dataIndex: 'products',
      key: 'products',
      width: 100,
      render: (products) => (
        <Badge count={products?.length || 0} showZero color="blue">
          <ShoppingOutlined />
        </Badge>
      ),
    },
    {
      title: 'Time',
      key: 'time',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 12 }}>
            <strong>Start:</strong> {moment(record.startDate).format('DD/MM/YYYY HH:mm')}
          </div>
          <div style={{ fontSize: 12 }}>
            <strong>End:</strong> {moment(record.endDate).format('DD/MM/YYYY HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {record.status !== 'ended' && (
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {record.status !== 'active' && (
            <Popconfirm
              title="Are you sure you want to delete this flash sale?"
              onConfirm={() => handleDelete(record._id)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Handlers
  const handleCreate = () => {
    setEditingFlashSale(null);
      form.resetFields();
      setSelectedProducts([]);
      setModalVisible(true);
  };

  const handleEdit = (flashSale) => {
    setEditingFlashSale(flashSale);
    form.setFieldsValue({
      title: flashSale.title,
      description: flashSale.description,
      dateRange: [moment(flashSale.startDate), moment(flashSale.endDate)],
    });
    
    
    // Tính lại giá flash cho các sản phẩm đã có
    const productsWithCalculatedPrice = Array.isArray(flashSale.products) 
      ? flashSale.products.map(product => {
          const originalPrice = product.productId?.finalPrice || product.productId?.discountedPrice || 0;
          const discountPercent = product.discountPercent || 0;
          const calculatedPrice = Math.round(originalPrice * (1 - discountPercent / 100));
          return {
            productId: product.productId?._id || product.productId,
            discountPercent: product.discountPercent,
            flashPrice: calculatedPrice,
            productInfo: product.productId
          };
        })
      : [];
    
    setSelectedProducts(productsWithCalculatedPrice);
    setModalVisible(true);
  };

  const handleView = (flashSale) => {
    Modal.info({
      title: flashSale.title,
      width: 800,
      content: (
        <div>
          <p><strong>Description:</strong> {flashSale.description || 'No description'}</p>
          <p><strong>Time:</strong> {moment(flashSale.startDate).format('DD/MM/YYYY HH:mm')} - {moment(flashSale.endDate).format('DD/MM/YYYY HH:mm')}</p>
          <p><strong>Status:</strong> {statusConfig[flashSale.status].text}</p>
          {flashSale.products && flashSale.products.length > 0 && (
            <div>
              <strong>Products:</strong>
              <Table
                dataSource={flashSale.products || []}
                columns={[
                  { 
                    title: 'Image', 
                    dataIndex: 'productId', 
                    key: 'image',
                    width: 60,
                    render: (productId) => {
                      const image = productId?.mainImage || (productId?.images && productId.images.length > 0 ? productId.images[0] : null);
                      return image ? (
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={Array.isArray(image) ? image[0] : image} 
                            alt="Product" 
                            style={{ 
                              width: 40, 
                              height: 40, 
                              objectFit: 'cover',
                              borderRadius: 4
                            }} 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div style={{
                            width: 40,
                            height: 40,
                            backgroundColor: '#f0f0f0',
                            borderRadius: 4,
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            color: '#999',
                            position: 'absolute',
                            top: 0,
                            left: 0
                          }}>
                            No Image
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          width: 40,
                          height: 40,
                          backgroundColor: '#f0f0f0',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          color: '#999'
                        }}>
                          No Image
                        </div>
                      );
                    }
                  },
                  { 
                    title: 'Product Name', 
                    dataIndex: ['productId', 'name'], 
                    key: 'name',
                    render: (text) => (
                      <div style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {text}
                      </div>
                    )
                  },
                  { 
                    title: 'Original Price', 
                    dataIndex: ['productId', 'finalPrice'], 
                    key: 'finalPrice', 
                    render: (price) => (
                      <span style={{ fontWeight: 500, color: '#666' }}>
                        {price?.toLocaleString()}đ
                      </span>
                    )
                  },
                  { 
                    title: 'Discount (%)', 
                    dataIndex: 'discountPercent', 
                    key: 'discountPercent', 
                    render: (percent) => percent ? (
                      <span style={{ color: '#52c41a', fontWeight: 500 }}>
                        {percent}%
                      </span>
                    ) : '-'
                  },
                  { 
                    title: 'Flash Price', 
                    dataIndex: 'flashPrice', 
                    key: 'flashPrice', 
                    render: (price) => price ? (
                      <span style={{ color: '#ff4757', fontWeight: 600 }}>
                        {price.toLocaleString()}đ
                      </span>
                    ) : '-'
                  },
                ]}
                pagination={false}
                size="small"
              />
            </div>
          )}
        </div>
      ),
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteFlashSale(id);
      message.success('Flash sale deleted successfully');
      fetchFlashSales();
      fetchStats();
    } catch (error) {
      message.error('Error deleting flash sale');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateFlashSaleStatus(id, status);
      message.success('Status updated successfully');
      fetchFlashSales();
      fetchStats();
    } catch (error) {
      message.error('Error updating status');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (!selectedProducts || selectedProducts.length === 0) {
        message.error('Vui lòng chọn ít nhất một sản phẩm');
        return;
      }

      // Kiểm tra sản phẩm trùng lặp
      const productIds = selectedProducts.map(p => p.productId);
      const uniqueProductIds = [...new Set(productIds)];
      if (productIds.length !== uniqueProductIds.length) {
        message.error('Không được có sản phẩm trùng lặp trong flash sale');
        return;
      }

      // Tính lại giá flash cho tất cả sản phẩm trước khi gửi
      const productsWithCalculatedPrice = selectedProducts.map(product => {
        const originalPrice = product.productInfo?.finalPrice || product.productInfo?.discountedPrice || 0;
        const discountPercent = product.discountPercent || 0;
        const calculatedPrice = Math.round(originalPrice * (1 - discountPercent / 100));
              return {
                productId: typeof product.productId === 'object' ? product.productId._id : product.productId,
                discountPercent: product.discountPercent,
                flashPrice: calculatedPrice
              };
      });

      const flashSaleData = {
        title: values.title,
        description: values.description,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
        products: productsWithCalculatedPrice,
      };

      if (editingFlashSale) {
        await updateFlashSale(editingFlashSale._id, flashSaleData);
        message.success('Flash sale updated successfully');
      } else {
        await createFlashSale(flashSaleData);
        message.success('Flash sale created successfully');
      }

      setModalVisible(false);
      fetchFlashSales();
      fetchStats();
    } catch (error) {
      message.error(editingFlashSale ? 'Error updating flash sale' : 'Error creating flash sale');
    }
  };

  const handleAddProducts = () => {
    setProductModalVisible(true);
  };

  const handleProductSelect = (product) => {
    const currentProducts = selectedProducts || [];
    const existingProduct = currentProducts.find(p => p.productId === product._id);
    
    if (existingProduct) {
      message.warning('Sản phẩm này đã được thêm vào flash sale');
      return;
    }
    
    const discountPercent = 0;
    const calculatedPrice = Math.round(product.finalPrice * (1 - discountPercent / 100));
    
    setSelectedProducts([...currentProducts, {
      productId: product._id,
      discountPercent: discountPercent,
      flashPrice: calculatedPrice,
      productInfo: product,
    }]);
    
    message.success('Đã thêm sản phẩm vào flash sale');
  };

  const handleProductRemove = (productId) => {
    const currentProducts = selectedProducts || [];
    setSelectedProducts(currentProducts.filter(p => p.productId !== productId));
  };

  const handleProductUpdate = (productId, field, value) => {
    const currentProducts = selectedProducts || [];
    setSelectedProducts(currentProducts.map(p => {
      if (p.productId === productId) {
        const updatedProduct = { ...p, [field]: value };
        
        // Tự động tính lại giá flash khi thay đổi phần trăm giảm giá
        if (field === 'discountPercent') {
          const originalPrice = p.productInfo?.finalPrice || p.productInfo?.discountedPrice || 0;
          const discountPercent = value || 0;
          const calculatedPrice = Math.round(originalPrice * (1 - discountPercent / 100));
          updatedProduct.flashPrice = calculatedPrice;
        }
        
        return updatedProduct;
      }
      return p;
    }));
  };


  return (
    <div className="flash-sale-management">
      {/* Statistics Cards */}
      {stats && (
        <Row gutter={[16, 16]} className="flash-sale-stats">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total"
                value={stats.overview?.total || 0}
                prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active"
                value={stats.overview?.active || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Upcoming"
                value={stats.overview?.upcoming || 0}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Ended"
                value={stats.overview?.ended || 0}
                prefix={<CloseCircleOutlined style={{ color: '#8c8c8c' }} />}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Table */}
      <Card
        title="Flash Sale Management"
        className="flash-sale-table"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} className="flash-sale-btn-primary">
            Create Flash Sale
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={flashSales || []}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} flash sale`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingFlashSale ? 'Edit Flash Sale' : 'Create New Flash Sale'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="Enter flash sale title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter flash sale description" />
          </Form.Item>


          <Form.Item
            name="dateRange"
            label="Time"
            rules={[{ required: true, message: 'Please select time' }]}
          >
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Products">
            <Button onClick={handleAddProducts} style={{ marginBottom: 16 }}>
              Add Products
            </Button>
            
            {selectedProducts && selectedProducts.length > 0 && (
              <Table
                dataSource={selectedProducts || []}
                columns={[
                  { 
                    title: 'Image', 
                    dataIndex: 'productInfo', 
                    key: 'image',
                    width: 60,
                    render: (productInfo) => {
                      const image = productInfo?.mainImage || (productInfo?.images && productInfo.images.length > 0 ? productInfo.images[0] : null);
                      return image ? (
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={Array.isArray(image) ? image[0] : image} 
                            alt="Product" 
                            style={{ 
                              width: 40, 
                              height: 40, 
                              objectFit: 'cover',
                              borderRadius: 4
                            }} 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div style={{
                            width: 40,
                            height: 40,
                            backgroundColor: '#f0f0f0',
                            borderRadius: 4,
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            color: '#999',
                            position: 'absolute',
                            top: 0,
                            left: 0
                          }}>
                            No Image
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          width: 40,
                          height: 40,
                          backgroundColor: '#f0f0f0',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          color: '#999'
                        }}>
                          No Image
                        </div>
                      );
                    }
                  },
                  { 
                    title: 'Product Name', 
                    dataIndex: ['productInfo', 'name'], 
                    key: 'name',
                    render: (text) => (
                      <div style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {text}
                      </div>
                    )
                  },
                  { 
                    title: 'Original Price', 
                    dataIndex: ['productInfo', 'finalPrice'], 
                    key: 'finalPrice', 
                    render: (price, record) => {
                      const originalPrice = record.productInfo?.finalPrice || record.productInfo?.discountedPrice || 0;
                      return originalPrice ? (
                        <span style={{ fontWeight: 500, color: '#666' }}>
                          {originalPrice.toLocaleString()}đ
                        </span>
                      ) : '-';
                    }
                  },
                  {
                    title: 'Discount (%)',
                    dataIndex: 'discountPercent',
                    key: 'discountPercent',
                    render: (value, record) => (
                      <InputNumber
                        min={0}
                        max={100}
                        value={value}
                        onChange={(val) => handleProductUpdate(record.productId, 'discountPercent', val)}
                        style={{ width: 80 }}
                      />
                    ),
                  },
        {
          title: 'Flash Price',
          dataIndex: 'flashPrice',
          key: 'flashPrice',
          render: (value, record) => {
            const originalPrice = record.productInfo?.finalPrice || record.productInfo?.discountedPrice || 0;
            const discountPercent = record.discountPercent || 0;
            const calculatedPrice = Math.round(originalPrice * (1 - discountPercent / 100));
            return (
              <span style={{ fontWeight: 600, color: '#52c41a' }}>
                {calculatedPrice.toLocaleString()}đ
              </span>
            );
          },
        },
                  {
                    title: 'Actions',
                    key: 'action',
                    render: (_, record) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleProductRemove(record.productId)}
                      />
                    ),
                  },
                ]}
                pagination={false}
                size="small"
              />
            )}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingFlashSale ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        title="Select Products"
        open={productModalVisible}
        onCancel={() => setProductModalVisible(false)}
        footer={null}
        width={1000}
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={12}>
              <Select
                placeholder="Select category"
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: '100%' }}
                allowClear
              >
                {categories.map(category => (
                  <Option key={category._id} value={category._id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>

        <Table
          dataSource={products || []}
          columns={[
            { 
              title: 'Image', 
              dataIndex: 'mainImage', 
              key: 'image',
              width: 80,
              render: (image) => {
                const imageUrl = Array.isArray(image) ? image[0] : image;
                return imageUrl ? (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={imageUrl} 
                      alt="Product" 
                      style={{ 
                        width: 50, 
                        height: 50, 
                        objectFit: 'cover',
                        borderRadius: 4
                      }} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div style={{
                      width: 50,
                      height: 50,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 4,
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: '#999',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}>
                      No Image
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: 50,
                    height: 50,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: '#999'
                  }}>
                    No Image
                  </div>
                );
              }
            },
            { 
              title: 'Product Name', 
              dataIndex: 'name', 
              key: 'name',
              render: (text) => (
                <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {text}
                </div>
              )
            },
            { 
              title: 'Price', 
              dataIndex: 'finalPrice', 
              key: 'finalPrice', 
              render: (price) => (
                <span style={{ fontWeight: 600, color: '#1890ff' }}>
                  {price?.toLocaleString()}đ
                </span>
              )
            },
            { 
              title: 'Category', 
              dataIndex: ['category', 'name'], 
              key: 'category',
              render: (category) => (
                <span style={{ 
                  background: '#f0f0f0', 
                  padding: '2px 8px', 
                  borderRadius: 4,
                  fontSize: 12
                }}>
                  {category}
                </span>
              )
            },
            {
              title: 'Actions',
              key: 'action',
              width: 100,
              render: (_, record) => (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleProductSelect(record)}
                  disabled={selectedProducts?.some(p => p.productId === record._id) || false}
                >
                  {selectedProducts?.some(p => p.productId === record._id) ? 'Selected' : 'Select'}
                </Button>
              ),
            },
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="_id"
        />
      </Modal>
    </div>
  );
}
