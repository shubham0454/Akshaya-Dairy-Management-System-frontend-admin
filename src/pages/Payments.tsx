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
import Pagination from 'react-bootstrap/Pagination';
import { FiDownload, FiPlus, FiEdit } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { generateDriverPaymentPDF, generateCenterPaymentPDF } from '../utils/pdfGenerator';
import { format } from 'date-fns';

interface Payment {
  id: string;
  payment_code: string;
  payment_type: string;
  vendor_id: string;
  vendor_name?: string;
  final_amount: number;
  status: string;
  payment_month: string;
  total_amount: number;
  advance_amount: number;
  previous_pending: number;
  deductions: number;
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    vendor_id: '',
    payment_type: 'monthly_milk',
    payment_month: new Date().toISOString().substring(0, 7) + '-01',
    total_amount: '',
    advance_amount: '0',
    previous_pending: '0',
    deductions: '0',
    final_amount: '',
    payment_notes: '',
  });
  const [statusData, setStatusData] = useState({
    status: 'paid',
    transaction_id: '',
    payment_method: 'bank_transfer',
  });

  useEffect(() => {
    fetchPayments();
    fetchCenters();
  }, [currentPage]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/payment');
      const paymentsData = response.data.data || [];
      setAllPayments(paymentsData);
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setPayments(paymentsData.slice(startIndex, endIndex));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch payments');
      setAllPayments([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await axios.get('/centers');
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    }
  };

  const handleCalculate = async () => {
    if (!formData.vendor_id || !formData.payment_month) {
      toast.error('Please select vendor and month');
      return;
    }
    try {
      const response = await axios.get('/payment/calculate', {
        params: {
          vendor_id: formData.vendor_id,
          month: formData.payment_month,
        },
      });
      const calc = response.data.data;
      setFormData({
        ...formData,
        total_amount: calc.totalMilkAmount?.toFixed(2) || '0',
        advance_amount: calc.advanceAmount?.toFixed(2) || '0',
        previous_pending: calc.previousPending?.toFixed(2) || '0',
        deductions: calc.deductions?.toFixed(2) || '0',
        final_amount: calc.finalAmount?.toFixed(2) || '0',
      });
      toast.success('Payment calculated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to calculate payment');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/payment', {
        ...formData,
        total_amount: parseFloat(formData.total_amount) || 0,
        advance_amount: parseFloat(formData.advance_amount) || 0,
        previous_pending: parseFloat(formData.previous_pending) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        final_amount: parseFloat(formData.final_amount) || 0,
      });
      toast.success('Payment created successfully!');
      setShowModal(false);
      resetForm();
      fetchPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create payment');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      await axios.patch(`/payment/${selectedPayment.id}/status`, statusData);
      toast.success('Payment status updated!');
      setShowStatusModal(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDownloadCenterPDF = async (payment: Payment) => {
    try {
      const center = centers.find(c => c.id === payment.vendor_id);
      const monthStart = new Date(payment.payment_month);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      
      const collections = await axios.get('/milk/collections', {
        params: {
          vendor_id: payment.vendor_id,
          start_date: monthStart.toISOString().split('T')[0],
          end_date: monthEnd.toISOString().split('T')[0],
        },
      });

      generateCenterPaymentPDF({
        centerName: center?.dairy_name || 'Unknown',
        month: format(new Date(payment.payment_month), 'MMMM yyyy'),
        totalMilkAmount: payment.total_amount || 0,
        advanceAmount: payment.advance_amount || 0,
        previousPending: payment.previous_pending || 0,
        deductions: payment.deductions || 0,
        finalAmount: payment.final_amount || 0,
        paymentCode: payment.payment_code,
        collections: collections.data.data || [],
      });

      toast.success('PDF downloaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate PDF');
    }
  };

  const handleDownloadDriverPDF = async (payment: Payment) => {
    try {
      const monthStart = new Date(payment.payment_month);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      
      const response = await axios.get('/reports/driver-salary', {
        params: {
          driver_id: payment.vendor_id,
          start_date: monthStart.toISOString().split('T')[0],
          end_date: monthEnd.toISOString().split('T')[0],
        },
      });

      const data = response.data.data;
      generateDriverPaymentPDF({
        driverName: data.driver.name,
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
        baseSalary: data.salary.baseSalary,
        overtime: data.salary.overtime,
        bonus: data.salary.bonus,
        deductions: data.salary.deductions,
        finalAmount: data.salary.finalAmount,
        paymentCode: payment.payment_code,
        collections: data.collections,
      });

      toast.success('PDF downloaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate PDF');
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_id: '',
      payment_type: 'monthly_milk',
      payment_month: new Date().toISOString().substring(0, 7) + '-01',
      total_amount: '',
      advance_amount: '0',
      previous_pending: '0',
      deductions: '0',
      final_amount: '',
      payment_notes: '',
    });
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: '#6F42C1' }}>Payments</h2>
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
          Create Payment
        </Button>
      </div>

      <>
        {payments.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center p-5">
              <p className="text-muted mb-0">No payments found.</p>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Payment Code</th>
                    <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Type</th>
                    <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Center/Driver</th>
                    <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Month</th>
                    <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Amount</th>
                    <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Status</th>
                    <th style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.payment_code}</td>
                  <td>
                    <Badge 
                      style={{
                        backgroundColor: '#007BFF',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px'
                      }}
                    >
                      {payment.payment_type}
                    </Badge>
                  </td>
                  <td className="fw-semibold">{payment.vendor_name || 'N/A'}</td>
                  <td>{payment.payment_month ? format(new Date(payment.payment_month), 'MMM yyyy') : 'N/A'}</td>
                  <td className="fw-semibold" style={{ color: '#6F42C1' }}>
                    ₹{(payment.final_amount || 0).toFixed(2)}
                  </td>
                  <td>
                    <Badge 
                      style={{
                        backgroundColor: payment.status === 'paid' ? '#00CCCC' : payment.status === 'approved' ? '#6F42C1' : '#F5F5F5',
                        color: payment.status === 'paid' || payment.status === 'approved' ? 'white' : '#1E2329',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: payment.status === 'paid' || payment.status === 'approved' ? 'none' : '1px solid #E5E7EB'
                      }}
                    >
                      {payment.status}
                    </Badge>
                  </td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-primary" size="sm">
                        Actions
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => { setSelectedPayment(payment); setShowStatusModal(true); }}>
                          <FiEdit className="me-2" />
                          Update Status
                        </Dropdown.Item>
                        {payment.payment_type === 'monthly_milk' && (
                          <Dropdown.Item onClick={() => handleDownloadCenterPDF(payment)}>
                            <FiDownload className="me-2" />
                            Download PDF
                          </Dropdown.Item>
                        )}
                        {payment.payment_type === 'driver_salary' && (
                          <Dropdown.Item onClick={() => handleDownloadDriverPDF(payment)}>
                            <FiDownload className="me-2" />
                            Download PDF
                          </Dropdown.Item>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
              </Table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {allPayments.length > itemsPerPage && (
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
            {Array.from({ length: Math.ceil(allPayments.length / itemsPerPage) }, (_, i) => i + 1)
              .filter(page => {
                const totalPages = Math.ceil(allPayments.length / itemsPerPage);
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
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(allPayments.length / itemsPerPage), prev + 1))} 
              disabled={currentPage === Math.ceil(allPayments.length / itemsPerPage)}
            />
            <Pagination.Last 
              onClick={() => setCurrentPage(Math.ceil(allPayments.length / itemsPerPage))} 
              disabled={currentPage === Math.ceil(allPayments.length / itemsPerPage)}
            />
          </Pagination>
        </div>
        )}
      </>

      {/* Create Payment Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreate}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Type *</Form.Label>
                  <Form.Select
                    value={formData.payment_type}
                    onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                    required
                  >
                    <option value="monthly_milk">Monthly Milk</option>
                    <option value="driver_salary">Driver Salary</option>
                    <option value="advance">Advance</option>
                    <option value="adjustment">Adjustment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vendor/Center *</Form.Label>
                  <Form.Select
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                    required
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
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Month *</Form.Label>
                  <Form.Control
                    type="month"
                    value={formData.payment_month.substring(0, 7)}
                    onChange={(e) => setFormData({ ...formData, payment_month: e.target.value + '-01' })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>&nbsp;</Form.Label>
                  <Button variant="outline-secondary" onClick={handleCalculate} className="w-100">
                    Calculate Payment
                  </Button>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Advance Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.advance_amount}
                    onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Previous Pending</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.previous_pending}
                    onChange={(e) => setFormData({ ...formData, previous_pending: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deductions</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Final Amount *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData.final_amount}
                onChange={(e) => setFormData({ ...formData, final_amount: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.payment_notes}
                onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
              />
            </Form.Group>
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
                Create Payment
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Update Status Modal */}
      <Modal show={showStatusModal} onHide={() => { setShowStatusModal(false); setSelectedPayment(null); }}>
        <Modal.Header 
          closeButton
          style={{
            backgroundColor: '#6F42C1',
            color: 'white',
            borderBottom: 'none'
          }}
        >
          <Modal.Title style={{ color: 'white', fontWeight: '600' }}>Update Payment Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateStatus}>
            <Form.Group className="mb-3">
              <Form.Label>Status *</Form.Label>
              <Form.Select
                value={statusData.status}
                onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                required
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
            {statusData.status === 'paid' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Transaction ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={statusData.transaction_id}
                    onChange={(e) => setStatusData({ ...statusData, transaction_id: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select
                    value={statusData.payment_method}
                    onChange={(e) => setStatusData({ ...statusData, payment_method: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </Form.Select>
                </Form.Group>
              </>
            )}
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2 fw-semibold" 
                onClick={() => { setShowStatusModal(false); setSelectedPayment(null); }}
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
                Update Status
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Payments;
