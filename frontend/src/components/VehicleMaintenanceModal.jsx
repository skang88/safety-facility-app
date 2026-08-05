import { useState, useRef } from 'react';
import axios from 'axios';
import { X, Loader2, Wrench, Camera } from 'lucide-react';

export default function VehicleMaintenanceModal({ vehicles = [], defaultVehicleId = '', onClose, onSuccess }) {
  const [vehicleId, setVehicleId] = useState(defaultVehicleId || (vehicles[0]?._id || ''));
  const [inspectorName, setInspectorName] = useState('');
  const [affiliation, setAffiliation] = useState('의령119안전센터');
  const [maintenanceType, setMaintenanceType] = useState('정기점검');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [inspectionDate, setInspectionDate] = useState(todayStr);
  const [nextDueDate, setNextDueDate] = useState('');

  const [itemsChecked, setItemsChecked] = useState({
    engineOil: '양호',
    brakeStatus: '양호',
    tireStatus: '양호',
    pumpStatus: '양호',
    batteryStatus: '양호'
  });

  const [cost, setCost] = useState('0');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const photoInputRef = useRef(null);

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusChange = (itemKey, statusVal) => {
    setItemsChecked(prev => ({ ...prev, [itemKey]: statusVal }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!vehicleId) {
      setErrorMessage('차량을 선택해주세요.');
      return;
    }
    if (!inspectorName.trim()) {
      setErrorMessage('점검/정비자 이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('vehicleId', vehicleId);
      formData.append('inspectorName', inspectorName);
      formData.append('affiliation', affiliation);
      formData.append('maintenanceType', maintenanceType);
      formData.append('inspectionDate', inspectionDate);
      formData.append('nextDueDate', nextDueDate);
      formData.append('itemsChecked', JSON.stringify(itemsChecked));
      formData.append('cost', cost ? String(cost) : '0');
      formData.append('notes', notes);
      if (photo) formData.append('photo', photo);

      await axios.post('/api/vehicles/maintenances', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to save maintenance:', error);
      setErrorMessage(error.response?.data?.error || '점검/정비 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const maintenanceTypes = ['정기점검', '수시점검', '소모품교환', '고장수리'];
  const statusOptions = ['양호', '교환필요', '해당없음'];

  const itemLabels = {
    engineOil: '엔진오일 상태',
    brakeStatus: '제동장치 / 브레이크',
    tireStatus: '타이어 상태 및 공기압',
    pumpStatus: '소방 펌프 / 특장장치',
    batteryStatus: '배터리 전압 / 상태'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-700 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            <h2 className="text-lg font-bold">소방차량 점검 및 정비 기록</h2>
          </div>
          <button onClick={onClose} className="text-red-100 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="p-6 space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-medium">
                {errorMessage}
              </div>
            )}

            {/* Vehicle Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                대상 차량 선택 *
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-bold focus:ring-red-500 focus:border-red-500 outline-none"
                disabled={isLoading}
                required
              >
                {vehicles.map(v => (
                  <option key={v._id} value={v._id}>
                    [{v.region}119] {v.vehicleNumber} ({v.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Inspector & Affiliation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  소속 센터 *
                </label>
                <select
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                >
                  <option value="의령119안전센터">의령119안전센터</option>
                  <option value="부림119안전센터">부림119안전센터</option>
                  <option value="정곡119안전센터">정곡119안전센터</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  점검/정비자 *
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="예: 김철수"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Maintenance Type & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  점검/정비 구분 *
                </label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                >
                  {maintenanceTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  점검/정비 일자 *
                </label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Next Due Date */}
            <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
              <label className="block text-xs font-bold text-red-800 mb-1">
                📅 차기 점검/정비 예정일 설정 (자동 업데이트)
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-red-500 focus:border-red-500 outline-none"
                disabled={isLoading}
              />
              <p className="text-[10px] text-gray-500 mt-1">
                * 입력 시 해당 차량의 차기 정기점검/정비 일자 D-Day 카운트다운이 자동 설정됩니다.
              </p>
            </div>

            {/* Consumables Checklist */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                소모품 및 주요 부품 점검 결과
              </label>
              <div className="space-y-2.5 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                {Object.keys(itemsChecked).map((itemKey) => (
                  <div key={itemKey} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">{itemLabels[itemKey]}</span>
                    <div className="flex space-x-1">
                      {statusOptions.map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(itemKey, status)}
                          className={`px-2 py-1 text-xs rounded border font-bold transition-colors
                            ${itemsChecked[itemKey] === status 
                              ? (status === '양호' ? 'bg-green-100 border-green-500 text-green-700' : 
                                 status === '교환필요' || status === '정비필요' || status === '불량' ? 'bg-red-100 border-red-500 text-red-700' : 
                                 'bg-gray-200 border-gray-400 text-gray-700')
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }
                          `}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost & Photo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  정비 비용 (원)
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  증빙 / 정비 사진
                </label>
                <div 
                  onClick={() => photoInputRef.current.click()}
                  className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-2 text-center cursor-pointer hover:bg-gray-100 transition flex items-center justify-center gap-2 h-10"
                >
                  <Camera className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium truncate">
                    {photo ? photo.name : '사진 첨부'}
                  </span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={photoInputRef}
                  onChange={handlePhotoCapture}
                />
              </div>
            </div>

            {photoPreview && (
              <div className="mt-2">
                <img src={photoPreview} alt="미리보기" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                정비 내역 및 특이사항
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="교환한 부품 상세나 수리 내역 작성"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                rows="2"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold text-sm bg-white hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors flex items-center justify-center min-w-[80px]"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
