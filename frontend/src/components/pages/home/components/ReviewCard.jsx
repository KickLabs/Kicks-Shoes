import React from 'react';
import { Avatar } from 'antd'; // Sử dụng Avatar từ Ant Design
import { FaStar } from 'react-icons/fa';
import './ReviewCard.css';

const ReviewCard = ({ review }) => {
  // Kiểm tra nếu review không có hình ảnh
  if (!review.images || review.images.length === 0) {
    return null;
  }

  // Render các sao
  const renderStars = n =>
    Array.from({ length: n }).map((_, i) => (
      <FaStar key={i} style={{ color: '#fadb14', marginRight: 2 }} />
    ));

  return (
    <div className="review-card">
      <div className="review-top" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Hiển thị Avatar */}
        <Avatar src={review.user?.avatar || 'default-avatar-url'} />
        <strong>{review.user?.fullName || 'Anonymous'}</strong>
      </div>

      {/* Hiển thị rating */}
      <div className="review-rating">
        {renderStars(review.rating)}
        <span className="rating-number">{review.rating.toFixed(1)}</span>
      </div>

      {/* Hiển thị nội dung comment */}
      <p className="review-content">{review.comment}</p>

      {/* Hiển thị các hình ảnh của feedback */}
      {review.images && review.images.length > 0 && (
        <div className="review-images">
          {review.images.map((image, index) => (
            <img key={index} src={image} alt={`Feedback Image ${index}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
