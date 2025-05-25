import React from 'react';
import './CategoriesSection.css';
import categoryImg1 from '../../../../assets/images/HomePage/categories-image1.png';
import categoryImg2 from '../../../../assets/images/HomePage/categories-image2.png';
import { CategoryCard } from './CategoryCard';


export const CategoriesSection = () => {
  const categories = [
    {
      title: 'Lifestyle Shoes',
      image: categoryImg1,
    },
    {
      title: 'Basketball Shoes',
      image: categoryImg2,
    },
  ];

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
          <CategoryCard key= {index} cat={cat}/>
        ))}
      </div>
    </section>
  );
};
