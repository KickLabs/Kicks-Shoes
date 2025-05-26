import { Checkbox } from "antd";

const CategoryPanel = ({ categories }) => (
  <Checkbox.Group style={{ display: "flex", flexDirection: "column" }}>
    {categories.map((cat) => (
      <Checkbox key={cat} value={cat}>
        {cat}
      </Checkbox>
    ))}
  </Checkbox.Group>
);

export default CategoryPanel;
