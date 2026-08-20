const GeojeTransport = require('../models/GeojeTransport');

let isSeeded = false;

const seedInitialDataIfNeeded = async () => {
  isSeeded = true;
};

// Get monthly transport rosters (ultra-fast lean query)
exports.getMonthlyRoster = async (req, res) => {
  try {
    if (!isSeeded) {
      await seedInitialDataIfNeeded();
    }
    const { year, month } = req.query;

    let query = {};
    if (year && month) {
      const formattedMonth = String(month).padStart(2, '0');
      const regex = new RegExp(`^${year}-${formattedMonth}`);
      query.date = regex;
    }

    const rosters = await GeojeTransport.find(query).sort({ date: 1 }).lean();
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
    
    // Find existing slot index with safe index fallback
    const existingIndex = targetArray.findIndex((s, idx) => {
      const idxVal = typeof s.slotIndex === 'number' ? s.slotIndex : idx;
      return idxVal === Number(slotIndex);
    });

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
      roster.departureTeam = roster.departureTeam.filter((s, idx) => {
        const idxVal = typeof s.slotIndex === 'number' ? s.slotIndex : idx;
        return idxVal !== Number(slotIndex);
      });
    } else if (shiftType === 'return') {
      roster.returnTeam = roster.returnTeam.filter((s, idx) => {
        const idxVal = typeof s.slotIndex === 'number' ? s.slotIndex : idx;
        return idxVal !== Number(slotIndex);
      });
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

// Get Notice Text
exports.getNotice = async (req, res) => {
  try {
    const noticeDoc = await GeojeTransport.findOne({ date: 'SYSTEM_NOTICE' }).lean();
    const defaultNotice = '📢 [비상 동원 수송 안내] 의령소방서 ↔ 거제 폭우 현장 지원 인력은 출발 10분 전 본서 전정 집결 바랍니다. (문의: 현장대응단 / 소방행정과)';
    res.json({
      success: true,
      noticeText: noticeDoc && noticeDoc.generalNotes ? noticeDoc.generalNotes : defaultNotice
    });
  } catch (err) {
    console.error('Error fetching notice:', err);
    res.status(500).json({ success: false, message: '공지사항 조회 중 오류가 발생했습니다.' });
  }
};

// Update Notice Text
exports.updateNotice = async (req, res) => {
  try {
    const { noticeText } = req.body;
    let noticeDoc = await GeojeTransport.findOne({ date: 'SYSTEM_NOTICE' });
    if (!noticeDoc) {
      noticeDoc = new GeojeTransport({
        date: 'SYSTEM_NOTICE',
        generalNotes: noticeText || ''
      });
    } else {
      noticeDoc.generalNotes = noticeText || '';
    }
    await noticeDoc.save();
    res.json({ success: true, noticeText: noticeDoc.generalNotes, message: '공지사항이 저장되었습니다.' });
  } catch (err) {
    console.error('Error updating notice:', err);
    res.status(500).json({ success: false, message: '공지사항 저장 중 오류가 발생했습니다.' });
  }
};
