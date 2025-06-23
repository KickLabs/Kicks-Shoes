import React, { useState } from 'react';
import { Pagination, Button } from 'antd';
import { FaStar } from 'react-icons/fa';
import './CommentSection.css';

const generateFakeComments = (count = 30) => {
  const names = ['Minh', 'An', 'Huy', 'Trang', 'Linh', 'Nam', 'Hoa', 'Tú'];
  const comments = [
    'Sản phẩm rất đẹp, chất lượng tuyệt vời!',
    'Đóng gói cẩn thận, giao hàng nhanh.',
    'Giá cả hợp lý, sẽ ủng hộ tiếp.',
    'Hơi chật một chút nhưng vẫn ổn.',
    'Màu sắc giống hình, rất ưng ý.',
  ];
  const sampleImages = [
    'https://picsum.photos/seed/1/120',
    'https://picsum.photos/seed/2/120',
    'https://picsum.photos/seed/3/120',
    'https://picsum.photos/seed/4/120',
    'https://picsum.photos/seed/5/120',
  ];

  return Array.from({ length: count }).map(() => {
    const name = names[Math.floor(Math.random() * names.length)];
    const content = comments[Math.floor(Math.random() * comments.length)];
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const time = new Date(
      Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)
    ).toLocaleString();
    const rating = Math.floor(Math.random() * 5) + 1;
    const imageCount = Math.floor(Math.random() * 4); // 0–3 images
    const images = Array.from({ length: imageCount }).map(
      () => sampleImages[Math.floor(Math.random() * sampleImages.length)]
    );

    return { name, content, hash, time, images, rating };
  });
};

const CommentSection = () => {
  const allComments = generateFakeComments(9);
  const [filterRating, setFilterRating] = useState(null); // null = All
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredComments = filterRating
    ? allComments.filter(c => c.rating === filterRating)
    : allComments;

  const pagedComments = filteredComments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const renderStars = count => {
    return Array.from({ length: count }).map((_, idx) => (
      <FaStar key={idx} style={{ color: '#fadb14', marginRight: 2 }} />
    ));
  };

  return (
    <div className="comment-section">
      <h3>Đánh giá sản phẩm</h3>

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
            onClick={() => {
              setFilterRating(star);
              setCurrentPage(1);
            }}
            type={filterRating === star ? 'primary' : 'default'}
          >
            {star} sao
          </Button>
        ))}
      </div>

      {pagedComments.map(c => (
        <div key={c.hash} className="comment-item">
          <div className="comment-header">
            <strong>{c.name}</strong>
            <span className="comment-hash">#{c.hash}</span>
            <span className="comment-time">{c.time}</span>
          </div>
          <div className="comment-rating">{renderStars(c.rating)}</div>
          <p className="comment-content">{c.content}</p>
          {c.images.length > 0 && (
            <div className="comment-images">
              {c.images.map((imgUrl, i) => (
                <img key={i} src={imgUrl} alt={`Feedback ${i}`} />
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="pagination-wrapper">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredComments.length}
          onChange={page => setCurrentPage(page)}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default CommentSection;
