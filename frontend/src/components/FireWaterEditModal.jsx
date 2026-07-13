import { useState } from 'react';
import axios from 'axios';
import { X, Loader2, MapPin } from 'lucide-react';

export default function FireWaterEditModal({ fireWater, onClose, onSuccess }) {
  // If fireWater is null, it means we are creating a new one
  const isEdit = !!fireWater;
  
  const [serialNumber, setSerialNumber] = useState(fireWater?.serialNumber || '');
  const [name, setName] = useState(fireWater?.name || '');
  const [type, setType] = useState(fireWater?.type || '지상소화전');
  const [region, setRegion] = useState(fireWater?.region || '의령');
  const [address, setAddress] = useState(fireWater?.address || '');
  
  const [longitude, setLongitude] = useState(fireWater?.location?.coordinates?.[0]?.toString() || '128.2570');
  const [latitude, setLatitude] = useState(fireWater?.location?.coordinates?.[1]?.toString() || '35.3168');
  
  const [diameter, setDiameter] = useState(fireWater?.diameter || '');
  const [installDate, setInstallDate] = useState(fireWater?.installDate || '');
  const [details, setDetails] = useState(fireWater?.details || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('소방용수 명칭을 입력해주세요.');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('위치 주소를 입력해주세요.');
      return;
    }

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);

    if (isNaN(latVal) || isNaN(lngVal)) {
      setErrorMessage('올바른 위경도 좌표를 입력해주세요.');
      return;
    }

    if (latVal < 33 || latVal > 39 || lngVal < 124 || lngVal > 132) {
      if (!window.confirm('입력하신 좌표가 대한민국 범위를 벗어납니다. 그래도 저장하시겠습니까?\n(위도 범위: 33~39, 경도 범위: 124~132)')) {
        return;
      }
    }

    setIsLoading(true);
    try {
      const data = {
        serialNumber,
        name,
        type,
        region,
        address,
        coordinates: [lngVal, latVal],
        diameter,
        installDate,
        details
      };

      if (isEdit) {
        await axios.put(`/api/fire-waters/${fireWater._id}`, data);
      } else {
        await axios.post('/api/fire-waters', data);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save fire water:', error);
      setErrorMessage(error.response?.data?.error || '소방용수 대상물 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fireWaterTypes = ['지상소화전', '지하소화전', '급수탑', '저수조', '비상소화장치'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center text-red-600 gap-2">
            <MapPin className="w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-800">
              {isEdit ? '소방용수 정보 및 좌표 수정' : '신규 소방용수 대상물 등록'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="p-6 space-y-4 text-left">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
                {errorMessage}
              </div>
            )}

            {/* Serial Number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  관리번호 / 연번
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="예: 의령-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  구분 (종류)
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                >
                  {fireWaterTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                용수명 (명칭)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 의령시장 지상소화전"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                disabled={isLoading}
                required
              />
            </div>

            {/* Center & Address */}
            <div className="grid grid-cols-3 gap-2">
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
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  위치 (주소)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="예: 의령읍 의병로 123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Latitude and Longitude Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  위도 (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="예: 35.3168"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  경도 (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="예: 128.2570"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Specs: Diameter and Install Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  구경 (Diameter, e.g. 100mm)
                </label>
                <input
                  type="text"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                  placeholder="예: 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  설치일자 (Install Date)
                </label>
                <input
                  type="text"
                  value={installDate}
                  onChange={(e) => setInstallDate(e.target.value)}
                  placeholder="예: 2021-08-15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                기타상세 / 비고
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="상세 위치 묘사 또는 비고 사항"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                rows="2"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 rounded-b-xl">
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors flex items-center justify-center min-w-[70px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '저장'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
