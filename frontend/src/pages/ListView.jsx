import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, CheckCircle, AlertCircle, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import InspectionModal from '../components/InspectionModal';
import InspectionDetailModal from '../components/InspectionDetailModal';
import FacilityEditModal from '../components/FacilityEditModal';

export default function ListView() {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewInspection, setViewInspection] = useState(null);
  const [editingInspection, setEditingInspection] = useState(null);
  const [editingFacility, setEditingFacility] = useState(null);
  
  // Filters
  const [regionFilter, setRegionFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await axios.get('/api/facilities');
      setFacilities(res.data);
    } catch (error) {
      console.error('Failed to fetch facilities:', error);
    }
  };

  const handleOpenModal = (facility) => {
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const handleInspectionComplete = () => {
    setIsModalOpen(false);
    setSelectedFacility(null);
    setEditingInspection(null);
    fetchFacilities();
    alert('점검 결과가 저장되었습니다.');
  };

  const handleViewResults = (inspection) => {
    if (!inspection) {
      alert('점검 결과가 존재하지 않습니다.');
      return;
    }
    setViewInspection(inspection);
  };

  const handleEdit = (inspection) => {
    setViewInspection(null);
    setEditingInspection(inspection);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await axios.delete(`/api/inspections/${id}`);
        setViewInspection(null);
        fetchFacilities();
        alert('삭제되었습니다.');
      } catch (error) {
        console.error('Failed to delete inspection:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  // 1. Filter
  let filtered = facilities.filter(fac => {
    const matchRegion = regionFilter === '전체' || fac.region === regionFilter;
    const matchStatus = statusFilter === '전체' || 
                        (statusFilter === '완료' ? fac.isInspected : !fac.isInspected);
    const matchSearch = fac.name.includes(searchQuery);
    return matchRegion && matchStatus && matchSearch;
  });

  // 2. Sort by Region ('의령' -> '부림' -> '정곡') then by Name
  const regionOrder = { '의령': 1, '부림': 2, '정곡': 3 };
  filtered.sort((a, b) => {
    if (regionOrder[a.region] !== regionOrder[b.region]) {
      return (regionOrder[a.region] || 99) - (regionOrder[b.region] || 99);
    }
    // 자연스러운 숫자 정렬 (의령1 -> 의령2 -> 의령11)
    return a.name.localeCompare(b.name, 'ko', { numeric: true });
  });

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col">
      {/* Filters Area */}
      <div className="bg-white p-4 shadow-sm z-10 border-b flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-gray-800">점검 리스트 ({filtered.length}개소)</h2>
          <Link 
            to="/report" 
            className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm text-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            보고서 출력
          </Link>
        </div>
        <div className="max-w-7xl w-full flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="시설물 이름 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={regionFilter} 
              onChange={(e) => setRegionFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-sm flex-1 sm:flex-none"
            >
              <option value="전체">센터 전체</option>
              <option value="의령">의령</option>
              <option value="부림">부림</option>
              <option value="정곡">정곡</option>
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-sm flex-1 sm:flex-none"
            >
              <option value="전체">상태 전체</option>
              <option value="미점검">미점검</option>
              <option value="완료">점검 완료</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(fac => {
            const match = fac.name.match(/^(.*?)\s*\((.*?)\)$/);
            const displayName = match ? match[1] : fac.name;
            const address = match ? match[2] : null;

            return (
            <div key={fac._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="pr-2 flex-1">
                  <h3 className="font-bold text-lg text-gray-800 break-keep">{displayName}</h3>
                  {address && <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{address}</p>}
                  <div className="flex items-center gap-1.5 mt-0.5 text-gray-400">
                    <p className="text-[10px]">
                      ({fac.location.coordinates[1].toFixed(5)}, {fac.location.coordinates[0].toFixed(5)})
                    </p>
                    <button
                      onClick={() => setEditingFacility(fac)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center transition-colors shrink-0"
                    >
                      좌표 수정
                    </button>
                  </div>
                </div>
                {fac.isInspected ? (
                  <span className="flex items-center text-green-700 bg-green-100 px-2 py-1 rounded text-[11px] font-bold whitespace-nowrap shrink-0">
                    <CheckCircle className="w-3 h-3 mr-1" /> 완료
                  </span>
                ) : (
                  <span className="flex items-center text-red-700 bg-red-100 px-2 py-1 rounded text-[11px] font-bold whitespace-nowrap shrink-0">
                    <AlertCircle className="w-3 h-3 mr-1" /> 미점검
                  </span>
                )}
              </div>
              
              <div className="mb-4">
                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium mb-3">
                  센터: {fac.region}
                </span>
                <div className="grid grid-cols-2 gap-2 text-[13px] text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p>• 구명환: <span className="font-semibold">{fac.baseItems.lifebuoy}</span>개</p>
                  <p>• 구명조끼: <span className="font-semibold">{fac.baseItems.lifeJacket}</span>개</p>
                  <p>• 구명줄: <span className="font-semibold">{fac.baseItems.lifeline}</span>개</p>
                  <p>• 드로우백: <span className="font-semibold">{fac.baseItems.throwBag}</span>개</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex gap-1.5">
                <a
                  href={`https://map.kakao.com/link/map/${encodeURIComponent(fac.name)},${fac.location.coordinates[1]},${fac.location.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors text-center bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 flex items-center justify-center whitespace-nowrap"
                >
                  📍 위치
                </a>
                {fac.isInspected ? (
                  <>
                    <button
                      onClick={() => handleViewResults(fac.latestInspection)}
                      className="flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-sm bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 whitespace-nowrap"
                    >
                      👁 결과보기
                    </button>
                    <button
                      onClick={() => handleEdit(fac.latestInspection)}
                      className="flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                    >
                      ✏️ 수정
                    </button>
                  </>
                ) : (
                  <>
                    {fac.latestInspection && (
                      <button
                        onClick={() => handleViewResults(fac.latestInspection)}
                        className="flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-sm bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                      >
                        ⏱ 이력보기
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenModal(fac)}
                      className="flex-[2] py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-sm bg-red-600 text-white hover:bg-red-700 whitespace-nowrap"
                    >
                      점검 등록
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
              <p className="text-lg">해당하는 시설물이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedFacility && (
        <InspectionModal 
          facility={selectedFacility} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleInspectionComplete}
        />
      )}

      {viewInspection && (
        <InspectionDetailModal 
          inspection={viewInspection} 
          onClose={() => setViewInspection(null)} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editingInspection && (
        <InspectionModal 
          facility={editingInspection.facility}
          initialData={editingInspection}
          onClose={() => setEditingInspection(null)}
          onSuccess={handleInspectionComplete}
        />
      )}

      {editingFacility && (
        <FacilityEditModal
          facility={editingFacility}
          onClose={() => setEditingFacility(null)}
          onSuccess={() => {
            setEditingFacility(null);
            fetchFacilities();
            alert('시설물 정보 및 좌표가 수정되었습니다.');
          }}
        />
      )}
    </div>
  );
}
