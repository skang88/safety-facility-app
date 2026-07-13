import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Printer, ArrowLeft, LifeBuoy, Briefcase, MapPin, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ReportView() {
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('전체');

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
      
      // Sort by region and name
      const regionOrder = { '의령': 1, '부림': 2, '정곡': 3 };
      const sorted = res.data.sort((a, b) => {
        if (regionOrder[a.region] !== regionOrder[b.region]) {
          return (regionOrder[a.region] || 99) - (regionOrder[b.region] || 99);
        }
        return a.name.localeCompare(b.name, 'ko', { numeric: true });
      });

      setFacilities(sorted);
    } catch (error) {
      console.error('Failed to fetch facilities:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const activeCategory = categories.find(c => c._id === activeCategoryId);
  const inspectionFields = activeCategory?.inspectionFields || [];

  // Build dynamic itemLabels
  const itemLabels = {};
  inspectionFields.forEach(field => {
    itemLabels[field.key] = field.label;
  });

  const filteredFacilities = facilities.filter(fac => 
    regionFilter === '전체' || fac.region === regionFilter
  );

  if (loading && facilities.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> 로딩중...
      </div>
    );
  }

  return (
    <div className="bg-gray-200 min-h-screen overflow-auto print:bg-white pb-20">
      {/* Controls (Hidden in Print) */}
      <div className="sticky top-0 bg-white shadow-sm p-4 flex flex-col gap-3 print:hidden z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 font-medium">
              <ArrowLeft className="w-5 h-5 mr-1" /> 돌아가기
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={regionFilter} 
              onChange={(e) => setRegionFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
            >
              <option value="전체">센터 전체</option>
              <option value="의령">의령119안전센터</option>
              <option value="부림">부림119안전센터</option>
              <option value="정곡">정곡119안전센터</option>
            </select>
            <p className="text-sm text-gray-500 hidden sm:block">총 {filteredFacilities.length}개소 보고서</p>
            <button 
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors"
            >
              <Printer className="w-5 h-5 mr-2" /> PDF 저장 / 인쇄
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="flex space-x-1 border-t border-gray-100 pt-3">
            {categories.map(cat => {
              const isActive = cat._id === activeCategoryId;
              return (
                <button
                  key={cat._id}
                  onClick={() => {
                    setActiveCategoryId(cat._id);
                    setRegionFilter('전체');
                  }}
                  className={`flex items-center px-4 py-2 font-bold text-sm transition-all rounded-lg
                    ${isActive 
                      ? 'bg-red-600 text-white shadow' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
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
      </div>

      {/* Report Pages */}
      <div className="print:m-0 max-w-[800px] mx-auto mt-8 space-y-8 print:space-y-0">
        {loading ? (
          <div className="text-center p-10 text-gray-500 bg-white rounded-xl shadow">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> 데이터를 불러오는 중입니다...
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="text-center p-10 text-gray-500 bg-white rounded-xl shadow print:hidden">
            해당 센터의 시설물이 없습니다.
          </div>
        ) : filteredFacilities.map((fac, index) => {
          const insp = fac.latestInspection;
          const [lon, lat] = fac.location.coordinates;
          
          const match = fac.name.match(/^(.*?)\s*\((.*?)\)$/);
          const displayName = match ? match[1] : fac.name;
          const address = match ? match[2] : null;

          return (
            <div 
              key={fac._id} 
              className="bg-white p-10 shadow-lg print:shadow-none print:p-0 mx-auto aspect-[1/1.414] w-full max-w-[210mm] relative box-border"
              style={{ pageBreakAfter: index === filteredFacilities.length - 1 ? 'auto' : 'always' }}
            >
              <style>{`
                @media print {
                  @page { margin: 15mm; size: A4; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              `}</style>

              <div className="text-center mb-8 border-b-2 border-red-700 pb-4">
                <h1 className="text-3xl font-extrabold text-gray-900">
                  {activeCategory?.name || '안전시설물'} 점검 결과 보고서
                </h1>
              </div>

              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 break-keep">{displayName}</h2>
                  {address && <p className="text-gray-500 text-sm mt-1 mb-0.5">{address}</p>}
                  <p className="text-gray-400 text-xs mb-1 font-mono">좌표: {lat.toFixed(6)}, {lon.toFixed(6)}</p>
                  <p className="text-gray-600 font-medium mt-1">소관: {fac.region}119안전센터</p>
                </div>
                {insp && (
                  <div className="text-right text-sm">
                    <p><span className="text-gray-500">점검일시:</span> <span className="font-semibold">{new Date(insp.createdAt).toLocaleDateString()} {new Date(insp.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></p>
                    <p className="mt-1"><span className="text-gray-500">점검자:</span> <span className="font-semibold">{insp.affiliation} {insp.inspectorName}</span></p>
                    {insp.quarter && <p className="mt-1"><span className="inline-block bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-bold">{insp.quarter.split('-Q')[0]}년 {insp.quarter.split('-Q')[1]}분기</span></p>}
                  </div>
                )}
                {!insp && (
                  <div className="text-right text-sm text-red-500 font-bold">
                    최근 점검 이력 없음
                  </div>
                )}
              </div>

              {/* Map Section */}
              <div className="mb-4 border-2 border-gray-200 rounded-xl overflow-hidden h-44 bg-gray-50 relative">
                <MapContainer 
                  center={[lat, lon]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  dragging={false}
                  touchZoom={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[lat, lon]} />
                </MapContainer>
              </div>

              {/* Photos Section */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-300 rounded-xl p-2 bg-gray-50 h-64 flex flex-col">
                  <p className="text-center font-bold text-sm text-gray-700 mb-2">{activeCategory?.photoLabels?.[0] || '외부 사진'}</p>
                  {insp?.externalPhotoPath ? (
                    <img src={insp.externalPhotoPath} alt="외부" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">사진 없음</div>
                  )}
                </div>
                <div className="border border-gray-300 rounded-xl p-2 bg-gray-50 h-64 flex flex-col">
                  <p className="text-center font-bold text-sm text-gray-700 mb-2">{activeCategory?.photoLabels?.[1] || '내부 사진'}</p>
                  {insp?.internalPhotoPath ? (
                    <img src={insp.internalPhotoPath} alt="내부" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">사진 없음</div>
                  )}
                </div>
              </div>

              {/* Dynamic Items Status */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 border-b-2 border-gray-800 pb-2 mb-3">점검 항목 상태</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(itemLabels).map(([key, label]) => {
                    const status = insp?.itemsStatus?.[key] || '-';
                    let statusColor = 'text-gray-900';
                    if (['양호', '완료', '지정'].includes(status)) statusColor = 'text-green-600 font-bold';
                    if (['불량', '정비필요', '교체대상', '철거대상', '미완료', '미지정'].includes(status)) statusColor = 'text-red-600 font-bold';
                    
                    return (
                      <div key={key} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <span className="font-medium text-gray-700">{label}</span>
                        <span className={statusColor}>{status}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 border-b-2 border-gray-800 pb-2 mb-3">특이사항</h3>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[80px] text-gray-800 whitespace-pre-wrap">
                  {insp?.notes ? insp.notes : '특이사항 없음'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
