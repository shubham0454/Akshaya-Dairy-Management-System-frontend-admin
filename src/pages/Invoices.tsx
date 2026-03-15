import React from 'react';
import { Card } from 'react-bootstrap';
import { FiFileText } from 'react-icons/fi';

const Invoices = () => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold" style={{ color: '#6F42C1' }}>
          <FiFileText className="me-2" style={{ color: '#00CCCC' }} />
          Invoices
        </h3>
      </div>

      <Card style={{ border: 'none', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body className="p-4">
          <div className="text-center py-5">
            <FiFileText size={64} style={{ color: '#00CCCC', marginBottom: '1rem' }} />
            <h5 style={{ color: '#6C757D' }}>Invoice Management</h5>
            <p className="text-muted">This page will display all invoices and invoice management options.</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Invoices;


