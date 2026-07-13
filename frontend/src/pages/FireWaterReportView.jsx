import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
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

export default function FireWaterReportView() {
  const [fireWaters, setFireWaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('전체');

  useEffect(() => {
    fetchFireWaters();
  }, []);

  const fetchFireWaters = async () => {
    try {
      const res = await axios.get('/api/fire-waters');
      
      // Sort by region and name
      const regionOrder = { '의령': 1, '부림': 2, '정곡': 3 };
      const sorted = res.data.sort((a, b) => {
        if (regionOrder[a.region] !== regionOrder[b.region]) {
          return (regionOrder[a.region] || 99) - (regionOrder[b.region] || 99);
        }
        return a.name.localeCompare(b.name, 'ko', { numeric: true });
      });

      setFireWaters(sorted);
    } catch (error) {
      console.error('Failed to fetch fire waters:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> 로딩중...
      </div>
    );
  }

  const filteredFireWaters = fireWaters.filter(fw => 
    regionFilter === '전체' || fw.region === regionFilter
  );

  return (
    <div className="bg-gray-200 min-h-screen overflow-auto print:bg-white pb-20">
      {/* Controls (Hidden in Print) */}
      <div className="sticky top-0 bg-white shadow-sm p-4 flex justify-between items-center print:hidden z-50">
        <div className="flex items-center">
          <Link to="/fire-water" className="flex items-center text-gray-600 hover:text-gray-900 font-bold">
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
          <p className="text-sm text-gray-500 hidden sm:block">총 {filteredFireWaters.length}개소 보고서</p>
          <button 
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors"
          >
            <Printer className="w-5 h-5 mr-2" /> PDF 저장 / 인쇄
          </button>
        </div>
      </div>

      {/* Report Pages */}
      <div className="print:m-0 max-w-[800px] mx-auto mt-8 space-y-8 print:space-y-0">
        {filteredFireWaters.length === 0 ? (
          <div className="text-center p-10 text-gray-500 bg-white rounded-xl shadow print:hidden">
            해당 센터의 소방용수 시설물이 없습니다.
          </div>
        ) : filteredFireWaters.map((fw, index) => {
          const insp = fw.latestInspection;
          const [lon, lat] = fw.location.coordinates;

          return (
            <div 
              key={fw._id} 
              className="bg-white p-8 print:p-0 mx-auto aspect-[1/1.414] w-full max-w-[210mm] relative box-border flex flex-col justify-between"
              style={{ pageBreakAfter: index === filteredFireWaters.length - 1 ? 'auto' : 'always' }}
            >
              <style>{`
                @media print {
                  @page { margin: 15mm; size: A4; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              `}</style>

              <div>
                {/* Title */}
                <div className="text-center mb-5 border-b-2 border-red-700 pb-2">
                  <h1 className="text-2xl font-extrabold text-gray-900">소 소 방 용 수 시 설 관 리 카 드</h1>
                </div>

                {/* Management Card Table */}
                <div className="mb-4">
                  <table className="w-full border-collapse border border-gray-300 text-sm text-left">
                    <tbody>
                      <tr>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-700 w-1/6">관리번호</th>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900 w-2/6">{fw.serialNumber || '-'}</td>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-700 w-1/6">용수구분</th>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900 w-2/6 font-bold text-red-600">{fw.type}</td>
                      </tr>
                      <tr>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-700">소관관서</th>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900">{fw.region}119안전센터</td>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-700">구경 (mm)</th>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900">{fw.diameter ? `${fw.diameter} mm` : '-'}</td>
                      </tr>
                      <tr>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-700">시설물명</th>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900 font-bold" colSpan="3">{fw.name}</td>
                      </tr>
                      <tr>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-700">소재지</th>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900" colSpan="3">{fw.address}</td>
                      </tr>
                      <tr>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-700">설치일자</th>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900">{fw.installDate || '-'}</td>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-700">좌표 (WGS84)</th>
                        <td className="border border-gray-300 px-3 py-2 text-gray-600 font-mono text-xs">{lat.toFixed(6)}, {lon.toFixed(6)}</td>
                      </tr>
                      {fw.details && (
                        <tr>
                          <th className="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-700">기타설명</th>
                          <td className="border border-gray-300 px-3 py-2 text-gray-600 text-xs" colSpan="3">{fw.details}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Map Section */}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-800 text-xs border-l-4 border-red-600 pl-2 mb-2">위치 지도 (Map)</h3>
                  <div className="border border-gray-300 rounded-lg overflow-hidden h-36 bg-gray-50 relative">
                    <MapContainer 
                      center={[lat, lon]} 
                      zoom={16} 
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
                </div>

                {/* Photos Section */}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-800 text-xs border-l-4 border-red-600 pl-2 mb-2">현장 사진 (Photos)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-300 rounded-lg p-1.5 bg-gray-50 h-44 flex flex-col justify-between">
                      <p className="text-center font-bold text-[11px] text-gray-600 mb-1">외부 (원경)</p>
                      {insp?.externalPhotoPath ? (
                        <img src={insp.externalPhotoPath} alt="원경" className="w-full h-[140px] object-cover rounded shadow-sm" />
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">사진 없음</div>
                      )}
                    </div>
                    <div className="border border-gray-300 rounded-lg p-1.5 bg-gray-50 h-44 flex flex-col justify-between">
                      <p className="text-center font-bold text-[11px] text-gray-600 mb-1">상세 (근경)</p>
                      {insp?.internalPhotoPath ? (
                        <img src={insp.internalPhotoPath} alt="근경" className="w-full h-[140px] object-cover rounded shadow-sm" />
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">사진 없음</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Latest Inspection Status */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800 text-xs border-l-4 border-red-600 pl-2">최근 작동 점검 결과</h3>
                    {insp && (
                      <span className="text-[11px] font-bold text-gray-600">
                        점검일: {new Date(insp.createdAt).toLocaleDateString()} | 점검자: {insp.affiliation} {insp.inspectorName}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-50 border border-gray-200 rounded p-2.5 text-center">
                      <span className="block text-[11px] text-gray-500 font-bold mb-1">몸체 및 외관</span>
                      <span className={`text-xs font-bold ${insp?.itemsStatus?.bodyStatus === '양호' ? 'text-green-600' : insp?.itemsStatus?.bodyStatus === '불량' ? 'text-red-600' : 'text-gray-400'}`}>
                        {insp?.itemsStatus?.bodyStatus || '-'}
                      </span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2.5 text-center">
                      <span className="block text-[11px] text-gray-500 font-bold mb-1">표지판/보호틀</span>
                      <span className={`text-xs font-bold ${insp?.itemsStatus?.signStatus === '양호' ? 'text-green-600' : insp?.itemsStatus?.signStatus === '불량' ? 'text-red-600' : 'text-gray-400'}`}>
                        {insp?.itemsStatus?.signStatus || '-'}
                      </span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2.5 text-center">
                      <span className="block text-[11px] text-gray-500 font-bold mb-1">밸브 작동</span>
                      <span className={`text-xs font-bold ${insp?.itemsStatus?.valveStatus === '양호' ? 'text-green-600' : insp?.itemsStatus?.valveStatus === '불량' ? 'text-red-600' : 'text-gray-400'}`}>
                        {insp?.itemsStatus?.valveStatus || '-'}
                      </span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2.5 text-center">
                      <span className="block text-[11px] text-gray-500 font-bold mb-1">수압 및 방수</span>
                      <span className={`text-xs font-bold ${insp?.itemsStatus?.waterStatus === '양호' ? 'text-green-600' : insp?.itemsStatus?.waterStatus === '불량' ? 'text-red-600' : 'text-gray-400'}`}>
                        {insp?.itemsStatus?.waterStatus || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-800 text-xs border-l-4 border-red-600 pl-2 mb-2">특이사항 (Notes)</h3>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[50px] text-xs text-gray-700 whitespace-pre-wrap leading-relaxed text-left">
                    {insp?.notes ? insp.notes : '특이사항 없음'}
                  </div>
                </div>
              </div>

              {/* Card Footer for Authority Sign */}
              <div className="mt-auto border-t border-gray-300 pt-3 flex justify-between items-center text-xs text-gray-500 font-bold">
                <span>의령소방서 현장대응단</span>
                <span>(인)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
