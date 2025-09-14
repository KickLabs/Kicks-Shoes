import React from 'react';
import './CategoriesSection.css';
import categoryImg1 from '../../../../assets/images/HomePage/categories-image1.png';
import categoryImg2 from '../../../../assets/images/HomePage/categories-image2.png';
import { CategoryCard } from './CategoryCard';
import { useNavigate } from 'react-router-dom';

export const CategoriesSection = () => {
  const navigate = useNavigate();

  const categories = [
    {
      title: 'Shoes',
      subtitle: 'Step up your style',
      image: categoryImg1,
      productType: 'shoes',
      route: '/shoes',
    },
    {
      title: 'Clothing',
      subtitle: 'Dress to impress',
      image: categoryImg2,
      productType: 'clothing',
      route: '/clothing',
    },
    {
      title: 'Accessories',
      subtitle: 'Complete your look',
      image: categoryImg1, // You can add specific accessory image later
      productType: 'accessory',
      route: '/accessories',
    },
    {
      title: 'Other',
      subtitle: 'Discover more',
      image: categoryImg2, // You can add specific other image later
      productType: 'other',
      route: '/other',
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
          <CategoryCard key={index} cat={cat} onClick={() => navigate(cat.route)} />
        ))}
      </div>
    </section>
  );
};
