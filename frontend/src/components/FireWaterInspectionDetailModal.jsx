import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, CheckCircle, AlertTriangle, XCircle, Calendar, User, MapPin, FileText, Edit2, Trash2, History } from 'lucide-react';

export default function FireWaterInspectionDetailModal({ inspection: initialInspection, onClose, onEdit, onDelete }) {
  const [inspection, setInspection] = useState(initialInspection);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (inspection?.fireWater?._id) {
      setLoadingHistory(true);
      axios.get(`/api/fire-waters/${inspection.fireWater._id}/inspections`)
        .then(res => {
          const historyData = res.data.map(insp => ({
            ...insp,
            fireWater: inspection.fireWater
          }));
          setHistory(historyData);
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingHistory(false));
    }
  }, [inspection?.fireWater?._id]);

  if (!inspection) return null;

  const itemLabels = {
    bodyStatus: '몸체 및 외관 상태',
    signStatus: '표지판 및 보호틀',
    valveStatus: '밸브 개폐 작동',
    waterStatus: '수압 및 방수 상태'
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case '양호': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case '불량': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case '없음': return <XCircle className="w-5 h-5 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '양호': return 'text-green-700 bg-green-50 border-green-200';
      case '불량': return 'text-red-700 bg-red-50 border-red-200';
      case '없음': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl text-left">
          <div>
            <h2 className="text-xl font-bold text-gray-800 break-keep">
              {inspection.fireWater?.name}
              {inspection.quarter && (
                <span className="text-sm font-medium text-blue-600 ml-2 bg-blue-50 px-2 py-0.5 rounded align-middle">
                  {inspection.quarter.split('-Q')[0]}년 {inspection.quarter.split('-Q')[1]}분기
                </span>
              )}
            </h2>
            {inspection.fireWater?.address && <p className="text-xs text-gray-500 mt-1">{inspection.fireWater.address}</p>}
            {inspection.fireWater?.location?.coordinates && (
              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                좌표: {inspection.fireWater.location.coordinates[1].toFixed(6)}, {inspection.fireWater.location.coordinates[0].toFixed(6)}
              </p>
            )}
            <div className="flex items-center text-gray-500 text-sm mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span>관서: {inspection.fireWater?.region}119안전센터</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 self-start">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto bg-white flex-1 space-y-6 text-left">
          {/* Photos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">외부(원경) 사진</p>
              {inspection.externalPhotoPath ? (
                <a href={inspection.externalPhotoPath} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={inspection.externalPhotoPath} 
                    alt="외부 사진" 
                    className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm hover:opacity-90 transition"
                  />
                </a>
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200">
                  <span className="text-gray-400 text-sm">사진 없음</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">상세(근경) 사진</p>
              {inspection.internalPhotoPath ? (
                <a href={inspection.internalPhotoPath} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={inspection.internalPhotoPath} 
                    alt="상세 사진" 
                    className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm hover:opacity-90 transition"
                  />
                </a>
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200">
                  <span className="text-gray-400 text-sm">사진 없음</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">조사자</p>
                <p className="font-semibold text-gray-900">{inspection.inspectorName}</p>
                <p className="text-xs text-gray-600">{inspection.affiliation}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-3">
              <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">조사일시</p>
                <p className="font-semibold text-gray-900">{new Date(inspection.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-600">{new Date(inspection.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
          </div>

          {/* Items Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-sm">용수 상태/작동 점검 결과</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {Object.entries(itemLabels).map(([key, label]) => {
                const status = inspection.itemsStatus?.[key] || '확인불가';
                return (
                  <div key={key} className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(status)}`}>
                    <span className="font-medium text-xs sm:text-sm">{label}</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs sm:text-sm font-bold">{status}</span>
                      {getStatusIcon(status)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          {inspection.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <h3 className="font-bold text-gray-800 text-sm">특이사항</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {inspection.notes}
                </p>
              </div>
            </div>
          )}

          {/* History */}
          {history.filter(h => h._id !== inspection._id).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center space-x-2">
                <History className="w-4 h-4 text-gray-500" />
                <h3 className="font-bold text-gray-800 text-sm">과거 조사 이력</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {history.filter(h => h._id !== inspection._id).map(past => (
                  <div 
                    key={past._id} 
                    onClick={() => setInspection(past)}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {past.quarter ? `${past.quarter.split('-Q')[0]}년 ${past.quarter.split('-Q')[1]}분기` : new Date(past.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{past.affiliation} {past.inspectorName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">{new Date(past.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">보기</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-between">
          <button 
            onClick={() => onDelete(inspection._id)}
            className="flex items-center text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </button>
          <div className="flex space-x-2">
            <button 
              onClick={onClose}
              className="text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
            >
              닫기
            </button>
            <button 
              onClick={() => onEdit(inspection)}
              className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
