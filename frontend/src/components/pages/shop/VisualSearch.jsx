import { CameraOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  List,
  message,
  Row,
  Spin,
  Tag,
  Typography,
  Upload,
} from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

const formatPrice = price => {
  if (price === null || price === undefined) return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const SearchResults = ({ results }) => {
  if (!results) return null;
  return (
    <div>
      <Alert
        type="info"
        showIcon
        message="AI đã phân tích hình ảnh của bạn"
        description={
          <div>
            <Text strong>Từ khóa chính: </Text>
            <Tag color="geekblue">{results.analyzedKeywords.category || 'N/A'}</Tag>
            <Tag color="blue">{results.analyzedKeywords.product_name || 'N/A'}</Tag>
            <Text strong>Thương hiệu: </Text>
            <Tag color="purple">{results.analyzedKeywords.brand || 'N/A'}</Tag>
            <Text strong>Đặc điểm: </Text>
            {results.analyzedKeywords.features?.map(f => (
              <Tag key={f}>{f}</Tag>
            ))}
          </div>
        }
        style={{ marginBottom: '24px' }}
      />
      {results.products.length > 0 ? (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
          dataSource={results.products}
          renderItem={item => (
            <List.Item>
              <Card
                hoverable
                cover={
                  <img
                    alt={item.name}
                    src={item.mainImage || '/placeholder.svg'}
                    style={{ height: 200, objectFit: 'cover' }}
                  />
                }
              >
                <Card.Meta
                  title={item.name}
                  description={
                    <Text strong style={{ color: '#1890ff' }}>
                      {formatPrice(item.finalPrice)}
                    </Text>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Rất tiếc, chúng tôi không tìm thấy sản phẩm nào phù hợp với hình ảnh của bạn." />
      )}
    </div>
  );
};

const VisualSearch = () => {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.searchResults) {
      setSearchResults(location.state.searchResults);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleSearch = async () => {
    if (!file) {
      message.error('Please select an image to search.');
      return;
    }
    setLoading(true);
    setError('');
    setSearchResults(null);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post('/api/products/visual-search', formData);
      if (response.data.success) {
        setSearchResults(response.data.data);
        message.success('Search complete!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'The search could not be performed.';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const draggerProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: file => {
      setFile(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => setPreviewImage(reader.result);
      return false;
    },
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '80vh' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Search Products by Image
      </Title>
      {!searchResults && (
        <Row justify="center" gutter={[24, 24]}>
          <Col xs={24} md={12} lg={8}>
            <Card title="Upload Your Photos" bordered={false}>
              <Dragger {...draggerProps}>
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: '250px', objectFit: 'contain' }}
                  />
                ) : (
                  <>
                    <p className="ant-upload-drag-icon">
                      <CameraOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag and drop files here</p>
                    <p className="ant-upload-hint">Support PNG, JPG, WEBP (Max 5MB).</p>
                  </>
                )}
              </Dragger>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={loading}
                onClick={handleSearch}
                disabled={!file}
                block
                size="large"
                style={{ marginTop: '16px' }}
              >
                {loading ? 'Analyzing...' : 'Search'}
              </Button>
            </Card>
          </Col>
        </Row>
      )}
      <Row justify="center" style={{ marginTop: '24px' }}>
        <Col xs={24} md={20} lg={16}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
              <Paragraph style={{ marginTop: '16px' }}>AI is analyzing your images...</Paragraph>
            </div>
          )}
          {error && !loading && (
            <Alert message="Search Error" description={error} type="error" showIcon />
          )}
          {!loading && searchResults && <SearchResults results={searchResults} />}
        </Col>
      </Row>
    </div>
  );
};

export default VisualSearch;
