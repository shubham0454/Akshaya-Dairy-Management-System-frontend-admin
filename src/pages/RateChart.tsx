import React from 'react';
import { Card } from 'react-bootstrap';
import { FiBarChart2 } from 'react-icons/fi';

const RateChart = () => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold" style={{ color: '#6F42C1' }}>
          <FiBarChart2 className="me-2" style={{ color: '#00CCCC' }} />
          Rate Chart
        </h3>
      </div>

      <Card style={{ border: 'none', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body className="p-4">
          <div className="text-center py-5">
            <FiBarChart2 size={64} style={{ color: '#00CCCC', marginBottom: '1rem' }} />
            <h5 style={{ color: '#6C757D' }}>Rate Chart</h5>
            <p className="text-muted">This page will display milk rate charts and pricing information.</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RateChart;


