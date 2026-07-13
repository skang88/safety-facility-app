import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Search, CheckCircle, AlertCircle, Printer, FileSpreadsheet, Plus, Upload, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import FireWaterInspectionModal from '../components/FireWaterInspectionModal';
import FireWaterInspectionDetailModal from '../components/FireWaterInspectionDetailModal';
import FireWaterEditModal from '../components/FireWaterEditModal';

export default function FireWaterListView() {
  const [fireWaters, setFireWaters] = useState([]);
  const [selectedFireWater, setSelectedFireWater] = useState(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [viewInspection, setViewInspection] = useState(null);
  const [editingInspection, setEditingInspection] = useState(null);
  const [editingFireWater, setEditingFireWater] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Filters
  const [regionFilter, setRegionFilter] = useState('전체');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

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
      e.target.value = null; // Clear input
    }
  };

  // Filter fire waters
  let filtered = fireWaters.filter(fw => {
    const matchRegion = regionFilter === '전체' || fw.region === regionFilter;
    const matchType = typeFilter === '전체' || fw.type === typeFilter;
    const matchStatus = statusFilter === '전체' || 
                        (statusFilter === '완료' ? fw.isInspected : !fw.isInspected);
    const matchSearch = fw.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        fw.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRegion && matchType && matchStatus && matchSearch;
  });

  // Sort by region and name
  const regionOrder = { '의령': 1, '부림': 2, '정곡': 3 };
  filtered.sort((a, b) => {
    if (regionOrder[a.region] !== regionOrder[b.region]) {
      return (regionOrder[a.region] || 99) - (regionOrder[b.region] || 99);
    }
    return a.name.localeCompare(b.name, 'ko', { numeric: true });
  });

  const fireWaterTypes = ['지상소화전', '지하소화전', '급수탑', '저수조', '비상소화장치'];

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col">
      {/* Top Banner and Excel Tools */}
      <div className="bg-white p-4 shadow-sm z-10 border-b flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="font-bold text-gray-800 text-lg text-left">소방용수 관리 ({filtered.length}개소)</h2>
            <p className="text-xs text-gray-500 text-left">소방용수 대상물 리스트 관리 및 분기 조사를 기록합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Excel Upload */}
            <button
              onClick={() => excelInputRef.current.click()}
              className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
              title="소방용수 엑셀 리스트를 업로드하여 대상물을 등록/수정합니다."
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              대상물 업로드
            </button>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              className="hidden"
              ref={excelInputRef}
            />

            {/* Excel Downloads */}
            <a
              href="/api/fire-waters/export-excel"
              target="_blank"
              download
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              대상물 다운로드
            </a>

            <a
              href="/api/fire-waters/export-results-excel"
              target="_blank"
              download
              className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
              점검결과 다운로드
            </a>

            {/* Print and Add */}
            <Link 
              to="/fire-water-report" 
              className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-sm text-xs transition"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              보고서 출력
            </Link>

            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              신규 등록
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="w-full flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="용수명 또는 주소 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
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
              <option value="전체">구분 전체</option>
              {fireWaterTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm font-medium"
            >
              <option value="전체">조사여부 전체</option>
              <option value="미점검">미점검</option>
              <option value="완료">조사 완료</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List View */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(fw => {
            const hasSerial = !!fw.serialNumber;
            const lat = fw.location.coordinates[1];
            const lon = fw.location.coordinates[0];

            return (
              <div key={fw._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition text-left">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="pr-1 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        {fw.type}
                      </span>
                      {hasSerial && (
                        <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          {fw.serialNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-gray-800 break-all">{fw.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-normal break-keep">{fw.address}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-gray-400">
                      <p className="text-[10px] font-mono">
                        ({lat.toFixed(5)}, {lon.toFixed(5)})
                      </p>
                      <button
                        onClick={() => setEditingFireWater(fw)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center shrink-0 transition-colors"
                      >
                        수정
                      </button>
                    </div>
                  </div>
                  
                  {fw.isInspected ? (
                    <span className="flex items-center text-green-700 bg-green-100 px-2 py-1 rounded text-[10px] sm:text-[11px] font-bold whitespace-nowrap shrink-0 shadow-sm border border-green-200">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> 조사완료
                    </span>
                  ) : (
                    <span className="flex items-center text-red-700 bg-red-100 px-2 py-1 rounded text-[10px] sm:text-[11px] font-bold whitespace-nowrap shrink-0 shadow-sm border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> 미조사
                    </span>
                  )}
                </div>

                <div className="mb-4 space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-700">
                  <p>• 센터: <span className="font-bold">{fw.region}119안전센터</span></p>
                  <p>• 구경: <span className="font-bold">{fw.diameter ? fw.diameter + ' mm' : '미기재'}</span></p>
                  <p>• 설치일자: <span className="font-bold">{fw.installDate || '미기재'}</span></p>
                  {fw.details && <p className="text-[11px] text-gray-500 line-clamp-1 italic">• {fw.details}</p>}
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex gap-1.5">
                  <a
                    href={`https://map.kakao.com/link/map/${encodeURIComponent(fw.name)},${lat},${lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-lg font-bold text-xs transition text-center bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 flex items-center justify-center whitespace-nowrap"
                  >
                    📍 위치
                  </a>
                  {fw.isInspected ? (
                    <>
                      <button
                        onClick={() => handleViewResults(fw.latestInspection)}
                        className="flex-1 py-2 rounded-lg font-bold text-xs transition shadow-sm bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 whitespace-nowrap"
                      >
                        👁 결과보기
                      </button>
                      <button
                        onClick={() => handleEditInspection(fw.latestInspection)}
                        className="flex-1 py-2 rounded-lg font-bold text-xs transition shadow-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                      >
                        ✏️ 수정
                      </button>
                    </>
                  ) : (
                    <>
                      {fw.latestInspection && (
                        <button
                          onClick={() => handleViewResults(fw.latestInspection)}
                          className="flex-1 py-2 rounded-lg font-bold text-xs transition shadow-sm bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                        >
                          ⏱ 이력보기
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenInspectionModal(fw)}
                        className="flex-[2] py-2 rounded-lg font-bold text-xs transition shadow-sm bg-red-600 text-white hover:bg-red-700 whitespace-nowrap"
                      >
                        조사 등록
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-500">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium">해당하는 소방용수 대상물이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isInspectionModalOpen && selectedFireWater && (
        <FireWaterInspectionModal 
          fireWater={selectedFireWater} 
          onClose={() => setIsInspectionModalOpen(false)}
          onSuccess={handleInspectionComplete}
        />
      )}

      {viewInspection && (
        <FireWaterInspectionDetailModal 
          inspection={viewInspection} 
          onClose={() => setViewInspection(null)} 
          onEdit={handleEditInspection}
          onDelete={handleDeleteInspection}
        />
      )}

      {editingInspection && (
        <FireWaterInspectionModal 
          fireWater={editingInspection.fireWater}
          initialData={editingInspection}
          onClose={() => setEditingInspection(null)}
          onSuccess={handleInspectionComplete}
        />
      )}

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
            alert('소방용수 대상물 정보가 저장되었습니다.');
          }}
        />
      )}
    </div>
  );
}
