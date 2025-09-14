import './CategoryCard.css';

export const CategoryCard = ({ cat, onClick }) => {
  return (
    <div className="category-card" onClick={onClick}>
      <img src={cat.image} alt={cat.title} />
      <div className="category-info">
        <h3>{cat.title}</h3>
        {cat.subtitle && <p className="category-subtitle">{cat.subtitle}</p>}
        <button className="category-btn">↗</button>
      </div>
    </div>
  );
};
