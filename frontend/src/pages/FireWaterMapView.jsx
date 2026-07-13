import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import FireWaterInspectionModal from '../components/FireWaterInspectionModal';

const createIcon = (isInspected) => {
  const color = isInspected ? '#10b981' : '#ef4444'; // Green for inspected, Red for pending
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

function MapBounds({ fireWaters }) {
  const map = useMap();
  useEffect(() => {
    if (fireWaters.length > 0) {
      const bounds = fireWaters.map(f => [f.location.coordinates[1], f.location.coordinates[0]]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [fireWaters, map]);
  return null;
}

export default function FireWaterMapView() {
  const [fireWaters, setFireWaters] = useState([]);
  const [selectedFireWater, setSelectedFireWater] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchFireWaters();
  }, []);

  const fetchFireWaters = async () => {
    try {
      const res = await axios.get('/api/fire-waters');
      setFireWaters(res.data);
    } catch (error) {
      console.error('Failed to fetch fire waters:', error);
    }
  };

  const handleOpenModal = (fw) => {
    setSelectedFireWater(fw);
    setIsModalOpen(true);
  };

  const handleInspectionComplete = () => {
    setIsModalOpen(false);
    setSelectedFireWater(null);
    fetchFireWaters();
    alert('조사 결과가 등록되었습니다.');
  };

  // Default center for Uiryeong if no fire waters loaded yet
  const defaultCenter = [35.3168, 128.2570];

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fireWaters.length > 0 && <MapBounds fireWaters={fireWaters} />}
        
        {fireWaters.map((fw) => (
          <Marker 
            key={fw._id} 
            position={[fw.location.coordinates[1], fw.location.coordinates[0]]}
            icon={createIcon(fw.isInspected)}
          >
            <Popup>
              <div className="p-1 min-w-[220px] text-left">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] px-1 py-0.5 rounded font-bold">
                      {fw.type}
                    </span>
                    {fw.serialNumber && (
                      <span className="bg-gray-100 text-gray-600 text-[9px] px-1 py-0.5 rounded font-medium">
                        {fw.serialNumber}
                      </span>
                    )}
                  </div>
                  {fw.isInspected ? (
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold shrink-0">완료</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold shrink-0">미조사</span>
                  )}
                </div>
                <h3 className="font-bold text-base mb-1">{fw.name}</h3>
                <p className="text-xs text-gray-500 mb-2 leading-relaxed">{fw.address}</p>
                
                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded mb-3 border border-gray-100 space-y-1">
                  <p>• 소관: {fw.region}119안전센터</p>
                  <p>• 구경: {fw.diameter ? fw.diameter + ' mm' : '미기재'}</p>
                  <p>• 설치일자: {fw.installDate || '미기재'}</p>
                </div>
                
                <button
                  onClick={() => handleOpenModal(fw)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-xs transition"
                >
                  조사 등록
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {isModalOpen && selectedFireWater && (
        <FireWaterInspectionModal 
          fireWater={selectedFireWater} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleInspectionComplete}
        />
      )}
    </div>
  );
}
