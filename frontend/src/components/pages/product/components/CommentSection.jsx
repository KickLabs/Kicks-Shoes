import React, { useState, useEffect } from 'react';
import { Pagination, Button, Spin, Alert, Avatar, Modal, Progress, Tag, Divider } from 'antd';
import { FaStar } from 'react-icons/fa';
import { ThunderboltOutlined, SmileOutlined, MehOutlined, FrownOutlined } from '@ant-design/icons';
import axiosInstance from '@/services/axiosInstance';
import './CommentSection.css';

const CommentSection = ({ productId }) => {
  const [comments, setComments] = useState([]);
  const [filterRating, setFilterRating] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const pageSize = 5;

  // Fetch real feedbacks for this product
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    axiosInstance
      .get(`/feedback?product=${productId}`)
      .then(res => setComments(res.data.data || []))
      .catch(err => {
        console.error('Fetch comments error:', err);
        setError('Failed to load reviews');
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const filtered = filterRating ? comments.filter(c => c.rating === filterRating) : comments;

  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderStars = n =>
    Array.from({ length: n }).map((_, i) => (
      <FaStar key={i} style={{ color: '#fadb14', marginRight: 2 }} />
    ));

  // Handle AI Summary
  const handleAISummary = async () => {
    setSummaryModalVisible(true);
    setSummaryLoading(true);

    try {
      const response = await axiosInstance.get(`/feedback/product/${productId}/summary`);
      setSummaryData(response.data.data);
    } catch (err) {
      console.error('Error fetching AI summary:', err);
      Alert.error('Unable to generate review summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Render sentiment icon
  const getSentimentIcon = type => {
    if (type === 'positive') return <SmileOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
    if (type === 'neutral') return <MehOutlined style={{ color: '#faad14', fontSize: 20 }} />;
    if (type === 'negative') return <FrownOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
  };

  if (loading) return <Spin />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="comment-section">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0 }}>Product reviews</h3>
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleAISummary}
          disabled={comments.length === 0}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
          }}
        >
          AI Summary
        </Button>
      </div>

      <div className="comment-filter">
        <Button
          type={!filterRating ? 'default' : 'default'}
          onClick={() => {
            setFilterRating(null);
            setCurrentPage(1);
          }}
        >
          All
        </Button>
        {[5, 4, 3, 2, 1].map(star => (
          <Button
            key={star}
            type={filterRating === star ? 'default' : 'default'}
            onClick={() => {
              setFilterRating(star);
              setCurrentPage(1);
            }}
          >
            {star} star
          </Button>
        ))}
      </div>

      {paged.map(c => (
        <div key={c._id} className="comment-item">
          <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar src={c.user?.avatar} />
            <strong>{c.user?.fullName || 'Anonymous'}</strong>
            <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
          </div>
          <div className="comment-rating">{renderStars(c.rating)}</div>
          <p className="comment-content">{c.comment}</p>
          {c.images?.length > 0 && (
            <div className="comment-images">
              {c.images.map((url, i) => (
                <img key={i} src={url} alt={`Review ${i}`} />
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="pagination-wrapper">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filtered.length}
          onChange={page => setCurrentPage(page)}
          showSizeChanger={false}
        />
      </div>

      {/* AI Summary Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#667eea', fontSize: 20 }} />
            <span>AI Review Summary</span>
          </div>
        }
        open={summaryModalVisible}
        onCancel={() => setSummaryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setSummaryModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {summaryLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#666' }}>AI is analyzing reviews...</p>
          </div>
        ) : summaryData ? (
          <div>
            {/* Overview Stats */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#999' }}>Total Reviews</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {summaryData.totalReviews}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#999' }}>Average Rating</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fadb14' }}>
                    {Number(summaryData.averageRating).toFixed(1)}{' '}
                    <FaStar style={{ fontSize: 18, marginLeft: 4 }} />
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div style={{ marginTop: 16 }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = summaryData.ratingDistribution[star] || 0;
                  const percent =
                    summaryData.totalReviews > 0
                      ? Math.round((count / summaryData.totalReviews) * 100)
                      : 0;
                  return (
                    <div
                      key={star}
                      style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}
                    >
                      <span style={{ width: 60 }}>
                        {star} <FaStar style={{ fontSize: 12 }} />
                      </span>
                      <Progress
                        percent={percent}
                        showInfo={false}
                        strokeColor="#fadb14"
                        style={{ flex: 1 }}
                      />
                      <span style={{ width: 50, textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Divider />

            {/* AI Summary Text */}
            <div style={{ marginBottom: 24 }}>
              <h3>Overview Summary</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: '#333' }}>{summaryData.summary}</p>
            </div>

            {/* Sentiment Analysis */}
            {summaryData.sentiment && (
              <div style={{ marginBottom: 24 }}>
                <h3>Sentiment Analysis</h3>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    {getSentimentIcon('positive')}
                    <div style={{ marginTop: 8 }}>
                      <Progress
                        percent={summaryData.sentiment.positive}
                        strokeColor="#52c41a"
                        format={percent => `${percent}%`}
                      />
                      <div style={{ fontSize: 12, color: '#666' }}>Positive</div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {getSentimentIcon('neutral')}
                    <div style={{ marginTop: 8 }}>
                      <Progress
                        percent={summaryData.sentiment.neutral}
                        strokeColor="#faad14"
                        format={percent => `${percent}%`}
                      />
                      <div style={{ fontSize: 12, color: '#666' }}>Neutral</div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {getSentimentIcon('negative')}
                    <div style={{ marginTop: 8 }}>
                      <Progress
                        percent={summaryData.sentiment.negative}
                        strokeColor="#ff4d4f"
                        format={percent => `${percent}%`}
                      />
                      <div style={{ fontSize: 12, color: '#666' }}>Negative</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Divider />

            {/* Highlights */}
            {summaryData.highlights && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  {/* Pros */}
                  {summaryData.highlights.pros && summaryData.highlights.pros.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: '#52c41a' }}>✅ Pros</h4>
                      <ul style={{ paddingLeft: 20, margin: 0 }}>
                        {summaryData.highlights.pros.map((pro, index) => (
                          <li key={index} style={{ marginBottom: 8, color: '#333' }}>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cons */}
                  {summaryData.highlights.cons && summaryData.highlights.cons.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: '#ff4d4f' }}>⚠️ Cons</h4>
                      <ul style={{ paddingLeft: 20, margin: 0 }}>
                        {summaryData.highlights.cons.map((con, index) => (
                          <li key={index} style={{ marginBottom: 8, color: '#333' }}>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Topic Analysis */}
            {summaryData.topicAnalysis && Object.keys(summaryData.topicAnalysis).length > 0 && (
              <div>
                <Divider />
                <h3>Detailed Analysis</h3>
                {Object.entries(summaryData.topicAnalysis).map(([topic, data]) => {
                  if (data.mentions === 0) return null;
                  return (
                    <div key={topic} style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                          {topic === 'comfort' && ' Comfort'}
                          {topic === 'quality' && ' Quality'}
                          {topic === 'design' && ' Design'}
                          {topic === 'sizing' && ' Sizing'}
                          {topic === 'value' && ' Value'}
                        </span>
                        <Tag color={data.score >= 4 ? 'green' : data.score >= 3 ? 'orange' : 'red'}>
                          {data.score}/5 ({data.mentions} mentions)
                        </Tag>
                      </div>
                      <Progress
                        percent={(data.score / 5) * 100}
                        showInfo={false}
                        strokeColor={
                          data.score >= 4 ? '#52c41a' : data.score >= 3 ? '#faad14' : '#ff4d4f'
                        }
                      />
                      <p style={{ fontSize: 13, color: '#666', marginTop: 4, marginBottom: 0 }}>
                        {data.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer Note */}
            <div
              style={{
                marginTop: 24,
                padding: 12,
                background: '#f0f2f5',
                borderRadius: 8,
                fontSize: 12,
                color: '#666',
              }}
            >
              <ThunderboltOutlined style={{ marginRight: 4 }} />
              Summary generated by AI based on {summaryData.totalReviews} reviews. Last updated:{' '}
              {new Date(summaryData.lastUpdated).toLocaleString('en-US')}
            </div>
          </div>
        ) : (
          <Alert type="warning" message="Unable to load review summary" />
        )}
      </Modal>
    </div>
  );
};

export default CommentSection;
