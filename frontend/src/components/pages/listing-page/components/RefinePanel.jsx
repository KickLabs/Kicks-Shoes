import { Button } from 'antd';

const RefinePanel = ({ refineOptions, selectedRefineOption, onRefineSelect }) => {
  return (
    <div className="filter-refine">
      {refineOptions.map((option, index) => (
        <Button
          key={option ?? index}
          className={`refine-button ${selectedRefineOption === option ? 'active' : ''}`} // Toggle active class
          onClick={() => onRefineSelect(option === selectedRefineOption ? null : option)} // Toggle selection
        >
          {option}
        </Button>
      ))}
    </div>
  );
};

export default RefinePanel;
