import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CategoriesSection.css';
import categoryImg1 from '../../../../assets/images/HomePage/categories-image1.png';
import categoryImg2 from '../../../../assets/images/HomePage/categories-image2.png';
import { CategoryCard } from './CategoryCard';

export const CategoriesSection = () => {
  const navigate = useNavigate();

  const categories = [
    {
      title: 'Lifestyle Shoes',
      image: categoryImg1,
      query: '6845bf9d51fd52e476d71b62',
    },
    {
      title: 'Basketball Shoes',
      image: categoryImg2,
      query: '6845c008d4731224ddda38b1',
    },
  ];

  const handleCategoryClick = query => {
    navigate(`/listing-page?category=${encodeURIComponent(query)}`);
  };

  return (
    <section className="categories-section">
      <div className="categories-header">
        <h2>CATEGORIES</h2>
        <div className="categories-nav">
          <button>&lt;</button>
          <button>&gt;</button>
        </div>
      </div>
      <div className="categories-grid">
        {categories.map((cat, index) => (
          <CategoryCard
            key={index}
            cat={cat}
            onCategoryClick={() => {
              console.log('Click:', cat.query);
              handleCategoryClick(cat.query);
            }}
          />
        ))}
      </div>
    </section>
  );
};
