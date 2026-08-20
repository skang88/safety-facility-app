const GeojeTransport = require('../models/GeojeTransport');

// Seed default sample data if database is empty or missing target dates
const seedInitialDataIfNeeded = async () => {
  try {
    const count = await GeojeTransport.countDocuments();
    if (count === 0) {
      const sampleEntries = [
        {
          date: '2026-08-20',
          departureTeamDepartment: '현장대응단',
          departureTeam: [
            { slotIndex: 0, department: '현장대응단', rank: '소방위', name: '김태호', phone: '010-1234-5678', note: '지휘차 탑승' },
            { slotIndex: 1, department: '현장대응단', rank: '소방장', name: '박성민', phone: '010-2345-6789', note: '' }
          ],
          returnTeamDepartment: '소방행정과',
          returnTeam: [
            { slotIndex: 0, department: '소방행정과', rank: '소방위', name: '이수진', phone: '010-3456-7890', note: '업무 지원' },
            { slotIndex: 1, department: '소방행정과', rank: '소방장', name: '최동현', phone: '010-4567-8901', note: '' }
          ],
          generalNotes: '폭우 대비 현장 인력 수송 비상 편성 (거제소방서 본서 출발)'
        },
        {
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
          generalNotes: '저녁 복귀조 1명 추가 모집 중'
        },
        {
          date: '2026-08-22',
          departureTeamDepartment: '119재난대응과',
          departureTeam: [
            { slotIndex: 0, department: '119재난대응과', rank: '소방위', name: '윤서준', phone: '010-8901-2345', note: '' }
          ],
          returnTeamDepartment: '예방안전과',
          returnTeam: [],
          generalNotes: '주말 폭우 지원 인력 모집 중'
        }
      ];

      await GeojeTransport.insertMany(sampleEntries);
      console.log('Geoje Transport sample data seeded successfully');
    }
  } catch (err) {
    console.error('Error seeding Geoje transport data:', err);
  }
};

// Get monthly transport rosters
exports.getMonthlyRoster = async (req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const { year, month } = req.query;

    let query = {};
    if (year && month) {
      const formattedMonth = String(month).padStart(2, '0');
      const regex = new RegExp(`^${year}-${formattedMonth}`);
      query.date = regex;
    }

    const rosters = await GeojeTransport.find(query).sort({ date: 1 });
    res.json({ success: true, data: rosters });
  } catch (err) {
    console.error('Error fetching rosters:', err);
    res.status(500).json({ success: false, message: '수송지원 명단을 불러오는 중 오류가 발생했습니다.' });
  }
};

// Get single day roster
exports.getDayRoster = async (req, res) => {
  try {
    const { date } = req.params;
    let roster = await GeojeTransport.findOne({ date });

    if (!roster) {
      roster = {
        date,
        departureTeamDepartment: '현장대응단',
        departureTeam: [],
        returnTeamDepartment: '소방행정과',
        returnTeam: [],
        generalNotes: ''
      };
    }

    res.json({ success: true, data: roster });
  } catch (err) {
    console.error('Error fetching day roster:', err);
    res.status(500).json({ success: false, message: '일자별 명단을 불러오는 중 오류가 발생했습니다.' });
  }
};

// Update or sign up volunteer for slot
exports.upsertSlot = async (req, res) => {
  try {
    const { date } = req.params;
    const { shiftType, slotIndex, department, rank, name, phone, note, teamDepartment } = req.body;

    if (!shiftType || (shiftType !== 'departure' && shiftType !== 'return')) {
      return res.status(400).json({ success: false, message: '유효하지 않은 구분입니다. (departure 또는 return)' });
    }

    let roster = await GeojeTransport.findOne({ date });

    if (!roster) {
      roster = new GeojeTransport({
        date,
        departureTeamDepartment: shiftType === 'departure' && teamDepartment ? teamDepartment : '현장대응단',
        departureTeam: [],
        returnTeamDepartment: shiftType === 'return' && teamDepartment ? teamDepartment : '소방행정과',
        returnTeam: [],
        generalNotes: ''
      });
    }

    // Update team department if provided
    if (teamDepartment) {
      if (shiftType === 'departure') {
        roster.departureTeamDepartment = teamDepartment;
      } else {
        roster.returnTeamDepartment = teamDepartment;
      }
    }

    const targetArray = shiftType === 'departure' ? roster.departureTeam : roster.returnTeam;
    
    // Find existing slot index
    const existingIndex = targetArray.findIndex(s => s.slotIndex === Number(slotIndex));

    const slotData = {
      slotIndex: Number(slotIndex),
      department: department || '',
      rank: rank || '',
      name: name || '',
      phone: phone || '',
      note: note || '',
      updatedAt: new Date()
    };

    if (existingIndex >= 0) {
      targetArray[existingIndex] = slotData;
    } else {
      targetArray.push(slotData);
    }

    await roster.save();
    res.json({ success: true, data: roster, message: '지원 정보가 성공적으로 등록/수정 되었습니다.' });
  } catch (err) {
    console.error('Error updating slot:', err);
    res.status(500).json({ success: false, message: '저장 처리 중 오류가 발생했습니다.' });
  }
};

// Cancel/Delete volunteer slot
exports.cancelSlot = async (req, res) => {
  try {
    const { date } = req.params;
    const { shiftType, slotIndex } = req.body;

    let roster = await GeojeTransport.findOne({ date });
    if (!roster) {
      return res.status(404).json({ success: false, message: '해당 일자의 신청 내역이 없습니다.' });
    }

    if (shiftType === 'departure') {
      roster.departureTeam = roster.departureTeam.filter(s => s.slotIndex !== Number(slotIndex));
    } else if (shiftType === 'return') {
      roster.returnTeam = roster.returnTeam.filter(s => s.slotIndex !== Number(slotIndex));
    }

    await roster.save();
    res.json({ success: true, data: roster, message: '신청 내역이 취소되었습니다.' });
  } catch (err) {
    console.error('Error canceling slot:', err);
    res.status(500).json({ success: false, message: '취소 처리 중 오류가 발생했습니다.' });
  }
};

// Update Team Department & General Notes
exports.updateRosterMeta = async (req, res) => {
  try {
    const { date } = req.params;
    const { departureTeamDepartment, returnTeamDepartment, generalNotes } = req.body;

    let roster = await GeojeTransport.findOne({ date });
    if (!roster) {
      roster = new GeojeTransport({
        date,
        departureTeamDepartment: departureTeamDepartment || '현장대응단',
        departureTeam: [],
        returnTeamDepartment: returnTeamDepartment || '소방행정과',
        returnTeam: [],
        generalNotes: generalNotes || ''
      });
    } else {
      if (departureTeamDepartment !== undefined) roster.departureTeamDepartment = departureTeamDepartment;
      if (returnTeamDepartment !== undefined) roster.returnTeamDepartment = returnTeamDepartment;
      if (generalNotes !== undefined) roster.generalNotes = generalNotes;
    }

    await roster.save();
    res.json({ success: true, data: roster, message: '담당 부서 정보가 업데이트되었습니다.' });
  } catch (err) {
    console.error('Error updating meta:', err);
    res.status(500).json({ success: false, message: '메타 데이터 수정 중 오류가 발생했습니다.' });
  }
};
