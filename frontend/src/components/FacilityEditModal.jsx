import { useState } from 'react';
import axios from 'axios';
import { X, Loader2, MapPin } from 'lucide-react';

export default function FacilityEditModal({ facility, onClose, onSuccess }) {
  const category = facility?.category;
  const baseItemFields = category?.baseItemFields || [];

  const [name, setName] = useState(facility?.name || '');
  const [region, setRegion] = useState(facility?.region || '의령');
  
  // Coordinates: longitude is index 0, latitude is index 1
  const [longitude, setLongitude] = useState(facility?.location?.coordinates?.[0]?.toString() || '');
  const [latitude, setLatitude] = useState(facility?.location?.coordinates?.[1]?.toString() || '');
  
  // Dynamic base items from category
  const buildInitialBaseItems = () => {
    const items = {};
    baseItemFields.forEach(field => {
      const val = facility?.baseItems?.[field.key];
      items[field.key] = val !== undefined && val !== null ? String(val) : '';
    });
    return items;
  };
  const [baseItems, setBaseItems] = useState(buildInitialBaseItems);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleBaseItemChange = (key, value) => {
    setBaseItems(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('시설물 이름을 입력해주세요.');
      return;
    }

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);

    if (isNaN(latVal) || isNaN(lngVal)) {
      setErrorMessage('올바른 위경도 좌표를 입력해주세요.');
      return;
    }

    // Latitude ranges from 33 to 39 in South Korea, Longitude from 124 to 132
    if (latVal < 33 || latVal > 39 || lngVal < 124 || lngVal > 132) {
      if (!window.confirm('입력하신 좌표가 대한민국 범위를 벗어납니다. 그래도 저장하시겠습니까?\n(위도 범위: 33~39, 경도 범위: 124~132)')) {
        return;
      }
    }

    // Convert base items to proper types
    const processedBaseItems = {};
    baseItemFields.forEach(field => {
      const raw = baseItems[field.key];
      if (field.type === 'number') {
        processedBaseItems[field.key] = raw ? Number(raw) : 0;
      } else {
        processedBaseItems[field.key] = raw || '';
      }
    });

    setIsLoading(true);
    try {
      await axios.put(`/api/facilities/${facility._id}`, {
        name,
        region,
        coordinates: [lngVal, latVal], // GeoJSON format: [longitude, latitude]
        baseItems: processedBaseItems
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update facility:', error);
      setErrorMessage(error.response?.data?.error || '시설물 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center text-red-600 gap-2">
            <MapPin className="w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-800">시설물 정보 수정</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="p-6 space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
                {errorMessage}
              </div>
            )}

            {category && (
              <div className="text-center">
                <span className="inline-block text-[11px] text-white bg-red-600 px-2 py-0.5 rounded font-medium">{category.name}</span>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                시설물 명
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 의령1 (의령읍 서동리)"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Region Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                관서/센터
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm transition-all"
                disabled={isLoading}
              >
                <option value="의령">의령</option>
                <option value="부림">부림</option>
                <option value="정곡">정곡</option>
              </select>
            </div>

            {/* Latitude and Longitude Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  위도 (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="예: 35.31277"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-mono transition-all"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  경도 (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="예: 128.25562"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-mono transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Dynamic Base Item Fields */}
            {baseItemFields.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  시설물 상세 정보
                </label>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {baseItemFields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        step={field.type === 'number' ? 'any' : undefined}
                        value={baseItems[field.key] || ''}
                        onChange={(e) => handleBaseItemChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm transition-all"
                        disabled={isLoading}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 leading-relaxed">
                * 위경도 좌표 수정 시, 카카오 지도 바로가기 링크 및 지도상의 위치 핀이 새로 설정된 좌표로 자동 업데이트됩니다.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
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
