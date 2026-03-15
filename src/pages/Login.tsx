import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiDroplet, FiShield, FiTrendingUp, FiUsers, FiDollarSign } from 'react-icons/fi';

const Login = () => {
  const [mobileOrEmail, setMobileOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(mobileOrEmail, password);
      navigate('/dashboard');
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex vh-100" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Left Side - Logo and Information */}
      <div 
        className="d-none d-lg-flex flex-column justify-content-center align-items-center p-5"
        style={{
          width: '50%',
          background: 'linear-gradient(135deg, #6F42C1 0%, #007BFF 50%, #00CCCC 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Circles */}
        <div 
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <div 
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />

        <div className="text-center" style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div className="mb-4">
            <FiDroplet 
              size={80} 
              style={{ 
                color: 'white',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }} 
            />
          </div>
          
          {/* Company Name */}
          <h1 className="mb-3 fw-bold" style={{ fontSize: '2.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            Akshaya Dairy
          </h1>
          
          {/* Tagline */}
          <p className="mb-5" style={{ fontSize: '1.2rem', opacity: 0.95 }}>
            Admin Management System
          </p>

          {/* Features */}
          <div className="mt-5 text-start" style={{ maxWidth: '400px' }}>
            <div className="d-flex align-items-center mb-4">
              <div 
                className="rounded-circle p-3 me-3"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <FiShield size={24} />
              </div>
              <div>
                <h5 className="mb-1">Secure Access</h5>
                <p className="mb-0" style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Enterprise-grade security for your data
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center mb-4">
              <div 
                className="rounded-circle p-3 me-3"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <FiTrendingUp size={24} />
              </div>
              <div>
                <h5 className="mb-1">Real-time Analytics</h5>
                <p className="mb-0" style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Monitor your dairy operations in real-time
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center">
              <div 
                className="rounded-circle p-3 me-3"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <FiUsers size={24} />
              </div>
              <div>
                <h5 className="mb-1">Complete Control</h5>
                <p className="mb-0" style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Manage drivers, centers, and collections
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div 
        className="d-flex flex-column justify-content-center align-items-center p-4"
        style={{ 
          width: '100%',
          backgroundColor: '#FFFFFF'
        }}
      >
        <div style={{ width: '100%', maxWidth: '450px' }}>
          {/* Mobile Logo */}
          <div className="d-lg-none text-center mb-4">
            <FiDroplet size={60} style={{ color: '#6F42C1' }} />
            <h2 className="mt-3 fw-bold" style={{ color: '#6F42C1' }}>Akshaya Dairy</h2>
            <p className="text-muted">Admin Login</p>
          </div>

          {/* Desktop Title */}
          <div className="d-none d-lg-block mb-5">
            <h2 className="fw-bold mb-2" style={{ color: '#6F42C1', fontSize: '2rem' }}>
              Welcome Back
            </h2>
            <p className="text-muted">Sign in to continue to your admin dashboard</p>
          </div>

          {/* Login Form */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ color: '#212529' }}>
                    Mobile Number or Email
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={mobileOrEmail}
                    onChange={(e) => setMobileOrEmail(e.target.value)}
                    placeholder="Enter your mobile or email"
                    required
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      padding: '12px 16px'
                    }}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ color: '#212529' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      padding: '12px 16px'
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn w-100 text-white fw-semibold py-3"
                  disabled={loading}
                  style={{
                    backgroundColor: '#6F42C1',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#5a32a3';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#6F42C1';
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-muted small mb-0">
              © 2024 Akshaya Dairy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

