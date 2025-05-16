import React, { useState } from "react";
import { Button } from "antd";
import { Line } from "@ant-design/charts";

const dataMonthly = [
  { month: "JUL", value: 40 },
  { month: "AUG", value: 40 },
  { month: "SEP", value: 50 },
  { month: "OCT", value: 80 },
  { month: "NOV", value: 60 },
  { month: "DEC", value: 400 },
];

const dataWeekly = [
  { week: "W1", value: 20 },
  { week: "W2", value: 30 },
  { week: "W3", value: 25 },
  { week: "W4", value: 40 },
];

const dataYearly = [
  { year: "2020", value: 100 },
  { year: "2021", value: 120 },
  { year: "2022", value: 180 },
  { year: "2023", value: 350 },
];

export default function SaleGraph() {
  const [active, setActive] = useState("MONTHLY");

  let chartData = dataMonthly;
  let xField = "month";
  if (active === "WEEKLY") {
    chartData = dataWeekly;
    xField = "week";
  } else if (active === "YEARLY") {
    chartData = dataYearly;
    xField = "year";
  }

  const config = {
    data: chartData,
    xField,
    yField: "value",
    height: 260,
    width: 750,
    smooth: true,
    lineStyle: { stroke: "#4A69E2", lineWidth: 4 },
    area: { style: { fill: "l(270) 0:#4A69E2 1:#fff" } },
    point: { size: 0 },
    xAxis: {
      label: { style: { fontWeight: 700, fontSize: 16 } },
      line: null,
      tickLine: null,
      range: [0.1, 0.8],
    },
    yAxis: {
      label: { style: { fontWeight: 500, fontSize: 14 } },
      grid: { line: { style: { stroke: "#eee", lineDash: [4, 4] } } },
    },
    tooltip: { showMarkers: false },
    animation: false,
  };

  return (
    <div className="sale-graph">
      <div className="sale-graph-header">
        <span className="sale-graph-title">Sale Graph</span>
        <div className="sale-graph-filters">
          {["WEEKLY", "MONTHLY", "YEARLY"].map((type) => (
            <Button
              key={type}
              className={active === type ? "active" : ""}
              onClick={() => setActive(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>
      <div className="sale-graph-divider" />
      <div className="sale-graph-chart">
        <Line {...config} />
      </div>
    </div>
  );
}
