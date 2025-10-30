import React from 'react';
import './LoadingSpinner.css';
import logoImg from '../../assets/images/Logo.png';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner-container">
        <div className="loading-logo-wrapper">
          <img src={logoImg} alt="Kicks Shoes" className="loading-logo" />
          <div className="loading-spinner"></div>
        </div>
        <div className="loading-text">Loading...</div>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
