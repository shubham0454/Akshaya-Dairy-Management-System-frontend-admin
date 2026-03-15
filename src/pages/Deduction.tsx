import React from 'react';
import { Card } from 'react-bootstrap';
import { FiMinus } from 'react-icons/fi';

const Deduction = () => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold" style={{ color: '#6F42C1' }}>
          <FiMinus className="me-2" style={{ color: '#00CCCC' }} />
          Deduction Management
        </h3>
      </div>

      <Card style={{ border: 'none', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body className="p-4">
          <div className="text-center py-5">
            <FiMinus size={64} style={{ color: '#00CCCC', marginBottom: '1rem' }} />
            <h5 style={{ color: '#6C757D' }}>Deduction Management</h5>
            <p className="text-muted">This page will display deduction records and management options.</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Deduction;


