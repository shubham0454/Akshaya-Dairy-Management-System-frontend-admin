import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { RegisterData } from '../contexts/AuthContext';
import { FiDroplet, FiUserPlus, FiShield, FiTrendingUp } from 'react-icons/fi';

const Register = () => {
  const [formData, setFormData] = useState<RegisterData>({
    first_name: '',
    last_name: '',
    mobile_no: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...formData, email: formData.email || undefined });
      navigate('/dashboard');
    } catch {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const gradientStyle = {
    background: 'linear-gradient(135deg, #6F42C1 0%, #007BFF 50%, #00CCCC 100%)',
    color: 'white',
  };

  const inputStyle = {
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '12px 16px',
  };

  return (
    <div className="d-flex flex-column flex-lg-row min-vh-100" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Left Side - Logo and Information (hidden on small screens) */}
      <div
        className="d-none d-lg-flex flex-column justify-content-center align-items-center p-4 p-xl-5"
        style={{
          width: '50%',
          ...gradientStyle,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
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
          <div className="mb-4">
            <FiDroplet
              size={80}
              style={{ color: 'white', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
            />
          </div>
          <h1 className="mb-3 fw-bold" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            Akshaya Dairy
          </h1>
          <p className="mb-5" style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', opacity: 0.95 }}>
            Create your admin account
          </p>

          <div className="mt-5 text-start" style={{ maxWidth: '400px' }}>
            <div className="d-flex align-items-center mb-4">
              <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <FiUserPlus size={24} />
              </div>
              <div>
                <h5 className="mb-1">Quick Setup</h5>
                <p className="mb-0" style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Get started in minutes
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center mb-4">
              <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <FiShield size={24} />
              </div>
              <div>
                <h5 className="mb-1">Secure Access</h5>
                <p className="mb-0" style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Enterprise-grade security
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center">
              <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <FiTrendingUp size={24} />
              </div>
              <div>
                <h5 className="mb-1">Full Control</h5>
                <p className="mb-0" style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Manage drivers, centers & collections
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div
        className="d-flex flex-column justify-content-center align-items-center p-3 p-sm-4 py-5"
        style={{ width: '100%', backgroundColor: '#FFFFFF', minHeight: '100vh' }}
      >
        <div style={{ width: '100%', maxWidth: '450px' }}>
          {/* Mobile Logo */}
          <div className="d-lg-none text-center mb-4">
            <FiDroplet size={56} style={{ color: '#6F42C1' }} />
            <h2 className="mt-3 fw-bold" style={{ color: '#6F42C1', fontSize: '1.5rem' }}>Akshaya Dairy</h2>
            <p className="text-muted small">Create Account</p>
          </div>

          <div className="d-none d-lg-block mb-4">
            <h2 className="fw-bold mb-2" style={{ color: '#6F42C1', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>
              Create Account
            </h2>
            <p className="text-muted">Register to access the admin dashboard</p>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3 p-sm-4 p-md-5">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label fw-semibold" style={{ color: '#212529' }}>First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      className="form-control form-control-lg"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="First name"
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label fw-semibold" style={{ color: '#212529' }}>Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      className="form-control form-control-lg"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Last name"
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="form-label fw-semibold" style={{ color: '#212529' }}>Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile_no"
                    className="form-control form-control-lg"
                    value={formData.mobile_no}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    required
                    style={inputStyle}
                  />
                </div>
                <div className="mt-3">
                  <label className="form-label fw-semibold" style={{ color: '#212529' }}>Email (optional)</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control form-control-lg"
                    value={formData.email || ''}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    style={inputStyle}
                  />
                </div>
                <div className="mt-3">
                  <label className="form-label fw-semibold" style={{ color: '#212529' }}>Role</label>
                  <select
                    name="role"
                    className="form-select form-select-lg"
                    value={formData.role}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="admin">Admin</option>
                    <option value="driver">Driver</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
                <div className="mt-3">
                  <label className="form-label fw-semibold" style={{ color: '#212529' }}>Password *</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control form-control-lg"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Choose a strong password"
                    required
                    minLength={6}
                    style={inputStyle}
                  />
                </div>
                <button
                  type="submit"
                  className="btn w-100 text-white fw-semibold py-3 mt-4"
                  disabled={loading}
                  style={{
                    backgroundColor: '#6F42C1',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
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
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center mt-4 mb-0">
            <span className="text-muted">Already have an account? </span>
            <Link to="/login" className="fw-semibold" style={{ color: '#6F42C1', textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>

          <div className="text-center mt-3">
            <p className="text-muted small mb-0">© 2024 Akshaya Dairy. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
