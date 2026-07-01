import { useState, useRef } from 'react';
import axios from 'axios';
import { Camera, X, Loader2 } from 'lucide-react';

export default function FireWaterInspectionModal({ fireWater, onClose, onSuccess, initialData = null }) {
  const [affiliation, setAffiliation] = useState(
    initialData?.affiliation || (fireWater?.region ? `${fireWater.region}119안전센터` : '의령119안전센터')
  );
  const [inspectorName, setInspectorName] = useState(initialData?.inspectorName || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [externalPhoto, setExternalPhoto] = useState(null);
  const [externalPhotoPreview, setExternalPhotoPreview] = useState(initialData?.externalPhotoPath || null);
  const [internalPhoto, setInternalPhoto] = useState(null);
  const [internalPhotoPreview, setInternalPhotoPreview] = useState(initialData?.internalPhotoPath || null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [itemsStatus, setItemsStatus] = useState(initialData?.itemsStatus || {
    bodyStatus: '양호',
    signStatus: '양호',
    valveStatus: '양호',
    waterStatus: '양호'
  });

  const externalFileInputRef = useRef(null);
  const internalFileInputRef = useRef(null);

  const handlePhotoCapture = (type, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1000;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], `photo-${Date.now()}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            const previewUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            if (type === 'external') {
              setExternalPhoto(compressedFile);
              setExternalPhotoPreview(previewUrl);
            } else {
              setInternalPhoto(compressedFile);
              setInternalPhotoPreview(previewUrl);
            }
          }, 'image/jpeg', 0.8);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusChange = (item, status) => {
    setItemsStatus(prev => ({ ...prev, [item]: status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!initialData && (!externalPhoto || !internalPhoto)) {
      alert('외부(원경) 및 상세(근경) 점검 사진 2장을 모두 등록해주세요.');
      return;
    }
    if (!inspectorName.trim()) {
      alert('점검자 이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('affiliation', affiliation);
      formData.append('inspectorName', inspectorName);
      formData.append('notes', notes);
      formData.append('itemsStatus', JSON.stringify(itemsStatus));
      if (externalPhoto) formData.append('externalPhoto', externalPhoto);
      if (internalPhoto) formData.append('internalPhoto', internalPhoto);

      if (initialData) {
        await axios.put(`/api/fire-waters/inspections/${initialData._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`/api/fire-waters/${fireWater._id}/inspections`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Submit failed:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = ['양호', '불량', '없음'];
  const itemLabels = {
    bodyStatus: '몸체 및 외관 상태',
    signStatus: '표지판 및 보호틀',
    valveStatus: '밸브 개폐 작동',
    waterStatus: '수압 및 방수 상태'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-800">소방용수 조사 결과 등록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-6 overflow-y-auto text-left">
          <div className="mb-4 text-center">
            <h3 className="text-xl font-bold text-red-600 break-keep">{fireWater?.name}</h3>
            {fireWater?.address && <p className="text-xs text-gray-500 mt-1">{fireWater.address}</p>}
            <p className="text-xs text-gray-400 mt-1">구분: {fireWater?.type} | 관서: {fireWater?.region}119안전센터</p>
          </div>

          <form id="firewater-inspection-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Inspector Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                <select 
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="의령119안전센터">의령119안전센터</option>
                  <option value="부림119안전센터">부림119안전센터</option>
                  <option value="정곡119안전센터">정곡119안전센터</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input 
                  type="text" 
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="홍길동"
                  required
                />
              </div>
            </div>

            {/* Photo Capture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현장 사진 ({initialData ? '새로 업로드 시 변경됨' : '2장 필수'})
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* External Photo */}
                <div>
                  <div 
                    onClick={() => externalFileInputRef.current.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors h-32 flex flex-col justify-center items-center
                      ${externalPhotoPreview ? 'border-gray-300 bg-gray-50' : 'border-red-300 bg-red-50 hover:bg-red-100'}`}
                  >
                    {externalPhotoPreview ? (
                      <img src={externalPhotoPreview} alt="외부 사진" className="max-h-full mx-auto rounded shadow-sm" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-red-500 mb-1" />
                        <span className="text-xs font-medium text-red-600">외부(원경) 사진</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={externalFileInputRef}
                    onChange={(e) => handlePhotoCapture('external', e)}
                  />
                </div>

                {/* Internal Photo */}
                <div>
                  <div 
                    onClick={() => internalFileInputRef.current.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors h-32 flex flex-col justify-center items-center
                      ${internalPhotoPreview ? 'border-gray-300 bg-gray-50' : 'border-red-300 bg-red-50 hover:bg-red-100'}`}
                  >
                    {internalPhotoPreview ? (
                      <img src={internalPhotoPreview} alt="상세 사진" className="max-h-full mx-auto rounded shadow-sm" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-red-500 mb-1" />
                        <span className="text-xs font-medium text-red-600">상세(근경) 사진</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={internalFileInputRef}
                    onChange={(e) => handlePhotoCapture('internal', e)}
                  />
                </div>
              </div>
            </div>

            {/* Items Check */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">용수 작동/상태 확인</label>
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {Object.keys(itemsStatus).map((itemKey) => (
                  <div key={itemKey} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">{itemLabels[itemKey]}</span>
                    <div className="flex space-x-1.5">
                      {statusOptions.map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(itemKey, status)}
                          className={`px-2.5 py-1 text-xs rounded border font-bold transition-colors
                            ${itemsStatus[itemKey] === status 
                              ? (status === '양호' ? 'bg-green-100 border-green-500 text-green-700' : 
                                 status === '불량' ? 'bg-red-100 border-red-500 text-red-700' : 
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

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">특이사항</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-red-500 focus:border-red-500 outline-none"
                rows="3"
                placeholder="균열, 도색불량, 주변 장애물 적치 등 특이사항 기재"
              ></textarea>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex justify-end space-x-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isLoading}
          >
            취소
          </button>
          <button 
            type="submit"
            form="firewater-inspection-form"
            className="flex items-center px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            결과 저장
          </button>
        </div>
      </div>
    </div>
  );
}
