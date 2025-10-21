import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Avatar,
  Typography,
  Space,
  message,
  Row,
  Col,
  Breadcrumb,
  Input,
  Select,
  Tag,
  Spin,
  Empty,
  Badge,
} from 'antd';
import {
  LikeOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  UserOutlined,
  TagOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import blogService from '../../../services/blogService';
import { useAuth } from '../../../contexts/AuthContext';
import './BlogFeedPage.css';

const { Title, Text, Paragraph } = Typography;

const BlogFeedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    tags: [],
    sortBy: 'publishedAt',
    order: 'desc',
  });
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const canCreate = !!user && user.role !== 'customer';

  const load = async (nextPage = 1, append = false) => {
    try {
      setLoading(true);
      const params = {
        status: 'published',
        page: nextPage,
        limit: 9,
        ...filters,
      };

      // Clean up empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || (Array.isArray(params[key]) && params[key].length === 0)) {
          delete params[key];
        }
      });

      const res = await blogService.list(params);
      const data = res.data || [];
      setItems(prev => (append ? [...prev, ...data] : data));
      setTotal(res.total || data.length);
      setPage(nextPage);
      setHasMore((res.total || 0) > (append ? items.length + data.length : data.length));
    } catch (e) {
      message.error(e.response?.data?.message || e.message || 'Failed to load blog feed');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await blogService.list({ status: 'published', limit: 1000 });
      const uniqueCategories = [...new Set(res.data?.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  };

  useEffect(() => {
    load(1, false);
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      category: '',
      tags: [],
      sortBy: 'publishedAt',
      order: 'desc',
    });
  };

  const handleView = async id => {
    try {
      await blogService.addView(id);
    } catch (_) {}
    navigate(`/blog/${id}`);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px' }}>
      {/* Header Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}
          >
            <div>
              <Title level={2} style={{ margin: 0, color: 'white', fontWeight: '700' }}>
                Kicks Shoes Community Blog
              </Title>
              <Text
                style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', marginTop: '8px' }}
              >
                Discover the latest trends, stories, and insights from our community
              </Text>
            </div>
            {canCreate && (
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate('/blog/create')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  backdropFilter: 'blur(10px)',
                }}
              >
                Create Post
              </Button>
            )}
          </div>

          <Breadcrumb
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            items={[
              {
                title: (
                  <a style={{ color: 'rgba(255, 255, 255, 0.8)' }} onClick={() => navigate('/')}>
                    Home
                  </a>
                ),
              },
              { title: <span style={{ color: 'white' }}>Blog</span> },
            ]}
          />
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card
        style={{
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: 'none',
          marginBottom: '32px',
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Input.Search
              placeholder="Search blog posts..."
              value={filters.q}
              onChange={e => handleFilterChange('q', e.target.value)}
              onSearch={() => load(1, false)}
              style={{ flex: 1, borderRadius: '12px' }}
              size="large"
              enterButton={<SearchOutlined />}
            />
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              type={showFilters ? 'primary' : 'default'}
              size="large"
              style={{
                borderRadius: '12px',
                background: showFilters
                  ? 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)'
                  : undefined,
                border: 'none',
              }}
            >
              Filters
            </Button>
          </div>

          {showFilters && (
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '16px',
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <div>
                    <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                      Category
                    </Text>
                    <Select
                      placeholder="Select category"
                      value={filters.category}
                      onChange={value => handleFilterChange('category', value)}
                      style={{ width: '100%' }}
                      allowClear
                      size="large"
                    >
                      {categories.map(cat => (
                        <Select.Option key={cat} value={cat}>
                          {cat}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div>
                    <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                      Sort by
                    </Text>
                    <Select
                      placeholder="Sort by"
                      value={filters.sortBy}
                      onChange={value => handleFilterChange('sortBy', value)}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Select.Option value="publishedAt">Published Date</Select.Option>
                      <Select.Option value="views">Views</Select.Option>
                      <Select.Option value="likes">Likes</Select.Option>
                      <Select.Option value="title">Title</Select.Option>
                    </Select>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div>
                    <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                      Order
                    </Text>
                    <Select
                      placeholder="Order"
                      value={filters.order}
                      onChange={value => handleFilterChange('order', value)}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Select.Option value="desc">Newest First</Select.Option>
                      <Select.Option value="asc">Oldest First</Select.Option>
                    </Select>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {(filters.q || filters.category || filters.tags.length > 0) && (
            <div
              style={{
                background: '#e3f2fd',
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: '16px',
              }}
            >
              <Text type="secondary" style={{ marginRight: '8px' }}>
                Active filters:
              </Text>
              {filters.q && (
                <Tag closable onClose={() => handleFilterChange('q', '')} color="blue">
                  Search: {filters.q}
                </Tag>
              )}
              {filters.category && (
                <Tag closable onClose={() => handleFilterChange('category', '')} color="green">
                  Category: {filters.category}
                </Tag>
              )}
              <Button type="link" size="small" onClick={clearFilters} style={{ marginLeft: '8px' }}>
                Clear all
              </Button>
            </div>
          )}
        </Space>
      </Card>

      {/* Loading State */}
      {loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', marginTop: '32px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">Loading blog posts...</Text>
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && !loading && (
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px 24px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            marginTop: '32px',
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4} style={{ marginBottom: '8px', color: '#666' }}>
                  No blog posts found
                </Title>
                <Text type="secondary">
                  {canCreate
                    ? 'Create your first blog post to get started!'
                    : 'Check back later for new content.'}
                </Text>
              </div>
            }
          >
            {canCreate && (
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate('/blog/create')}
                style={{
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(67, 97, 238, 0.4)',
                }}
              >
                Create First Post
              </Button>
            )}
          </Empty>
        </div>
      )}

      <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
        {items.map(post => (
          <Col key={post._id} xs={24} sm={12} lg={8} xl={6}>
            <Card
              hoverable
              className="blog-card"
              cover={
                post.thumbnail ? (
                  <div className="blog-thumbnail" style={{ position: 'relative' }}>
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      style={{
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '12px 12px 0 0',
                        width: '100%',
                      }}
                    />
                    {post.isFeatured && (
                      <Badge
                        count={<StarOutlined style={{ color: '#faad14' }} />}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '50%',
                          padding: '4px',
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    className="blog-thumbnail-placeholder"
                    style={{
                      height: '200px',
                      background: 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '12px 12px 0 0',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
                      {post.title?.charAt(0)?.toUpperCase() || 'B'}
                    </Text>
                  </div>
                )
              }
              onClick={() => handleView(post._id)}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: 'none',
              }}
              bodyStyle={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
              }}
            >
              <div style={{ flex: 1 }}>
                <Title
                  level={4}
                  style={{
                    marginBottom: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '1.4',
                    color: '#1a1a1a',
                  }}
                  ellipsis={{ rows: 2 }}
                >
                  {post.title}
                </Title>

                <Paragraph
                  ellipsis={{ rows: 3 }}
                  style={{
                    color: '#666',
                    marginBottom: '16px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  {post.summary || post.content?.replace(/<[^>]*>/g, '').substring(0, 120) + '...'}
                </Paragraph>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <Avatar
                    size="small"
                    src={post.author?.avatar}
                    icon={<UserOutlined />}
                    style={{ marginRight: '8px' }}
                  />
                  <Text type="secondary" style={{ fontSize: '13px', fontWeight: '500' }}>
                    {post.author?.fullName || post.author?.username || 'Admin'}
                  </Text>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <Space size="small">
                    <CalendarOutlined style={{ color: '#999', fontSize: '12px' }} />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </Space>

                  {post.category && (
                    <Tag color="blue" style={{ fontSize: '11px', margin: 0, borderRadius: '4px' }}>
                      {post.category}
                    </Tag>
                  )}
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Space size="large">
                    <Space size="small">
                      <EyeOutlined style={{ color: '#999', fontSize: '14px' }} />
                      <Text type="secondary" style={{ fontSize: '13px' }}>
                        {post.views || 0}
                      </Text>
                    </Space>
                    <Space size="small">
                      <LikeOutlined style={{ color: '#999', fontSize: '14px' }} />
                      <Text type="secondary" style={{ fontSize: '13px' }}>
                        {post.likes || 0}
                      </Text>
                    </Space>
                  </Space>

                  {post.tags && post.tags.length > 0 && (
                    <Space size="small">
                      {post.tags.slice(0, 1).map((tag, index) => (
                        <Tag
                          key={index}
                          color="geekblue"
                          style={{ fontSize: '10px', borderRadius: '4px' }}
                        >
                          <TagOutlined /> {tag}
                        </Tag>
                      ))}
                      {post.tags.length > 1 && (
                        <Tag style={{ fontSize: '10px', borderRadius: '4px' }}>
                          +{post.tags.length - 1}
                        </Tag>
                      )}
                    </Space>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Button
            loading={loading}
            onClick={() => load(page + 1, true)}
            size="large"
            style={{
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)',
              border: 'none',
              color: 'white',
              fontWeight: '600',
              padding: '12px 32px',
              height: 'auto',
              boxShadow: '0 4px 12px rgba(67, 97, 238, 0.4)',
            }}
          >
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlogFeedPage;
