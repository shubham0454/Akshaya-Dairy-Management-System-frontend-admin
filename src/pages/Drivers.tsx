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
  Col,
  Dropdown
} from 'react-bootstrap';
import { FiPlus, FiEdit, FiPower, FiUserX, FiUserCheck, FiTruck, FiMapPin, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Pagination from 'react-bootstrap/Pagination';

interface Driver {
  id: string;
  driver_id: string;
  first_name: string;
  last_name: string;
  mobile_no: string;
  email?: string;
  is_on_duty: boolean;
  is_active?: boolean;
  status?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  license_number?: string;
  license_expiry?: string;
  salary_per_month?: number;
  center_id?: string;
  center_name?: string;
  center_number?: string;
  centers?: any[];
  centers_count?: number;
  latitude?: number;
  longitude?: number;
  joining_date?: string;
  emergency_contact_name?: string;
  emergency_contact_mobile?: string;
}

const Drivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [locationDriver, setLocationDriver] = useState<Driver | null>(null);
  const [detailsDriver, setDetailsDriver] = useState<Driver | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    mobile_no: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    center_id: '',
    license_number: '',
    license_expiry: '',
    vehicle_number: '',
    vehicle_type: 'bike',
    salary_per_month: '',
    joining_date: new Date().toISOString().split('T')[0],
    emergency_contact_name: '',
    emergency_contact_mobile: '',
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchCenters();
      await fetchDrivers();
    };
    loadData();
  }, [currentPage]);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/driver/all');
      const driversData = response.data.data || [];
      // Map center data to include center count and info
      const driversWithCenterInfo = driversData.map((driver: Driver) => {
        // If driver has centers array, use it; otherwise check center_id
        let driverCenters: any[] = [];
        if (driver.centers && Array.isArray(driver.centers)) {
          driverCenters = driver.centers;
        } else if (driver.center_id) {
          const center = centers.find(c => c.id === driver.center_id);
          if (center) driverCenters = [center];
        }
        
        return {
          ...driver,
          // Ensure is_active is properly set (default to false if undefined)
          is_active: driver.is_active === true,
          centers: driverCenters,
          centers_count: driverCenters.length || (driver.center_id ? 1 : 0),
          center_number: driverCenters.length > 0 
            ? driverCenters.map(c => c.center_number || c.dairy_name || c.id).join(', ')
            : 'Unassigned',
        };
      });
      setAllDrivers(driversWithCenterInfo);
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setDrivers(driversWithCenterInfo.slice(startIndex, endIndex));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await axios.get('/centers');
      setCenters(response.data.data);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/driver-admin', {
        ...formData,
        salary_per_month: formData.salary_per_month ? parseFloat(formData.salary_per_month) : 0,
      });
      toast.success('Driver created successfully!');
      setShowModal(false);
      resetForm();
      fetchDrivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create driver');
    }
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormData({
      mobile_no: driver.mobile_no,
      email: driver.email || '',
      password: '',
      first_name: driver.first_name,
      last_name: driver.last_name,
      center_id: driver.center_id || '',
      license_number: driver.license_number || '',
      license_expiry: driver.license_expiry ? new Date(driver.license_expiry).toISOString().split('T')[0] : '',
      vehicle_number: driver.vehicle_number || '',
      vehicle_type: driver.vehicle_type || 'bike',
      salary_per_month: driver.salary_per_month?.toString() || '',
      joining_date: new Date().toISOString().split('T')[0],
      emergency_contact_name: '',
      emergency_contact_mobile: '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      await axios.put(`/driver-admin/${selectedDriver.id}`, {
        ...updateData,
        salary_per_month: updateData.salary_per_month ? parseFloat(updateData.salary_per_month) : undefined,
      });
      toast.success('Driver updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchDrivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update driver');
    }
  };

  const handleToggleDuty = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/driver-admin/${id}/toggle-duty`);
      toast.success('Duty status updated!');
      fetchDrivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update duty status');
    }
  };

  const handleViewLocation = (driver: Driver) => {
    setLocationDriver(driver);
    setShowLocationModal(true);
  };

  const handleViewDetails = async (driver: Driver) => {
    setDetailsDriver(driver);
    setShowDetailsModal(true);
    
    // Fetch current location for the driver
    try {
      const locationResponse = await axios.get('/driver/location/current', {
        params: { driver_id: driver.driver_id }
      });
      if (locationResponse.data.success && locationResponse.data.data) {
        const location = locationResponse.data.data;
        setDetailsDriver({
          ...driver,
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
    } catch (error) {
      console.error('Failed to fetch driver location:', error);
      // Continue without location data
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/driver-admin/${id}/toggle-status`);
      toast.success(`Driver ${!currentStatus ? 'activated' : 'deactivated'}!`);
      // Refresh drivers list to get updated status
      await fetchDrivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      // Refresh on error too to ensure UI is correct
      await fetchDrivers();
    }
  };

  const handleAssignCenter = async (driverId: string, centerId: string) => {
    try {
      await axios.post(`/driver-admin/${driverId}/assign-center`, { center_id: centerId });
      toast.success('Center assigned successfully!');
      fetchDrivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign center');
    }
  };


  const resetForm = () => {
    setFormData({
      mobile_no: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      center_id: '',
      license_number: '',
      license_expiry: '',
      vehicle_number: '',
      vehicle_type: 'bike',
      salary_per_month: '',
      joining_date: new Date().toISOString().split('T')[0],
      emergency_contact_name: '',
      emergency_contact_mobile: '',
    });
    setSelectedDriver(null);
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: '#6F42C1' }}>Drivers</h2>
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
          Add Driver
        </Button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Name</th>
                  <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Mobile</th>
                  <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Center Allocated No</th>
                  <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Duty Status</th>
                  <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Status</th>
                  <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  No drivers found
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="fw-semibold">{driver.first_name} {driver.last_name}</td>
                  <td>{driver.mobile_no}</td>
                  <td>
                    <Badge 
                      style={{
                        backgroundColor: '#F5F5F5',
                        color: '#1E2329',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      {driver.centers_count || 0} {driver.centers_count === 1 ? 'Center' : 'Centers'}
                    </Badge>
                    {driver.centers_count > 0 && (
                      <small className="d-block text-muted mt-1">
                        {driver.center_number || driver.center_name || 'Unassigned'}
                      </small>
                    )}
                  </td>
                  <td>
                    <div className="form-check form-switch d-inline-block">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id={`duty-${driver.id}`}
                        checked={driver.is_on_duty || false}
                        onChange={() => handleToggleDuty(driver.id, driver.is_on_duty || false)}
                        style={{ cursor: 'pointer', width: '3em', height: '1.5em' }}
                      />
                      <label className="form-check-label ms-2" htmlFor={`duty-${driver.id}`}>
                        <Badge 
                          className="ms-2"
                          style={{
                            backgroundColor: driver.is_on_duty ? '#00CCCC' : '#F5F5F5',
                            color: driver.is_on_duty ? 'white' : '#1E2329',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: driver.is_on_duty ? 'none' : '1px solid #E5E7EB'
                          }}
                        >
                          {driver.is_on_duty ? 'On Duty' : 'Off Duty'}
                        </Badge>
                      </label>
                    </div>
                  </td>
                  <td>
                    <div className="form-check form-switch d-inline-block">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id={`status-${driver.id}`}
                        checked={driver.is_active === true}
                        onChange={() => handleToggleStatus(driver.id, driver.is_active === true)}
                        style={{ cursor: 'pointer', width: '3em', height: '1.5em' }}
                      />
                      <label className="form-check-label ms-2" htmlFor={`status-${driver.id}`}>
                        <Badge 
                          className="ms-2"
                          style={{
                            backgroundColor: driver.is_active === true ? '#00CCCC' : '#F5F5F5',
                            color: driver.is_active === true ? 'white' : '#1E2329',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: driver.is_active === true ? 'none' : '1px solid #E5E7EB'
                          }}
                        >
                          {driver.is_active === true ? 'Active' : 'Inactive'}
                        </Badge>
                      </label>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-2 flex-wrap">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(driver)}
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
                        onClick={() => handleViewDetails(driver)}
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
                        View Details
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
      </div>

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="lg">
        <Modal.Header 
          closeButton
          style={{
            backgroundColor: '#6F42C1',
            color: 'white',
            borderBottom: 'none'
          }}
        >
          <Modal.Title style={{ color: 'white', fontWeight: '600' }}>Add Driver</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreate}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile Number *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.mobile_no}
                    onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
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
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assign Center</Form.Label>
                  <Form.Select
                    value={formData.center_id}
                    onChange={(e) => setFormData({ ...formData, center_id: e.target.value })}
                  >
                    <option value="">Select Center</option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.dairy_name}
                      </option>
                    ))}
                  </Form.Select>
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
                  <Form.Label>License Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>License Expiry</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehicle Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehicle Type</Form.Label>
                  <Form.Select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  >
                    <option value="bike">Bike</option>
                    <option value="auto">Auto</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Salary per Month</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.salary_per_month}
                    onChange={(e) => setFormData({ ...formData, salary_per_month: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Joining Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
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
                Create Driver
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* View Location Modal */}
      <Modal show={showLocationModal} onHide={() => { setShowLocationModal(false); setLocationDriver(null); }} size="lg">
        <Modal.Header 
          closeButton
          style={{
            backgroundColor: '#6F42C1',
            color: 'white',
            borderBottom: 'none'
          }}
        >
          <Modal.Title style={{ color: 'white', fontWeight: '600' }}>
            <FiMapPin className="me-2" />
            Driver Location - {locationDriver ? `${locationDriver.first_name} ${locationDriver.last_name}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {locationDriver ? (
            <div>
              {locationDriver.latitude && locationDriver.longitude ? (
                <div>
                  <div className="mb-3 p-3 bg-light rounded">
                    <p className="mb-2"><strong>Driver:</strong> {locationDriver.first_name} {locationDriver.last_name}</p>
                    <p className="mb-2"><strong>Mobile:</strong> {locationDriver.mobile_no}</p>
                    <p className="mb-1"><strong>Coordinates:</strong></p>
                    <p className="mb-0 ms-3">Latitude: {locationDriver.latitude}</p>
                    <p className="mb-0 ms-3">Longitude: {locationDriver.longitude}</p>
                  </div>
                  <div className="mb-3">
                    <a
                      href={`https://www.google.com/maps?q=${locationDriver.latitude},${locationDriver.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <FiMapPin className="me-2" />
                      Open in Google Maps
                    </a>
                  </div>
                  <div style={{ width: '100%', height: '400px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${locationDriver.latitude},${locationDriver.longitude}&z=15&output=embed`}
                      allowFullScreen
                      title="Driver Location"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <FiMapPin size={48} className="mb-3 opacity-25" />
                  <p>Location data not available for this driver</p>
                  <p className="small">The driver may not have shared their location yet.</p>
                </div>
              )}
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => { setShowLocationModal(false); setLocationDriver(null); }}
            className="fw-semibold"
            style={{
              backgroundColor: '#17A2B8',
              borderColor: '#17A2B8',
              color: 'white',
              borderRadius: '8px'
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); resetForm(); }} size="lg">
        <Modal.Header 
          closeButton
          style={{
            backgroundColor: '#6F42C1',
            color: 'white',
            borderBottom: 'none'
          }}
        >
          <Modal.Title style={{ color: 'white', fontWeight: '600' }}>Edit Driver</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdate}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assign Center</Form.Label>
                  <Form.Select
                    value={formData.center_id}
                    onChange={(e) => setFormData({ ...formData, center_id: e.target.value })}
                  >
                    <option value="">Select Center</option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.dairy_name}
                      </option>
                    ))}
                  </Form.Select>
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>License Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>License Expiry</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehicle Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehicle Type</Form.Label>
                  <Form.Select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  >
                    <option value="bike">Bike</option>
                    <option value="auto">Auto</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Salary per Month</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.salary_per_month}
                    onChange={(e) => setFormData({ ...formData, salary_per_month: e.target.value })}
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
                Update Driver
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Driver Details Modal */}
      <Modal show={showDetailsModal} onHide={() => { setShowDetailsModal(false); setDetailsDriver(null); }} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FiEye className="me-2" />
            Driver Details - {detailsDriver ? `${detailsDriver.first_name} ${detailsDriver.last_name}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsDriver ? (
            <div>
              {/* Personal Information */}
              <div className="mb-4">
                <h5 className="mb-3 border-bottom pb-2">Personal Information</h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Name:</strong> {detailsDriver.first_name} {detailsDriver.last_name}</p>
                    <p><strong>Mobile Number:</strong> {detailsDriver.mobile_no}</p>
                    <p><strong>Email:</strong> {detailsDriver.email || 'N/A'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Status:</strong> 
                      <Badge bg={detailsDriver.is_active === true ? 'success' : 'danger'} className="ms-2">
                        {detailsDriver.is_active === true ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                    <p><strong>Duty Status:</strong> 
                      <Badge bg={detailsDriver.is_on_duty ? 'success' : 'secondary'} className="ms-2">
                        {detailsDriver.is_on_duty ? 'On Duty' : 'Off Duty'}
                      </Badge>
                    </p>
                    <p><strong>Joining Date:</strong> {detailsDriver.joining_date ? new Date(detailsDriver.joining_date).toLocaleDateString() : 'N/A'}</p>
                  </Col>
                </Row>
              </div>

              {/* Vehicle Information */}
              <div className="mb-4">
                <h5 className="mb-3 border-bottom pb-2">Vehicle Information</h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Vehicle Number:</strong> {detailsDriver.vehicle_number || 'N/A'}</p>
                    <p><strong>Vehicle Type:</strong> {detailsDriver.vehicle_type ? detailsDriver.vehicle_type.charAt(0).toUpperCase() + detailsDriver.vehicle_type.slice(1) : 'N/A'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>License Number:</strong> {detailsDriver.license_number || 'N/A'}</p>
                    <p><strong>License Expiry:</strong> {detailsDriver.license_expiry ? new Date(detailsDriver.license_expiry).toLocaleDateString() : 'N/A'}</p>
                  </Col>
                </Row>
              </div>

              {/* Assignment & Salary */}
              <div className="mb-4">
                <h5 className="mb-3 border-bottom pb-2">Assignment & Salary</h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Assigned Centers:</strong> {detailsDriver.centers_count || 0}</p>
                    <p><strong>Center Details:</strong> {detailsDriver.center_number || 'Unassigned'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Salary per Month:</strong> ₹{detailsDriver.salary_per_month ? detailsDriver.salary_per_month.toLocaleString('en-IN') : 'N/A'}</p>
                  </Col>
                </Row>
              </div>

              {/* Emergency Contact */}
              {(detailsDriver.emergency_contact_name || detailsDriver.emergency_contact_mobile) && (
                <div className="mb-4">
                  <h5 className="mb-3 border-bottom pb-2">Emergency Contact</h5>
                  <Row>
                    <Col md={6}>
                      <p><strong>Contact Name:</strong> {detailsDriver.emergency_contact_name || 'N/A'}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Contact Mobile:</strong> {detailsDriver.emergency_contact_mobile || 'N/A'}</p>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Location Information */}
              <div className="mb-4">
                <h5 className="mb-3 border-bottom pb-2">Current Location</h5>
                {detailsDriver.latitude && detailsDriver.longitude ? (
                  <div>
                    <div className="mb-3 p-3 bg-light rounded">
                      <p className="mb-2"><strong>Coordinates:</strong></p>
                      <p className="mb-0 ms-3">Latitude: {detailsDriver.latitude}</p>
                      <p className="mb-0 ms-3">Longitude: {detailsDriver.longitude}</p>
                    </div>
                    <div className="mb-3">
                      <a
                        href={`https://www.google.com/maps?q=${detailsDriver.latitude},${detailsDriver.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        <FiMapPin className="me-2" />
                        Open in Google Maps
                      </a>
                    </div>
                    <div style={{ width: '100%', height: '400px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${detailsDriver.latitude},${detailsDriver.longitude}&z=15&output=embed`}
                        allowFullScreen
                        title="Driver Location"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted py-3">
                    <FiMapPin size={32} className="mb-2 opacity-25" />
                    <p>Location data not available</p>
                    <p className="small">The driver may not have shared their location yet.</p>
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
            onClick={() => { setShowDetailsModal(false); setDetailsDriver(null); }}
            className="fw-semibold"
            style={{
              backgroundColor: '#17A2B8',
              borderColor: '#17A2B8',
              color: 'white',
              borderRadius: '8px'
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Drivers;
