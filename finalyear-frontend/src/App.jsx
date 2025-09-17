import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import IndividualDashboard from './components/IndividualDashboard';
import VisualizationDashboard from './components/VisualizationDashboard';
import MemberDashboard from './pages/MemberDashboard';
import LeadDashboard from './pages/LeadDashboard';
import PMDashboard from './pages/PMDashboard';
import { useEffect } from 'react';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.split('/')[1]; // Gets 'member', 'lead', or 'pm'

  // Determine which dashboard component to show based on role
  const getDashboardComponent = () => {
    switch (basePath) {
      case 'member':
        return MemberDashboard;
      case 'lead':
        return LeadDashboard;
      case 'pm':
        return PMDashboard;
      default:
        return IndividualDashboard;
    }
  };

  const DashboardComponent = getDashboardComponent();

  return (
    <div>
      <nav style={{ 
        padding: '1rem', 
        backgroundColor: '#f8f9fa',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <ul style={{ 
          listStyle: 'none', 
          display: 'flex', 
          gap: '2rem',
          margin: 0,
          padding: 0
        }}>
          <li>
            <Link to={`/${basePath}/dashboard`} style={{ 
              textDecoration: 'none', 
              color: '#333',
              fontWeight: '500'
            }}>Dashboard</Link>
          </li>
          {/* Only show Performance Analysis for non-PM users */}
          {basePath !== 'pm' && (
            <li>
              <Link to={`/${basePath}/dashboard/performance`} style={{ 
                textDecoration: 'none', 
                color: '#333',
                fontWeight: '500'
              }}>Performance Analysis</Link>
            </li>
          )}
        </ul>
      </nav>

      <Routes>
        <Route index element={<Navigate to={`/${basePath}/dashboard`} replace />} />
        <Route path="/">
          <Route index element={<Navigate to={`/${basePath}/dashboard`} replace />} />
          <Route path="dashboard" element={<DashboardComponent />} />
          {/* Performance route only for non-PM users */}
          {basePath !== 'pm' && (
            <Route path="dashboard/performance" element={<VisualizationDashboard />} />
          )}
        </Route>
        {/* Redirect /performance to /dashboard/performance for non-PM users */}
        {basePath !== 'pm' && (
          <Route path="performance" element={<Navigate to={`/${basePath}/dashboard/performance`} replace />} />
        )}
      </Routes>
    </div>
  );
}

export default App;
