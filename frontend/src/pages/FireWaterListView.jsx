import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  FileSpreadsheet, 
  Plus, 
  Upload, 
  Download,
  LayoutGrid,
  Map as MapIcon,
  BarChart2,
  ShieldCheck,
  Database,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FireWaterInspectionModal from '../components/FireWaterInspectionModal';
import FireWaterInspectionDetailModal from '../components/FireWaterInspectionDetailModal';
import FireWaterEditModal from '../components/FireWaterEditModal';
import FireWaterMapView from './FireWaterMapView';

export default function FireWaterListView() {
  const [fireWaters, setFireWaters] = useState([]);
  const [selectedFireWater, setSelectedFireWater] = useState(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [viewInspection, setViewInspection] = useState(null);
  const [editingInspection, setEditingInspection] = useState(null);
  const [editingFireWater, setEditingFireWater] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Navigation Tabs: 'stats', 'manage', 'audit', 'data'
  const [activeTab, setActiveTab] = useState('manage');

  // View mode inside Manage tab: 'list' or 'map'
  const [viewMode, setViewMode] = useState('list');

  // Filters
  const [stationFilter, setStationFilter] = useState('전체');
  const [regionFilter, setRegionFilter] = useState('전체');
  const [legalTypeFilter, setLegalTypeFilter] = useState('전체');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // Table Sort State
  const [sortField, setSortField] = useState('serialNumber');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Audit state
  const [auditSummary, setAuditSummary] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const excelInputRef = useRef(null);

  useEffect(() => {
    fetchFireWaters();
  }, []);

  const fetchFireWaters = async () => {
    try {
      const res = await axios.get('/api/fire-waters');
      setFireWaters(res.data);
    } catch (error) {
      console.error('Failed to fetch fire waters:', error);
    }
  };

  const handleRevalidateAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await axios.post('/api/fire-waters/audit/revalidate');
      setAuditSummary(res.data.summary);
      alert(res.data.message || '전체 데이터 검수가 완료되었습니다.');
      fetchFireWaters();
    } catch (error) {
      console.error('Failed to revalidate data audit:', error);
      alert('데이터 검수 중 오류가 발생했습니다.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleOpenInspectionModal = (fw) => {
    setSelectedFireWater(fw);
    setIsInspectionModalOpen(true);
  };

  const handleInspectionComplete = () => {
    setIsInspectionModalOpen(false);
    setSelectedFireWater(null);
    setEditingInspection(null);
    fetchFireWaters();
    alert('조사 결과가 저장되었습니다.');
  };

  const handleViewResults = (inspection) => {
    if (!inspection) {
      alert('점검 결과가 존재하지 않습니다.');
      return;
    }
    setViewInspection(inspection);
  };

  const handleEditInspection = (inspection) => {
    setViewInspection(null);
    setEditingInspection(inspection);
  };

  const handleDeleteInspection = async (id) => {
    if (window.confirm('정말 점검 기록을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`/api/fire-waters/inspections/${id}`);
        setViewInspection(null);
        fetchFireWaters();
        alert('삭제되었습니다.');
      } catch (error) {
        console.error('Failed to delete inspection:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleDeleteFireWater = async (id) => {
    if (window.confirm('정말 대상 소방용수 및 해당 점검 기록을 전체 삭제하시겠습니까?')) {
      try {
        await axios.delete(`/api/fire-waters/${id}`);
        fetchFireWaters();
        alert('삭제되었습니다.');
      } catch (error) {
        console.error('Failed to delete fire water:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('excel', file);

    try {
      const res = await axios.post('/api/fire-waters/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message || '성공적으로 업로드되었습니다.');
      fetchFireWaters();
    } catch (error) {
      console.error('Excel upload failed:', error);
      alert(error.response?.data?.error || '업로드 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
    } finally {
      e.target.value = null;
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter logic
  let filtered = fireWaters.filter(fw => {
    const matchRegion = regionFilter === '전체' || fw.region === regionFilter;
    const matchLegal = legalTypeFilter === '전체' || (fw.legalType || '법정') === legalTypeFilter;
    const matchType = typeFilter === '전체' || fw.type === typeFilter;
    const matchStatus = statusFilter === '전체' || 
                        (statusFilter === '완료' ? fw.isInspected : !fw.isInspected);
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || 
                        (fw.name && fw.name.toLowerCase().includes(q)) || 
                        (fw.address && fw.address.toLowerCase().includes(q)) ||
                        (fw.serialNumber && fw.serialNumber.toLowerCase().includes(q)) ||
                        (fw.hydId && fw.hydId.toLowerCase().includes(q)) ||
                        (fw.masterId && fw.masterId.toLowerCase().includes(q)) ||
                        (fw.nearbyBuilding && fw.nearbyBuilding.toLowerCase().includes(q));
    return matchRegion && matchLegal && matchType && matchStatus && matchSearch;
  });

  // Sorting logic
  filtered.sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const fireWaterTypes = ['지상소화전', '지하소화전', '급수탑', '저수조', '비상소화장치'];

  // Stats calculation
  const totalCount = fireWaters.length;
  const legalCount = fireWaters.filter(f => (f.legalType || '법정') === '법정').length;
  const nonLegalCount = fireWaters.filter(f => (f.legalType || '법정') === '비법정').length;
  const inspectedCount = fireWaters.filter(f => f.isInspected).length;
  const auditNeedCount = fireWaters.filter(f => f.needsAudit === 'Y').length;

  const typeDistribution = fireWaterTypes.map(t => ({
    type: t,
    count: fireWaters.filter(f => f.type === t).length
  }));

  const centerDistribution = ['의령', '부림', '정곡'].map(c => ({
    center: c + '119안전센터',
    count: fireWaters.filter(f => f.region === c).length
  }));

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col overflow-hidden text-left">
      {/* Top Banner Header */}
      <div className="bg-white px-5 py-3 shadow-sm z-10 border-b flex flex-col space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-gray-900 text-lg sm:text-xl tracking-tight">
                소방용수시설 통합관리 시스템
              </h2>
              <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                v5.4.4 통합
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              관내 소방용수 마스터 DB조회, 데이터 검수, 위치 지도, 불량이력 관리를 통합 지원합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download/Upload Tools */}
            <button
              onClick={() => excelInputRef.current.click()}
              className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
              title="엑셀 업로드"
            >
              <Upload className="w-3.5 h-3.5 mr-1" /> 업로드
            </button>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              className="hidden"
              ref={excelInputRef}
            />

            <a
              href="/api/fire-waters/export-excel"
              target="_blank"
              download
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> 엑셀 다운로드
            </a>

            <Link 
              to="/fire-water-report" 
              className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-sm text-xs transition"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" /> 관리카드 인쇄
            </Link>

            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> + 신규 시설
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-gray-200 gap-1 pt-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'manage'
                ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> 시설관리 ({filtered.length})
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> 종합 통계
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> 데이터 검수 & 불량이력
            {auditNeedCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                {auditNeedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'data'
                ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Database className="w-4 h-4" /> DB 교환 & 관리
          </button>
        </div>
      </div>

      {/* TAB 1: 시설관리 (Manage Tab) */}
      {activeTab === 'manage' && (
        <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl shadow-xs border border-gray-200 space-y-3 shrink-0">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="통합검색 (관리번호, HYD_ID, MASTER_ID, 주소, 주변대상물)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xs sm:text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <select 
                  value={regionFilter} 
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-xs font-medium"
                >
                  <option value="전체">안전센터: 전체</option>
                  <option value="의령">의령119안전센터</option>
                  <option value="부림">부림119안전센터</option>
                  <option value="정곡">정곡119안전센터</option>
                </select>

                <select 
                  value={legalTypeFilter} 
                  onChange={(e) => setLegalTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-xs font-medium"
                >
                  <option value="전체">법정구분: 전체</option>
                  <option value="법정">법정</option>
                  <option value="비법정">비법정</option>
                </select>

                <select 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-xs font-medium"
                >
                  <option value="전체">시설종류: 전체</option>
                  {fireWaterTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-xs font-medium"
                >
                  <option value="전체">조사상태: 전체</option>
                  <option value="미점검">미조사</option>
                  <option value="완료">조사 완료</option>
                </select>

                {/* View Mode Segmented Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 ${
                      viewMode === 'list' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> 리스트
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 ${
                      viewMode === 'map' ? 'bg-white text-red-600 shadow-xs font-extrabold' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5" /> 지도 보기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* View Content */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'map' ? (
              <div className="h-full w-full min-h-[500px] bg-white rounded-xl shadow-xs border border-gray-200 p-2">
                <FireWaterMapView 
                  fireWaters={filtered} 
                  onRefresh={fetchFireWaters} 
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden flex flex-col h-full">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                    <thead className="bg-gray-100/80 text-gray-700 font-bold sticky top-0 z-10 border-b border-gray-200">
                      <tr>
                        <th onClick={() => handleSort('serialNumber')} className="py-3 px-3 cursor-pointer hover:bg-gray-200/70 transition">
                          관리번호 <ArrowUpDown className="inline w-3 h-3 text-gray-400" />
                        </th>
                        <th onClick={() => handleSort('legalType')} className="py-3 px-3 cursor-pointer hover:bg-gray-200/70 transition">
                          구분 <ArrowUpDown className="inline w-3 h-3 text-gray-400" />
                        </th>
                        <th onClick={() => handleSort('name')} className="py-3 px-3 cursor-pointer hover:bg-gray-200/70 transition">
                          용수명 <ArrowUpDown className="inline w-3 h-3 text-gray-400" />
                        </th>
                        <th onClick={() => handleSort('region')} className="py-3 px-3 cursor-pointer hover:bg-gray-200/70 transition">
                          안전센터 <ArrowUpDown className="inline w-3 h-3 text-gray-400" />
                        </th>
                        <th onClick={() => handleSort('address')} className="py-3 px-3 cursor-pointer hover:bg-gray-200/70 transition">
                          위치 주소 <ArrowUpDown className="inline w-3 h-3 text-gray-400" />
                        </th>
                        <th onClick={() => handleSort('hydId')} className="py-3 px-3 cursor-pointer hover:bg-gray-200/70 transition">
                          HYD_ID / MASTER_ID
                        </th>
                        <th className="py-3 px-3">관경 / 수압</th>
                        <th className="py-3 px-3">표지 / 보호틀</th>
                        <th className="py-3 px-3">조사상태</th>
                        <th className="py-3 px-3 text-right">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map(fw => (
                        <tr key={fw._id} className="hover:bg-red-50/30 transition">
                          <td className="py-2.5 px-3 font-bold text-gray-900">
                            {fw.serialNumber || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (fw.legalType || '법정') === '법정' 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {fw.legalType || '법정'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-gray-800">
                            <div>{fw.name}</div>
                            <div className="text-[10px] text-red-600 font-normal">{fw.type}</div>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {fw.region}119안전센터
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px] truncate text-gray-600" title={fw.address}>
                            {fw.address}
                            {fw.nearbyBuilding && (
                              <div className="text-[10px] text-gray-400 italic">({fw.nearbyBuilding})</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">
                            {fw.hydId || fw.masterId || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {fw.diameter ? fw.diameter + 'mm' : '-'} / {fw.waterPressure ? fw.waterPressure + 'Mpa' : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            표지: {fw.signBoard || '×'} / 보호: {fw.protectiveFrame || '×'}
                          </td>
                          <td className="py-2.5 px-3">
                            {fw.isInspected ? (
                              <span className="inline-flex items-center text-green-700 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" /> 완료
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-red-700 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200">
                                <AlertCircle className="w-3 h-3 mr-1" /> 미조사
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setEditingFireWater(fw)}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-bold"
                              >
                                수정
                              </button>

                              {fw.isInspected ? (
                                <button
                                  onClick={() => handleViewResults(fw.latestInspection)}
                                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[11px] font-bold"
                                >
                                  결과
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenInspectionModal(fw)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold"
                                >
                                  조사
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteFireWater(fw._id)}
                                className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[11px] font-bold"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan="10" className="py-12 text-center text-gray-400">
                            조회된 소방용수 시설 데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 종합 통계 (Stats Tab) */}
      {activeTab === 'stats' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-bold text-gray-500">전체 소방용수</span>
              <p className="text-2xl font-black text-gray-900 mt-1">{totalCount}개소</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-bold text-blue-600">법정 소화전</span>
              <p className="text-2xl font-black text-blue-700 mt-1">{legalCount}개소</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-bold text-amber-600">비법정 소화전</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{nonLegalCount}개소</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-bold text-green-600">분기 조사완료율</span>
              <p className="text-2xl font-black text-green-700 mt-1">
                {totalCount > 0 ? Math.round((inspectedCount / totalCount) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Bar Chart Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-gray-800 border-b pb-2">시설 종류별 분포</h3>
              <div className="space-y-2.5">
                {typeDistribution.map(item => {
                  const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                  return (
                    <div key={item.type} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-700">{item.type}</span>
                        <span className="text-gray-900">{item.count}개 ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-gray-800 border-b pb-2">관서/안전센터별 분포</h3>
              <div className="space-y-2.5">
                {centerDistribution.map(item => {
                  const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                  return (
                    <div key={item.center} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-700">{item.center}</span>
                        <span className="text-gray-900">{item.count}개 ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 데이터 검수 & 불량이력 (Audit Tab) */}
      {activeTab === 'audit' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">시스템 자동 데이터 검수</h3>
              <p className="text-xs text-gray-500">좌표 누락, 범위 오류, 관리번호 중복 및 수압 이상 유무를 검수합니다.</p>
            </div>
            <button
              onClick={handleRevalidateAudit}
              disabled={isAuditing}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              {isAuditing ? '검수 진행 중...' : '전체 재검수 실행'}
            </button>
          </div>

          {/* Audit Results Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-800 border-b pb-2">검수 대상 항목</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                  <tr>
                    <th className="py-2.5 px-3">관리번호</th>
                    <th className="py-2.5 px-3">MASTER_ID</th>
                    <th className="py-2.5 px-3">매칭상태</th>
                    <th className="py-2.5 px-3">검수결과</th>
                    <th className="py-2.5 px-3">도로명주소</th>
                    <th className="py-2.5 px-3 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fireWaters.map(fw => (
                    <tr key={fw._id} className={fw.needsAudit === 'Y' ? 'bg-red-50/50' : ''}>
                      <td className="py-2.5 px-3 font-bold text-gray-900">{fw.serialNumber || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-500">{fw.masterId || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                          {fw.matchingStatus || '자동매칭'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {fw.auditResult === '정상' ? (
                          <span className="text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 정상
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> {fw.auditResult || '검수필요'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{fw.address}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setEditingFireWater(fw)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-bold"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 마스터 DB 교환 & 관리 (Data Tab) */}
      {activeTab === 'data' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-gray-900 border-b pb-2">마스터DB 다운로드</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                현재 통합 시스템에 등록된 소방용수 시설 데이터 전체 및 점검 결과를 엑셀 서식으로 다운로드합니다.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href="/api/fire-waters/export-excel"
                  target="_blank"
                  download
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> 엑셀 목록 다운로드
                </a>
                <a
                  href="/api/fire-waters/export-results-excel"
                  target="_blank"
                  download
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" /> 점검결과 다운로드
                </a>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-gray-900 border-b pb-2">마스터DB 일괄 업로드</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                소방용수 마스터 엑셀 파일(.xlsx)을 업로드하여 데이터를 일괄 갱신합니다.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => excelInputRef.current.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> 엑셀 파일 선택
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {isInspectionModalOpen && selectedFireWater && (
        <FireWaterInspectionModal 
          fireWater={selectedFireWater} 
          onClose={() => setIsInspectionModalOpen(false)}
          onSuccess={handleInspectionComplete}
        />
      )}

      {/* View Detail Inspection Modal */}
      {viewInspection && (
        <FireWaterInspectionDetailModal 
          inspection={viewInspection} 
          onClose={() => setViewInspection(null)} 
          onEdit={handleEditInspection}
          onDelete={handleDeleteInspection}
        />
      )}

      {/* Edit Inspection Modal */}
      {editingInspection && (
        <FireWaterInspectionModal 
          fireWater={editingInspection.fireWater}
          initialData={editingInspection}
          onClose={() => setEditingInspection(null)}
          onSuccess={handleInspectionComplete}
        />
      )}

      {/* Edit or Add Target Modal */}
      {(isAddingNew || editingFireWater) && (
        <FireWaterEditModal
          fireWater={editingFireWater}
          onClose={() => {
            setIsAddingNew(false);
            setEditingFireWater(null);
          }}
          onSuccess={() => {
            setIsAddingNew(false);
            setEditingFireWater(null);
            fetchFireWaters();
            alert('소방용수 정보가 저장되었습니다.');
          }}
        />
      )}
    </div>
  );
}
