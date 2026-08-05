import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import InspectionModal from '../components/InspectionModal';
import { AlertTriangle, Layers, Info } from 'lucide-react';

const createFacilityIcon = (isInspected) => {
  const color = isInspected ? '#10b981' : '#ef4444'; // Green for inspected, Red for pending
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

function MapBounds({ facilities }) {
  const map = useMap();
  useEffect(() => {
    if (facilities && facilities.length > 0) {
      const validPoints = facilities
        .filter(f => f.location?.coordinates && f.location.coordinates.length === 2)
        .map(f => [f.location.coordinates[1], f.location.coordinates[0]]);
      if (validPoints.length > 0) {
        map.fitBounds(validPoints, { padding: [50, 50] });
      }
    }
  }, [facilities, map]);
  return null;
}

export default function MapView({ facilities: propFacilities, onRefresh }) {
  const [internalFacilities, setInternalFacilities] = useState([]);
  const [drowningRisks, setDrowningRisks] = useState([]);
  const [showRiskLayer, setShowRiskLayer] = useState(true); // Risk map toggle
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const facilities = propFacilities !== undefined ? propFacilities : internalFacilities;

  useEffect(() => {
    if (propFacilities === undefined) {
      fetchFacilities();
    }
    fetchDrowningRisks();
  }, [propFacilities]);

  const fetchFacilities = async () => {
    try {
      const res = await axios.get('/api/facilities');
      setInternalFacilities(res.data);
    } catch (error) {
      console.error('Failed to fetch facilities:', error);
    }
  };

  const fetchDrowningRisks = async () => {
    try {
      const res = await axios.get('/api/drowning-risks');
      setDrowningRisks(res.data);
    } catch (error) {
      console.error('Failed to fetch drowning risk data:', error);
    }
  };

  const handleOpenModal = (facility) => {
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const handleInspectionComplete = () => {
    setIsModalOpen(false);
    setSelectedFacility(null);
    if (onRefresh) onRefresh();
    else fetchFacilities();
    alert('점검 결과가 등록되었습니다.');
  };

  const defaultCenter = [35.3168, 128.2570];

  return (
    <div className="h-full w-full relative min-h-[500px] flex flex-col text-left">
      {/* Map Control Bar with Source Attribution */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-2 border-b border-gray-200 flex flex-wrap justify-between items-center z-10 rounded-t-xl text-left gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-600" />
          <span className="text-xs font-bold text-gray-800">지도 레이어 설정:</span>
          <span className="text-[11px] text-gray-500 hidden sm:inline-flex items-center">
            <Info className="w-3 h-3 mr-1 text-blue-500" />
            (출처: 소방청 소방안전 빅데이터 플랫폼)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRiskLayer(!showRiskLayer)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm border ${
              showRiskLayer 
                ? 'bg-amber-500 text-white border-amber-600 font-extrabold' 
                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            ⚠️ 익수사고 위험지도 (경남 {drowningRisks.length.toLocaleString()}건) {showRiskLayer ? '켜짐' : '꺼짐'}
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer 
          center={defaultCenter} 
          zoom={12} 
          scrollWheelZoom={true}
          className="h-full w-full rounded-b-xl overflow-hidden shadow-inner border border-gray-200"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | 익수사고 데이터 출처: <a href="https://www.bigdata-119.go.kr" target="_blank" rel="noopener noreferrer">소방안전 빅데이터 플랫폼</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {facilities.length > 0 && <MapBounds facilities={facilities} />}
          
          {/* Facility Markers */}
          {facilities.map((fac) => {
            if (!fac.location?.coordinates || fac.location.coordinates.length < 2) return null;
            const match = fac.name.match(/^(.*?)\s*\((.*?)\)$/);
            const displayName = match ? match[1] : fac.name;
            const address = match ? match[2] : null;

            return (
              <Marker 
                key={fac._id} 
                position={[fac.location.coordinates[1], fac.location.coordinates[0]]}
                icon={createFacilityIcon(fac.isInspected)}
              >
                <Popup>
                  <div className="p-1 min-w-[200px] text-left">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-base text-gray-900">{displayName}</h3>
                      {fac.isInspected ? (
                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">완료</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold">미점검</span>
                      )}
                    </div>
                    {address && <p className="text-xs text-gray-500 mb-1">{address}</p>}
                    <p className="text-xs text-gray-600 mb-3">관서: {fac.region}119안전센터</p>
                    
                    {fac.baseItems && (
                      <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded mb-3 border border-gray-100 space-y-0.5">
                        {fac.baseItems.lifebuoy !== undefined && <p>구명환: {fac.baseItems.lifebuoy}개</p>}
                        {fac.baseItems.lifeJacket !== undefined && <p>구명조끼: {fac.baseItems.lifeJacket}개</p>}
                        {fac.baseItems.lifeline !== undefined && <p>구명줄: {fac.baseItems.lifeline}개</p>}
                        {fac.baseItems.throwBag !== undefined && <p>드로우백: {fac.baseItems.throwBag}개</p>}
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleOpenModal(fac)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-xs transition-colors"
                    >
                      점검 등록
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Drowning Accident Risk Points Layer */}
          {showRiskLayer && drowningRisks.map((risk) => (
            <CircleMarker
              key={risk._id}
              center={[risk.lat, risk.lng]}
              radius={6}
              pathOptions={{
                color: '#d97706',
                fillColor: '#ef4444',
                fillOpacity: 0.65,
                weight: 1.5
              }}
            >
              <Popup>
                <div className="p-1 text-left max-w-xs">
                  <div className="flex items-center gap-1 text-red-600 font-extrabold text-xs mb-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>익수사고 과거 발생지점</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-1">
                    [출처: 소방청 소방안전 빅데이터 플랫폼]
                  </p>
                  <p className="font-bold text-sm text-gray-900 mb-1">{risk.address}</p>
                  <div className="text-xs space-y-1 bg-amber-50 p-2 rounded border border-amber-200">
                    <p>• 사고 구분: <span className="font-bold text-red-700">{risk.causeSub} ({risk.causeMain})</span></p>
                    {risk.weatherWarning && <p>• 기상 특보: <span className="font-bold text-amber-800">{risk.weatherWarning}</span></p>}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {isModalOpen && selectedFacility && (
        <InspectionModal 
          facility={selectedFacility} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleInspectionComplete}
        />
      )}
    </div>
  );
}
