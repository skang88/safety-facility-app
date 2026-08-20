import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  UserCheck, 
  PlusCircle, 
  Trash2, 
  Copy, 
  Printer, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  Building, 
  Phone, 
  FileText, 
  Share2, 
  ShieldAlert,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
  Info,
  CalendarCheck
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/geoje-transport';

const DEPARTMENTS = [
  '현장대응단',
  '소방행정과',
  '예방안전과',
  '119재난대응과',
  '옥포119안전센터',
  '고현119안전센터',
  '장승포119안전센터',
  '거제119안전센터',
  '동부119안전센터',
  '소방구조대',
  '수난구조대',
  '직접 입력'
];

const RANKS = [
  '소방위',
  '소방장',
  '소방경',
  '소방교',
  '소방사',
  '소방령',
  '의용소방대원',
  '자원봉사자',
  '직접 입력'
];

// Initial mock dataset for local fallback & rich immediate display
const DEFAULT_SAMPLE_DATA = {
  '2026-08-20': {
    date: '2026-08-20',
    departureTeamDepartment: '현장대응단',
    departureTeam: [
      { slotIndex: 0, department: '현장대응단', rank: '소방위', name: '홍길동', phone: '010-1234-5678', note: '지휘차 탑승' },
      { slotIndex: 1, department: '현장대응단', rank: '소방장', name: '김철수', phone: '010-2345-6789', note: '수송 운전' }
    ],
    returnTeamDepartment: '소방행정과',
    returnTeam: [
      { slotIndex: 0, department: '소방행정과', rank: '소방위', name: '이영희', phone: '010-3456-7890', note: '업무 지원' },
      { slotIndex: 1, department: '소방행정과', rank: '소방장', name: '박민수', phone: '010-4567-8901', note: '장비 교환' }
    ],
    generalNotes: '폭우 대비 본서 06:00 출발 현장 지원'
  },
  '2026-08-21': {
    date: '2026-08-21',
    departureTeamDepartment: '옥포119안전센터',
    departureTeam: [
      { slotIndex: 0, department: '옥포119안전센터', rank: '소방경', name: '정해성', phone: '010-5678-9012', note: '' },
      { slotIndex: 1, department: '옥포119안전센터', rank: '소방교', name: '한지민', phone: '010-6789-0123', note: '' }
    ],
    returnTeamDepartment: '고현119안전센터',
    returnTeam: [
      { slotIndex: 0, department: '고현119안전센터', rank: '소방위', name: '강민우', phone: '010-7890-1234', note: '' }
    ],
    generalNotes: '저녁 복귀조 1명 추가 신청 받는 중'
  },
  '2026-08-22': {
    date: '2026-08-22',
    departureTeamDepartment: '119재난대응과',
    departureTeam: [
      { slotIndex: 0, department: '119재난대응과', rank: '소방위', name: '윤서준', phone: '010-8901-2345', note: '' }
    ],
    returnTeamDepartment: '예방안전과',
    returnTeam: [],
    generalNotes: '주말 비상 수송지원 지원자 수시 모집'
  }
};

export default function GeojeTransportView() {
  // Current view date state (Default to August 2026)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 20)); // Month is 0-indexed (7 = August)
  const [rosterMap, setRosterMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for adding/editing a volunteer slot
  const [editingSlotInfo, setEditingSlotInfo] = useState(null); // { shiftType: 'departure'|'return', slotIndex: 0|1 }
  const [formDept, setFormDept] = useState('현장대응단');
  const [formCustomDept, setFormCustomDept] = useState('');
  const [formRank, setFormRank] = useState('소방위');
  const [formCustomRank, setFormCustomRank] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formTeamDept, setFormTeamDept] = useState('');

  // Department Filter & View Mode State
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'

  // Load rosters from localStorage first, then sync with backend
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  // Format date helper: YYYY-MM-DD
  const formatDateStr = (yearVal, monthVal, dayVal) => {
    const mm = String(monthVal).padStart(2, '0');
    const dd = String(dayVal).padStart(2, '0');
    return `${yearVal}-${mm}-${dd}`;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch monthly rosters from API or LocalStorage
  const fetchMonthlyRosters = async () => {
    setLoading(true);
    const localDataStr = localStorage.getItem(`geoje_transport_roster_${year}_${month}`);
    let initialRosters = localDataStr ? JSON.parse(localDataStr) : { ...DEFAULT_SAMPLE_DATA };

    try {
      const response = await axios.get(`${API_BASE_URL}/monthly?year=${year}&month=${month}`);
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const apiMap = {};
        response.data.data.forEach(item => {
          apiMap[item.date] = item;
        });
        const merged = { ...initialRosters, ...apiMap };
        setRosterMap(merged);
        localStorage.setItem(`geoje_transport_roster_${year}_${month}`, JSON.stringify(merged));
      } else {
        setRosterMap(initialRosters);
      }
    } catch (err) {
      console.warn('Backend API connection failed, falling back to local storage:', err);
      setRosterMap(initialRosters);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyRosters();
  }, [year, month]);

  // Save changes to state, localStorage, and API
  const updateRosterData = async (dateStr, updatedDayData) => {
    const updatedMap = {
      ...rosterMap,
      [dateStr]: updatedDayData
    };
    setRosterMap(updatedMap);
    localStorage.setItem(`geoje_transport_roster_${year}_${month}`, JSON.stringify(updatedMap));

    try {
      await axios.put(`${API_BASE_URL}/meta/${dateStr}`, {
        departureTeamDepartment: updatedDayData.departureTeamDepartment,
        returnTeamDepartment: updatedDayData.returnTeamDepartment,
        generalNotes: updatedDayData.generalNotes
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date(2026, 7, 20)); // Jump to current active date (2026-08-20)
  };

  // Days matrix for calendar
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon, etc.
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Padding days from previous month
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false,
        dateStr: null
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(year, month, d);
      days.push({
        dayNum: d,
        isCurrentMonth: true,
        dateStr,
        dayOfWeek: new Date(year, month - 1, d).getDay()
      });
    }

    // Padding days for next month to complete grid (multiples of 7)
    const remainingSlots = 42 - days.length; // 6 rows of 7
    for (let i = 1; i <= (remainingSlots < 7 ? remainingSlots : remainingSlots - 7); i++) {
      days.push({
        dayNum: i,
        isCurrentMonth: false,
        dateStr: null
      });
    }

    return days;
  }, [year, month]);

  // Open date details / registration modal
  const handleOpenDayModal = (dateStr) => {
    if (!dateStr) return;
    setSelectedDateStr(dateStr);
    setIsModalOpen(true);
    setEditingSlotInfo(null);
  };

  const selectedDayData = useMemo(() => {
    if (!selectedDateStr) return null;
    return rosterMap[selectedDateStr] || {
      date: selectedDateStr,
      departureTeamDepartment: '현장대응단',
      departureTeam: [],
      returnTeamDepartment: '소방행정과',
      returnTeam: [],
      generalNotes: ''
    };
  }, [selectedDateStr, rosterMap]);

  // Start slot registration / edit
  const handleStartEditSlot = (shiftType, slotIndex, existingSlot) => {
    const defaultTeamDept = shiftType === 'departure' 
      ? (selectedDayData?.departureTeamDepartment || '현장대응단') 
      : (selectedDayData?.returnTeamDepartment || '소방행정과');

    setEditingSlotInfo({ shiftType, slotIndex });
    setFormTeamDept(defaultTeamDept);
    if (existingSlot) {
      const isCustomDept = !DEPARTMENTS.includes(existingSlot.department) || existingSlot.department === '직접 입력';
      setFormDept(isCustomDept ? '직접 입력' : existingSlot.department);
      setFormCustomDept(isCustomDept ? existingSlot.department : '');

      const isCustomRank = !RANKS.includes(existingSlot.rank) || existingSlot.rank === '직접 입력';
      setFormRank(isCustomRank ? '직접 입력' : existingSlot.rank);
      setFormCustomRank(isCustomRank ? existingSlot.rank : '');

      setFormName(existingSlot.name || '');
      setFormPhone(existingSlot.phone || '');
      setFormNote(existingSlot.note || '');
    } else {
      setFormDept(defaultTeamDept);
      setFormCustomDept('');
      setFormRank('소방위');
      setFormCustomRank('');
      setFormName('');
      setFormPhone('');
      setFormNote('');
    }
  };

  // Submit volunteer slot registration
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!editingSlotInfo || !selectedDateStr) return;

    const finalDept = formDept === '직접 입력' ? formCustomDept : formDept;
    const finalRank = formRank === '직접 입력' ? formCustomRank : formRank;

    if (!formName.trim()) {
      alert('성명을 입력해 주세요.');
      return;
    }

    const { shiftType, slotIndex } = editingSlotInfo;
    const newSlot = {
      slotIndex,
      department: finalDept || formTeamDept || '거제소방서',
      rank: finalRank || '소방위',
      name: formName.trim(),
      phone: formPhone.trim(),
      note: formNote.trim(),
      updatedAt: new Date().toISOString()
    };

    const currentDay = { ...selectedDayData };
    let depTeam = [...(currentDay.departureTeam || [])];
    let retTeam = [...(currentDay.returnTeam || [])];

    if (shiftType === 'departure') {
      currentDay.departureTeamDepartment = formTeamDept || currentDay.departureTeamDepartment || '현장대응단';
      const existingIdx = depTeam.findIndex(s => s.slotIndex === slotIndex);
      if (existingIdx >= 0) depTeam[existingIdx] = newSlot;
      else depTeam.push(newSlot);
      currentDay.departureTeam = depTeam;
    } else {
      currentDay.returnTeamDepartment = formTeamDept || currentDay.returnTeamDepartment || '소방행정과';
      const existingIdx = retTeam.findIndex(s => s.slotIndex === slotIndex);
      if (existingIdx >= 0) retTeam[existingIdx] = newSlot;
      else retTeam.push(newSlot);
      currentDay.returnTeam = retTeam;
    }

    await updateRosterData(selectedDateStr, currentDay);

    // Call API endpoint
    try {
      await axios.post(`${API_BASE_URL}/slot/${selectedDateStr}`, {
        shiftType,
        slotIndex,
        department: newSlot.department,
        rank: newSlot.rank,
        name: newSlot.name,
        phone: newSlot.phone,
        note: newSlot.note,
        teamDepartment: formTeamDept
      });
    } catch (err) {
      console.warn('Backend API save slot warning:', err);
    }

    setEditingSlotInfo(null);
    showToast('✨ 자원 신청/수정이 완료되었습니다!');
  };

  // Cancel/Remove volunteer slot
  const handleCancelSlot = async (shiftType, slotIndex) => {
    if (!window.confirm('정말로 자원 신청을 취소하시겠습니까?')) return;

    const currentDay = { ...selectedDayData };
    if (shiftType === 'departure') {
      currentDay.departureTeam = (currentDay.departureTeam || []).filter(s => s.slotIndex !== slotIndex);
    } else {
      currentDay.returnTeam = (currentDay.returnTeam || []).filter(s => s.slotIndex !== slotIndex);
    }

    await updateRosterData(selectedDateStr, currentDay);

    try {
      await axios.post(`${API_BASE_URL}/cancel/${selectedDateStr}`, { shiftType, slotIndex });
    } catch (err) {
      console.warn('Backend cancel slot API warning:', err);
    }

    showToast('신청 내역이 취소되었습니다.');
  };

  // Copy formatted roster string to clipboard (for KakaoTalk / SMS)
  const handleCopyFormattedText = (dayData) => {
    if (!dayData) return;
    const dateObj = new Date(dayData.date);
    const dayOfWeekStr = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
    const formattedDate = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일(${dayOfWeekStr})`;

    const depDept = dayData.departureTeamDepartment || '현장대응단';
    const depList = (dayData.departureTeam || [])
      .map(s => `${s.rank} ${s.name}`)
      .join(', ') || '신청자 없음 (모집중)';

    const retDept = dayData.returnTeamDepartment || '소방행정과';
    const retList = (dayData.returnTeam || [])
      .map(s => `${s.rank} ${s.name}`)
      .join(', ') || '신청자 없음 (모집중)';

    const textToCopy = `[거제소방서 폭우현장 인력수송 지원]
■ 일자: ${formattedDate}
■ 출발(06시): ${depDept} / 인원: ${depList}
■ 복귀(18시): ${retDept} / 인원: ${retList}
■ 비고: ${dayData.generalNotes || '이상 없음'}`;

    navigator.clipboard.writeText(textToCopy);
    showToast('📋 카카오톡/문자 전송용 보고서 양식이 복사되었습니다!');
  };

  // Calculate monthly stats summary
  const statsSummary = useMemo(() => {
    let totalVolunteers = 0;
    let completedDays = 0;
    let openSlotsCount = 0;
    const deptCountMap = {};

    Object.values(rosterMap).forEach(day => {
      const depCount = (day.departureTeam || []).length;
      const retCount = (day.returnTeam || []).length;
      const dayTotal = depCount + retCount;

      totalVolunteers += dayTotal;
      if (dayTotal >= 4) completedDays++;
      openSlotsCount += (4 - dayTotal);

      [...(day.departureTeam || []), ...(day.returnTeam || [])].forEach(s => {
        if (s.department) {
          deptCountMap[s.department] = (deptCountMap[s.department] || 0) + 1;
        }
      });
    });

    const sortedDepts = Object.entries(deptCountMap).sort((a, b) => b[1] - a[1]);
    const topDept = sortedDepts[0] ? `${sortedDepts[0][0]} (${sortedDepts[0][1]}회)` : '현장대응단';

    return {
      totalVolunteers,
      completedDays,
      openSlotsCount,
      topDept
    };
  }, [rosterMap]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-16">
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-emerald-400 animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Header / Public Emergency Service Notice Banner */}
      <header className="bg-gradient-to-r from-red-900 via-slate-900 to-red-950 border-b border-red-800/40 shadow-xl py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-600/30 rounded-2xl border border-red-500/50 shadow-inner flex items-center justify-center">
              <ShieldAlert className="w-9 h-9 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  거제소방서 재난대응
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center">
                  <Check className="w-3 h-3 mr-1" /> 전체 공개 (자유 지원/예약)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                거제소방서 폭우현장 인력 수송지원 시스템
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-red-400 shrink-0" />
                <span>아침 06시 출발조(2명) 및 저녁 18시 복귀조(2명) 자원신청 달력 (누구나 접속 &amp; 이름 등록 가능)</span>
              </p>
            </div>
          </div>

          {/* Action buttons & Stats header */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={() => handleOpenDayModal('2026-08-20')}
              className="flex items-center px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-xl shadow-lg hover:shadow-red-600/30 transition border border-red-400/30 text-sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              오늘(8/20) 자원 신청하기
            </button>
          </div>
        </div>
      </header>

      {/* KPI Overview Summary Dashboard Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/70 rounded-2xl p-4 shadow-lg flex items-center space-x-3">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">이번 달 총 지원인원</p>
              <p className="text-xl font-black text-white mt-0.5">{statsSummary.totalVolunteers} <span className="text-xs text-slate-400 font-normal">명</span></p>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/70 rounded-2xl p-4 shadow-lg flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">완료된 일자 (4/4명)</p>
              <p className="text-xl font-black text-emerald-400 mt-0.5">{statsSummary.completedDays} <span className="text-xs text-slate-400 font-normal">일</span></p>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/70 rounded-2xl p-4 shadow-lg flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">현재 모집 잔여 석</p>
              <p className="text-xl font-black text-amber-400 mt-0.5">{statsSummary.openSlotsCount} <span className="text-xs text-slate-400 font-normal">자리에 지원 가능</span></p>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/70 rounded-2xl p-4 shadow-lg flex items-center space-x-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">최다 참여 소속부서</p>
              <p className="text-sm font-extrabold text-blue-300 mt-1 truncate max-w-[140px]">{statsSummary.topDept}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Calendar Navigation & Controls */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 w-full flex-1 flex flex-col">
        
        {/* Navigation Bar */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Month Navigation */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevMonth}
              className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition border border-slate-600"
              title="이전 달"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide min-w-[160px] text-center">
              {year}년 {month}월
            </h2>

            <button
              onClick={handleNextMonth}
              className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition border border-slate-600"
              title="다음 달"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleToday}
              className="px-3.5 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700/50 text-xs font-bold transition ml-2"
            >
              오늘로 이동
            </button>
          </div>

          {/* Department Filter & Search */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="w-full md:w-48 pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="ALL">전체 부서 보기</option>
                {DEPARTMENTS.filter(d => d !== '직접 입력').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                  viewMode === 'calendar' 
                    ? 'bg-red-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                달력
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                  viewMode === 'list' 
                    ? 'bg-red-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                목록
              </button>
            </div>
          </div>

        </div>

        {/* CALENDAR VIEW MODE */}
        {viewMode === 'calendar' && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex-1">
            
            {/* Calendar Day Header */}
            <div className="grid grid-cols-7 bg-slate-900 border-b border-slate-700 text-center font-black text-xs py-3 text-slate-300">
              <div className="text-red-400">일 (Sun)</div>
              <div>월 (Mon)</div>
              <div>화 (Tue)</div>
              <div>수 (Wed)</div>
              <div>목 (Thu)</div>
              <div>금 (Fri)</div>
              <div className="text-blue-400">토 (Sat)</div>
            </div>

            {/* Calendar Day Cells */}
            <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-700/50">
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div key={idx} className="bg-slate-900/40 p-2 min-h-[140px] text-slate-600 select-none">
                      <span className="text-xs font-bold">{cell.dayNum}</span>
                    </div>
                  );
                }

                const dayData = rosterMap[cell.dateStr] || {
                  date: cell.dateStr,
                  departureTeamDepartment: '현장대응단',
                  departureTeam: [],
                  returnTeamDepartment: '소방행정과',
                  returnTeam: []
                };

                const depCount = (dayData.departureTeam || []).length;
                const retCount = (dayData.returnTeam || []).length;
                const totalCount = depCount + retCount;
                const isComplete = totalCount >= 4;

                const isToday = cell.dateStr === '2026-08-20';
                const isSunday = cell.dayOfWeek === 0;
                const isSaturday = cell.dayOfWeek === 6;

                // Department filter match check
                if (selectedDeptFilter !== 'ALL') {
                  const matchDep = dayData.departureTeamDepartment === selectedDeptFilter || (dayData.departureTeam || []).some(s => s.department === selectedDeptFilter);
                  const matchRet = dayData.returnTeamDepartment === selectedDeptFilter || (dayData.returnTeam || []).some(s => s.department === selectedDeptFilter);
                  if (!matchDep && !matchRet) {
                    return (
                      <div key={idx} className="bg-slate-900/60 p-2 min-h-[140px] opacity-40">
                        <span className="text-xs font-bold text-slate-500">{cell.dayNum}</span>
                      </div>
                    );
                  }
                }

                return (
                  <div
                    key={idx}
                    onClick={() => handleOpenDayModal(cell.dateStr)}
                    className={`bg-slate-900 p-2.5 min-h-[150px] transition-all hover:bg-slate-800 cursor-pointer flex flex-col justify-between group relative border ${
                      isToday 
                        ? 'ring-2 ring-red-500 bg-red-950/20 border-red-500/50' 
                        : 'border-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    {/* Top Row: Date Number & Badge Status */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-black rounded-lg px-2 py-0.5 ${
                          isToday 
                            ? 'bg-red-600 text-white shadow' 
                            : isSunday 
                              ? 'text-red-400 font-bold' 
                              : isSaturday 
                                ? 'text-blue-400 font-bold' 
                                : 'text-slate-200'
                        }`}>
                          {cell.dayNum}일
                        </span>

                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                          isComplete 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : totalCount > 0 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {isComplete ? '완료 (4/4)' : `${totalCount}/4명 모집중`}
                        </span>
                      </div>

                      {/* Departure Team Box (아침 06시 출발조 2명) */}
                      <div className="mt-2 text-left bg-slate-800/80 rounded-xl p-2 border border-slate-700/80">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-extrabold text-amber-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> 06시 출발
                          </span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                            {dayData.departureTeamDepartment || '현장대응단'}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {[0, 1].map(slotIdx => {
                            const slot = (dayData.departureTeam || []).find(s => s.slotIndex === slotIdx);
                            return (
                              <div key={slotIdx} className="text-[11px] text-slate-200 truncate flex items-center justify-between">
                                {slot ? (
                                  <span className="font-bold text-slate-100">
                                    <span className="text-slate-400 font-normal mr-1">{slot.rank}</span>
                                    {slot.name}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-medium text-[10px] italic">+ 자원 지원 가능</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Return Team Box (저녁 18시 복귀조 2명) */}
                      <div className="mt-1.5 text-left bg-slate-800/80 rounded-xl p-2 border border-slate-700/80">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-extrabold text-blue-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> 18시 복귀
                          </span>
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.2 rounded border border-blue-500/30">
                            {dayData.returnTeamDepartment || '소방행정과'}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {[0, 1].map(slotIdx => {
                            const slot = (dayData.returnTeam || []).find(s => s.slotIndex === slotIdx);
                            return (
                              <div key={slotIdx} className="text-[11px] text-slate-200 truncate flex items-center justify-between">
                                {slot ? (
                                  <span className="font-bold text-slate-100">
                                    <span className="text-slate-400 font-normal mr-1">{slot.rank}</span>
                                    {slot.name}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-medium text-[10px] italic">+ 자원 지원 가능</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Quick Action Bar on Hover */}
                    <div className="mt-2 text-[10px] text-slate-400 font-bold flex items-center justify-between border-t border-slate-800 pt-1.5">
                      <span className="group-hover:text-red-400 transition">상세 및 신청 &rarr;</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyFormattedText(dayData);
                        }}
                        className="p-1 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition"
                        title="카톡/문자 양식 복사"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LIST VIEW MODE */}
        {viewMode === 'list' && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-red-400" />
              {year}년 {month}월 수송지원 전체 명단 목록
            </h3>

            <div className="divide-y divide-slate-700/60 border border-slate-700 rounded-xl overflow-hidden">
              {Object.keys(rosterMap).sort().map(dateKey => {
                const dayData = rosterMap[dateKey];
                const dateObj = new Date(dateKey);
                const dayOfWeekStr = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];

                const depList = (dayData.departureTeam || []).map(s => `${s.rank} ${s.name}`).join(', ') || '미정 (신청 가능)';
                const retList = (dayData.returnTeam || []).map(s => `${s.rank} ${s.name}`).join(', ') || '미정 (신청 가능)';

                return (
                  <div key={dateKey} className="p-4 bg-slate-900/60 hover:bg-slate-900 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-950 text-red-300 border border-red-700/50 p-2.5 rounded-xl text-center min-w-[75px]">
                        <p className="text-xs font-semibold">{month}월</p>
                        <p className="text-xl font-black leading-tight">{dateObj.getDate()}일</p>
                        <p className="text-[10px] font-bold text-red-400">({dayOfWeekStr})</p>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            출발 (06:00)
                          </span>
                          <span className="font-bold text-white">담당: {dayData.departureTeamDepartment || '현장대응단'}</span>
                          <span className="text-slate-300">/ 인원: {depList}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                            복귀 (18:00)
                          </span>
                          <span className="font-bold text-white">담당: {dayData.returnTeamDepartment || '소방행정과'}</span>
                          <span className="text-slate-300">/ 인원: {retList}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyFormattedText(dayData)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-600 transition flex items-center"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        양식 복사
                      </button>

                      <button
                        onClick={() => handleOpenDayModal(dateKey)}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                        신청/수정
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* DAY DETAIL & VOLUNTEER REGISTRATION MODAL */}
      {isModalOpen && selectedDayData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-2xl w-full p-6 text-slate-100 relative animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div>
                <span className="bg-red-600/30 text-red-300 border border-red-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  거제소방서 수송지원
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {selectedDateStr} 인력 수송 지원 신청 및 현황
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Prompt Requirement Display Card */}
            <div className="mt-4 p-4 bg-slate-800/90 border border-red-900/50 rounded-2xl text-xs space-y-2">
              <p className="font-extrabold text-red-400 flex items-center">
                <ShieldAlert className="w-4 h-4 mr-1.5" />
                현장 지원 보고 문자 양식 Preview:
              </p>
              <div className="bg-slate-950 p-3 rounded-xl font-mono text-slate-300 text-[11px] leading-relaxed border border-slate-800 select-all">
                {`${selectedDateStr.split('-')[1]}/${selectedDateStr.split('-')[2]} 출발 담당 ${selectedDayData.departureTeamDepartment || '현장대응단'} / 인원 ${(selectedDayData.departureTeam || []).map(s => `${s.rank} ${s.name}`).join(', ') || '신청가능'} / 복귀 담당 ${selectedDayData.returnTeamDepartment || '소방행정과'} / 인원 ${(selectedDayData.returnTeam || []).map(s => `${s.rank} ${s.name}`).join(', ') || '신청가능'}`}
              </div>
            </div>

            {/* Shift Slot Cards */}
            <div className="mt-6 space-y-6">
              
              {/* 1. Departure Shift (아침 06시 출발조) */}
              <div className="bg-slate-800/70 border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">
                      아침 06시 출발조
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      담당: [{selectedDayData.departureTeamDepartment || '현장대응단'}]
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">정원 2명</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1].map(slotIdx => {
                    const slot = (selectedDayData.departureTeam || []).find(s => s.slotIndex === slotIdx);
                    return (
                      <div
                        key={slotIdx}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                          slot 
                            ? 'bg-slate-900 border-emerald-500/40 text-emerald-100' 
                            : 'bg-slate-900/40 border-slate-700/80 border-dashed text-slate-400'
                        }`}
                      >
                        {slot ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded">
                              {slot.department}
                            </span>
                            <p className="text-sm font-black text-white mt-1">
                              {slot.rank} {slot.name}
                            </p>
                            {slot.phone && <p className="text-[10px] text-slate-400 flex items-center"><Phone className="w-3 h-3 mr-1" />{slot.phone}</p>}
                            {slot.note && <p className="text-[10px] text-amber-300">비고: {slot.note}</p>}
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-bold text-slate-400">자리 #{slotIdx + 1}</p>
                            <p className="text-[11px] text-slate-500">지원자 없음</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleStartEditSlot('departure', slotIdx, slot)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                              slot 
                                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' 
                                : 'bg-red-600 text-white hover:bg-red-500 shadow'
                            }`}
                          >
                            {slot ? '수정' : '+ 신청하기'}
                          </button>

                          {slot && (
                            <button
                              onClick={() => handleCancelSlot('departure', slotIdx)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950 transition"
                              title="신청 취소"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Return Shift (저녁 18시 복귀조) */}
              <div className="bg-slate-800/70 border border-blue-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">
                      저녁 18시 복귀조
                    </span>
                    <span className="text-xs font-bold text-blue-300">
                      담당: [{selectedDayData.returnTeamDepartment || '소방행정과'}]
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">정원 2명</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1].map(slotIdx => {
                    const slot = (selectedDayData.returnTeam || []).find(s => s.slotIndex === slotIdx);
                    return (
                      <div
                        key={slotIdx}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                          slot 
                            ? 'bg-slate-900 border-emerald-500/40 text-emerald-100' 
                            : 'bg-slate-900/40 border-slate-700/80 border-dashed text-slate-400'
                        }`}
                      >
                        {slot ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded">
                              {slot.department}
                            </span>
                            <p className="text-sm font-black text-white mt-1">
                              {slot.rank} {slot.name}
                            </p>
                            {slot.phone && <p className="text-[10px] text-slate-400 flex items-center"><Phone className="w-3 h-3 mr-1" />{slot.phone}</p>}
                            {slot.note && <p className="text-[10px] text-blue-300">비고: {slot.note}</p>}
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-bold text-slate-400">자리 #{slotIdx + 1}</p>
                            <p className="text-[11px] text-slate-500">지원자 없음</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleStartEditSlot('return', slotIdx, slot)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                              slot 
                                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' 
                                : 'bg-red-600 text-white hover:bg-red-500 shadow'
                            }`}
                          >
                            {slot ? '수정' : '+ 신청하기'}
                          </button>

                          {slot && (
                            <button
                              onClick={() => handleCancelSlot('return', slotIdx)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950 transition"
                              title="신청 취소"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* INLINE EDIT / SIGN-UP FORM */}
            {editingSlotInfo && (
              <form onSubmit={handleSaveSlot} className="mt-6 bg-slate-800 border border-red-500/50 rounded-2xl p-5 space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <h4 className="text-sm font-black text-white flex items-center">
                    <UserPlus className="w-4 h-4 mr-2 text-red-400" />
                    {editingSlotInfo.shiftType === 'departure' ? '아침 06시 출발조' : '저녁 18시 복귀조'} - 자원 신청 등록
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingSlotInfo(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    취소
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Shift Main Team Dept */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      {editingSlotInfo.shiftType === 'departure' ? '출발 담당 부서명' : '복귀 담당 부서명'}
                    </label>
                    <input
                      type="text"
                      value={formTeamDept}
                      onChange={(e) => setFormTeamDept(e.target.value)}
                      placeholder="예: 현장대응단, 소방행정과"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>

                  {/* Personal Department */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">신청자 소속 부서</label>
                    <select
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {formDept === '직접 입력' && (
                      <input
                        type="text"
                        value={formCustomDept}
                        onChange={(e) => setFormCustomDept(e.target.value)}
                        placeholder="부서명 직접 입력"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1 outline-none"
                      />
                    )}
                  </div>

                  {/* Rank */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">계급 (직위)</label>
                    <select
                      value={formRank}
                      onChange={(e) => setFormRank(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {formRank === '직접 입력' && (
                      <input
                        type="text"
                        value={formCustomRank}
                        onChange={(e) => setFormCustomRank(e.target.value)}
                        placeholder="계급 직접 입력"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mt-1 outline-none"
                      />
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">성명 <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="예: 홍길동"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-red-500 outline-none font-bold"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">비상 연락처 (선택)</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">비고 (지원차량 / 요청사항)</label>
                    <input
                      type="text"
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      placeholder="예: 승용차 지원 가능, 장비 지참"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>

                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlotInfo(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg border border-red-400/30"
                  >
                    신청 완료
                  </button>
                </div>
              </form>
            )}

            {/* Modal Footer Controls */}
            <div className="mt-6 pt-4 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleCopyFormattedText(selectedDayData)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl border border-slate-600 transition flex items-center"
              >
                <Copy className="w-4 h-4 mr-2 text-red-400" />
                카톡/문자 양식 복사
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 transition flex items-center"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  인쇄하기
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl"
                >
                  닫기
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
