import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import InspectionModal from '../components/InspectionModal';

const createIcon = (isInspected) => {
  const color = isInspected ? '#10b981' : '#ef4444'; // Green for inspected, Red for pending
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Helper component to adjust map bounds
function MapBounds({ facilities }) {
  const map = useMap();
  useEffect(() => {
    if (facilities.length > 0) {
      const bounds = facilities.map(f => [f.location.coordinates[1], f.location.coordinates[0]]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [facilities, map]);
  return null;
}

export default function MapView() {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await axios.get('/api/facilities');
      setFacilities(res.data);
    } catch (error) {
      console.error('Failed to fetch facilities:', error);
    }
  };

  const handleOpenModal = (facility) => {
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const handleInspectionComplete = () => {
    setIsModalOpen(false);
    setSelectedFacility(null);
    fetchFacilities();
    alert('점검 결과가 등록되었습니다.');
  };

  // Default center for Uiryeong if no facilities loaded yet
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
        {facilities.length > 0 && <MapBounds facilities={facilities} />}
        
        {facilities.map((fac) => (
          <Marker 
            key={fac._id} 
            position={[fac.location.coordinates[1], fac.location.coordinates[0]]}
            icon={createIcon(fac.isInspected)}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg">{fac.name}</h3>
                  {fac.isInspected ? (
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">완료</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold">미점검</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">관서: {fac.region}</p>
                
                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded mb-3 border border-gray-100">
                  <p>구명환: {fac.baseItems.lifebuoy}개</p>
                  <p>구명쪼끼: {fac.baseItems.lifeJacket}개</p>
                  <p>구명줄: {fac.baseItems.lifeline}개</p>
                  <p>드로우백: {fac.baseItems.throwBag}개</p>
                </div>
                
                <button
                  onClick={() => handleOpenModal(fac)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  점검 등록
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

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
