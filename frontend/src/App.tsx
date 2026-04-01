import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import POS from './pages/pos/POS';
import Items from './pages/items/Items';
import Categories from './pages/items/Categories';
import Customers from './pages/customers/Customers';
import Inventory from './pages/inventory/Inventory';
import Tickets from './pages/tickets/Tickets';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import Employees from './pages/employees/Employees';
import Shifts from './pages/shifts/Shifts';
import Kitchen from './pages/kitchen/Kitchen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/items" element={<Items />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/shifts" element={<Shifts />} />
                <Route path="/kitchen" element={<Kitchen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
