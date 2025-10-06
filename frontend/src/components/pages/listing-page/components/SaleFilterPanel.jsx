import React from 'react';
import { Checkbox } from 'antd';
import './SaleFilterPanel.css';

const SaleFilterPanel = ({ selectedSaleType, onSaleTypeChange }) => {
  const saleOptions = [
    { value: 'flash-sale', label: 'Flash Sale', color: '#ff4757' },
    { value: 'regular-sale', label: 'Regular Sale', color: '#FFA52F' },
  ];

  return (
    <div className="sale-filter-panel">
      <h3 className="sale-filter-title">Sale Type</h3>
      <div className="sale-options">
        {saleOptions.map(option => (
          <div key={option.value} className="sale-option">
            <Checkbox
              checked={selectedSaleType === option.value}
              onChange={() =>
                onSaleTypeChange(selectedSaleType === option.value ? null : option.value)
              }
            >
              <span className="sale-option-label" style={{ color: option.color }}>
                {option.label}
              </span>
            </Checkbox>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SaleFilterPanel;
