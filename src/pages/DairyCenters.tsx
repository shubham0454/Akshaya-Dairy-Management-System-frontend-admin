import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Table, 
  Badge, 
  Spinner, 
  Button, 
  Modal, 
  Form, 
  Row, 
  Col
} from 'react-bootstrap';
import Pagination from 'react-bootstrap/Pagination';
import { FiPlus, FiEdit, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';

interface DairyCenter {
  id: string;
  dairy_name: string;
  contact_mobile: string;
  email?: string;
  is_active: boolean;
  qr_code?: string;
  address?: any;
  first_name?: string;
  last_name?: string;
}

const DairyCenters = () => {
  const [centers, setCenters] = useState<DairyCenter[]>([]);
  const [allCenters, setAllCenters] = useState<DairyCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<DairyCenter | null>(null);
  const [detailsCenter, setDetailsCenter] = useState<DairyCenter | null>(null);
  const [milkCollections, setMilkCollections] = useState<any[]>([]);
  const [collectionFilters, setCollectionFilters] = useState({
    start_date: '',
    end_date: '',
    milk_type: '' as 'cow' | 'buffalo' | 'mix_milk' | '',
  });
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    dairy_name: '',
    contact_mobile: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  useEffect(() => {
    fetchCenters();
  }, [currentPage]);

  const fetchCenters = async () => {
    try {
      const response = await axios.get('/centers');
      const centersData = response.data.data || [];
      setAllCenters(centersData);
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setCenters(centersData.slice(startIndex, endIndex));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch centers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/centers', formData);
      toast.success('Dairy center created successfully!');
      setShowModal(false);
      resetForm();
      fetchCenters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create center');
    }
  };

  const handleEdit = (center: DairyCenter) => {
    setSelectedCenter(center);
    setFormData({
      dairy_name: center.dairy_name,
      contact_mobile: center.contact_mobile,
      email: center.email || '',
      password: '',
      first_name: center.first_name || '',
      last_name: center.last_name || '',
      address: center.address || { street: '', city: '', state: '', pincode: '' },
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenter) return;
    try {
      const updateData: any = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      await axios.put(`/centers/${selectedCenter.id}`, updateData);
      toast.success('Dairy center updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchCenters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update center');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/centers/${id}/toggle-status`);
      toast.success(`Center ${!currentStatus ? 'activated' : 'deactivated'}!`);
      await fetchCenters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      await fetchCenters();
    }
  };

  const handleViewDetails = async (center: DairyCenter) => {
    setDetailsCenter(center);
    setShowDetailsModal(true);
    // Reset filters and fetch all collections initially
    setCollectionFilters({ start_date: '', end_date: '', milk_type: '' });
    // Fetch milk collections for this center (all data initially)
    try {
      setLoadingCollections(true);
      const response = await axios.get('/milk/collections', { 
        params: { vendor_id: center.id, limit: 1000 } 
      });
      setMilkCollections(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch milk collections:', error);
      setMilkCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchMilkCollections = async (centerId: string, filters?: typeof collectionFilters) => {
    try {
      setLoadingCollections(true);
      const activeFilters = filters || collectionFilters;
      const params: any = {
        vendor_id: centerId,
        limit: 1000,
      };

      if (activeFilters.start_date && activeFilters.end_date) {
        params.start_date = activeFilters.start_date;
        params.end_date = activeFilters.end_date;
      }

      const response = await axios.get('/milk/collections', { params });
      let collections = response.data.data || [];

      // Filter by milk type if selected
      if (activeFilters.milk_type) {
        collections = collections.filter((c: any) => c.milk_type === activeFilters.milk_type);
      }

      setMilkCollections(collections);
    } catch (error: any) {
      console.error('Failed to fetch milk collections:', error);
      toast.error('Failed to fetch milk collections');
      setMilkCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };

  const calculateMilkTotals = () => {
    const cowMilk = milkCollections
      .filter((c: any) => c.milk_type === 'cow')
      .reduce((sum: number, c: any) => sum + (parseFloat(c.milk_weight) || 0), 0);
    
    const buffaloMilk = milkCollections
      .filter((c: any) => c.milk_type === 'buffalo')
      .reduce((sum: number, c: any) => sum + (parseFloat(c.milk_weight) || 0), 0);
    
    const mixMilk = milkCollections
      .filter((c: any) => c.milk_type === 'mix_milk')
      .reduce((sum: number, c: any) => sum + (parseFloat(c.milk_weight) || 0), 0);
    
    const totalMilk = cowMilk + buffaloMilk + mixMilk;
    const totalAmount = milkCollections.reduce((sum: number, c: any) => sum + (parseFloat(c.total_amount) || 0), 0);

    return { cowMilk, buffaloMilk, mixMilk, totalMilk, totalAmount };
  };


  const resetForm = () => {
    setFormData({
      dairy_name: '',
      contact_mobile: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      address: { street: '', city: '', state: '', pincode: '' },
    });
    setSelectedCenter(null);
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: '#6F42C1' }}>Dairy Centers</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowModal(true)}
          className="fw-semibold"
          style={{
            backgroundColor: '#6F42C1',
            borderColor: '#6F42C1',
            borderRadius: '8px'
          }}
        >
          <FiPlus className="me-2" />
          Add Center
        </Button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Table striped hover className="mb-0">
            <thead>
              <tr>
                <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Center Name</th>
                <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Mobile No</th>
                <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Email ID</th>
                <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Status</th>
                <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
        <tbody>
          {centers.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted py-4">
                No dairy centers found
              </td>
            </tr>
          ) : (
            centers.map((center) => (
              <tr key={center.id}>
                <td className="fw-semibold">{center.dairy_name}</td>
                <td>{center.contact_mobile}</td>
                <td>{center.email || 'N/A'}</td>
                <td>
                  <div className="form-check form-switch d-inline-block">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id={`status-${center.id}`}
                      checked={center.is_active === true}
                      onChange={() => handleToggleStatus(center.id, center.is_active === true)}
                      style={{ cursor: 'pointer', width: '3em', height: '1.5em' }}
                    />
                    <label className="form-check-label ms-2" htmlFor={`status-${center.id}`}>
                      <Badge 
                        className="ms-2"
                        style={{
                          backgroundColor: center.is_active === true ? '#00CCCC' : '#F5F5F5',
                          color: center.is_active === true ? 'white' : '#1E2329',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: center.is_active === true ? 'none' : '1px solid #E5E7EB'
                        }}
                      >
                        {center.is_active === true ? 'Active' : 'Inactive'}
                      </Badge>
                    </label>
                  </div>
                </td>
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEdit(center)}
                      style={{
                        borderColor: '#6F42C1',
                        color: '#6F42C1',
                        borderRadius: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#6F42C1';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6F42C1';
                      }}
                    >
                      <FiEdit className="me-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleViewDetails(center)}
                      style={{
                        borderColor: '#00CCCC',
                        color: '#00CCCC',
                        borderRadius: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#00CCCC';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#00CCCC';
                      }}
                    >
                      <FiEye className="me-1" />
                      View
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
            </Table>
          </div>
        </div>

      {/* Pagination */}
      {allCenters.length > itemsPerPage && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
            />
            <Pagination.Prev 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
              disabled={currentPage === 1}
            />
            {Array.from({ length: Math.ceil(allCenters.length / itemsPerPage) }, (_, i) => i + 1)
              .filter(page => {
                const totalPages = Math.ceil(allCenters.length / itemsPerPage);
                return page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2);
              })
              .map((page, index, array) => {
                if (index > 0 && page - array[index - 1] > 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <Pagination.Ellipsis />
                      <Pagination.Item
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Pagination.Item>
                    </React.Fragment>
                  );
                }
                return (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                );
              })}
            <Pagination.Next 
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(allCenters.length / itemsPerPage), prev + 1))} 
              disabled={currentPage === Math.ceil(allCenters.length / itemsPerPage)}
            />
            <Pagination.Last 
              onClick={() => setCurrentPage(Math.ceil(allCenters.length / itemsPerPage))} 
              disabled={currentPage === Math.ceil(allCenters.length / itemsPerPage)}
            />
          </Pagination>
        </div>
      )}

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }}>
        <Modal.Header 
          closeButton
          style={{
            backgroundColor: '#6F42C1',
            color: 'white',
            borderBottom: 'none'
          }}
        >
          <Modal.Title style={{ color: 'white', fontWeight: '600' }}>Add Dairy Center</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreate}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Center Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.dairy_name}
                    onChange={(e) => setFormData({ ...formData, dairy_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Mobile *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.contact_mobile}
                    onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Default: password123"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Street</Form.Label>
              <Form.Control
                type="text"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
              />
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.address.pincode}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, pincode: e.target.value }
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2 fw-semibold" 
                onClick={() => { setShowModal(false); resetForm(); }}
                style={{
                  backgroundColor: '#17A2B8',
                  borderColor: '#17A2B8',
                  color: 'white',
                  borderRadius: '8px'
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                className="fw-semibold"
                style={{
                  backgroundColor: '#6F42C1',
                  borderColor: '#6F42C1',
                  borderRadius: '8px'
                }}
              >
                Create Center
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); resetForm(); }}>
        <Modal.Header 
          closeButton
          style={{
            backgroundColor: '#6F42C1',
            color: 'white',
            borderBottom: 'none'
          }}
        >
          <Modal.Title style={{ color: 'white', fontWeight: '600' }}>Edit Dairy Center</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdate}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Center Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.dairy_name}
                    onChange={(e) => setFormData({ ...formData, dairy_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Mobile *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.contact_mobile}
                    onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New Password (leave empty to keep current)</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Street</Form.Label>
              <Form.Control
                type="text"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
              />
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.address.pincode}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, pincode: e.target.value }
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2 fw-semibold" 
                onClick={() => { setShowEditModal(false); resetForm(); }}
                style={{
                  backgroundColor: '#17A2B8',
                  borderColor: '#17A2B8',
                  color: 'white',
                  borderRadius: '8px'
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                className="fw-semibold"
                style={{
                  backgroundColor: '#6F42C1',
                  borderColor: '#6F42C1',
                  borderRadius: '8px'
                }}
              >
                Update Center
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Center Details Modal */}
      <Modal show={showDetailsModal} onHide={() => { 
        setShowDetailsModal(false); 
        setDetailsCenter(null);
        setMilkCollections([]);
        setCollectionFilters({ start_date: '', end_date: '', milk_type: '' });
      }} size="xl">
        <Modal.Header 
          closeButton
          style={{
            backgroundColor: '#6F42C1',
            color: 'white',
            borderBottom: 'none'
          }}
        >
          <Modal.Title style={{ color: 'white', fontWeight: '600' }}>
            <FiEye className="me-2" />
            Center Details - {detailsCenter?.dairy_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {detailsCenter ? (
            <div>
              {/* Center Information */}
              <div className="mb-4">
                <h5 className="mb-3 border-bottom pb-2">Center Information</h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Center Name:</strong> {detailsCenter?.dairy_name}</p>
                    <p><strong>Mobile Number:</strong> {detailsCenter?.contact_mobile}</p>
                    <p><strong>Email:</strong> {detailsCenter?.email || 'N/A'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Status:</strong> 
                      <Badge bg={detailsCenter?.is_active === true ? 'success' : 'danger'} className="ms-2">
                        {detailsCenter?.is_active === true ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                    <p><strong>QR Code:</strong> {detailsCenter?.qr_code || 'N/A'}</p>
                    {detailsCenter?.address && (
                      <div>
                        <p><strong>Address:</strong></p>
                        <p className="ms-3">
                          {detailsCenter.address.street && `${detailsCenter.address.street}, `}
                          {detailsCenter.address.city && `${detailsCenter.address.city}, `}
                          {detailsCenter.address.state && `${detailsCenter.address.state} `}
                          {detailsCenter.address.pincode && `- ${detailsCenter.address.pincode}`}
                        </p>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>

              {/* Milk Collection Section */}
              <div className="mb-4">
                <h5 className="mb-3 border-bottom pb-2">Milk Collection Data</h5>
                
                {/* Date Range Filter */}
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>From Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={collectionFilters.start_date}
                        onChange={(e) => {
                          const newFilters = { ...collectionFilters, start_date: e.target.value };
                          setCollectionFilters(newFilters);
                          if (newFilters.start_date && newFilters.end_date && detailsCenter) {
                            fetchMilkCollections(detailsCenter.id, newFilters);
                          }
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>To Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={collectionFilters.end_date}
                        onChange={(e) => {
                          const newFilters = { ...collectionFilters, end_date: e.target.value };
                          setCollectionFilters(newFilters);
                          if (newFilters.start_date && newFilters.end_date && detailsCenter) {
                            fetchMilkCollections(detailsCenter.id, newFilters);
                          }
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Milk Type Filter</Form.Label>
                      <Form.Select
                        value={collectionFilters.milk_type}
                        onChange={(e) => {
                          const newFilters = { ...collectionFilters, milk_type: e.target.value as any };
                          setCollectionFilters(newFilters);
                          if (detailsCenter) {
                            fetchMilkCollections(detailsCenter.id, newFilters);
                          }
                        }}
                      >
                        <option value="">All Types</option>
                        <option value="cow">Cow Milk</option>
                        <option value="buffalo">Buffalo Milk</option>
                        <option value="mix_milk">Mix Milk</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Milk Totals */}
                {milkCollections.length > 0 && (
                  <div className="mb-3 p-3 bg-light rounded">
                    <Row>
                      <Col md={3}>
                        <p className="mb-1"><strong>Cow Milk Total:</strong></p>
                        <h5 className="text-primary">{calculateMilkTotals().cowMilk.toFixed(2)} kg</h5>
                      </Col>
                      <Col md={3}>
                        <p className="mb-1"><strong>Buffalo Milk Total:</strong></p>
                        <h5 className="text-primary">{calculateMilkTotals().buffaloMilk.toFixed(2)} kg</h5>
                      </Col>
                      <Col md={3}>
                        <p className="mb-1"><strong>Mix Milk Total:</strong></p>
                        <h5 className="text-primary">{calculateMilkTotals().mixMilk.toFixed(2)} kg</h5>
                      </Col>
                      <Col md={3}>
                        <p className="mb-1"><strong>Overall Total:</strong></p>
                        <h5 className="text-success">{calculateMilkTotals().totalMilk.toFixed(2)} kg</h5>
                        <p className="mb-0"><strong>Total Amount:</strong> ₹{calculateMilkTotals().totalAmount.toFixed(2)}</p>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Milk Collections Table */}
                {loadingCollections ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : milkCollections.length > 0 ? (
                  <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table striped bordered hover size="sm">
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Type</th>
                          <th>Weight (kg)</th>
                          <th>FAT %</th>
                          <th>SNF %</th>
                          <th>Rate/L</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {milkCollections.map((collection: any) => (
                          <tr key={collection.id}>
                            <td>{new Date(collection.collection_date).toLocaleDateString()}</td>
                            <td>
                              <Badge bg={collection.collection_time === 'morning' ? 'info' : 'warning'}>
                                {collection.collection_time}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={
                                collection.milk_type === 'cow' ? 'primary' :
                                collection.milk_type === 'buffalo' ? 'secondary' : 'success'
                              }>
                                {collection.milk_type === 'cow' ? 'Cow' :
                                 collection.milk_type === 'buffalo' ? 'Buffalo' : 'Mix'}
                              </Badge>
                            </td>
                            <td>{parseFloat(collection.milk_weight).toFixed(2)}</td>
                            <td>{parseFloat(collection.fat_percentage).toFixed(2)}</td>
                            <td>{parseFloat(collection.snf_percentage).toFixed(2)}</td>
                            <td>₹{parseFloat(collection.rate_per_liter).toFixed(2)}</td>
                            <td>₹{parseFloat(collection.total_amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <p>No milk collection data found for the selected date range.</p>
                    {(!collectionFilters.start_date || !collectionFilters.end_date) && (
                      <p className="small">Please select a date range to view collections.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            className="fw-semibold"
            style={{
              backgroundColor: '#17A2B8',
              borderColor: '#17A2B8',
              color: 'white',
              borderRadius: '8px'
            }}
            onClick={() => { 
            setShowDetailsModal(false); 
            setDetailsCenter(null);
            setMilkCollections([]);
            setCollectionFilters({ start_date: '', end_date: '', milk_type: '' });
          }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DairyCenters;
