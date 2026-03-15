import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import ShodanSearch from './pages/ShodanSearch';
import Bruteforce from './pages/Bruteforce';
import WhitelistChecker from './pages/WhitelistChecker';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import AccountSettings from './pages/AccountSettings';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="shodan" element={<ShodanSearch />} />
          <Route path="bruteforce" element={<Bruteforce />} />
          <Route path="whitelist" element={<WhitelistChecker />} />
          <Route path="account" element={<AccountSettings />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route path="settings" element={<Settings />} />
          <Route path="logs" element={<Logs />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
