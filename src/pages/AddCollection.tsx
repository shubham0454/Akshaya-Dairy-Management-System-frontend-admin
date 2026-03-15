import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from 'react-bootstrap';
import { FiPlus, FiArrowRight } from 'react-icons/fi';

const AddCollection = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold" style={{ color: '#6F42C1' }}>
          <FiPlus className="me-2" style={{ color: '#00CCCC' }} />
          Add Milk Collection
        </h3>
      </div>

      <Card style={{ border: 'none', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body className="p-4">
          <div className="text-center py-5">
            <FiPlus size={64} style={{ color: '#00CCCC', marginBottom: '1rem' }} />
            <h5 style={{ color: '#6C757D' }}>Add New Milk Collection</h5>
            <p className="text-muted mb-4">
              Use the Milk Price page to add new milk collections for dairy centers.
            </p>
            <Button
              onClick={() => navigate('/milk-price')}
              style={{
                backgroundColor: '#6F42C1',
                borderColor: '#6F42C1',
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5a32a3';
                e.currentTarget.style.borderColor = '#5a32a3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6F42C1';
                e.currentTarget.style.borderColor = '#6F42C1';
              }}
            >
              Go to Milk Price & Add Collection
              <FiArrowRight className="ms-2" />
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AddCollection;


