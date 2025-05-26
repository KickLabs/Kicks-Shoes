import "./ProductCard.css";
import { formatPrice } from "../../../utils/StringFormat";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  return (
    <div className="product-card">
      <div className="product-card__image-container">
        {product.isNew && <div className="product-card__badge">New</div>}
        {product.price.isOnSale && (
          <div
            style={{ backgroundColor: "#FFA52F", width: "70px" }}
            className="product-card__badge"
          >
            {product.price.discountPercent}% off
          </div>
        )}
        <img
          src={product.images[0]}
          alt={product.name}
          className="product-card__image"
        />
      </div>
      <div className="product-card__info">
        <h2 className="product-card__name">{product.name}</h2>
      </div>
      <div className="product-card__footer">
        <button className="product-card__button">
          <div
            className="product-card__button-inner"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <span>VIEW PRODUCT -</span>
            <span className="product-card__price">
              {product.price.isOnSale
                ? formatPrice(
                    product.price.regular *
                      (product.price.discountPercent / 100)
                  )
                : formatPrice(product.price.regular)}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
