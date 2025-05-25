import React from "react";
import "./ReviewCard.css";

const ReviewCard = ({ review }) => {
  return (
    <div className="review-card">
      <div className="review-top">
        <div className="review-text">
          <h3>{review.title}</h3>
          <p>{review.comment}</p>
          <div className="review-rating">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="star">★</span>
            ))}
            <span className="rating-number">{review.rating.toFixed(1)}</span>
          </div>
        </div>
        <img className="user-avatar" src={review.userImage} alt={review.userName} />
      </div>
      <img className="review-image" src={review.image} alt="product" />
    </div>
  );
};

export default ReviewCard;
