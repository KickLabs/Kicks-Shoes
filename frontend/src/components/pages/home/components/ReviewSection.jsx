import "./ReviewSection.css";
import { reviewData } from "../../../../data/homepageData";
import { useEffect, useState } from "react";
import ReviewCard from "./ReviewCard";
import { Button } from "antd";
export const ReviewSection = () => {
  const [reviewList, setReviewList] = useState([]);
  useEffect(() => {
    setReviewList(reviewData);
  }, []);
  return (
    <>
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
    </>
  );
};
