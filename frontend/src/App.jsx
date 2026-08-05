import { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListChecks, 
  Flame, 
  Truck,
  LogOut, 
  Menu, 
  X, 
  Shield, 
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ListView from './pages/ListView';
import FireWaterListView from './pages/FireWaterListView';
import FireWaterMapView from './pages/FireWaterMapView';
import VehicleListView from './pages/VehicleListView';
import ReportView from './pages/ReportView';
import FireWaterReportView from './pages/FireWaterReportView';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Scalable Module Navigation Registry
const MODULE_ROUTES = [
  { path: '/', label: '통합 대시보드', icon: LayoutDashboard, exact: true },
  { path: '/list', label: '수난안전 시설', icon: ListChecks },
  { path: '/fire-water', label: '소방용수 관리', icon: Flame },
  { path: '/vehicle', label: '소방차량 관리', icon: Truck },
];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const token = localStorage.getItem('token');
  
  // Safely parse user from localStorage to prevent white-screen crashes on corrupt data
  let user = null;
  try {
    const userJson = localStorage.getItem('user');
    user = userJson && userJson !== 'undefined' ? JSON.parse(userJson) : null;
  } catch (e) {
    console.error('Failed to parse user JSON from localStorage:', e);
    user = null;
  }

  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsMobileMenuOpen(false);
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Print view pages (No header/navigation rendered)
  if (location.pathname === '/report' || location.pathname === '/fire-water-report') {
    return (
      <Routes>
        <Route path="/report" element={<ReportView />} />
        <Route path="/fire-water-report" element={<FireWaterReportView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const isNavActive = (module) => {
    if (module.exact) return location.pathname === module.path;
    return location.pathname.startsWith(module.path);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="bg-red-700 text-white shadow-md z-40 print:hidden shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Brand Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <Link to="/" className="flex flex-col text-left">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight leading-none">의령소방서</span>
                <span className="text-[10px] text-red-200 font-medium mt-0.5">통합 안전점검 플랫폼</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {MODULE_ROUTES.map(module => {
                const Icon = module.icon;
                const active = isNavActive(module);
                return (
                  <Link
                    key={module.path}
                    to={module.path}
                    className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                      active 
                        ? 'bg-red-800 text-white shadow-inner border border-red-600/50' 
                        : 'text-red-100 hover:bg-red-600 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 shrink-0" />
                    {module.label}
                  </Link>
                );
              })}

              {/* User Profile & Log Out (Desktop) */}
              {user && (
                <div className="flex items-center space-x-3 border-l border-red-600/60 pl-3 ml-2">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-white">
                      {user.name || user.employeeId || user.email.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-red-200">
                      {user.role === 'admin' ? '관리자' : '점검 요원'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center p-2 rounded-lg text-red-100 hover:bg-red-800 hover:text-white transition-colors"
                    title="로그아웃"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-white hover:bg-red-600 focus:outline-none transition-colors"
                aria-label="메뉴 열기"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 md:hidden transition-opacity backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-over Drawer Navigation */}
      <div 
        className={`fixed top-0 right-0 w-4/5 max-w-xs h-full bg-white text-gray-800 shadow-2xl z-50 md:hidden flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="p-5 bg-red-700 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span className="font-bold text-lg">의령소방서 메뉴</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg text-red-100 hover:bg-red-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info Card in Drawer */}
        {user && (
          <div className="p-4 bg-red-50 border-b border-red-100 flex items-center space-x-3 text-left">
            <div className="p-2 bg-red-100 text-red-700 rounded-full">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">
                {user.name || user.employeeId || user.email.split('@')[0]}
              </p>
              <p className="text-xs text-red-600 font-medium">
                {user.role === 'admin' ? '시스템 관리자' : '점검 담당자'}
              </p>
            </div>
          </div>
        )}

        {/* Mobile Module Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-left">
          <p className="text-xs font-bold text-gray-400 px-3 uppercase tracking-wider mb-2">점검 모듈 메뉴</p>
          {MODULE_ROUTES.map(module => {
            const Icon = module.icon;
            const active = isNavActive(module);
            return (
              <Link
                key={module.path}
                to={module.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all ${
                  active 
                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-3 ${active ? 'text-red-600' : 'text-gray-400'}`} />
                  <span>{module.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${active ? 'text-red-600' : 'text-gray-300'}`} />
              </Link>
            );
          })}
        </div>

        {/* Mobile Logout Footer */}
        {user && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition shadow-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative print:overflow-visible">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/list" element={<ListView />} />
          <Route path="/fire-water" element={<FireWaterListView />} />
          <Route path="/fire-water-map" element={<FireWaterMapView />} />
          <Route path="/vehicle" element={<VehicleListView />} />
          {/* Catch-all route to prevent white screens on invalid/unmatched paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
