
import './CategoryCard.css'
export const CategoryCard = ({ cat }) => {
return(
  <>
    <div className="category-card">
    <img src={cat.image} alt={cat.title} />
    <div className="category-info">
      <h3>{cat.title}</h3>
      <button className="category-btn">↗</button>
    </div>
  </div>
  </>
)
};
