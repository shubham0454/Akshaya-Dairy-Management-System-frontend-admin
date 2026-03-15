import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, 
  FiTruck, 
  FiUsers, 
  FiDroplet, 
  FiDollarSign, 
  FiLogOut, 
  FiTrendingUp, 
  FiMenu, 
  FiX, 
  FiUser, 
  FiPlus,
  FiFileText,
  FiBarChart2,
  FiGift,
  FiMinus,
  FiCreditCard
} from 'react-icons/fi';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/collections', label: 'Show Collection', icon: FiDroplet },
    { path: '/centers', label: 'Center', icon: FiUsers },
    { path: '/advance', label: 'Advance', icon: FiCreditCard },
    { path: '/deduction', label: 'Deduction', icon: FiMinus },
    { path: '/invoices', label: 'Invoices', icon: FiFileText },
    { path: '/rate-chart', label: 'Rate Chart', icon: FiBarChart2 },
    { path: '/annual-bonus', label: 'Annual Bonus', icon: FiGift },
    { path: '/add-collection', label: 'Add Collection', icon: FiPlus },
    { path: '/drivers', label: 'Driver', icon: FiTruck },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="d-flex flex-column vh-100" style={{ overflow: 'hidden' }}>
      {/* Top Navbar - Azia Style */}
      <header
        className="d-flex justify-content-between align-items-center p-3"
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          zIndex: 1030,
          position: 'sticky',
          top: 0,
        }}
      >
        <div className="d-flex align-items-center">
          <button
            className="d-md-none btn btn-link p-2 me-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: '#1E2329' }}
          >
            {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
          <h5 className="mb-0 d-none d-md-block" style={{ color: '#1E2329', fontWeight: 600 }}>
            Admin Panel
          </h5>
        </div>
        
        {/* Admin Icon Dropdown */}
        <div className="position-relative" ref={dropdownRef}>
          <button
            className="btn btn-link p-2 d-flex align-items-center"
            onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
            style={{
              color: '#6F42C1',
              textDecoration: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: adminDropdownOpen ? '#F5F5F5' : 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F5';
            }}
            onMouseLeave={(e) => {
              if (!adminDropdownOpen) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <FiUser size={20} />
          </button>
          
          {adminDropdownOpen && (
            <div
              className="position-absolute end-0 mt-2 shadow-lg rounded"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                minWidth: '200px',
                zIndex: 1050,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="p-3 border-bottom">
                <div className="fw-bold" style={{ color: '#1E2329' }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="small text-muted">{user?.email || user?.mobile}</div>
              </div>
              <div className="py-2">
                <button
                  className="btn btn-link w-100 text-start d-flex align-items-center px-3 py-2"
                  onClick={() => {
                    setAdminDropdownOpen(false);
                    // Navigate to profile page if exists, or show profile modal
                  }}
                  style={{
                    color: '#1E2329',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F5F5F5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <FiUser className="me-2" size={16} />
                  Profile
                </button>
                <button
                  className="btn btn-link w-100 text-start d-flex align-items-center px-3 py-2"
                  onClick={() => {
                    setAdminDropdownOpen(false);
                    logout();
                  }}
                  style={{
                    color: '#DC3545',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F5F5F5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <FiLogOut className="me-2" size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="d-flex flex-grow-1" style={{ overflow: 'hidden' }}>
        {/* Sidebar - Azia Style */}
        <nav
          className={`p-3 h-100 ${
            mobileMenuOpen ? 'd-block' : 'd-none'
          } d-md-block`}
          style={{
            width: '250px',
            minHeight: 'calc(100vh - 60px)',
            zIndex: 1020,
            transition: 'transform 0.3s ease',
            boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E5E7EB',
            overflowY: 'auto',
          }}
        >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0 fw-bold" style={{ color: '#1E2329' }}>Akshaya Dairy</h4>
          <button
            className="d-md-none btn btn-link p-0"
            style={{ color: '#1E2329' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FiX size={24} />
          </button>
        </div>
        <ul className="list-unstyled">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="mb-2">
                <Link
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`d-flex align-items-center text-decoration-none p-2 rounded transition ${
                    isActive ? 'shadow-sm' : ''
                  }`}
                  style={{
                    transition: 'all 0.2s ease',
                    backgroundColor: isActive ? '#F5F5F5' : 'transparent',
                    color: isActive ? '#6F42C1' : '#6C757D',
                    fontWeight: isActive ? 600 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#F8F9FA';
                      e.currentTarget.style.color = '#1E2329';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6C757D';
                    }
                  }}
                >
                  <Icon className="me-2" size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100"
          style={{ 
            backgroundColor: '#6F42C1', 
            opacity: 0.5, 
            zIndex: 1020 
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content - Azia White Background */}
      <main
        className="flex-grow-1 overflow-auto p-3 p-md-4"
        style={{
          backgroundColor: '#FFFFFF',
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <Outlet />
      </main>
      </div>
    </div>
  );
};

export default Layout;

