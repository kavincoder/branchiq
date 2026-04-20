import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login        from './pages/Login.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Export       from './pages/Export.jsx';
import Transactions from './pages/Transactions.jsx';
import Loans        from './pages/Loans.jsx';
import Deposits     from './pages/Deposits.jsx';
import Investments  from './pages/Investments.jsx';
import AIInsights   from './pages/AIInsights.jsx';
import Users        from './pages/Users.jsx';
import AuditLogs    from './pages/AuditLogs.jsx';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/loans"        element={<Loans />} />
        <Route path="/deposits"     element={<Deposits />} />
        <Route path="/investments"  element={<Investments />} />
        <Route path="/ai-insights"  element={<AIInsights />} />
        <Route path="/users"        element={<Users />} />
        <Route path="/audit-logs"   element={<AuditLogs />} />
        <Route path="/export"       element={<Export />} />
        <Route path="/"             element={<Navigate to="/dashboard" replace />} />
        <Route path="*"             element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
