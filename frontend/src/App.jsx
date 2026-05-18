import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Map, LayoutDashboard } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';

function App() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation */}
      <nav className="bg-red-700 text-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl">의령소방서 수난안전시설물 점검</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/' ? 'bg-red-800 text-white' : 'text-red-100 hover:bg-red-600'
                }`}
              >
                <LayoutDashboard className="w-5 h-5 mr-1" />
                대시보드
              </Link>
              <Link
                to="/map"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/map' ? 'bg-red-800 text-white' : 'text-red-100 hover:bg-red-600'
                }`}
              >
                <Map className="w-5 h-5 mr-1" />
                지도보기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
