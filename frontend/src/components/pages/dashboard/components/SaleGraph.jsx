import React, { useState, useEffect } from 'react';
import { Button, Spin, Alert } from 'antd';
import { Line } from '@ant-design/charts';
import { getShopSalesData } from '../../../../services/dashboardService';

export default function SaleGraph() {
  const [active, setActive] = useState('MONTHLY');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSalesData();
  }, [active]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const response = await getShopSalesData(active.toLowerCase());
      setChartData(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Failed to load sales data');
      // Fallback data if API fails
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const getXField = () => {
    switch (active) {
      case 'WEEKLY':
        return 'week';
      case 'YEARLY':
        return 'year';
      default:
        return 'month';
    }
  };

  const config = {
    data: chartData,
    xField: getXField(),
    yField: 'value',
    height: 260,
    width: 750,
    smooth: true,
    lineStyle: { stroke: '#4A69E2', lineWidth: 4 },
    area: { style: { fill: 'l(270) 0:#4A69E2 1:#fff' } },
    point: { size: 0 },
    xAxis: {
      label: { style: { fontWeight: 700, fontSize: 16 } },
      line: null,
      tickLine: null,
      range: [0.1, 0.8],
    },
    yAxis: {
      label: { style: { fontWeight: 500, fontSize: 14 } },
      grid: { line: { style: { stroke: '#eee', lineDash: [4, 4] } } },
    },
    tooltip: { showMarkers: false },
    animation: false,
  };

  if (loading) {
    return (
      <div className="sale-graph">
        <div className="sale-graph-header">
          <span className="sale-graph-title">Sale Graph</span>
          <div className="sale-graph-filters">
            {['WEEKLY', 'MONTHLY', 'YEARLY'].map(type => (
              <Button
                key={type}
                className={active === type ? 'active' : ''}
                onClick={() => setActive(type)}
                disabled={loading}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
        <div className="sale-graph-divider" />
        <div className="sale-graph-chart" style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sale-graph">
        <div className="sale-graph-header">
          <span className="sale-graph-title">Sale Graph</span>
          <div className="sale-graph-filters">
            {['WEEKLY', 'MONTHLY', 'YEARLY'].map(type => (
              <Button
                key={type}
                className={active === type ? 'active' : ''}
                onClick={() => setActive(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
        <div className="sale-graph-divider" />
        <div className="sale-graph-chart">
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="sale-graph">
      <div className="sale-graph-header">
        <span className="sale-graph-title">Sale Graph</span>
        <div className="sale-graph-filters">
          {['WEEKLY', 'MONTHLY', 'YEARLY'].map(type => (
            <Button
              key={type}
              className={active === type ? 'active' : ''}
              onClick={() => setActive(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>
      <div className="sale-graph-divider" />
      <div className="sale-graph-chart">
        {chartData.length > 0 ? (
          <Line {...config} />
        ) : (
          <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
            No sales data available for the selected period
          </div>
        )}
      </div>
    </div>
  );
}
