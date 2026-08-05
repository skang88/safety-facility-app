import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  Truck, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Wrench, 
  Navigation,
  Fuel,
  Calendar,
  User,
  Gauge
} from 'lucide-react';
import VehicleEditModal from '../components/VehicleEditModal';
import VehicleLogModal from '../components/VehicleLogModal';
import VehicleMaintenanceModal from '../components/VehicleMaintenanceModal';

export default function VehicleListView() {
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles', 'logs', 'maintenances'
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [isAddingMaintenance, setIsAddingMaintenance] = useState(false);
  const [selectedVehicleForAction, setSelectedVehicleForAction] = useState('');

  // Filters
  const [regionFilter, setRegionFilter] = useState('전체');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  const excelInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'vehicles') {
        const res = await axios.get('/api/vehicles');
        setVehicles(res.data);
      } else if (activeTab === 'logs') {
        const res = await axios.get('/api/vehicles/logs');
        setLogs(res.data);
      } else if (activeTab === 'maintenances') {
        const res = await axios.get('/api/vehicles/maintenances');
        setMaintenances(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch vehicle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('excel', file);

    try {
      const res = await axios.post('/api/vehicles/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message || '성공적으로 업로드되었습니다.');
      fetchData();
    } catch (error) {
      console.error('Excel upload failed:', error);
      alert(error.response?.data?.error || '엑셀 업로드 중 오류가 발생했습니다.');
    } finally {
      e.target.value = null;
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (window.confirm('정말 이 차량을 삭제하시겠습니까? 관련 운행 및 정비 기록도 모두 삭제됩니다.')) {
      try {
        await axios.delete(`/api/vehicles/${id}`);
        alert('삭제되었습니다.');
        fetchData();
      } catch (error) {
        console.error('Failed to delete vehicle:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchRegion = regionFilter === '전체' || v.region === regionFilter;
    const matchType = typeFilter === '전체' || v.type === typeFilter;
    const matchStatus = statusFilter === '전체' || v.status === statusFilter;
    const matchSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRegion && matchType && matchStatus && matchSearch;
  });

  // Filter urgent D-Day alerts (due within 7 days or overdue)
  const alertVehicles = vehicles.filter(v => v.alertLevel === 'overdue' || v.alertLevel === 'warning');

  const vehicleTypes = ['펌프차', '물탱크차', '사다리차', '구급차', '지휘차', '구조차', '행정차'];

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col overflow-hidden text-left">
      {/* Top Banner & Main Sub-view Selector */}
      <div className="bg-white p-4 shadow-sm z-10 border-b flex flex-col space-y-4 shrink-0">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="font-bold text-gray-800 text-base sm:text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-red-600" />
              소방차량 관리 시스템 ({vehicles.length}대 운용)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              의령소방서 관내 소방차량의 운행 일지 작성, 누적 주행거리, 정기점검 및 정비 시기를 관리합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Excel Actions */}
            <button
              onClick={() => excelInputRef.current.click()}
              className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs transition shadow-sm whitespace-nowrap"
              title="소방차량 대장 엑셀 업로드"
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              대장 업로드
            </button>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              className="hidden"
              ref={excelInputRef}
            />

            <a
              href="/api/vehicles/export-excel"
              target="_blank"
              download
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow-sm whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              대장 다운로드
            </a>

            <a
              href="/api/vehicles/export-logs-excel"
              target="_blank"
              download
              className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
              운행일지 다운로드
            </a>

            {/* Quick Record Buttons */}
            <button
              onClick={() => setIsAddingLog(true)}
              className="flex items-center px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-xs transition shadow-sm whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5 mr-1" />
              운행기록 작성
            </button>

            <button
              onClick={() => setIsAddingMaintenance(true)}
              className="flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition shadow-sm whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5 mr-1" />
              정비기록 작성
            </button>

            <button
              onClick={() => setIsAddingVehicle(true)}
              className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              차량 신규등록
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 space-x-2 pt-1">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-t-lg transition border-b-2 -mb-[2px] flex items-center gap-1.5 ${
              activeTab === 'vehicles'
                ? 'border-red-600 text-red-600 font-extrabold bg-red-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            소방차량 현황 및 점검 알림
            {alertVehicles.length > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full ml-1 animate-pulse font-extrabold">
                {alertVehicles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-t-lg transition border-b-2 -mb-[2px] flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-red-600 text-red-600 font-extrabold bg-red-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Navigation className="w-4 h-4" />
            운행 기록일지
          </button>

          <button
            onClick={() => setActiveTab('maintenances')}
            className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-t-lg transition border-b-2 -mb-[2px] flex items-center gap-1.5 ${
              activeTab === 'maintenances'
                ? 'border-red-600 text-red-600 font-extrabold bg-red-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            정비 및 점검 이력
          </button>
        </div>

        {/* Filter Controls for Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div className="w-full flex flex-col md:flex-row gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="차량번호 또는 차량명 검색..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs sm:text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select 
                value={regionFilter} 
                onChange={(e) => setRegionFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm font-medium"
              >
                <option value="전체">센터 전체</option>
                <option value="의령">의령</option>
                <option value="부림">부림</option>
                <option value="정곡">정곡</option>
              </select>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm font-medium"
              >
                <option value="전체">종류 전체</option>
                {vehicleTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm font-medium"
              >
                <option value="전체">상태 전체</option>
                <option value="운용중">운용중</option>
                <option value="점검중">점검중</option>
                <option value="정비중">정비중</option>
                <option value="휴차">휴차</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* D-Day Alert Banner (Vehicles Tab) */}
        {activeTab === 'vehicles' && alertVehicles.length > 0 && (
          <div className="max-w-7xl mx-auto bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm text-left">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce" />
              <span>차기 점검/정비 시기도래 및 지연 차량 알림 ({alertVehicles.length}대)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {alertVehicles.map(v => (
                <div 
                  key={v._id}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${
                    v.alertLevel === 'overdue' 
                      ? 'bg-red-100 border-red-300 text-red-800' 
                      : 'bg-amber-100 border-amber-300 text-amber-900'
                  }`}
                >
                  <span>[{v.region}119] {v.vehicleNumber} ({v.name})</span>
                  <span className="bg-white px-2 py-0.5 rounded text-[11px] shadow-xs">
                    {v.alertMessage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-gray-500 font-medium">데이터를 불러오는 중입니다...</div>
        ) : activeTab === 'vehicles' ? (
          /* VEHICLES CARDS GRID */
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVehicles.map(v => {
              let statusBg = 'bg-green-100 text-green-800 border-green-200';
              if (v.status === '점검중' || v.status === '정비중') statusBg = 'bg-amber-100 text-amber-800 border-amber-200';
              if (v.status === '휴차') statusBg = 'bg-gray-200 text-gray-700 border-gray-300';

              return (
                <div key={v._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition text-left">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div>
                      <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-1.5 py-0.5 rounded font-bold mr-1.5">
                        {v.type}
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium">
                        {v.manufactureYear ? `${v.manufactureYear}년식` : '연식미상'}
                      </span>
                      <h3 className="font-bold text-base text-gray-900 mt-1">{v.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{v.vehicleNumber}</p>
                    </div>

                    <span className={`px-2 py-1 rounded text-[11px] font-bold border shrink-0 ${statusBg}`}>
                      {v.status}
                    </span>
                  </div>

                  {/* Mileage & Center */}
                  <div className="my-3 bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1 text-xs text-gray-700">
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">• 소속:</span>
                      <span className="font-bold">{v.region}119안전센터</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">• 누적 주행거리:</span>
                      <span className="font-bold text-red-600 font-mono text-sm">{v.totalMileage.toLocaleString()} km</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">• 연료:</span>
                      <span className="font-bold">{v.fuelType}</span>
                    </p>
                  </div>

                  {/* Scheduled Dates & Alerts */}
                  <div className="space-y-1.5 mb-4 text-xs">
                    <div className="flex justify-between items-center p-2 bg-blue-50/60 rounded border border-blue-100">
                      <span className="text-gray-600 font-medium">차기 정기점검:</span>
                      <span className="font-bold font-mono">{v.nextInspectionDate || '미설정'}</span>
                    </div>

                    <div className="flex justify-between items-center p-2 bg-purple-50/60 rounded border border-purple-100">
                      <span className="text-gray-600 font-medium">차기 정비예정:</span>
                      <span className="font-bold font-mono">{v.nextMaintenanceDate || '미설정'}</span>
                    </div>

                    {v.alertMessage && (
                      <div className={`p-1.5 rounded text-center font-extrabold text-[11px] border ${
                        v.alertLevel === 'overdue' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        ⚠️ {v.alertMessage}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-auto pt-3 border-t border-gray-100 grid grid-cols-3 gap-1">
                    <button
                      onClick={() => {
                        setSelectedVehicleForAction(v._id);
                        setIsAddingLog(true);
                      }}
                      className="py-1.5 px-2 bg-violet-50 text-violet-700 border border-violet-200 rounded text-xs font-bold hover:bg-violet-100 transition whitespace-nowrap text-center"
                    >
                      🛣️ 운행기록
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVehicleForAction(v._id);
                        setIsAddingMaintenance(true);
                      }}
                      className="py-1.5 px-2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-bold hover:bg-amber-100 transition whitespace-nowrap text-center"
                    >
                      🛠️ 정비기록
                    </button>
                    <button
                      onClick={() => setEditingVehicle(v)}
                      className="py-1.5 px-2 bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-bold hover:bg-gray-100 transition whitespace-nowrap text-center"
                    >
                      ✏️ 수정
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredVehicles.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-500">
                <Truck className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-lg">등록된 소방차량이 없습니다.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'logs' ? (
          /* DRIVING LOGS TABLE */
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">최근 차량 운행 기록일지 ({logs.length}건)</h3>
              <button
                onClick={() => setIsAddingLog(true)}
                className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 shadow-sm"
              >
                + 운행 기록 작성
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left text-gray-700">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">차량정보</th>
                    <th className="p-3">운전자/소속</th>
                    <th className="p-3">운행목적</th>
                    <th className="p-3">출발~도착일시</th>
                    <th className="p-3">주행거리 (km)</th>
                    <th className="p-3">주유량</th>
                    <th className="p-3">비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <tr key={log._id} className="hover:bg-gray-50 transition">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{log.vehicle?.name || '-'}</p>
                        <p className="text-[11px] text-gray-500 font-mono">{log.vehicle?.vehicleNumber}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold">{log.driverName}</p>
                        <p className="text-[11px] text-gray-500">{log.affiliation}</p>
                      </td>
                      <td className="p-3">
                        <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[11px] font-bold">
                          {log.purpose}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        <p>출발: {log.departureTime}</p>
                        <p className="text-gray-500">도착: {log.arrivalTime}</p>
                      </td>
                      <td className="p-3 font-mono">
                        <p className="font-bold text-red-600">{log.distance} km</p>
                        <p className="text-[11px] text-gray-400">({log.startMileage} → {log.endMileage})</p>
                      </td>
                      <td className="p-3 font-mono">
                        {log.fuelRefueled > 0 ? (
                          <span className="text-amber-600 font-bold">{log.fuelRefueled} L</span>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-xs text-gray-500 max-w-xs truncate">
                        {log.notes || '-'}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">등록된 운행 기록이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* MAINTENANCE LOGS TABLE */
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">소방차량 점검 및 정비 이력 ({maintenances.length}건)</h3>
              <button
                onClick={() => setIsAddingMaintenance(true)}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 shadow-sm"
              >
                + 정비 기록 작성
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left text-gray-700">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">차량정보</th>
                    <th className="p-3">구분</th>
                    <th className="p-3">점검/정비자</th>
                    <th className="p-3">점검일자</th>
                    <th className="p-3">차기 예정일</th>
                    <th className="p-3">소모품 체크</th>
                    <th className="p-3">비용/사진</th>
                    <th className="p-3">내역</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {maintenances.map(m => (
                    <tr key={m._id} className="hover:bg-gray-50 transition">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{m.vehicle?.name || '-'}</p>
                        <p className="text-[11px] text-gray-500 font-mono">{m.vehicle?.vehicleNumber}</p>
                      </td>
                      <td className="p-3">
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
                          {m.maintenanceType}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold">{m.inspectorName}</p>
                        <p className="text-[11px] text-gray-500">{m.affiliation}</p>
                      </td>
                      <td className="p-3 font-mono">{m.inspectionDate}</td>
                      <td className="p-3 font-mono text-purple-700 font-bold">{m.nextDueDate || '-'}</td>
                      <td className="p-3">
                        <div className="text-[11px] space-y-0.5">
                          <p>엔진오일: <span className="font-bold">{m.itemsChecked?.engineOil || '-'}</span></p>
                          <p>브레이크: <span className="font-bold">{m.itemsChecked?.brakeStatus || '-'}</span></p>
                          <p>타이어: <span className="font-bold">{m.itemsChecked?.tireStatus || '-'}</span></p>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-mono font-bold">{m.cost ? m.cost.toLocaleString() + '원' : '-'}</p>
                        {m.photoPath && (
                          <a href={m.photoPath} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 underline">
                            사진보기
                          </a>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-500 max-w-xs truncate">
                        {m.notes || '-'}
                      </td>
                    </tr>
                  ))}
                  {maintenances.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-400">등록된 정비/점검 기록이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(isAddingVehicle || editingVehicle) && (
        <VehicleEditModal
          vehicle={editingVehicle}
          onClose={() => {
            setIsAddingVehicle(false);
            setEditingVehicle(null);
          }}
          onSuccess={() => {
            setIsAddingVehicle(false);
            setEditingVehicle(null);
            fetchData();
            alert('소방차량 정보가 저장되었습니다.');
          }}
        />
      )}

      {isAddingLog && (
        <VehicleLogModal
          vehicles={vehicles}
          defaultVehicleId={selectedVehicleForAction}
          onClose={() => {
            setIsAddingLog(false);
            setSelectedVehicleForAction('');
          }}
          onSuccess={() => {
            setIsAddingLog(false);
            setSelectedVehicleForAction('');
            fetchData();
            alert('운행 기록일지가 작성되었습니다.');
          }}
        />
      )}

      {isAddingMaintenance && (
        <VehicleMaintenanceModal
          vehicles={vehicles}
          defaultVehicleId={selectedVehicleForAction}
          onClose={() => {
            setIsAddingMaintenance(false);
            setSelectedVehicleForAction('');
          }}
          onSuccess={() => {
            setIsAddingMaintenance(false);
            setSelectedVehicleForAction('');
            fetchData();
            alert('소방차량 점검 및 정비 기록이 작성되었습니다.');
          }}
        />
      )}
    </div>
  );
}
