import { Checkbox } from "antd";

const GenderPanel = ({ genders }) => (
  <Checkbox.Group style={{ display: "flex", flexDirection: "column" }}>
    {genders.map((g) => (
      <Checkbox key={g} value={g}>
        {g}
      </Checkbox>
    ))}
  </Checkbox.Group>
);

export default GenderPanel;
