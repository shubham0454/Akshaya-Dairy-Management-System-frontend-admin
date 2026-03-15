import React from 'react';
import { Card } from 'react-bootstrap';
import { FiGift } from 'react-icons/fi';

const AnnualBonus = () => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold" style={{ color: '#6F42C1' }}>
          <FiGift className="me-2" style={{ color: '#00CCCC' }} />
          Annual Bonus
        </h3>
      </div>

      <Card style={{ border: 'none', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body className="p-4">
          <div className="text-center py-5">
            <FiGift size={64} style={{ color: '#00CCCC', marginBottom: '1rem' }} />
            <h5 style={{ color: '#6C757D' }}>Annual Bonus Management</h5>
            <p className="text-muted">This page will display annual bonus records and management options.</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AnnualBonus;


