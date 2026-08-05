import { useState } from 'react';
import axios from 'axios';
import { X, Loader2, Truck } from 'lucide-react';

export default function VehicleEditModal({ vehicle, onClose, onSuccess }) {
  const isEdit = !!vehicle;

  const [vehicleNumber, setVehicleNumber] = useState(vehicle?.vehicleNumber || '');
  const [name, setName] = useState(vehicle?.name || '');
  const [type, setType] = useState(vehicle?.type || '펌프차');
  const [region, setRegion] = useState(vehicle?.region || '의령');
  const [status, setStatus] = useState(vehicle?.status || '운용중');
  const [manufactureYear, setManufactureYear] = useState(vehicle?.manufactureYear || '');
  const [totalMileage, setTotalMileage] = useState(vehicle?.totalMileage?.toString() || '0');
  const [nextInspectionDate, setNextInspectionDate] = useState(vehicle?.nextInspectionDate || '');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState(vehicle?.nextMaintenanceDate || '');
  const [fuelType, setFuelType] = useState(vehicle?.fuelType || '경유');
  const [details, setDetails] = useState(vehicle?.details || '');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!vehicleNumber.trim()) {
      setErrorMessage('차량번호를 입력해주세요.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('차량명칭을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        vehicleNumber,
        name,
        type,
        region,
        status,
        manufactureYear,
        totalMileage: Number(totalMileage) || 0,
        nextInspectionDate,
        nextMaintenanceDate,
        fuelType,
        details
      };

      if (isEdit) {
        await axios.put(`/api/vehicles/${vehicle._id}`, data);
      } else {
        await axios.post('/api/vehicles', data);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      setErrorMessage(error.response?.data?.error || '차량 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const vehicleTypes = ['펌프차', '물탱크차', '사다리차', '구급차', '지휘차', '구조차', '행정차'];
  const statusOptions = ['운용중', '점검중', '정비중', '휴차'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-700 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            <h2 className="text-lg font-bold">
              {isEdit ? '소방차량 정보 수정' : '신규 소방차량 등록'}
            </h2>
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

            {/* Vehicle Number & Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  차량 번호 *
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="예: 의령 70바 1101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  차량 명칭 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 의령 1호 펌프차"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Type & Center */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  차량 종류
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                >
                  {vehicleTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  관서/센터
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                >
                  <option value="의령">의령</option>
                  <option value="부림">부림</option>
                  <option value="정곡">정곡</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  운용 상태
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                >
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mileage & Year & Fuel */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  누적 주행거리 (km)
                </label>
                <input
                  type="number"
                  value={totalMileage}
                  onChange={(e) => setTotalMileage(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  연식/도입연도
                </label>
                <input
                  type="text"
                  value={manufactureYear}
                  onChange={(e) => setManufactureYear(e.target.value)}
                  placeholder="2021"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  연료 종류
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                >
                  <option value="경유">경유</option>
                  <option value="휘발유">휘발유</option>
                  <option value="전기">전기</option>
                  <option value="하이브리드">하이브리드</option>
                </select>
              </div>
            </div>

            {/* Next Inspection & Maintenance Dates */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  📅 차기 정기점검 예정일
                </label>
                <input
                  type="date"
                  value={nextInspectionDate}
                  onChange={(e) => setNextInspectionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  🔧 차기 정비/소모품 교환일
                </label>
                <input
                  type="date"
                  value={nextMaintenanceDate}
                  onChange={(e) => setNextMaintenanceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                특이사항 / 비고
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="특장장치 사양 또는 차량 관련 비고 사항"
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
