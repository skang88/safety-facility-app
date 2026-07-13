import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Flame, Map } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ListView from './pages/ListView';
import FireWaterListView from './pages/FireWaterListView';
import FireWaterMapView from './pages/FireWaterMapView';
import ReportView from './pages/ReportView';
import FireWaterReportView from './pages/FireWaterReportView';

function App() {
  const location = useLocation();

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
