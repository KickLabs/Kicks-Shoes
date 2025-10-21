import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Avatar,
  Typography,
  Space,
  Tag,
  Button,
  Input,
  message,
  Modal,
  Divider,
  Row,
  Col,
  Breadcrumb,
  Spin,
  Empty,
  Badge,
} from 'antd';
import {
  LikeOutlined,
  EyeOutlined,
  SendOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  TagOutlined,
  StarOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import blogService from '../../../services/blogService';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Paragraph, Text } = Typography;

const BlogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [backHoverTop, setBackHoverTop] = useState(false);
  const [backHoverBottom, setBackHoverBottom] = useState(false);

  const canInteract = !!user;
  const isOwner = !!user && (user._id === post?.author?._id || user.id === post?.author?._id);
  const hasLiked =
    !!user &&
    Array.isArray(post?.likedBy) &&
    post.likedBy.some(u => String(u) === String(user._id || user.id));

  const load = async () => {
    try {
      setLoading(true);
      const [postRes, commentsRes] = await Promise.all([
        blogService.get(id),
        blogService.listComments(id, { limit: 20 }),
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data || []);
    } catch (e) {
      message.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    blogService.addView(id).catch(() => {});
  }, [id]);

  const handleLike = async like => {
    if (!canInteract) return message.info('Please login to like the post');
    if (liking) return; // Prevent double clicks

    setLiking(true);
    try {
      await blogService.setLike(post._id, like);

      // Update local state instead of reloading (and maintain likedBy)
      setPost(prevPost => {
        const userId = user._id || user.id;
        const likedBy = Array.isArray(prevPost.likedBy) ? [...prevPost.likedBy] : [];
        const already = likedBy.some(u => String(u) === String(userId));
        if (like) {
          if (!already) likedBy.push(userId);
          return { ...prevPost, likes: (prevPost.likes || 0) + (already ? 0 : 1), likedBy };
        }
        // unlike
        if (already) {
          const nextLikedBy = likedBy.filter(u => String(u) !== String(userId));
          return {
            ...prevPost,
            likes: Math.max((prevPost.likes || 0) - 1, 0),
            likedBy: nextLikedBy,
          };
        }
        return prevPost;
      });
    } catch (e) {
      message.error('Failed to react');
    } finally {
      setLiking(false);
    }
  };

  const submitComment = async () => {
    if (!canInteract) return message.info('Please login to comment');
    if (!comment.trim()) return;
    if (commenting) return; // Prevent double submissions

    const commentContent = comment.trim();
    setComment(''); // Clear input immediately for better UX
    setCommenting(true);

    try {
      const response = await blogService.createComment({ blog: post._id, content: commentContent });

      // Add new comment to local state instead of reloading
      const newComment = {
        _id: response.data._id,
        content: commentContent,
        user: {
          _id: user._id,
          fullName: user.fullName || user.username,
          username: user.username,
          avatar: user.avatar,
        },
        createdAt: new Date().toISOString(),
        blog: post._id,
      };

      setComments(prevComments => [newComment, ...prevComments]);

      // Update comment count in post
      setPost(prevPost => ({
        ...prevPost,
        commentsCount: (prevPost.commentsCount || 0) + 1,
      }));
    } catch (e) {
      message.error('Failed to comment');
      setComment(commentContent); // Restore comment if failed
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text type="secondary">Loading blog post...</Text>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px' }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Blog post not found">
          <Button type="primary" onClick={() => navigate('/blog')}>
            Back to Blog
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/blog')}
          onMouseEnter={() => setBackHoverTop(true)}
          onMouseLeave={() => setBackHoverTop(false)}
          style={{
            borderRadius: '8px',
            border: backHoverTop ? '1px solid #b3b3b3' : '1px solid #d9d9d9',
            background: backHoverTop ? '#eef2f6' : 'white',
            boxShadow: backHoverTop ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
            transition: 'all .2s ease',
            color: backHoverTop ? '#0f172a' : '#1f2937',
            fontWeight: 500,
            height: 40,
          }}
        >
          Back to Blog
        </Button>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb
        style={{ marginBottom: '24px' }}
        items={[
          { title: <a onClick={() => navigate('/')}>Home</a> },
          { title: <a onClick={() => navigate('/blog')}>Blog</a> },
          { title: post.title },
        ]}
      />

      {/* Main Content */}
      <Row gutter={[32, 32]}>
        <Col xs={24} lg={16}>
          {/* Blog Post */}
          <Card
            style={{
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: 'none',
              marginBottom: '32px',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}
              >
                <Title level={1} style={{ margin: 0, fontWeight: '700', lineHeight: '1.3' }}>
                  {post.title}
                </Title>
                {isOwner && (
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => setShowEdit(true)}
                    style={{
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)',
                      border: 'none',
                      color: 'white',
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>

              {/* Author Info */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}
              >
                <Avatar
                  src={post.author?.avatar}
                  size={48}
                  icon={<UserOutlined />}
                  style={{ background: 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                    {post.author?.fullName || post.author?.username || 'Author'}
                  </div>
                  <Space size="small">
                    <CalendarOutlined style={{ color: '#999' }} />
                    <Text type="secondary">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </Space>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {post.category && (
                    <Tag color="blue" style={{ borderRadius: '6px', fontWeight: '500' }}>
                      {post.category}
                    </Tag>
                  )}
                  {post.isFeatured && (
                    <Badge
                      count={<StarOutlined style={{ color: '#faad14' }} />}
                      style={{
                        backgroundColor: 'rgba(250, 173, 20, 0.1)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                      }}
                    >
                      <Tag color="gold" style={{ borderRadius: '6px', fontWeight: '500' }}>
                        Featured
                      </Tag>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <Space size="small">
                  <EyeOutlined style={{ color: '#999' }} />
                  <Text type="secondary">{post.views || 0} views</Text>
                </Space>
                <Space size="small">
                  <LikeOutlined style={{ color: '#999' }} />
                  <Text type="secondary">{post.likes || 0} likes</Text>
                </Space>
                <Space size="small">
                  <TagOutlined style={{ color: '#999' }} />
                  <Text type="secondary">{post.commentsCount || comments.length} comments</Text>
                </Space>
              </div>
            </div>

            {/* Banner Image */}
            {post.banner && (
              <div style={{ marginBottom: '32px' }}>
                <img
                  src={post.banner}
                  alt={post.title}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    maxHeight: '400px',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div
              style={{
                fontSize: '16px',
                lineHeight: '1.7',
                color: '#1a1a1a',
                marginBottom: '32px',
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ marginRight: '12px' }}>
                  Tags:
                </Text>
                <Space wrap>
                  {post.tags.map((tag, index) => (
                    <Tag key={index} color="geekblue" style={{ borderRadius: '6px' }}>
                      <TagOutlined /> {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* Actions */}
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <Tooltip title={hasLiked ? 'Click to unlike' : 'Click to like'}>
                <Button
                  type={hasLiked ? 'default' : 'primary'}
                  icon={<LikeOutlined />}
                  onClick={() => handleLike(!hasLiked)}
                  disabled={!canInteract || liking}
                  loading={liking}
                  style={{
                    borderRadius: '8px',
                    background: hasLiked
                      ? '#f3f4f6'
                      : 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)',
                    border: hasLiked ? '1px solid #d1d5db' : 'none',
                    fontWeight: '600',
                    color: hasLiked ? '#374151' : '#fff',
                    boxShadow: hasLiked
                      ? '0 1px 3px rgba(0,0,0,0.1)'
                      : '0 4px 12px rgba(67, 97, 238, 0.3)',
                  }}
                >
                  {hasLiked ? '✓ Liked' : 'Like'} ({post.likes || 0})
                </Button>
              </Tooltip>
              <Button
                onClick={() => navigate('/blog')}
                onMouseEnter={() => setBackHoverBottom(true)}
                onMouseLeave={() => setBackHoverBottom(false)}
                style={{
                  borderRadius: '8px',
                  border: backHoverBottom ? '1px solid #b3b3b3' : '1px solid #d9d9d9',
                  background: backHoverBottom ? '#eef2f6' : 'white',
                  boxShadow: backHoverBottom ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all .2s ease',
                  color: backHoverBottom ? '#0f172a' : '#1f2937',
                  fontWeight: 500,
                }}
              >
                Back to Blog
              </Button>
            </div>
          </Card>

          {/* Comments Section */}
          <Card
            style={{
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: 'none',
            }}
          >
            <Title level={4} style={{ marginBottom: '24px', fontWeight: '600' }}>
              Comments ({comments.length})
            </Title>

            {canInteract ? (
              <div
                style={{
                  marginBottom: '24px',
                  background: '#f8f9fa',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid #e9ecef',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#1a1a1a' }}>
                    Write a comment
                  </Text>
                </div>

                <div style={{ position: 'relative' }}>
                  <Input.TextArea
                    placeholder="Share your thoughts..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{
                      borderRadius: '12px',
                      borderColor: '#d9d9d9',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      padding: '12px 16px',
                      background: 'white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '12px',
                      gap: '8px',
                    }}
                  >
                    <Button
                      onClick={() => setComment('')}
                      disabled={!comment.trim()}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #d9d9d9',
                        background: 'white',
                        color: '#666',
                        fontWeight: '500',
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={submitComment}
                      loading={commenting}
                      disabled={commenting || !comment.trim()}
                      style={{
                        borderRadius: '8px',
                        background:
                          commenting || !comment.trim()
                            ? '#d1d5db'
                            : 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)',
                        border: 'none',
                        fontWeight: '600',
                        padding: '6px 20px',
                        height: 'auto',
                        boxShadow:
                          commenting || !comment.trim()
                            ? 'none'
                            : '0 4px 12px rgba(67, 97, 238, 0.3)',
                        color: commenting || !comment.trim() ? '#9ca3af' : '#fff',
                        cursor: commenting || !comment.trim() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {commenting ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '24px',
                  border: '1px solid #e9ecef',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <Text style={{ fontSize: '16px', color: '#666', fontWeight: '500' }}>
                    💬 Join the conversation
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Please login to share your thoughts and engage with the community
                </Text>
              </div>
            )}

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Text type="secondary">No comments yet. Be the first to comment!</Text>
                </div>
              ) : (
                comments.map(c => (
                  <div
                    key={c._id}
                    style={{
                      marginBottom: '16px',
                      padding: '16px',
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      border: '1px solid #e9ecef',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px',
                      }}
                    >
                      <Avatar
                        src={c.user?.avatar}
                        size={32}
                        icon={<UserOutlined />}
                        style={{ background: 'linear-gradient(135deg, #4361ee 0%, #0077cc 100%)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: '14px' }}>
                          {c.user?.fullName || c.user?.username || 'User'}
                        </Text>
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {new Date(c.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </div>
                      </div>
                    </div>
                    <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>{c.content}</Text>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Sidebar */}
          <Card
            style={{
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: 'none',
              position: 'sticky',
              top: '24px',
            }}
          >
            <Title level={4} style={{ marginBottom: '16px' }}>
              Post Info
            </Title>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>Published:</Text>
                <br />
                <Text type="secondary">
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </div>
              <div>
                <Text strong>Views:</Text>
                <br />
                <Text type="secondary">{post.views || 0}</Text>
              </div>
              <div>
                <Text strong>Likes:</Text>
                <br />
                <Text type="secondary">{post.likes || 0}</Text>
              </div>
              <div>
                <Text strong>Comments:</Text>
                <br />
                <Text type="secondary">{post.commentsCount || comments.length}</Text>
              </div>
              {post.category && (
                <div>
                  <Text strong>Category:</Text>
                  <br />
                  <Tag color="blue">{post.category}</Tag>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        open={showEdit}
        title="Edit Blog Post"
        onCancel={() => setShowEdit(false)}
        onOk={() => {
          setShowEdit(false);
          navigate(`/blog/edit/${post._id}`);
        }}
        okText="Open Composer"
        cancelText="Cancel"
        style={{ borderRadius: '12px' }}
      >
        <Text type="secondary">This will open the blog composer to edit this post.</Text>
      </Modal>
    </div>
  );
};

export default BlogDetailPage;
