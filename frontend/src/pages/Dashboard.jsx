import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import InspectionDetailModal from '../components/InspectionDetailModal';
import InspectionModal from '../components/InspectionModal';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [editingInspection, setEditingInspection] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get('/api/dashboard-summary');
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await axios.delete(`/api/inspections/${id}`);
        setSelectedInspection(null);
        fetchSummary();
        alert('삭제되었습니다.');
      } catch (error) {
        console.error('Failed to delete inspection:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleEdit = (inspection) => {
    setSelectedInspection(null);
    setEditingInspection(inspection);
  };

  const handleEditComplete = () => {
    setEditingInspection(null);
    fetchSummary();
    alert('수정되었습니다.');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">로딩중...</div>;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">수난안전시설물 점검 현황 및 통계</h1>
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">전체 시설물</p>
              <p className="text-3xl font-bold text-gray-900">{summary?.totalFacilities || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">이번 분기 점검 완료</p>
              <p className="text-3xl font-bold text-gray-900">{summary?.inspectionsCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-lg font-semibold text-gray-800">점검 진행률</h2>
            <span className="text-sm font-medium text-gray-600">
              {summary?.totalFacilities ? Math.round((summary.inspectionsCount / summary.totalFacilities) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${summary?.totalFacilities ? Math.round((summary.inspectionsCount / summary.totalFacilities) * 100) : 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-right">
            {summary?.totalFacilities || 0}개소 중 {summary?.inspectionsCount || 0}개소 완료
          </p>
        </div>

        {/* Recent Inspections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">최근 점검 결과</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {summary?.recentInspections?.length > 0 ? (
              summary.recentInspections.map((insp) => (
                <div 
                  key={insp._id} 
                  className="p-4 sm:flex sm:items-center sm:justify-between hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setSelectedInspection(insp)}
                >
                  <div className="flex space-x-4 items-start">
                    {insp.externalPhotoPath && (
                      <img src={insp.externalPhotoPath} alt="점검 사진" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{insp.facility?.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {insp.affiliation} {insp.inspectorName} 점검 (관서: {insp.facility?.region})
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(insp.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 text-sm">
                    {/* Simplified status display */}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                      점검완료
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">최근 점검 내역이 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      {selectedInspection && (
        <InspectionDetailModal 
          inspection={selectedInspection} 
          onClose={() => setSelectedInspection(null)} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editingInspection && (
        <InspectionModal 
          facility={editingInspection.facility}
          initialData={editingInspection}
          onClose={() => setEditingInspection(null)}
          onSuccess={handleEditComplete}
        />
      )}
    </div>
  );
}
