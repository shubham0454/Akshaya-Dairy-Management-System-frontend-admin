import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import DairyCenters from './pages/DairyCenters';
import MilkCollections from './pages/MilkCollections';
import MilkPrice from './pages/MilkPrice';
import Payments from './pages/Payments';
import Advance from './pages/Advance';
import Deduction from './pages/Deduction';
import Invoices from './pages/Invoices';
import RateChart from './pages/RateChart';
import AnnualBonus from './pages/AnnualBonus';
import AddCollection from './pages/AddCollection';
import Layout from './components/Layout';

function App() {
  console.log('App component rendering');
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="collections" element={<MilkCollections />} />
            <Route path="centers" element={<DairyCenters />} />
            <Route path="advance" element={<Advance />} />
            <Route path="deduction" element={<Deduction />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="rate-chart" element={<RateChart />} />
            <Route path="annual-bonus" element={<AnnualBonus />} />
            <Route path="add-collection" element={<AddCollection />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="milk-price" element={<MilkPrice />} />
            <Route path="payments" element={<Payments />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

