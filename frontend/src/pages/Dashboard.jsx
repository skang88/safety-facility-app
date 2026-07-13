import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Printer, 
  LifeBuoy, 
  Shield, 
  Anchor, 
  Package, 
  User, 
  MapPin, 
  Phone, 
  Signal, 
  Briefcase,
  FileText, 
  Activity, 
  Droplet,
  Waves
} from 'lucide-react';
import { Link } from 'react-router-dom';
import InspectionDetailModal from '../components/InspectionDetailModal';
import InspectionModal from '../components/InspectionModal';
import FireWaterInspectionDetailModal from '../components/FireWaterInspectionDetailModal';
import FireWaterInspectionModal from '../components/FireWaterInspectionModal';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('waterSafety'); // 'waterSafety' or 'fireWater'
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals for Water Safety
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [editingInspection, setEditingInspection] = useState(null);
  
  // Modals for Fire Water
  const [selectedFWInspection, setSelectedFWInspection] = useState(null);
  const [editingFWInspection, setEditingFWInspection] = useState(null);

  // Dynamic icon and style mapping for fields
  const fieldIcons = {
    // Water Rescue
    lifebuoy: { label: '구명환', icon: LifeBuoy, color: 'text-blue-600 bg-blue-100' },
    lifeJacket: { label: '구명조끼', icon: Shield, color: 'text-emerald-600 bg-emerald-100' },
    lifeline: { label: '구명줄', icon: Anchor, color: 'text-violet-600 bg-violet-100' },
    throwBag: { label: '드로우백', icon: Package, color: 'text-amber-600 bg-amber-100' },
    
    // Mountain Kit
    boxStatus: { label: '함 관리상태', icon: Package, color: 'text-blue-600 bg-blue-100' },
    drugStatus: { label: '구급약품 상태', icon: Shield, color: 'text-emerald-600 bg-emerald-100' },
    improvement: { label: '개선여부', icon: CheckCircle, color: 'text-violet-600 bg-violet-100' },
    manager: { label: '전담관리자 지정', icon: User, color: 'text-amber-600 bg-amber-100' },
    
    // Mountain Sign
    signStatus: { label: '표지판 관리상태', icon: MapPin, color: 'text-blue-600 bg-blue-100' },
    sktSignal: { label: 'SKT 통신상태', icon: Signal, color: 'text-emerald-600 bg-emerald-100' },
    ktSignal: { label: 'KT 통신상태', icon: Signal, color: 'text-violet-600 bg-violet-100' },
    lguSignal: { label: 'LGU+ 통신상태', icon: Signal, color: 'text-amber-600 bg-amber-100' }
  };

  const equipmentNamesFire = {
    bodyStatus: { label: '몸체 및 외관', icon: Shield, color: 'text-blue-600 bg-blue-100' },
    signStatus: { label: '표지판/보호틀', icon: FileText, color: 'text-emerald-600 bg-emerald-100' },
    valveStatus: { label: '밸브 작동 상태', icon: Activity, color: 'text-violet-600 bg-violet-100' },
    waterStatus: { label: '수압 및 방수', icon: Droplet, color: 'text-amber-600 bg-amber-100' }
  };

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
    fetchSummary();
  }, [activeTab, activeCategoryId]);

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

  const fetchSummary = async () => {
    setLoading(true);
    try {
      if (activeTab === 'waterSafety') {
        if (!activeCategoryId) {
          setLoading(false);
          return;
        }
        const res = await axios.get(`/api/dashboard-summary?category=${activeCategoryId}`);
        setSummary(res.data);
      } else {
        const res = await axios.get('/api/fire-waters/dashboard-summary');
        setSummary(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const endpoint = activeTab === 'waterSafety'
          ? `/api/inspections/${id}`
          : `/api/fire-waters/inspections/${id}`;
        await axios.delete(endpoint);
        setSelectedInspection(null);
        setSelectedFWInspection(null);
        fetchSummary();
        alert('삭제되었습니다.');
      } catch (error) {
        console.error('Failed to delete inspection:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleEdit = (inspection) => {
    if (activeTab === 'waterSafety') {
      setSelectedInspection(null);
      setEditingInspection(inspection);
    } else {
      setSelectedFWInspection(null);
      setEditingFWInspection(inspection);
    }
  };

  const handleEditComplete = () => {
    setEditingInspection(null);
    setEditingFWInspection(null);
    fetchSummary();
    alert('수정되었습니다.');
  };

  const renderStackedBar = (itemStats) => {
    const { good, bad, none } = itemStats;
    const total = good + bad + none;
    if (total === 0) {
      return (
        <div className="w-full bg-gray-100 rounded-full h-3 flex items-center justify-center text-[10px] text-gray-400 font-medium">
          점검 기록 없음
        </div>
      );
    }
    const goodPercent = (good / total) * 100;
    const badPercent = (bad / total) * 100;
    const nonePercent = (none / total) * 100;

    return (
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
        {good > 0 && (
          <div 
            className="bg-green-500 h-full transition-all duration-500" 
            style={{ width: `${goodPercent}%` }}
            title={`양호: ${good}개 (${Math.round(goodPercent)}%)`}
          />
        )}
        {bad > 0 && (
          <div 
            className="bg-red-500 h-full transition-all duration-500" 
            style={{ width: `${badPercent}%` }}
            title={`불량/미흡: ${bad}개 (${Math.round(badPercent)}%)`}
          />
        )}
        {none > 0 && (
          <div 
            className="bg-gray-400 h-full transition-all duration-500" 
            style={{ width: `${nonePercent}%` }}
            title={`없음/기타: ${none}개 (${Math.round(nonePercent)}%)`}
          />
        )}
      </div>
    );
  };

  const currentCategory = activeTab === 'waterSafety' ? summary?.category : null;
  const stats = summary?.equipmentStats || {};

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Dynamic Header & Tab Selector */}
        <div className="flex justify-between items-center flex-wrap gap-4 text-left">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">현장 소방안전시설 관리 시스템</h1>
            <p className="text-sm text-gray-500 mt-1">의령소방서 관내 안전시설물 및 소방용수 점검 현황입니다.</p>
          </div>
          
          <div className="flex bg-gray-200 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab('waterSafety')}
              className={`flex items-center px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'waterSafety' 
                  ? 'bg-white text-red-700 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Waves className="w-4 h-4 mr-1.5" />
              안전시설물
            </button>
            <button
              onClick={() => setActiveTab('fireWater')}
              className={`flex items-center px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'fireWater' 
                  ? 'bg-white text-red-700 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Droplet className="w-4 h-4 mr-1.5" />
              소방용수조사
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-4 text-left">
          <h2 className="text-lg font-bold text-gray-700">
            {activeTab === 'waterSafety' 
              ? `🌊 ${currentCategory?.name || '안전시설물'} 점검 현황 및 통계` 
              : '🚒 소방용수조사 현황 및 통계'}
          </h2>
          
          <Link 
            to={activeTab === 'waterSafety' ? '/report' : '/fire-water-report'} 
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm text-xs sm:text-sm transition"
          >
            <Printer className="w-4 h-4 mr-2" />
            보고서 출력 / 관리카드 인쇄
          </Link>
        </div>

        {/* Category Switcher Tabs for Water Safety */}
        {activeTab === 'waterSafety' && categories.length > 0 && (
          <div className="flex border-b border-gray-200 bg-white p-1 rounded-xl shadow-sm space-x-1">
            {categories.map(cat => {
              const isActive = cat._id === activeCategoryId;
              return (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategoryId(cat._id)}
                  className={`flex items-center px-4 py-2.5 font-bold text-sm transition-all rounded-lg
                    ${isActive 
                      ? 'bg-red-600 text-white shadow' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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

        {loading ? (
          <div className="p-16 text-center text-gray-500 font-semibold bg-white rounded-xl shadow-sm border border-gray-100">
            데이터 로딩중...
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4 text-left">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">전체 대상물 수</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {summary?.totalFacilities || 0}개소
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4 text-left">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    {summary?.currentQuarter 
                      ? `${summary.currentQuarter.split('-Q')[0]}년 ${summary.currentQuarter.split('-Q')[1]}분기`
                      : '이번 분기'} 완료 개소
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {summary?.inspectionsCount || 0}개소
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-left">
              <div className="flex justify-between items-end mb-2">
                <h2 className="text-base font-semibold text-gray-800">분기 점검 진행률</h2>
                <span className="text-sm font-bold text-gray-700">
                  {summary?.totalFacilities ? Math.round((summary.inspectionsCount / summary.totalFacilities) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${summary?.totalFacilities ? Math.round((summary.inspectionsCount / summary.totalFacilities) * 100) : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                {summary?.totalFacilities || 0}개소 중 {summary?.inspectionsCount || 0}개소 완료
              </p>
            </div>

            {/* Equipment Stats */}
            {activeTab === 'waterSafety' ? (
              // Water Safety / Dynamic Categories Equipment Stats
              currentCategory?.inspectionFields?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-4 text-left">
                  <h2 className="text-base font-semibold text-gray-800 flex items-center">
                    <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full mr-2"></span>
                    세부 점검 항목 통계 <span className="text-xs font-normal text-gray-500 ml-2">(분기 최종 점검 결과 기준)</span>
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentCategory.inspectionFields.map((field) => {
                      const key = field.key;
                      const itemStats = stats[key] || { good: 0, bad: 0, none: 0 };
                      const total = itemStats.good + itemStats.bad + itemStats.none;
                      const fieldConf = fieldIcons[key] || { label: field.label, icon: Shield, color: 'text-gray-600 bg-gray-100' };
                      const IconComponent = fieldConf.icon;

                      return (
                        <div 
                          key={key} 
                          className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`p-2 rounded-lg ${fieldConf.color} shrink-0`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{fieldConf.label}</h3>
                              <p className="text-[10px] sm:text-xs text-gray-500">총 {total}개소 점검</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {renderStackedBar(itemStats)}
                            
                            <div className="grid grid-cols-3 gap-1 text-center text-[10px] sm:text-xs">
                              <div className="bg-green-50/50 border border-green-100 rounded px-1 py-1">
                                <span className="block text-gray-500 text-[9px] truncate">양호/지정</span>
                                <span className="font-bold text-green-600 text-xs sm:text-sm">{itemStats.good}</span>
                              </div>
                              <div className={`border rounded px-1 py-1 ${itemStats.bad > 0 ? 'bg-red-50 border-red-200' : 'bg-red-50/30 border-red-100'}`}>
                                <span className="block text-gray-500 text-[9px] truncate">정비필요</span>
                                <span className={`font-bold text-xs sm:text-sm ${itemStats.bad > 0 ? 'text-red-600 font-extrabold' : 'text-gray-400'}`}>{itemStats.bad}</span>
                              </div>
                              <div className="bg-gray-50 border border-gray-100 rounded px-1 py-1">
                                <span className="block text-gray-500 text-[9px] truncate">없음/기타</span>
                                <span className="font-bold text-gray-600 text-xs sm:text-sm">{itemStats.none}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              // Fire Water Equipment Stats
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-4 text-left">
                <h2 className="text-base font-semibold text-gray-800 flex items-center">
                  <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full mr-2"></span>
                  세부 점검 항목 통계 <span className="text-xs font-normal text-gray-500 ml-2">(분기 최종 점검 결과 기준)</span>
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(equipmentNamesFire).map(([key, item]) => {
                    const itemStats = stats[key] || { good: 0, bad: 0, none: 0 };
                    const total = itemStats.good + itemStats.bad + itemStats.none;
                    const IconComponent = item.icon;

                    return (
                      <div 
                        key={key} 
                        className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 rounded-lg ${item.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">{item.label}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500">총 {total}개소 점검</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {renderStackedBar(itemStats)}
                          
                          <div className="grid grid-cols-3 gap-1 text-center text-[10px] sm:text-xs">
                            <div className="bg-green-50/50 border border-green-100 rounded px-1 py-1">
                              <span className="block text-gray-500 text-[9px]">양호</span>
                              <span className="font-bold text-green-600 text-xs sm:text-sm">{itemStats.good}</span>
                            </div>
                            <div className={`border rounded px-1 py-1 ${itemStats.bad > 0 ? 'bg-red-50 border-red-200' : 'bg-red-50/30 border-red-100'}`}>
                              <span className="block text-gray-500 text-[9px]">불량</span>
                              <span className={`font-bold text-xs sm:text-sm ${itemStats.bad > 0 ? 'text-red-600 font-extrabold' : 'text-gray-400'}`}>{itemStats.bad}</span>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded px-1 py-1">
                              <span className="block text-gray-500 text-[9px]">없음</span>
                              <span className="font-bold text-gray-600 text-xs sm:text-sm">{itemStats.none}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Inspections */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left">
              <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-800">최근 점검/조사 이력</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {summary?.recentInspections?.length > 0 ? (
                  summary.recentInspections.map((insp) => {
                    const name = activeTab === 'waterSafety' 
                      ? insp.facility?.name 
                      : insp.fireWater?.name;
                    
                    return (
                      <div 
                        key={insp._id} 
                        className="p-4 sm:flex sm:items-center sm:justify-between hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => {
                          if (activeTab === 'waterSafety') {
                            setSelectedInspection(insp);
                          } else {
                            setSelectedFWInspection(insp);
                          }
                        }}
                      >
                        <div className="flex space-x-4 items-start">
                          {insp.externalPhotoPath ? (
                            <img src={insp.externalPhotoPath} alt="현장 사진" className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg border border-gray-200 text-xs shrink-0">사진없음</div>
                          )}
                          <div>
                            <h3 className="font-bold text-gray-900">{name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {insp.affiliation} {insp.inspectorName} 점검
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(insp.createdAt).toLocaleDateString()} {new Date(insp.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 sm:mt-0 text-sm shrink-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-xs bg-green-100 text-green-800 border border-green-200 shadow-sm">
                            점검완료
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-500">최근 점검 내역이 없습니다.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals for Water Safety */}
      {selectedInspection && (
        <InspectionDetailModal 
          inspection={selectedInspection} 
          onClose={() => setSelectedInspection(null)} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editingInspection && (
        <InspectionModal 
          facility={editingInspection.facility}
          initialData={editingInspection}
          onClose={() => setEditingInspection(null)}
          onSuccess={handleEditComplete}
        />
      )}

      {/* Modals for Fire Water */}
      {selectedFWInspection && (
        <FireWaterInspectionDetailModal 
          inspection={selectedFWInspection} 
          onClose={() => setSelectedFWInspection(null)} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editingFWInspection && (
        <FireWaterInspectionModal 
          fireWater={editingFWInspection.fireWater}
          initialData={editingFWInspection}
          onClose={() => setEditingFWInspection(null)}
          onSuccess={handleEditComplete}
        />
      )}
    </div>
  );
}
