import React, { useState, useEffect } from 'react';
import { Pagination, Button, Spin, Alert, Avatar } from 'antd';
import { FaStar } from 'react-icons/fa';
import axiosInstance from '@/services/axiosInstance';
import './CommentSection.css';

const CommentSection = ({ productId }) => {
  const [comments, setComments] = useState([]);
  const [filterRating, setFilterRating] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  if (loading) return <Spin />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="comment-section">
      <h3>Product reviews</h3>

      <div className="comment-filter">
        <Button
          type={!filterRating ? 'primary' : 'default'}
          onClick={() => {
            setFilterRating(null);
            setCurrentPage(1);
          }}
        >
          Tất cả
        </Button>
        {[5, 4, 3, 2, 1].map(star => (
          <Button
            key={star}
            type={filterRating === star ? 'primary' : 'default'}
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
    </div>
  );
};

export default CommentSection;
