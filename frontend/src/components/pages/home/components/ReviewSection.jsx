import './ReviewSection.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ReviewCard from './ReviewCard';
import { Button } from 'antd';

export const ReviewSection = () => {
  const [reviewList, setReviewList] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get('/api/feedback');
        const reviews = response.data.data;

        const filteredReviews = reviews
          .filter(review => review.images && review.images.length > 0)
          .sort((a, b) => b.rating - a.rating);

        setReviewList(filteredReviews.slice(0, 3));
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="review-wrapper">
      <div className="review-header">
        <h4>Review</h4>
        <Button>Seclect all</Button>
      </div>
      <div className="review-list">
        {reviewList.map((review, index) => (
          <ReviewCard key={index} review={review} />
        ))}
      </div>
    </div>
  );
};
