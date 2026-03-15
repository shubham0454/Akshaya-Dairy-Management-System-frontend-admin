import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Table, 
  Badge, 
  Spinner, 
  Button, 
  Form, 
  Row, 
  Col,
  Modal,
  InputGroup
} from 'react-bootstrap';
import Pagination from 'react-bootstrap/Pagination';
import { FiFilter, FiRefreshCw, FiCheckCircle, FiXCircle, FiEdit, FiEye, FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

interface MilkCollection {
  id: string;
  collection_code?: string;
  collection_date: string;
  collection_time: string;
  milk_type: string;
  milk_weight: number;
  fat_percentage: number;
  snf_percentage: number;
  rate_per_liter: number;
  base_value?: number;
  total_amount: number;
  status: string;
  vendor_name?: string;
  // vendor_id?: string; // Commented out - using center_id only
  driver_name?: string;
  center_id?: string;
  center_name?: string;
  old_base_price?: number;
  old_net_price?: number;
  net_price?: number;
  quality_notes?: string;
  comments?: string;
}

const MilkCollections = () => {
  const [collections, setCollections] = useState<MilkCollection[]>([]);
  const [allCollections, setAllCollections] = useState<MilkCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    collection_date: '',
    collection_time: '',
    status: '',
    center_id: '', // Changed from vendor_id to center_id
  });
  const [centers, setCenters] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGroup, setEditGroup] = useState<any>(null);
  const [editData, setEditData] = useState<any>({ cow: {}, buffalo: {} });
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewCollection, setViewCollection] = useState<MilkCollection | null>(null);

  useEffect(() => {
    fetchCenters();
    fetchCollections();
  }, [currentPage]);

  // Listen for collection updates from other pages
  useEffect(() => {
    const handleCollectionsUpdated = () => {
      fetchCollections();
    };
    window.addEventListener('collections-updated', handleCollectionsUpdated);
    return () => {
      window.removeEventListener('collections-updated', handleCollectionsUpdated);
    };
  }, []);

  // Refresh collections when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCollections();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.start_date, filters.end_date, filters.collection_date, filters.collection_time, filters.center_id]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 1000 };
      
      if (filters.start_date && filters.end_date) {
        params.start_date = filters.start_date;
        params.end_date = filters.end_date;
      } else if (filters.collection_date) {
        params.collection_date = filters.collection_date;
      }
      
      if (filters.collection_time) params.collection_time = filters.collection_time;
      if (filters.status) params.status = filters.status;
      // Use center_id instead of vendor_id
      if (filters.center_id) params.center_id = filters.center_id;

      const response = await axios.get('/milk/collections', { params });
      const data = response.data.data || [];
      
      if (!Array.isArray(data)) {
        console.error('Invalid data format received:', data);
        toast.error('Invalid data format received from server');
        setCollections([]);
        setAllCollections([]);
        return;
      }
      
      // Group by center, date, and time, then separate cow and buffalo
      const grouped = groupCollectionsByCenterDateTime(data, centers);
      setAllCollections(grouped);
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setCollections(grouped.slice(startIndex, endIndex));
      
      if (grouped.length === 0 && data.length > 0) {
        console.warn('Data received but grouping resulted in empty array:', data);
      }
    } catch (error: any) {
      console.error('Fetch collections error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch collections';
      toast.error(errorMessage);
      setCollections([]);
      setAllCollections([]);
    } finally {
      setLoading(false);
    }
  };

  // Group collections by center_id, date, time - showing cow first, then buffalo
  const groupCollectionsByCenterDateTime = (data: MilkCollection[], centersList: any[] = centers) => {
    const grouped = new Map<string, any>();
    
    if (!data || data.length === 0) {
      return [];
    }
    
    data.forEach((collection) => {
      // Use center_id as primary key for grouping (center_id + collection_date + collection_time)
      const centerId = collection.center_id || collection.vendor_id || (collection as any).center_id; // Fallback to vendor_id if center_id is missing
      const collectionDate = collection.collection_date;
      const collectionTime = collection.collection_time;
      
      // Skip if essential data is missing
      if (!centerId || !collectionDate || !collectionTime) {
        console.warn('Skipping collection with missing data:', collection);
        return;
      }
      
      // Create unique key: center_id-collection_date-collection_time
      const key = `${centerId}-${collectionDate}-${collectionTime}`;
      
      if (!grouped.has(key)) {
        // Get center name from collection or find it from centers list
        let centerName = collection.center_name || collection.vendor_name;
        if (!centerName && centersList && centersList.length > 0) {
          const center = centersList.find(c => c.id === centerId || c.id === collection.vendor_id);
          centerName = center?.dairy_name || 'N/A';
        }
        
        // Create new group for this center, date, and time combination
        grouped.set(key, {
          id: `${centerId}-${collectionDate}-${collectionTime}`, // Unique group ID
          center_name: centerName || 'N/A',
          center_id: centerId,
          collection_date: collectionDate,
          collection_time: collectionTime,
          status: collection.status || 'collected',
          cow: null,
          buffalo: null,
          quality_notes: collection.quality_notes,
          comments: collection.quality_notes || collection.comments || '', // Use quality_notes as comments
        });
      }
      
      const group = grouped.get(key);
      // Separate cow and buffalo milk within the same group
      if (collection.milk_type === 'cow') {
        group.cow = {
          ...collection,
          rate_per_liter: collection.rate_per_liter || collection.base_value || 0,
          milk_weight: collection.milk_weight || 0,
          fat_percentage: collection.fat_percentage || 0,
          snf_percentage: collection.snf_percentage || 0,
        };
      } else if (collection.milk_type === 'buffalo') {
        group.buffalo = {
          ...collection,
          rate_per_liter: collection.rate_per_liter || collection.base_value || 0,
          milk_weight: collection.milk_weight || 0,
          fat_percentage: collection.fat_percentage || 0,
          snf_percentage: collection.snf_percentage || 0,
        };
      }
      // Update comments if available (prefer cow's comments, then buffalo's)
      if (collection.quality_notes || collection.comments) {
        group.comments = collection.quality_notes || collection.comments || group.comments;
      }
    });
    
    // Sort grouped results: by center name, then date (desc), then time (morning first)
    const groupedArray = Array.from(grouped.values());
    groupedArray.sort((a, b) => {
      // First sort by center name
      if (a.center_name !== b.center_name) {
        return a.center_name.localeCompare(b.center_name);
      }
      // Then by date (newest first)
      const dateA = new Date(a.collection_date);
      const dateB = new Date(b.collection_date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      // Finally by time (morning before evening)
      if (a.collection_time !== b.collection_time) {
        return a.collection_time === 'morning' ? -1 : 1;
      }
      return 0;
    });
    
    return groupedArray;
  };

  const fetchCenters = async () => {
    try {
      const response = await axios.get('/centers');
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/milk/collections/${id}/status`, { status });
      toast.success('Status updated successfully!');
      fetchCollections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleEditDataChange = (milkType: 'cow' | 'buffalo', field: string, value: string) => {
    // Prevent negative values for all numeric fields
    const numValue = parseFloat(value);
    if (value !== '' && !isNaN(numValue) && numValue < 0) {
      return; // Don't update if negative
    }
    
    setEditData(prev => ({
      ...prev,
      [milkType]: {
        ...prev[milkType],
        [field]: value
      }
    }));
  };

  const handleEdit = (group: any) => {
    setEditGroup(group);
    const cowData = group.cow || {};
    const buffaloData = group.buffalo || {};
    
    setEditData({
      cow: {
        base_price: cowData.base_value || cowData.rate_per_liter || 0,
        net_price: cowData.net_price || cowData.rate_per_liter || 0,
        fat_percentage: cowData.fat_percentage || 0,
        snf_percentage: cowData.snf_percentage || 0,
        milk_weight: cowData.milk_weight || 0,
        old_base_price: cowData.old_base_price,
        old_net_price: cowData.old_net_price,
      },
      buffalo: {
        base_price: buffaloData.base_value || buffaloData.rate_per_liter || 0,
        net_price: buffaloData.net_price || buffaloData.rate_per_liter || 0,
        fat_percentage: buffaloData.fat_percentage || 0,
        snf_percentage: buffaloData.snf_percentage || 0,
        milk_weight: buffaloData.milk_weight || 0,
        old_base_price: buffaloData.old_base_price,
        old_net_price: buffaloData.old_net_price,
      },
      comments: group.comments || group.quality_notes || (group.cow?.quality_notes) || (group.buffalo?.quality_notes) || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editGroup) return;

      // Update both cow and buffalo if they exist
      const updates = [];
      const comments = editData.comments || '';

      // Update Cow
      if (editGroup.cow && editData.cow) {
        const cowData = editGroup.cow;
        const cowId = cowData.id;
        const currentBasePrice = cowData.base_value || cowData.rate_per_liter;
        const newBasePrice = parseFloat(editData.cow.base_price);

        if (newBasePrice !== currentBasePrice) {
          await axios.post(`/milk/center-price`, {
            center_id: editGroup.center_id,
            price_date: editGroup.collection_date,
            milk_type: 'cow',
            base_price: newBasePrice,
            net_price: editData.cow.net_price ? parseFloat(editData.cow.net_price) : null,
          });
        }

        try {
          const priceResponse = await axios.get('/milk-price/single', {
            params: {
              date: editGroup.collection_date,
              milk_type: 'cow',
            },
          });

          const priceConfig = priceResponse.data.data;
          if (priceConfig) {
            const fatDiff = parseFloat(editData.cow.fat_percentage) - (priceConfig.base_fat || 0);
            const snfDiff = parseFloat(editData.cow.snf_percentage) - (priceConfig.base_snf || 0);
            const calculatedRate = newBasePrice + (fatDiff * priceConfig.fat_rate) + (snfDiff * priceConfig.snf_rate) + (priceConfig.bonus || 0);
            const finalRate = editData.cow.net_price ? parseFloat(editData.cow.net_price) : calculatedRate;
            const newTotal = (parseFloat(editData.cow.milk_weight) * finalRate) / 100;

            updates.push(
              axios.patch(`/milk/collections/${cowId}`, {
                fat_percentage: parseFloat(editData.cow.fat_percentage),
                snf_percentage: parseFloat(editData.cow.snf_percentage),
                milk_weight: parseFloat(editData.cow.milk_weight),
                rate_per_liter: finalRate,
                total_amount: Math.round(newTotal * 100) / 100,
                base_value: newBasePrice,
                net_price: editData.cow.net_price ? parseFloat(editData.cow.net_price) : null,
                old_base_price: currentBasePrice !== newBasePrice ? currentBasePrice : cowData.old_base_price,
                old_net_price: editData.cow.net_price && cowData.net_price && parseFloat(editData.cow.net_price) !== cowData.net_price 
                  ? cowData.net_price 
                  : cowData.old_net_price,
                quality_notes: comments,
              })
            );
          }
        } catch (error) {
          const finalRate = editData.cow.net_price ? parseFloat(editData.cow.net_price) : newBasePrice;
          const newTotal = (parseFloat(editData.cow.milk_weight) * finalRate) / 100;
          
          updates.push(
            axios.patch(`/milk/collections/${cowId}`, {
              fat_percentage: parseFloat(editData.cow.fat_percentage),
              snf_percentage: parseFloat(editData.cow.snf_percentage),
              milk_weight: parseFloat(editData.cow.milk_weight),
              rate_per_liter: finalRate,
              total_amount: Math.round(newTotal * 100) / 100,
              base_value: newBasePrice,
              net_price: editData.cow.net_price ? parseFloat(editData.cow.net_price) : null,
              quality_notes: comments,
            })
          );
        }
      }

      // Update Buffalo
      if (editGroup.buffalo && editData.buffalo) {
        const buffaloData = editGroup.buffalo;
        const buffaloId = buffaloData.id;
        const currentBasePrice = buffaloData.base_value || buffaloData.rate_per_liter;
        const newBasePrice = parseFloat(editData.buffalo.base_price);

        if (newBasePrice !== currentBasePrice) {
          await axios.post(`/milk/center-price`, {
            center_id: editGroup.center_id,
            price_date: editGroup.collection_date,
            milk_type: 'buffalo',
            base_price: newBasePrice,
            net_price: editData.buffalo.net_price ? parseFloat(editData.buffalo.net_price) : null,
          });
        }

        try {
          const priceResponse = await axios.get('/milk-price/single', {
            params: {
              date: editGroup.collection_date,
              milk_type: 'buffalo',
            },
          });

          const priceConfig = priceResponse.data.data;
          if (priceConfig) {
            const fatDiff = parseFloat(editData.buffalo.fat_percentage) - (priceConfig.base_fat || 0);
            const snfDiff = parseFloat(editData.buffalo.snf_percentage) - (priceConfig.base_snf || 0);
            const calculatedRate = newBasePrice + (fatDiff * priceConfig.fat_rate) + (snfDiff * priceConfig.snf_rate) + (priceConfig.bonus || 0);
            const finalRate = editData.buffalo.net_price ? parseFloat(editData.buffalo.net_price) : calculatedRate;
            const newTotal = (parseFloat(editData.buffalo.milk_weight) * finalRate) / 100;

            updates.push(
              axios.patch(`/milk/collections/${buffaloId}`, {
                fat_percentage: parseFloat(editData.buffalo.fat_percentage),
                snf_percentage: parseFloat(editData.buffalo.snf_percentage),
                milk_weight: parseFloat(editData.buffalo.milk_weight),
                rate_per_liter: finalRate,
                total_amount: Math.round(newTotal * 100) / 100,
                base_value: newBasePrice,
                net_price: editData.buffalo.net_price ? parseFloat(editData.buffalo.net_price) : null,
                old_base_price: currentBasePrice !== newBasePrice ? currentBasePrice : buffaloData.old_base_price,
                old_net_price: editData.buffalo.net_price && buffaloData.net_price && parseFloat(editData.buffalo.net_price) !== buffaloData.net_price 
                  ? buffaloData.net_price 
                  : buffaloData.old_net_price,
                quality_notes: comments,
              })
            );
          }
        } catch (error) {
          const finalRate = editData.buffalo.net_price ? parseFloat(editData.buffalo.net_price) : newBasePrice;
          const newTotal = (parseFloat(editData.buffalo.milk_weight) * finalRate) / 100;
          
          updates.push(
            axios.patch(`/milk/collections/${buffaloId}`, {
              fat_percentage: parseFloat(editData.buffalo.fat_percentage),
              snf_percentage: parseFloat(editData.buffalo.snf_percentage),
              milk_weight: parseFloat(editData.buffalo.milk_weight),
              rate_per_liter: finalRate,
              total_amount: Math.round(newTotal * 100) / 100,
              base_value: newBasePrice,
              net_price: editData.buffalo.net_price ? parseFloat(editData.buffalo.net_price) : null,
              quality_notes: comments,
            })
          );
        }
      }

      await Promise.all(updates);
      toast.success('Collections updated successfully!');
      setShowEditModal(false);
      setEditGroup(null);
      setEditData({ cow: {}, buffalo: {} });
      fetchCollections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update collections');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditGroup(null);
    setEditData({ cow: {}, buffalo: {} });
  };

  const handleViewDetails = (collection: any) => {
    setViewCollection(collection);
    setShowViewModal(true);
  };

  const calculateTotal = (fat: number, snf: number, rate: number, weight: number) => {
    // Simple calculation: (weight * rate) / 100
    return ((weight * rate) / 100).toFixed(2);
  };

  // Helper function to safely format numbers
  const formatNumber = (value: any, decimals: number = 2): string => {
    if (value === null || value === undefined || value === '') return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals);
  };

  const handleFilter = () => {
    fetchCollections();
  };

  const handleReset = () => {
    setFilters({
      start_date: '',
      end_date: '',
      collection_date: '',
      collection_time: '',
      status: '',
      center_id: '', // Changed from vendor_id to center_id
    });
    setTimeout(() => {
      fetchCollections();
    }, 100);
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Milk Collections</h2>
        <Button 
          variant="outline-primary" 
          onClick={handleReset}
          className="fw-semibold"
          style={{
            borderColor: '#6F42C1',
            color: '#6F42C1',
            borderRadius: '8px'
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
          <FiRefreshCw className="me-2" />
          Reset Filters
        </Button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <Row>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value, collection_date: '' })}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value, collection_date: '' })}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Or Single Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.collection_date}
                  onChange={(e) => setFilters({ ...filters, collection_date: e.target.value, start_date: '', end_date: '' })}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Time</Form.Label>
                <Form.Select
                  value={filters.collection_time}
                  onChange={(e) => setFilters({ ...filters, collection_time: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {/* Status Filter - Commented out */}
            {/* <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="collected">Collected</option>
                  <option value="delivered">Delivered</option>
                  <option value="processed">Processed</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </Form.Group>
            </Col> */}
            <Col md={2}>
              <Form.Group>
                <Form.Label>Center</Form.Label>
                <Form.Select
                  value={filters.center_id}
                  onChange={(e) => setFilters({ ...filters, center_id: e.target.value })}
                >
                  <option value="">All Centers</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.dairy_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Button 
                variant="primary" 
                onClick={handleFilter}
                className="fw-semibold"
                style={{
                  backgroundColor: '#6F42C1',
                  borderColor: '#6F42C1',
                  borderRadius: '8px'
                }}
              >
                <FiFilter className="me-2" />
                Filter
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="text-center p-5 bg-light rounded">
          <p className="text-muted mb-0">
            <FiXCircle className="me-2" style={{ fontSize: '2rem', color: '#6c757d' }} />
            No collections found. Try adjusting your filters or add a new collection.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
        <Table striped bordered hover responsive className="table-hover">
          <thead>
            <tr>
                <th className="align-middle" style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Center Name</th>
              <th className="align-middle" style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Date</th>
              <th className="align-middle" style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Time</th>
                <th colSpan={2} className="text-center" style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>COW MILK</th>
                <th colSpan={2} className="text-center" style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>BUFFALO MILK</th>
              {/* <th>Status</th> */}
              <th className="align-middle text-center" style={{ backgroundColor: '#F5F5F5', color: '#1E2329', fontWeight: 600 }}>Actions</th>
            </tr>
              <tr>
                <th style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)' }}></th>
                <th style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)' }}></th>
                <th style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)' }}></th>
                {/* Cow columns */}
                <th className="text-center" style={{ backgroundColor: 'rgba(0, 123, 255, 0.1)' }}>Price (₹)</th>
                <th className="text-center" style={{ backgroundColor: 'rgba(0, 123, 255, 0.1)' }}>Weight (kg)</th>
                {/* Buffalo columns */}
                <th className="text-center" style={{ backgroundColor: 'rgba(0, 204, 204, 0.1)' }}>Price (₹)</th>
                <th className="text-center" style={{ backgroundColor: 'rgba(0, 204, 204, 0.1)' }}>Weight (kg)</th>
                <th style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)' }}></th>
            </tr>
          </thead>
          <tbody>
              {collections.map((group) => (
                <tr key={group.id}>
                  <td className="fw-semibold">{group.center_name}</td>
                  <td>{format(new Date(group.collection_date), 'dd/MM/yyyy')}</td>
                  <td>
                    <Badge bg={group.collection_time === 'morning' ? 'success' : 'info'} style={{ 
                      backgroundColor: group.collection_time === 'morning' ? '#00CCCC' : '#007BFF',
                      color: 'white'
                    }}>
                      {group.collection_time}
                  </Badge>
                </td>
                   
                  {/* Cow Milk Columns - Simplified */}
                  {group.cow && group.cow.milk_weight && group.cow.milk_weight > 0 ? (
                    <>
                      <td className="text-center fw-semibold" style={{ color: '#007BFF' }}>
                        ₹{formatNumber(group.cow.rate_per_liter || group.cow.base_value || group.cow.net_price || 0)}
                      </td>
                      <td className="text-center fw-semibold">{formatNumber(group.cow.milk_weight || 0)}</td>
                    </>
                  ) : (
                    <>
                      <td className="text-center text-muted" style={{ fontStyle: 'italic' }}>-</td>
                      <td className="text-center text-muted" style={{ fontStyle: 'italic' }}>-</td>
                    </>
                  )}

                  {/* Buffalo Milk Columns - Simplified */}
                  {group.buffalo && group.buffalo.milk_weight && group.buffalo.milk_weight > 0 ? (
                    <>
                      <td className="text-center fw-semibold" style={{ color: '#00CCCC' }}>
                        ₹{formatNumber(group.buffalo.rate_per_liter || group.buffalo.base_value || group.buffalo.net_price || 0)}
                      </td>
                      <td className="text-center fw-semibold">{formatNumber(group.buffalo.milk_weight || 0)}</td>
                    </>
                  ) : (
                    <>
                      <td className="text-center text-muted" style={{ fontStyle: 'italic' }}>-</td>
                      <td className="text-center text-muted" style={{ fontStyle: 'italic' }}>-</td>
                    </>
                  )}

                  {/* Status and Comments - Commented out */}
                {/* <td>
                  <Badge bg={
                      group.status === 'delivered' ? 'success' :
                      group.status === 'processed' ? 'primary' :
                      group.status === 'rejected' ? 'danger' : 'warning'
                    } className="mb-1 d-block">
                      {group.status || 'collected'}
                  </Badge>
                  {group.comments && (
                    <div className="mt-1">
                      <small className="text-muted" title={group.comments}>
                        <em>💬 {group.comments.length > 30 ? group.comments.substring(0, 30) + '...' : group.comments}</em>
                      </small>
                    </div>
                  )}
                </td> */}
                <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewDetails(group)}
                        className="me-1"
                        style={{
                          borderColor: '#007BFF',
                          color: '#007BFF',
                          borderRadius: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#007BFF';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#007BFF';
                        }}
                      >
                        <FiEye />
                      </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                        onClick={() => handleEdit(group)}
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
                        <FiEdit />
                    </Button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        </div>
      )}

      {/* Pagination */}
      {allCollections.length > itemsPerPage && (
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
            {Array.from({ length: Math.ceil(allCollections.length / itemsPerPage) }, (_, i) => i + 1)
              .filter(page => {
                const totalPages = Math.ceil(allCollections.length / itemsPerPage);
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
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(allCollections.length / itemsPerPage), prev + 1))} 
              disabled={currentPage === Math.ceil(allCollections.length / itemsPerPage)}
            />
            <Pagination.Last 
              onClick={() => setCurrentPage(Math.ceil(allCollections.length / itemsPerPage))} 
              disabled={currentPage === Math.ceil(allCollections.length / itemsPerPage)}
            />
          </Pagination>
        </div>
      )}

      {/* View Details Modal */}
      <Modal show={showViewModal} onHide={() => { setShowViewModal(false); setViewCollection(null); }} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Collection Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewCollection && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Center Name:</strong> {viewCollection.center_name}</p>
                  <p><strong>Date:</strong> {format(new Date(viewCollection.collection_date), 'dd/MM/yyyy')}</p>
                  <p><strong>Time:</strong> 
                    <Badge bg={viewCollection.collection_time === 'morning' ? 'success' : 'info'} className="ms-2">
                      {viewCollection.collection_time}
                    </Badge>
                  </p>
                  {/* Status - Commented out */}
                  {/* <p><strong>Status:</strong> 
                    <Badge bg={
                      viewCollection.status === 'delivered' ? 'success' :
                      viewCollection.status === 'processed' ? 'primary' :
                      viewCollection.status === 'rejected' ? 'danger' : 'warning'
                    } className="ms-2">
                      {viewCollection.status}
                    </Badge>
                  </p> */}
                </Col>
              </Row>

              {viewCollection.cow && (
                <div className="mb-4">
                  <h5 className="border-bottom pb-2">Cow Milk Details</h5>
                  <Row>
                    <Col md={6}>
                      <p><strong>Base Price:</strong> 
                        {viewCollection.cow.old_base_price && (
                          <span className="text-decoration-line-through text-muted ms-2">
                            ₹{formatNumber(viewCollection.cow.old_base_price)}
                          </span>
                        )}
                        <span className="fw-bold ms-2" style={{ color: '#007BFF' }}>
                          ₹{formatNumber(viewCollection.cow.base_value || viewCollection.cow.rate_per_liter)}
                        </span>
                      </p>
                      <p><strong>Net Price:</strong> 
                        {viewCollection.cow.old_net_price && (
                          <span className="text-decoration-line-through text-muted ms-2">
                            ₹{formatNumber(viewCollection.cow.old_net_price)}
                          </span>
                        )}
                        <span className="fw-bold ms-2" style={{ color: '#007BFF' }}>
                          ₹{formatNumber(viewCollection.cow.net_price || viewCollection.cow.rate_per_liter)}
                        </span>
                      </p>
                      <p><strong>FAT %:</strong> {formatNumber(viewCollection.cow.fat_percentage)}</p>
                      <p><strong>SNF %:</strong> {formatNumber(viewCollection.cow.snf_percentage)}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Weight:</strong> {formatNumber(viewCollection.cow.milk_weight)} kg</p>
                      <p><strong>Total Amount:</strong> ₹{formatNumber(viewCollection.cow.total_amount)}</p>
                      <p><strong>Collection Code:</strong> {viewCollection.cow.collection_code || 'N/A'}</p>
                    </Col>
                  </Row>
                </div>
              )}

              {viewCollection.buffalo && (
                <div className="mb-4">
                  <h5 className="border-bottom pb-2">Buffalo Milk Details</h5>
                  <Row>
                    <Col md={6}>
                      <p><strong>Base Price:</strong> 
                        {viewCollection.buffalo.old_base_price && (
                          <span className="text-decoration-line-through text-muted ms-2">
                            ₹{formatNumber(viewCollection.buffalo.old_base_price)}
                          </span>
                        )}
                        <span className="fw-bold ms-2" style={{ color: '#00CCCC' }}>
                          ₹{formatNumber(viewCollection.buffalo.base_value || viewCollection.buffalo.rate_per_liter)}
                        </span>
                      </p>
                      <p><strong>Net Price:</strong> 
                        {viewCollection.buffalo.old_net_price && (
                          <span className="text-decoration-line-through text-muted ms-2">
                            ₹{formatNumber(viewCollection.buffalo.old_net_price)}
                          </span>
                        )}
                        <span className="fw-bold ms-2" style={{ color: '#00CCCC' }}>
                          ₹{formatNumber(viewCollection.buffalo.net_price || viewCollection.buffalo.rate_per_liter)}
                        </span>
                      </p>
                      <p><strong>FAT %:</strong> {formatNumber(viewCollection.buffalo.fat_percentage)}</p>
                      <p><strong>SNF %:</strong> {formatNumber(viewCollection.buffalo.snf_percentage)}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Weight:</strong> {formatNumber(viewCollection.buffalo.milk_weight)} kg</p>
                      <p><strong>Total Amount:</strong> ₹{formatNumber(viewCollection.buffalo.total_amount)}</p>
                      <p><strong>Collection Code:</strong> {viewCollection.buffalo.collection_code || 'N/A'}</p>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => { setShowViewModal(false); setViewCollection(null); }}
            className="fw-semibold"
            style={{
              backgroundColor: '#17A2B8',
              borderColor: '#17A2B8',
              color: 'white',
              borderRadius: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#138496';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#17A2B8';
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={handleCancelEdit} size="xl">
        <Modal.Header 
          closeButton
          style={{
            backgroundColor: '#6F42C1',
            color: 'white',
            borderBottom: 'none'
          }}
        >
          <Modal.Title style={{ color: 'white', fontWeight: '600' }}>Edit Milk Collection - {editGroup?.center_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editGroup && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Center:</strong> {editGroup.center_name}</p>
                  <p><strong>Date:</strong> {format(new Date(editGroup.collection_date), 'dd/MM/yyyy')}</p>
                  <p><strong>Time:</strong> 
                    <Badge bg={editGroup.collection_time === 'morning' ? 'success' : 'info'} className="ms-2">
                      {editGroup.collection_time}
                    </Badge>
                  </p>
                  {/* Status - Commented out */}
                  {/* <p><strong>Status:</strong> 
                    <Badge bg={
                      editGroup.status === 'delivered' ? 'success' :
                      editGroup.status === 'processed' ? 'primary' :
                      editGroup.status === 'rejected' ? 'danger' : 'warning'
                    } className="ms-2">
                      {editGroup.status || 'collected'}
                    </Badge>
                  </p> */}
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Comments / Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Add comments or notes about this collection..."
                      value={editData.comments || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        comments: e.target.value
                      })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                {/* Cow Milk Section */}
                <Col md={6}>
                  <div className="card border-info mb-3">
                    <div className="card-header bg-info text-white">
                      <h5 className="mb-0">Cow Milk</h5>
                    </div>
                    <div className="card-body">
                      {editGroup.cow ? (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label>Base Price (₹)</Form.Label>
                            {editData.cow.old_base_price && (
                              <div className="text-muted small">
                                Old: <span className="text-decoration-line-through">₹{formatNumber(editData.cow.old_base_price)}</span>
                              </div>
                            )}
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              value={editData.cow.base_price}
                              onChange={(e) => handleEditDataChange('cow', 'base_price', e.target.value)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>FAT %</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.1"
                              min="0"
                              value={editData.cow.fat_percentage}
                              onChange={(e) => handleEditDataChange('cow', 'fat_percentage', e.target.value)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>SNF %</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.1"
                              min="0"
                              value={editData.cow.snf_percentage}
                              onChange={(e) => handleEditDataChange('cow', 'snf_percentage', e.target.value)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Net Price (₹)</Form.Label>
                            {editData.cow.old_net_price && (
                              <div className="text-muted small">
                                Old: <span className="text-decoration-line-through">₹{formatNumber(editData.cow.old_net_price)}</span>
                              </div>
                            )}
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              value={editData.cow.net_price}
                              onChange={(e) => handleEditDataChange('cow', 'net_price', e.target.value)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Weight (kg)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              value={editData.cow.milk_weight}
                              onChange={(e) => handleEditDataChange('cow', 'milk_weight', e.target.value)}
                            />
                          </Form.Group>
                          <div className="alert alert-info">
                            <strong>Total:</strong> ₹{calculateTotal(
                              parseFloat(editData.cow.fat_percentage) || 0,
                              parseFloat(editData.cow.snf_percentage) || 0,
                              parseFloat(editData.cow.net_price) || parseFloat(editData.cow.base_price) || 0,
                              parseFloat(editData.cow.milk_weight) || 0
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-muted">No cow milk collection</p>
                      )}
                    </div>
                  </div>
                </Col>

                {/* Buffalo Milk Section */}
                <Col md={6}>
                  <div className="card border-secondary mb-3">
                    <div className="card-header bg-secondary text-white">
                      <h5 className="mb-0">Buffalo Milk</h5>
                    </div>
                    <div className="card-body">
                      {editGroup.buffalo ? (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label>Base Price (₹)</Form.Label>
                            {editData.buffalo.old_base_price && (
                              <div className="text-muted small">
                                Old: <span className="text-decoration-line-through">₹{formatNumber(editData.buffalo.old_base_price)}</span>
                              </div>
                            )}
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              value={editData.buffalo.base_price}
                              onChange={(e) => handleEditDataChange('buffalo', 'base_price', e.target.value)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>FAT %</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.1"
                              min="0"
                              value={editData.buffalo.fat_percentage}
                              onChange={(e) => handleEditDataChange('buffalo', 'fat_percentage', e.target.value)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>SNF %</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.1"
                              min="0"
                              value={editData.buffalo.snf_percentage}
                              onChange={(e) => handleEditDataChange('buffalo', 'snf_percentage', e.target.value)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Net Price (₹)</Form.Label>
                            {editData.buffalo.old_net_price && (
                              <div className="text-muted small">
                                Old: <span className="text-decoration-line-through">₹{formatNumber(editData.buffalo.old_net_price)}</span>
                              </div>
                            )}
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              value={editData.buffalo.net_price}
                              onChange={(e) => handleEditDataChange('buffalo', 'net_price', e.target.value)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Weight (kg)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              value={editData.buffalo.milk_weight}
                              onChange={(e) => handleEditDataChange('buffalo', 'milk_weight', e.target.value)}
                            />
                          </Form.Group>
                          <div className="alert alert-info">
                            <strong>Total:</strong> ₹{calculateTotal(
                              parseFloat(editData.buffalo.fat_percentage) || 0,
                              parseFloat(editData.buffalo.snf_percentage) || 0,
                              parseFloat(editData.buffalo.net_price) || parseFloat(editData.buffalo.base_price) || 0,
                              parseFloat(editData.buffalo.milk_weight) || 0
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-muted">No buffalo milk collection</p>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelEdit}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            <FiSave className="me-2" />
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MilkCollections;
