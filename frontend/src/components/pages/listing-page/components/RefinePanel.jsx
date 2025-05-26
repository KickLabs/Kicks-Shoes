import { Button } from "antd";

const RefinePanel = ({ refineOptions }) => (
  <div className="filter-refine">
    {refineOptions.map((option) => (
      <Button key={option} className="refine-button">
        {option}
      </Button>
    ))}
  </div>
);

export default RefinePanel;
