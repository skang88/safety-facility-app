import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Navigation, Fuel } from 'lucide-react';

export default function VehicleLogModal({ vehicles = [], defaultVehicleId = '', onClose, onSuccess }) {
  const [vehicleId, setVehicleId] = useState(defaultVehicleId || (vehicles[0]?._id || ''));
  const [driverName, setDriverName] = useState('');
  const [affiliation, setAffiliation] = useState('의령119안전센터');
  const [purpose, setPurpose] = useState('화재 출동');
  
  // Format current date-time for default departure/arrival
  const now = new Date();
  const formatDateTime = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  const [departureTime, setDepartureTime] = useState(formatDateTime(now));
  const [arrivalTime, setArrivalTime] = useState(formatDateTime(now));

  const selectedVehicle = vehicles.find(v => v._id === vehicleId);

  const [startMileage, setStartMileage] = useState(selectedVehicle?.totalMileage?.toString() || '0');
  const [endMileage, setEndMileage] = useState(selectedVehicle?.totalMileage?.toString() || '0');
  const [fuelRefueled, setFuelRefueled] = useState('0');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update start mileage when vehicle selection changes
  useEffect(() => {
    if (selectedVehicle) {
      setStartMileage(selectedVehicle.totalMileage?.toString() || '0');
      setEndMileage(selectedVehicle.totalMileage?.toString() || '0');
      setAffiliation(`${selectedVehicle.region}119안전센터`);
    }
  }, [vehicleId]);

  const calcDistance = () => {
    const s = Number(startMileage) || 0;
    const e = Number(endMileage) || 0;
    return Math.max(0, e - s);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!vehicleId) {
      setErrorMessage('차량을 선택해주세요.');
      return;
    }
    if (!driverName.trim()) {
      setErrorMessage('운전자 이름을 입력해주세요.');
      return;
    }

    const sVal = Number(startMileage);
    const eVal = Number(endMileage);

    if (isNaN(sVal) || isNaN(eVal)) {
      setErrorMessage('올바른 주행거리를 입력해주세요.');
      return;
    }
    if (eVal < sVal) {
      setErrorMessage('도착 주행거리가 출발 주행거리보다 적을 수 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        vehicleId,
        driverName,
        affiliation,
        purpose,
        departureTime: departureTime.replace('T', ' '),
        arrivalTime: arrivalTime.replace('T', ' '),
        startMileage: sVal,
        endMileage: eVal,
        fuelRefueled: Number(fuelRefueled) || 0,
        notes
      };

      await axios.post('/api/vehicles/logs', data);
      onSuccess();
    } catch (error) {
      console.error('Failed to save vehicle log:', error);
      setErrorMessage(error.response?.data?.error || '운행 일지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const purposeOptions = ['화재 출동', '구조 출동', '구급 출동', '순찰', '교육 훈련', '정비 이송', '기타'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-700 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            <h2 className="text-lg font-bold">소방차량 운행기록 작성</h2>
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

            {/* Driver & Affiliation */}
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
                  운전자 이름 *
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                운행 목적 *
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                disabled={isLoading}
              >
                {purposeOptions.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Departure & Arrival Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  출발 일시
                </label>
                <input
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  도착 일시
                </label>
                <input
                  type="datetime-local"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Mileage Calculations */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    출발 주행거리 (km)
                  </label>
                  <input
                    type="number"
                    value={startMileage}
                    onChange={(e) => setStartMileage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-red-500 focus:border-red-500 outline-none"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    도착 주행거리 (km)
                  </label>
                  <input
                    type="number"
                    value={endMileage}
                    onChange={(e) => setEndMileage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-red-500 focus:border-red-500 outline-none"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-red-50 p-2.5 rounded-lg border border-red-100 text-xs">
                <span className="font-bold text-gray-700">총 운행 거리를 계산합니다:</span>
                <span className="font-extrabold text-red-600 text-sm">{calcDistance()} km</span>
              </div>
            </div>

            {/* Refuel amount */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center">
                <Fuel className="w-3.5 h-3.5 mr-1 text-amber-600" />
                주유량 (선택사항, L)
              </label>
              <input
                type="number"
                step="any"
                value={fuelRefueled}
                onChange={(e) => setFuelRefueled(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-red-500 focus:border-red-500 outline-none"
                disabled={isLoading}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                운행 특이사항
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="출동 내역 또는 특이사항 기록"
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '기록 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
