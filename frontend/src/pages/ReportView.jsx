import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReportView() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await axios.get('/api/facilities');
      
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> 로딩중...
      </div>
    );
  }

  const itemLabels = {
    lifebuoy: '구명환',
    lifeJacket: '구명조끼',
    lifeline: '구명줄',
    throwBag: '드로우백'
  };

  return (
    <div className="bg-gray-200 min-h-screen overflow-auto print:bg-white pb-20">
      {/* Controls (Hidden in Print) */}
      <div className="sticky top-0 bg-white shadow-sm p-4 flex justify-between items-center print:hidden z-50">
        <div className="flex items-center">
          <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 font-medium">
            <ArrowLeft className="w-5 h-5 mr-1" /> 돌아가기
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-500">총 {facilities.length}개소 보고서</p>
          <button 
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm"
          >
            <Printer className="w-5 h-5 mr-2" /> PDF 저장 / 인쇄
          </button>
        </div>
      </div>

      {/* Report Pages */}
      <div className="print:m-0 max-w-[800px] mx-auto mt-8 space-y-8 print:space-y-0">
        {facilities.map((fac, index) => {
          const insp = fac.latestInspection;
          const [lon, lat] = fac.location.coordinates;
          
          return (
            <div 
              key={fac._id} 
              className="bg-white p-10 shadow-lg print:shadow-none print:p-0 mx-auto aspect-[1/1.414] w-full max-w-[210mm] relative box-border"
              style={{ pageBreakAfter: index === facilities.length - 1 ? 'auto' : 'always' }}
            >
              <style>{`
                @media print {
                  @page { margin: 15mm; size: A4; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              `}</style>

              <div className="text-center mb-8 border-b-2 border-red-700 pb-4">
                <h1 className="text-3xl font-extrabold text-gray-900">수난안전시설물 점검 결과 보고서</h1>
              </div>

              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{fac.name}</h2>
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
              <div className="mb-6 border-2 border-gray-200 rounded-xl overflow-hidden h-48 bg-gray-50 relative">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.005}%2C${lat-0.005}%2C${lon+0.005}%2C${lat+0.005}&layer=mapnik&marker=${lat}%2C${lon}`}
                  className="absolute inset-0"
                  title="map"
                ></iframe>
              </div>

              {/* Photos Section */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-300 rounded-xl p-2 bg-gray-50 h-64 flex flex-col">
                  <p className="text-center font-bold text-sm text-gray-700 mb-2">외부 사진</p>
                  {insp?.externalPhotoPath ? (
                    <img src={insp.externalPhotoPath} alt="외부" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">사진 없음</div>
                  )}
                </div>
                <div className="border border-gray-300 rounded-xl p-2 bg-gray-50 h-64 flex flex-col">
                  <p className="text-center font-bold text-sm text-gray-700 mb-2">내부 사진</p>
                  {insp?.internalPhotoPath ? (
                    <img src={insp.internalPhotoPath} alt="내부" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">사진 없음</div>
                  )}
                </div>
              </div>

              {/* Items Status */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 border-b-2 border-gray-800 pb-2 mb-3">장비 상태</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(itemLabels).map(([key, label]) => {
                    const status = insp?.itemsStatus?.[key] || '-';
                    let statusColor = 'text-gray-900';
                    if (status === '양호') statusColor = 'text-green-600 font-bold';
                    if (status === '불량') statusColor = 'text-red-600 font-bold';
                    
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
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 border-b-2 border-gray-800 pb-2 mb-3">특이사항</h3>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[100px] text-gray-800 whitespace-pre-wrap">
                  {insp?.notes ? insp.notes : '특이사항 없음'}
                </div>
              </div>

              <div className="absolute bottom-10 right-10 text-right">
                <p className="text-sm text-gray-500">의령소방서 119구조대</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
