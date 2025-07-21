import './CategoryCard.css';
export const CategoryCard = ({ cat, onCategoryClick }) => {
  return (
    <div className="category-card">
      <img src={cat.image} alt={cat.title} />
      <div className="category-info">
        <h3>{cat.title}</h3>
        <button className="category-btn" onClick={onCategoryClick}>
          ↗
        </button>
      </div>
    </div>
  );
};
