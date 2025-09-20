import React from 'react';
import './CategoriesSection.css';
import { CategoryCard } from './CategoryCard';
import { useNavigate } from 'react-router-dom';

export const CategoriesSection = () => {
  const navigate = useNavigate();

  const categories = [
    {
      title: 'Shoes',
      subtitle: 'Step up your style',
      image:
        'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/903ece78-32a8-4d24-a496-30b27c760777/NIKE+SHOX+TL.png',
      productType: 'shoes',
      route: '/shoes',
    },
    {
      title: 'Clothing',
      subtitle: 'Dress to impress',
      image:
        'https://assets.adidas.com/images/w_600,f_auto,q_auto/5118e5db5f804772a10f82c8316dd91c_9366/Own_The_Run_T-Shirt_Grey_IP2041_01_laydown.jpg',
      productType: 'clothing',
      route: '/clothing',
    },
    {
      title: 'Accessories',
      subtitle: 'Complete your look',
      image:
        'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/95f3ade62e9c4c598cedae9301281234_9366/Amplifier_Cuff_Beanie_Black_GA9762_01_standard.jpg',
      productType: 'accessory',
      route: '/accessories',
    },
    {
      title: 'Other',
      subtitle: 'Discover more',
      image:
        'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/7fcafee2-7416-44f2-a0bc-0f34d1f6c8a2/WMNS+AIR+JORDAN+1+MID.png',
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
