import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Spinner, Button, Table, Form } from 'react-bootstrap';
import { FiDroplet, FiUsers, FiTruck, FiDollarSign, FiDownload, FiArrowRight } from 'react-icons/fi';
import { generateMilkCollectionPDF, generateCenterReportPDF, generateDriverPaymentPDF } from '../utils/pdfGenerator';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  todayTotalMilk: number;
  morningMilk: number;
  eveningMilk: number;
  thisMonthMilk: number;
  lastMonthMilk: number;
}

interface Collection {
  id: string;
  collection_date: string;
  collection_time: string;
  milk_weight: number;
  fat_percentage: number;
  snf_percentage: number;
  total_amount: number;
  rate_per_liter?: number;
  center_name?: string;
  vendor_name?: string;
}

const Dashboard = () => {
  console.log('Dashboard component rendering');
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    todayTotalMilk: 0,
    morningMilk: 0,
    eveningMilk: 0,
    thisMonthMilk: 0,
    lastMonthMilk: 0,
  });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    try {
      return format(new Date(), 'yyyy-MM');
    } catch (e) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
  });
  const [centers, setCenters] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  
  // PDF Download Data
  const [centerPdfData, setCenterPdfData] = useState({
    center_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [driverPdfData, setDriverPdfData] = useState({
    driver_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  
  // Preview data states
  const [centerPreviewData, setCenterPreviewData] = useState<any>(null);
  const [driverPreviewData, setDriverPreviewData] = useState<any>(null);
  const [loadingCenterPreview, setLoadingCenterPreview] = useState(false);
  const [loadingDriverPreview, setLoadingDriverPreview] = useState(false);

  useEffect(() => {
    // Set a timeout to ensure loading state doesn't hang forever
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      console.warn('Dashboard loading timeout - showing content anyway');
    }, 10000); // 10 second timeout

    fetchStats();
    fetchMonthCollections();
    fetchCenters();
    fetchDrivers();

    return () => clearTimeout(loadingTimeout);
  }, [month]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/milk/dashboard/stats');
      setStats(response.data.data || {
        todayTotalMilk: 0,
        morningMilk: 0,
        eveningMilk: 0,
        thisMonthMilk: 0,
        lastMonthMilk: 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        todayTotalMilk: 0,
        morningMilk: 0,
        eveningMilk: 0,
        thisMonthMilk: 0,
        lastMonthMilk: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthCollections = async () => {
    try {
      const monthStart = `${month}-01`;
      const lastDay = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
      const monthEnd = `${month}-${lastDay.toString().padStart(2, '0')}`;
      
      const response = await axios.get('/milk/collections', {
        params: {
          start_date: monthStart,
          end_date: monthEnd,
          limit: 1000,
        },
      });
      setCollections(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      setCollections([]);
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

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/driver/all');
      setDrivers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const handleDownloadMonthlyPDF = () => {
    if (collections.length === 0) {
      toast.error('No data available for PDF');
      return;
    }

    const morningCollections = collections.filter(c => c.collection_time === 'morning');
    const eveningCollections = collections.filter(c => c.collection_time === 'evening');
    
    const morningTotal = morningCollections.reduce((sum, c) => sum + (c.milk_weight || 0), 0);
    const eveningTotal = eveningCollections.reduce((sum, c) => sum + (c.milk_weight || 0), 0);

    let monthName = month;
    try {
      monthName = format(new Date(month + '-01'), 'MMMM yyyy');
    } catch (e) {
      // Use month as fallback
    }
    
    generateMilkCollectionPDF({
      month: monthName,
      morningMilk: morningTotal,
      eveningMilk: eveningTotal,
      totalMilk: morningTotal + eveningTotal,
      collections: collections,
    });

    toast.success('PDF downloaded successfully!');
  };

  const handlePreviewCenterPDF = async () => {
    try {
      if (!centerPdfData.start_date || !centerPdfData.end_date) {
        toast.error('Please select start and end dates');
        return;
      }

      setLoadingCenterPreview(true);
      const response = await axios.get('/reports/center-collections', {
        params: {
          center_id: centerPdfData.center_id || undefined,
          start_date: centerPdfData.start_date,
          end_date: centerPdfData.end_date,
        },
      });

      const data = response.data.data;
      setCenterPreviewData(data);
      setLoadingCenterPreview(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch data');
      setLoadingCenterPreview(false);
      setCenterPreviewData(null);
    }
  };

  const handleResetCenterPDF = () => {
    setCenterPreviewData(null);
    setCenterPdfData({
      center_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleDownloadCenterPDF = () => {
    if (!centerPreviewData) {
      toast.error('Please preview the data first');
      return;
    }

    const centerName = centerPdfData.center_id ? 
      centers.find(c => c.id === centerPdfData.center_id)?.dairy_name || 'Unknown' :
      'All Centers';

    generateCenterReportPDF({
      centerName,
      startDate: centerPdfData.start_date,
      endDate: centerPdfData.end_date,
      collections: centerPreviewData.collections || [],
      totals: centerPreviewData.totals || { totalWeight: 0, totalAmount: 0, morningWeight: 0, eveningWeight: 0 },
    });

    toast.success('PDF downloaded successfully!');
  };

  const handlePreviewDriverPDF = async () => {
    try {
      if (!driverPdfData.driver_id || !driverPdfData.start_date || !driverPdfData.end_date) {
        toast.error('Please fill all required fields');
        return;
      }

      setLoadingDriverPreview(true);
      const response = await axios.get('/reports/driver-salary', {
        params: {
          driver_id: driverPdfData.driver_id,
          start_date: driverPdfData.start_date,
          end_date: driverPdfData.end_date,
        },
      });

      const data = response.data.data;
      setDriverPreviewData(data);
      setLoadingDriverPreview(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch data');
      setLoadingDriverPreview(false);
      setDriverPreviewData(null);
    }
  };

  const handleResetDriverPDF = () => {
    setDriverPreviewData(null);
    setDriverPdfData({
      driver_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleDownloadDriverPDF = () => {
    if (!driverPreviewData) {
      toast.error('Please preview the data first');
      return;
    }

    generateDriverPaymentPDF({
      driverName: driverPreviewData.driver.name,
      startDate: driverPdfData.start_date,
      endDate: driverPdfData.end_date,
      baseSalary: driverPreviewData.salary.baseSalary,
      overtime: driverPreviewData.salary.overtime,
      bonus: driverPreviewData.salary.bonus,
      deductions: driverPreviewData.salary.deductions,
      finalAmount: driverPreviewData.salary.finalAmount,
      collections: driverPreviewData.collections,
    });

    toast.success('PDF downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px', backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Sort collections by date (newest first) - today's date first, then older dates
  const sortCollectionsByDate = (collections: Collection[]) => {
    return [...collections].sort((a, b) => {
      try {
        const dateA = new Date(a.collection_date).getTime();
        const dateB = new Date(b.collection_date).getTime();
        return dateB - dateA; // Newest first (descending order)
      } catch (e) {
        return 0;
      }
    });
  };

  const morningCollections = sortCollectionsByDate(collections.filter(c => c.collection_time === 'morning'));
  const eveningCollections = sortCollectionsByDate(collections.filter(c => c.collection_time === 'evening'));
  const morningTotal = Number(morningCollections.reduce((sum, c) => sum + (Number(c.milk_weight) || 0), 0)) || 0;
  const eveningTotal = Number(eveningCollections.reduce((sum, c) => sum + (Number(c.milk_weight) || 0), 0)) || 0;

  // Process data for daily chart
  const processDailyData = () => {
    const dailyDataMap: { [key: string]: { date: string; morning: number; evening: number; total: number } } = {};
    
    collections.forEach((collection) => {
      const date = collection.collection_date;
      if (!dailyDataMap[date]) {
        try {
          dailyDataMap[date] = {
            date: format(new Date(date), 'dd/MM'),
            morning: 0,
            evening: 0,
            total: 0,
          };
        } catch (e) {
          dailyDataMap[date] = {
            date: date,
            morning: 0,
            evening: 0,
            total: 0,
          };
        }
      }
      
      const weight = Number(collection.milk_weight) || 0;
      dailyDataMap[date].total += weight;
      
      if (collection.collection_time === 'morning') {
        dailyDataMap[date].morning += weight;
      } else if (collection.collection_time === 'evening') {
        dailyDataMap[date].evening += weight;
      }
    });
    
    return Object.values(dailyDataMap).sort((a, b) => {
      try {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return dateA.localeCompare(dateB);
      } catch (e) {
        return 0;
      }
    });
  };

  const dailyChartData = processDailyData();

  // Process data for weekly chart
  const processWeeklyData = () => {
    const weeklyDataMap: { [key: string]: { week: string; morning: number; evening: number; total: number } } = {};
    
    collections.forEach((collection) => {
      try {
        const date = new Date(collection.collection_date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Get Sunday of the week
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        const weekLabel = `Week ${format(weekStart, 'dd/MM')} - ${format(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000), 'dd/MM')}`;
        
        if (!weeklyDataMap[weekKey]) {
          weeklyDataMap[weekKey] = {
            week: weekLabel,
            morning: 0,
            evening: 0,
            total: 0,
          };
        }
        
        const weight = Number(collection.milk_weight) || 0;
        weeklyDataMap[weekKey].total += weight;
        
        if (collection.collection_time === 'morning') {
          weeklyDataMap[weekKey].morning += weight;
        } else if (collection.collection_time === 'evening') {
          weeklyDataMap[weekKey].evening += weight;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    return Object.values(weeklyDataMap).sort((a, b) => {
      try {
        const weekA = a.week.split(' - ')[0];
        const weekB = b.week.split(' - ')[0];
        return weekA.localeCompare(weekB);
      } catch (e) {
        return 0;
      }
    });
  };

  // Process data for monthly chart (aggregate by month)
  const processMonthlyData = () => {
    const monthDataMap: { [key: string]: { month: string; morning: number; evening: number; total: number } } = {};
    
    collections.forEach((collection) => {
      try {
        const date = new Date(collection.collection_date);
        const monthKey = format(date, 'yyyy-MM');
        const monthLabel = format(date, 'MMMM yyyy');
        
        if (!monthDataMap[monthKey]) {
          monthDataMap[monthKey] = {
            month: monthLabel,
            morning: 0,
            evening: 0,
            total: 0,
          };
        }
        
        const weight = Number(collection.milk_weight) || 0;
        monthDataMap[monthKey].total += weight;
        
        if (collection.collection_time === 'morning') {
          monthDataMap[monthKey].morning += weight;
        } else if (collection.collection_time === 'evening') {
          monthDataMap[monthKey].evening += weight;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    return Object.values(monthDataMap).sort((a, b) => {
      try {
        return a.month.localeCompare(b.month);
      } catch (e) {
        return 0;
      }
    });
  };

  const weeklyChartData = processWeeklyData();
  const monthlyChartData = processMonthlyData();

  return (
    <div className="container-fluid px-0 px-md-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h2 className="mb-0 fw-bold" style={{ color: '#6F42C1' }}>Dashboard</h2>
        <div className="w-100 w-md-auto">
          <input
            type="month"
            className="form-control form-control-lg"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ maxWidth: '100%', minWidth: '200px' }}
          />
        </div>
      </div>

      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12} sm={6} md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)' }}>
                  <FiDroplet size={32} style={{ color: '#6F42C1' }} />
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1 small text-uppercase">Today's Milk</h6>
                  <h3 className="mb-0 fw-bold text-dark">{(Number(stats.todayTotalMilk) || 0).toFixed(2)} <small className="text-muted fs-6">kg</small></h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(0, 204, 204, 0.1)' }}>
                  <FiDroplet size={32} style={{ color: '#00CCCC' }} />
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1 small text-uppercase">Morning Milk</h6>
                  <h3 className="mb-0 fw-bold text-dark">{(Number(stats.morningMilk) || 0).toFixed(2)} <small className="text-muted fs-6">kg</small></h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(0, 123, 255, 0.1)' }}>
                  <FiDroplet size={32} style={{ color: '#007BFF' }} />
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1 small text-uppercase">Evening Milk</h6>
                  <h3 className="mb-0 fw-bold text-dark">{(Number(stats.eveningMilk) || 0).toFixed(2)} <small className="text-muted fs-6">kg</small></h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)' }}>
                  <FiDroplet size={32} style={{ color: '#6F42C1' }} />
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1 small text-uppercase">This Month</h6>
                  <h3 className="mb-0 fw-bold text-dark">{(Number(stats.thisMonthMilk) || 0).toFixed(2)} <small className="text-muted fs-6">kg</small></h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Daily Milk Collection Charts - COMMENTED OUT */}
      {/* <Row className="g-4 mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>Daily Milk Collection Chart - {(() => {
                try {
                  return format(new Date(month + '-01'), 'MMMM yyyy');
                } catch (e) {
                  return month;
                }
              })()}</h5>
            </Card.Header>
            <Card.Body>
              {dailyChartData.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p>No collection data available for this month</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={dailyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="morning" stroke="#00CCCC" strokeWidth={2} name="Morning (kg)" />
                    <Line type="monotone" dataKey="evening" stroke="#007BFF" strokeWidth={2} name="Evening (kg)" />
                    <Line type="monotone" dataKey="total" stroke="#6F42C1" strokeWidth={3} name="Total (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>Daily Milk Collection Bar Chart - {(() => {
                try {
                  return format(new Date(month + '-01'), 'MMMM yyyy');
                } catch (e) {
                  return month;
                }
              })()}</h5>
            </Card.Header>
            <Card.Body>
              {dailyChartData.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p>No collection data available for this month</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dailyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="morning" fill="#00CCCC" name="Morning (kg)" />
                    <Bar dataKey="evening" fill="#007BFF" name="Evening (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>Daily Milk Collection Chart - {(() => {
                try {
                  return format(new Date(month + '-01'), 'MMMM yyyy');
                } catch (e) {
                  return month;
                }
              })()}</h5>
            </Card.Header>
            <Card.Body>
              {dailyChartData.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p>No collection data available for this month</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={dailyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="morning" stroke="#00CCCC" strokeWidth={2} name="Morning (kg)" />
                    <Line type="monotone" dataKey="evening" stroke="#007BFF" strokeWidth={2} name="Evening (kg)" />
                    <Line type="monotone" dataKey="total" stroke="#6F42C1" strokeWidth={3} name="Total (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>Daily Milk Collection Bar Chart - {(() => {
                try {
                  return format(new Date(month + '-01'), 'MMMM yyyy');
                } catch (e) {
                  return month;
                }
              })()}</h5>
            </Card.Header>
            <Card.Body>
              {dailyChartData.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p>No collection data available for this month</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dailyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="morning" fill="#00CCCC" name="Morning (kg)" />
                    <Bar dataKey="evening" fill="#007BFF" name="Evening (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row> */}

      {/* Week Milk Collection Chart - COMMENTED OUT */}
      {/* <Row className="g-3 g-md-4 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold text-dark">Week Milk Collection Chart - {(() => {
                try {
                  return format(new Date(month + '-01'), 'MMMM yyyy');
                } catch (e) {
                  return month;
                }
              })()}</h5>
            </Card.Header>
            <Card.Body className="p-3 p-md-4">
              {weeklyChartData.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <FiDroplet size={48} className="mb-3 opacity-25" />
                  <p>No collection data available for this month</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="morning" stroke="#00CCCC" strokeWidth={2} name="Morning (kg)" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="evening" stroke="#17a2b8" strokeWidth={2} name="Evening (kg)" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="total" stroke="#0DCAF0" strokeWidth={3} name="Total (kg)" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row> */}

      {/* Week Milk Collection Bar Chart */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold text-dark">Week Milk Collection Bar Chart - {(() => {
                try {
                  return format(new Date(month + '-01'), 'MMMM yyyy');
                } catch (e) {
                  return month;
                }
              })()}</h5>
            </Card.Header>
            <Card.Body className="p-3 p-md-4">
              {weeklyChartData.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <FiDroplet size={48} className="mb-3 opacity-25" />
                  <p>No collection data available for this month</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="morning" fill="#00CCCC" name="Morning (kg)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="evening" fill="#17a2b8" name="Evening (kg)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Month Milk Collection Chart */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold text-dark">Month Milk Collection Chart - {(() => {
                try {
                  return format(new Date(month + '-01'), 'MMMM yyyy');
                } catch (e) {
                  return month;
                }
              })()}</h5>
            </Card.Header>
            <Card.Body className="p-3 p-md-4">
              {monthlyChartData.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <FiDroplet size={48} className="mb-3 opacity-25" />
                  <p>No collection data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="morning" stroke="#00CCCC" strokeWidth={2} name="Morning (kg)" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="evening" stroke="#17a2b8" strokeWidth={2} name="Evening (kg)" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="total" stroke="#0DCAF0" strokeWidth={3} name="Total (kg)" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Month Milk Collection Bar Chart - COMMENTED OUT */}
      {/* <Row className="g-3 g-md-4 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold text-dark">Month Milk Collection Bar Chart - {(() => {
                try {
                  return format(new Date(month + '-01'), 'MMMM yyyy');
                } catch (e) {
                  return month;
                }
              })()}</h5>
            </Card.Header>
            <Card.Body className="p-3 p-md-4">
              {monthlyChartData.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <FiDroplet size={48} className="mb-3 opacity-25" />
                  <p>No collection data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="morning" fill="#00CCCC" name="Morning (kg)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="evening" fill="#17a2b8" name="Evening (kg)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row> */}

      <Row className="g-3 g-md-4">
        <Col xs={12} lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark">
                  Morning Milk Collections - {(() => {
                    try {
                      return format(new Date(month + '-01'), 'MMMM yyyy');
                    } catch (e) {
                      return month;
                    }
                  })()}
                  {morningCollections.length > 0 && (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="ms-2"
                      onClick={() => navigate('/collections')}
                    >
                      View More <FiArrowRight className="ms-1" />
                    </Button>
                  )}
                </h5>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="p-3 bg-light border-bottom">
                <strong className="text-primary">Total: {(Number(morningTotal) || 0).toFixed(2)} kg</strong>
              </div>
              <div className="table-responsive">
                <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Center Name</th>
                    <th>Date</th>
                    <th>Price (₹)</th>
                    <th>Weight (kg)</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {morningCollections.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        No morning collections found for this month
                      </td>
                    </tr>
                  ) : (
                    morningCollections.slice(0, 10).map((collection) => {
                      let formattedDate = 'N/A';
                      try {
                        formattedDate = format(new Date(collection.collection_date), 'dd/MM/yyyy');
                      } catch (e) {
                        formattedDate = collection.collection_date || 'N/A';
                      }
                      return (
                        <tr key={collection.id}>
                          <td>{collection.center_name || collection.vendor_name || 'N/A'}</td>
                          <td>{formattedDate}</td>
                          <td>₹{(Number(collection.rate_per_liter) || 0).toFixed(2)}</td>
                          <td>{collection.milk_weight || 0}</td>
                          <td>₹{(Number(collection.total_amount) || 0).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark">
                  Evening Milk Collections - {(() => {
                    try {
                      return format(new Date(month + '-01'), 'MMMM yyyy');
                    } catch (e) {
                      return month;
                    }
                  })()}
                  {eveningCollections.length > 0 && (
                    <Button 
                      variant="outline-info" 
                      size="sm"
                      className="ms-2"
                      onClick={() => navigate('/collections')}
                    >
                      View More <FiArrowRight className="ms-1" />
                    </Button>
                  )}
                </h5>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="p-3 bg-light border-bottom">
                <strong className="text-info">Total: {(Number(eveningTotal) || 0).toFixed(2)} kg</strong>
              </div>
              <div className="table-responsive">
                <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Center Name</th>
                    <th>Date</th>
                    <th>Price (₹)</th>
                    <th>Weight (kg)</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {eveningCollections.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        No evening collections found for this month
                      </td>
                    </tr>
                  ) : (
                    eveningCollections.slice(0, 10).map((collection) => {
                      let formattedDate = 'N/A';
                      try {
                        formattedDate = format(new Date(collection.collection_date), 'dd/MM/yyyy');
                      } catch (e) {
                        formattedDate = collection.collection_date || 'N/A';
                      }
                      return (
                        <tr key={collection.id}>
                          <td>{collection.center_name || collection.vendor_name || 'N/A'}</td>
                          <td>{formattedDate}</td>
                          <td>₹{(Number(collection.rate_per_liter) || 0).toFixed(2)}</td>
                          <td>{collection.milk_weight || 0}</td>
                          <td>₹{(Number(collection.total_amount) || 0).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* PDF Download Cards Section */}
      <Row className="g-3 g-md-4 mb-4 mt-4">
        <Col xs={12} md={6} lg={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="text-white border-0" style={{ backgroundColor: '#00CCCC' }}>
              <h5 className="mb-0">
                <FiDownload className="me-2" />
                Monthly Report PDF
              </h5>
            </Card.Header>
            <Card.Body>
              {!collections.length ? (
                <div className="text-center text-muted py-3">
                  <p>No data available for this month</p>
                  <Button variant="success" size="sm" disabled>
                    <FiDownload className="me-2" />
                    Download PDF
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="mb-3">
                    <p className="mb-2"><strong>Month:</strong> {(() => {
                      try {
                        return format(new Date(month + '-01'), 'MMMM yyyy');
                      } catch (e) {
                        return month;
                      }
                    })()}</p>
                    <p className="mb-2"><strong>Morning Total:</strong> {(Number(morningTotal) || 0).toFixed(2)} kg</p>
                    <p className="mb-0"><strong>Evening Total:</strong> {(Number(eveningTotal) || 0).toFixed(2)} kg</p>
                  </div>
                  <Button variant="success" className="w-100" onClick={handleDownloadMonthlyPDF}>
                    <FiDownload className="me-2" />
                    Download Monthly PDF
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="text-white border-0" style={{ backgroundColor: '#00CCCC' }}>
              <h5 className="mb-0">
                <FiDownload className="me-2" />
                Center Report PDF
              </h5>
            </Card.Header>
            <Card.Body>
              {!centerPreviewData ? (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Center</Form.Label>
                    <Form.Select
                      value={centerPdfData.center_id}
                      onChange={(e) => setCenterPdfData({ ...centerPdfData, center_id: e.target.value })}
                    >
                      <option value="">All Centers</option>
                      {centers.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.dairy_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date *</Form.Label>
                    <Form.Control
                      type="date"
                      value={centerPdfData.start_date}
                      onChange={(e) => setCenterPdfData({ ...centerPdfData, start_date: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date *</Form.Label>
                    <Form.Control
                      type="date"
                      value={centerPdfData.end_date}
                      onChange={(e) => setCenterPdfData({ ...centerPdfData, end_date: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Button 
                    variant="success" 
                    className="w-100" 
                    onClick={handlePreviewCenterPDF} 
                    disabled={loadingCenterPreview}
                  >
                    {loadingCenterPreview ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Loading...
                      </>
                    ) : (
                      'Preview & Download'
                    )}
                  </Button>
                </Form>
              ) : (
                <div>
                  <div className="mb-3 p-2 bg-light rounded">
                    <p className="mb-1 small"><strong>Center:</strong> {centerPdfData.center_id ? 
                      centers.find(c => c.id === centerPdfData.center_id)?.dairy_name || 'Unknown' :
                      'All Centers'}</p>
                    <p className="mb-1 small"><strong>Period:</strong> {centerPdfData.start_date} to {centerPdfData.end_date}</p>
                    <p className="mb-1 small"><strong>Collections:</strong> {centerPreviewData.collections?.length || 0}</p>
                    <p className="mb-0 small"><strong>Total:</strong> {(Number(centerPreviewData.totals?.totalWeight) || 0).toFixed(2)} kg / ₹{(Number(centerPreviewData.totals?.totalAmount) || 0).toFixed(2)}</p>
                  </div>
                  <div className="d-flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleResetCenterPDF} className="flex-fill">
                      Change
                    </Button>
                    <Button variant="success" size="sm" onClick={handleDownloadCenterPDF} className="flex-fill">
                      <FiDownload className="me-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="text-white border-0" style={{ backgroundColor: '#00CCCC' }}>
              <h5 className="mb-0">
                <FiDownload className="me-2" />
                Driver Payment PDF
              </h5>
            </Card.Header>
            <Card.Body>
              {!driverPreviewData ? (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Driver *</Form.Label>
                    <Form.Select
                      value={driverPdfData.driver_id}
                      onChange={(e) => setDriverPdfData({ ...driverPdfData, driver_id: e.target.value })}
                      required
                    >
                      <option value="">Select Driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.first_name} {driver.last_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date *</Form.Label>
                    <Form.Control
                      type="date"
                      value={driverPdfData.start_date}
                      onChange={(e) => setDriverPdfData({ ...driverPdfData, start_date: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date *</Form.Label>
                    <Form.Control
                      type="date"
                      value={driverPdfData.end_date}
                      onChange={(e) => setDriverPdfData({ ...driverPdfData, end_date: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Button 
                    variant="success" 
                    className="w-100" 
                    onClick={handlePreviewDriverPDF} 
                    disabled={loadingDriverPreview}
                  >
                    {loadingDriverPreview ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Loading...
                      </>
                    ) : (
                      'Preview & Download'
                    )}
                  </Button>
                </Form>
              ) : (
                <div>
                  <div className="mb-3 p-2 bg-light rounded">
                    <p className="mb-1 small"><strong>Driver:</strong> {driverPreviewData.driver?.name || `${driverPreviewData.driver?.first_name || ''} ${driverPreviewData.driver?.last_name || ''}`.trim()}</p>
                    <p className="mb-1 small"><strong>Period:</strong> {driverPdfData.start_date} to {driverPdfData.end_date}</p>
                    <p className="mb-1 small"><strong>Base Salary:</strong> ₹{(Number(driverPreviewData.salary?.baseSalary) || 0).toFixed(2)}</p>
                    <p className="mb-1 small"><strong>Overtime:</strong> ₹{(Number(driverPreviewData.salary?.overtime) || 0).toFixed(2)}</p>
                    <p className="mb-1 small"><strong>Bonus:</strong> ₹{(Number(driverPreviewData.salary?.bonus) || 0).toFixed(2)}</p>
                    <p className="mb-1 small"><strong>Deductions:</strong> ₹{(Number(driverPreviewData.salary?.deductions) || 0).toFixed(2)}</p>
                    <p className="mb-0 small"><strong>Final Amount:</strong> ₹{(Number(driverPreviewData.salary?.finalAmount) || 0).toFixed(2)}</p>
                  </div>
                  <div className="d-flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleResetDriverPDF} className="flex-fill">
                      Change
                    </Button>
                    <Button variant="success" size="sm" onClick={handleDownloadDriverPDF} className="flex-fill">
                      <FiDownload className="me-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
