import React from 'react';
import { Avatar } from 'antd';
import { FaStar } from 'react-icons/fa';
import './ReviewCard.css';

const ReviewCard = ({ review }) => {
  if (!review.images || review.images.length === 0) {
    return null;
  }

  const renderStars = n =>
    Array.from({ length: n }).map((_, i) => (
      <FaStar key={i} style={{ color: '#fadb14', marginRight: 2 }} />
    ));

  return (
    <div className="review-card">
      <div className="review-top" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar src={review.user?.avatar || 'default-avatar-url'} />
        <strong>{review.user?.fullName || 'Anonymous'}</strong>
      </div>

      <div className="review-rating">
        {renderStars(review.rating)}
        <span className="rating-number">{review.rating.toFixed(1)}</span>
      </div>

      <p className="review-content">{review.comment}</p>

      {review.images.length > 0 && (
        <div className="review-image">
          <img src={review.images[0]} alt="Review Image" />
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
