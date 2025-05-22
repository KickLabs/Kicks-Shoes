import React from "react";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const { image, isNew, isSale, salePercent, name, price, onViewProduct } =
    product;
  return (
    <div className="product-card">
      <div className="product-card__image-container">
        {isNew && <div className="product-card__badge">New</div>}
        {isSale && (
          <div
            style={{ backgroundColor: "#FFA52F", width: "65px" }}
            className="product-card__badge"
          >
            ${salePercent}% off
          </div>
        )}
        <img src={image} alt={name} className="product-card__image" />
      </div>
      <div className="product-card__info">
        <h2 className="product-card__name">{name}</h2>
      </div>
      <div className="product-card__footer">
        <button className="product-card__button" onClick={onViewProduct}>
          <div className="product-card__button-inner">
            <span>VIEW PRODUCT -</span>
            <span className="product-card__price">${price}</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
