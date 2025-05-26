import "./FilterSidebar.css";
import { Collapse } from "antd";
import RefinePanel from "./RefinePanel";
import SizePanel from "./SizePanel";
import ColorPanel from "./ColorPanel";
import CategoryPanel from "./CategoryPanel";
import GenderPanel from "./GenderPanel";
import PricePanel from "./PricePanel";
import { useState } from "react";

const { Panel } = Collapse;

const FilterSidebar = ({
  refineOptions,
  sizes,
  colors,
  categories,
  genders,
  priceRange
}) => {
  const [selectedSize, setSelectedSize] = useState(null);

  const handleSelectSize = (size) => {
    setSelectedSize(size);
    if (onSizeChange) {
      onSizeChange(size);
    }
  };
  return (
    <div className="filter-sidebar">
      <h2 className="filter-sidebar__title">Filters</h2>

      <Collapse defaultActiveKey={["1", "2", "3", "4", "5", "6"]} ghost>
        <Panel header="REFINE BY" key="1">
          <RefinePanel refineOptions={refineOptions} />
        </Panel>

        <Panel header="SIZE" key="2">
          <SizePanel
            sizes={sizes}
            selectedSize={selectedSize}
            onSizeSelect={handleSelectSize}
          />
        </Panel>

        <Panel header="COLOR" key="3">
          <ColorPanel colors={colors} />
        </Panel>

        <Panel header="TYPE" key="4">
          <CategoryPanel categories={categories} />
        </Panel>

        <Panel header="GENDER" key="5">
          <GenderPanel genders={genders} />
        </Panel>

        <Panel header="PRICE" key="6">
          <PricePanel priceRange={priceRange} />
        </Panel>
      </Collapse>
    </div>
  );
};

export default FilterSidebar;
