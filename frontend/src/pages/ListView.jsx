import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  LifeBuoy, 
  Briefcase, 
  MapPin, 
  Shield 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import InspectionModal from '../components/InspectionModal';
import InspectionDetailModal from '../components/InspectionDetailModal';
import FacilityEditModal from '../components/FacilityEditModal';

export default function ListView() {
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewInspection, setViewInspection] = useState(null);
  const [editingInspection, setEditingInspection] = useState(null);
  const [editingFacility, setEditingFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [regionFilter, setRegionFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryIcon = (key) => {
    switch (key) {
      case 'water_rescue': return <LifeBuoy className="w-4 h-4 mr-2" />;
      case 'mountain_kit': return <Briefcase className="w-4 h-4 mr-2" />;
      case 'mountain_sign': return <MapPin className="w-4 h-4 mr-2" />;
      default: return <Shield className="w-4 h-4 mr-2" />;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeCategoryId) {
      fetchFacilities(activeCategoryId);
    }
  }, [activeCategoryId]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
      if (res.data.length > 0) {
        const waterCat = res.data.find(c => c.key === 'water_rescue');
        setActiveCategoryId(waterCat ? waterCat._id : res.data[0]._id);
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  const fetchFacilities = async (catId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/facilities?category=${catId}`);
      setFacilities(res.data);
    } catch (error) {
      console.error('Failed to fetch facilities:', error);
    } finally {
      setLoading(false);
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
    if (activeCategoryId) fetchFacilities(activeCategoryId);
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
        if (activeCategoryId) fetchFacilities(activeCategoryId);
        alert('삭제되었습니다.');
      } catch (error) {
        console.error('Failed to delete inspection:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const activeCategory = categories.find(c => c._id === activeCategoryId);

  // 1. Filter
  let filtered = facilities.filter(fac => {
    const matchRegion = regionFilter === '전체' || fac.region === regionFilter;
    const matchStatus = statusFilter === '전체' || 
                        (statusFilter === '완료' ? fac.isInspected : !fac.isInspected);
    const matchSearch = fac.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRegion && matchStatus && matchSearch;
  });

  // 2. Sort by Region ('의령' -> '부림' -> '정곡') then by Name
  const regionOrder = { '의령': 1, '부림': 2, '정곡': 3 };
  filtered.sort((a, b) => {
    if (regionOrder[a.region] !== regionOrder[b.region]) {
      return (regionOrder[a.region] || 99) - (regionOrder[b.region] || 99);
    }
    return a.name.localeCompare(b.name, 'ko', { numeric: true });
  });

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col">
      {/* Category Switching Tabs */}
      {categories.length > 0 && (
        <div className="bg-white px-4 pt-4 border-b flex space-x-1 shrink-0">
          {categories.map(cat => {
            const isActive = cat._id === activeCategoryId;
            return (
              <button
                key={cat._id}
                onClick={() => {
                  setActiveCategoryId(cat._id);
                  setRegionFilter('전체');
                  setStatusFilter('전체');
                  setSearchQuery('');
                }}
                className={`flex items-center px-4 py-2.5 font-bold text-sm transition-all rounded-t-lg border-b-2 -mb-[2px]
                  ${isActive 
                    ? 'border-red-600 text-red-600 font-extrabold bg-red-50/30' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {getCategoryIcon(cat.key)}
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Filters Area */}
      <div className="bg-white p-4 shadow-sm z-10 border-b flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-gray-800">
            {activeCategory?.name || '시설물'} 리스트 ({filtered.length}개소)
          </h2>
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
        {loading ? (
          <div className="p-8 text-center text-gray-500">데이터를 불러오는 중입니다...</div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(fac => {
              const match = fac.name.match(/^(.*?)\s*\((.*?)\)$/);
              const displayName = match ? match[1] : fac.name;
              const address = match ? match[2] : null;

              return (
                <div key={fac._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-2 flex-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-gray-800 break-keep truncate" title={displayName}>{displayName}</h3>
                      {address && <p className="text-[11px] text-gray-500 mt-0.5 leading-tight truncate" title={address}>{address}</p>}
                      <div className="flex items-center gap-1.5 mt-0.5 text-gray-400">
                        {fac.location?.coordinates && (
                          <p className="text-[10px] font-mono">
                            ({fac.location.coordinates[1].toFixed(5)}, {fac.location.coordinates[0].toFixed(5)})
                          </p>
                        )}
                        <button
                          onClick={() => setEditingFacility(fac)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center transition-colors shrink-0"
                        >
                          정보 수정
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
                  
                  {/* Dynamic Base Items Grid */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      <span className="inline-block bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded font-medium">
                        센터: {fac.region}
                      </span>
                      {activeCategory?.key === 'mountain_sign' && fac.baseItems?.nationalGridNum && (
                        <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-0.5 rounded font-bold">
                          {fac.baseItems.nationalGridNum}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-1 text-[12px] text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-[140px] overflow-y-auto">
                      {activeCategory?.baseItemFields?.map(field => {
                        const val = fac.baseItems?.[field.key];
                        const displayVal = val !== undefined && val !== null ? String(val) : '-';
                        let unit = '';
                        if (field.type === 'number') {
                          if (field.key === 'gridDistance') unit = 'M';
                          else unit = '개';
                        }
                        return (
                          <p key={field.key} className="truncate" title={`${field.label}: ${displayVal}${unit}`}>
                            • {field.label}: <span className="font-semibold text-gray-900">{displayVal}</span>{unit}
                          </p>
                        );
                      })}
                      {(!activeCategory?.baseItemFields || activeCategory.baseItemFields.length === 0) && (
                        <p className="text-xs text-gray-400">등록 정보가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex gap-1.5">
                    {fac.location?.coordinates && (
                      <a
                        href={`https://map.kakao.com/link/map/${encodeURIComponent(fac.name)},${fac.location.coordinates[1]},${fac.location.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors text-center bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 flex items-center justify-center whitespace-nowrap"
                      >
                        📍 위치
                      </a>
                    )}
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
        )}
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
            if (activeCategoryId) fetchFacilities(activeCategoryId);
            alert('시설물 정보가 수정되었습니다.');
          }}
        />
      )}
    </div>
  );
}
