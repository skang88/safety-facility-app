import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Flame, Map, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ListView from './pages/ListView';
import FireWaterListView from './pages/FireWaterListView';
import FireWaterMapView from './pages/FireWaterMapView';
import ReportView from './pages/ReportView';
import FireWaterReportView from './pages/FireWaterReportView';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // If user is not authenticated and trying to access a private page, redirect to login
  if (!token && !isPublicPath) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If user is authenticated and trying to access public auth pages, redirect to dashboard
  if (token && isPublicPath) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Under public path context (when NOT authenticated)
  if (isPublicPath) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    );
  }

  if (location.pathname === '/report' || location.pathname === '/fire-water-report') {
    return (
      <Routes>
        <Route path="/report" element={<ReportView />} />
        <Route path="/fire-water-report" element={<FireWaterReportView />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation */}
      <nav className="bg-red-700 text-white shadow-md z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl">의령소방서</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/"
                className={`flex items-center px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                  location.pathname === '/' ? 'bg-red-800 text-white' : 'text-red-100 hover:bg-red-600'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-1 shrink-0" />
                대시보드
              </Link>
              <Link
                to="/list"
                className={`flex items-center px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                  location.pathname === '/list' ? 'bg-red-800 text-white' : 'text-red-100 hover:bg-red-600'
                }`}
              >
                <ListChecks className="w-4 h-4 mr-1 shrink-0" />
                수난안전시설
              </Link>
              <Link
                to="/fire-water"
                className={`flex items-center px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                  location.pathname === '/fire-water' ? 'bg-red-800 text-white' : 'text-red-100 hover:bg-red-600'
                }`}
              >
                <Flame className="w-4 h-4 mr-1 shrink-0" />
                소방용수 관리
              </Link>
              <Link
                to="/fire-water-map"
                className={`flex items-center px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                  location.pathname === '/fire-water-map' ? 'bg-red-800 text-white' : 'text-red-100 hover:bg-red-600'
                }`}
              >
                <Map className="w-4 h-4 mr-1 shrink-0" />
                소방용수 지도
              </Link>

              {/* User Profile & Log Out */}
              {user && (
                <div className="flex items-center space-x-2 border-l border-red-600/50 pl-2 sm:pl-4">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-semibold text-white">
                      {user.name || user.employeeId || user.email.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-red-200">
                      {user.role === 'admin' ? '관리자' : '점검 요원'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center p-2 rounded-md text-red-100 hover:bg-red-600 hover:text-white transition"
                    title="로그아웃"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline-block text-xs font-medium ml-1">로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative print:overflow-visible">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/list" element={<ListView />} />
          <Route path="/fire-water" element={<FireWaterListView />} />
          <Route path="/fire-water-map" element={<FireWaterMapView />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
