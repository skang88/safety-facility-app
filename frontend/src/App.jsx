import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListChecks } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ListView from './pages/ListView';

import ReportView from './pages/ReportView';

function App() {
  const location = useLocation();

  if (location.pathname === '/report') {
    return (
      <Routes>
        <Route path="/report" element={<ReportView />} />
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
                to="/list"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/list' ? 'bg-red-800 text-white' : 'text-red-100 hover:bg-red-600'
                }`}
              >
                <ListChecks className="w-5 h-5 mr-1" />
                점검 리스트
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
        </Routes>
      </main>
    </div>
  );
}

export default App;
