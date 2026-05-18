import { X, CheckCircle, AlertTriangle, XCircle, Calendar, User, MapPin, FileText, Edit2, Trash2 } from 'lucide-react';

export default function InspectionDetailModal({ inspection, onClose, onEdit, onDelete }) {
  if (!inspection) return null;

  const itemLabels = {
    lifebuoy: '구명환',
    lifeJacket: '구명쪼끼',
    lifeline: '구명줄',
    throwBag: '드로우백'
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
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header with Photo Background (if available) or solid color */}
        <div className="relative h-48 bg-gray-900 flex-shrink-0 flex">
          {inspection.externalPhotoPath ? (
            <img 
              src={inspection.externalPhotoPath} 
              alt="외부 사진" 
              className="w-1/2 h-full object-cover opacity-80 border-r border-gray-800"
            />
          ) : (
            <div className="w-1/2 h-full flex items-center justify-center bg-gray-200 border-r border-gray-300">
              <span className="text-gray-400 text-sm">외부 사진 없음</span>
            </div>
          )}
          {inspection.internalPhotoPath ? (
            <img 
              src={inspection.internalPhotoPath} 
              alt="내부 사진" 
              className="w-1/2 h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-1/2 h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-sm">내부 사진 없음</span>
            </div>
          )}
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <h2 className="text-2xl font-bold text-white shadow-sm">{inspection.facility?.name}</h2>
            <div className="flex items-center text-gray-200 text-sm mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span>관서: {inspection.facility?.region}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">점검자</p>
                <p className="font-semibold text-gray-900">{inspection.inspectorName}</p>
                <p className="text-xs text-gray-600">{inspection.affiliation}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-3">
              <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">점검일시</p>
                <p className="font-semibold text-gray-900">{new Date(inspection.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-600">{new Date(inspection.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
          </div>

          {/* Item Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-sm">장비 상태</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {Object.entries(itemLabels).map(([key, label]) => {
                const status = inspection.itemsStatus?.[key] || '확인불가';
                return (
                  <div key={key} className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(status)}`}>
                    <span className="font-medium text-sm">{label}</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-bold">{status}</span>
                      {getStatusIcon(status)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes Card */}
          {inspection.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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

        </div>

        {/* Footer actions */}
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
