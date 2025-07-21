// import './ReviewSection.css';
// import { reviewData } from '../../../../data/homepageData';
// import { useEffect, useState } from 'react';
// import ReviewCard from './ReviewCard';
// import { Button } from 'antd';
// import axios from "axios";
// export const ReviewSection = () => {
//   const [reviewList, setReviewList] = useState([]);

//   useEffect(() => {
//     const fetchReviews = async () => {
//       try {
//         const response = await axios.get('/api/feedback'); // Đảm bảo đường dẫn API đúng
//         const reviews = response.data.data;

//         const filteredReviews = reviews
//           .filter(review => review.images && review.images.length > 0) // Lọc các review có hình ảnh
//           .sort((a, b) => b.rating - a.rating); // Sắp xếp theo rating giảm dần

//         // Chỉ lấy 3 review đầu tiên
//         setReviewList(filteredReviews.slice(0, 3));
//       } catch (error) {
//         console.error('Lỗi khi lấy dữ liệu:', error);
//       }
//     };

//     fetchReviews();
//   }, []);

//   return (
//     <>
//       <div className="review-wrapper">
//         <div className="review-header">
//           <h4>Review</h4>
//           <Button>Seclect all</Button>
//         </div>
//         <div className="review-list">
//           {reviewList.map((review, index) => (
//             <ReviewCard key={index} review={review} />
//           ))}
//         </div>
//       </div>
//     </>
//   );
// };
import './ReviewSection.css';
import { useEffect, useState } from 'react';
import axios from 'axios'; // Đảm bảo đã cài axios: npm install axios
import ReviewCard from './ReviewCard';
import { Button } from 'antd';

export const ReviewSection = () => {
  const [reviewList, setReviewList] = useState([]);

  useEffect(() => {
    // Gọi API để lấy danh sách feedback từ server
    const fetchReviews = async () => {
      try {
        const response = await axios.get('/api/feedback'); // Đảm bảo đường dẫn API đúng
        const reviews = response.data.data;

        // Lọc và sắp xếp các review có hình ảnh và sao cao
        const filteredReviews = reviews
          .filter(review => review.images && review.images.length > 0) // Lọc các review có hình ảnh
          .sort((a, b) => b.rating - a.rating); // Sắp xếp theo rating giảm dần

        // Chỉ lấy 3 review đầu tiên
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
