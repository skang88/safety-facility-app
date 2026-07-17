const xlsx = require('xlsx');

/**
 * Parse Fire Water Excel file buffer into structured objects
 * @param {Buffer} fileBuffer - Excel file buffer
 * @returns {Array<Object>} - Parsed and normalized fire water targets
 */
function parseFireWaterExcel(fileBuffer) {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  if (rows.length === 0) {
    throw new Error('The Excel file is empty');
  }

  let headerRowIndex = -1;
  const colIndices = {
    serialNumber: -1,
    name: -1,
    type: -1,
    region: -1,
    address: -1,
    longitude: -1,
    latitude: -1,
    diameter: -1,
    installDate: -1,
    details: -1
  };

  // Find header row in first 15 rows
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    if (!row) continue;
    
    let matchCount = 0;
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim().toLowerCase();
      if (val.includes('주소') || val.includes('위치') || val.includes('경도') || val.includes('위도') || val.includes('명칭') || val.includes('용수명') || val.includes('구분') || val.includes('시설명')) {
        matchCount++;
      }
    }
    
    if (matchCount >= 2) {
      headerRowIndex = r;
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim().toLowerCase();
        if (val.includes('번호') || val.includes('연번') || val.includes('id')) colIndices.serialNumber = c;
        else if (val.includes('용수명') || val.includes('명칭') || val.includes('시설명') || val.includes('이름')) colIndices.name = c;
        else if (val.includes('구분') || val.includes('종류') || val.includes('분류')) colIndices.type = c;
        else if (val.includes('관서') || val.includes('센터') || val.includes('안전센터') || val.includes('부서')) colIndices.region = c;
        else if (val.includes('주소') || val.includes('위치') || val.includes('소재지')) colIndices.address = c;
        else if (val.includes('경도') || val === 'x') colIndices.longitude = c;
        else if (val.includes('위도') || val === 'y') colIndices.latitude = c;
        else if (val.includes('구경')) colIndices.diameter = c;
        else if (val.includes('설치') || val.includes('일자') || val.includes('일시')) colIndices.installDate = c;
        else if (val.includes('비고') || val.includes('상세') || val.includes('기타')) colIndices.details = c;
      }
      break;
    }
  }

  // Default column mapping if no clear headers found
  if (headerRowIndex === -1 && rows.length > 0) {
    headerRowIndex = 0;
    const firstRow = rows[0];
    for (let c = 0; c < firstRow.length; c++) {
      const val = String(firstRow[c] || '').trim().toLowerCase();
      if (val.includes('번호') || val.includes('연번')) colIndices.serialNumber = c;
      else if (val.includes('용수명') || val.includes('명칭') || val.includes('시설명') || val.includes('이름')) colIndices.name = c;
      else if (val.includes('구분') || val.includes('종류')) colIndices.type = c;
      else if (val.includes('관서') || val.includes('센터') || val.includes('부서')) colIndices.region = c;
      else if (val.includes('주소') || val.includes('위치') || val.includes('소재지')) colIndices.address = c;
      else if (val.includes('경도') || val === 'x') colIndices.longitude = c;
      else if (val.includes('위도') || val === 'y') colIndices.latitude = c;
      else if (val.includes('구경')) colIndices.diameter = c;
      else if (val.includes('설치') || val.includes('일자')) colIndices.installDate = c;
      else if (val.includes('비고') || val.includes('상세')) colIndices.details = c;
    }
  }

  const parsedData = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const nameVal = colIndices.name !== -1 ? String(row[colIndices.name] || '').trim() : '';
    if (!nameVal) continue; // Skip if no name
    
    const serialVal = colIndices.serialNumber !== -1 ? String(row[colIndices.serialNumber] || '').trim() : '';
    const typeRaw = colIndices.type !== -1 ? String(row[colIndices.type] || '').trim() : '';
    let typeVal = '지상소화전';
    if (typeRaw.includes('지하')) typeVal = '지하소화전';
    else if (typeRaw.includes('지상')) typeVal = '지상소화전';
    else if (typeRaw.includes('급수')) typeVal = '급수탑';
    else if (typeRaw.includes('저수')) typeVal = '저수조';
    else if (typeRaw.includes('비상')) typeVal = '비상소화장치';

    const regionRaw = colIndices.region !== -1 ? String(row[colIndices.region] || '').trim() : '';
    let regionVal = '의령';
    if (regionRaw.includes('부림')) regionVal = '부림';
    else if (regionRaw.includes('정곡')) regionVal = '정곡';
    
    const addressVal = colIndices.address !== -1 ? String(row[colIndices.address] || '').trim() : nameVal;
    
    let lonVal = colIndices.longitude !== -1 ? parseFloat(row[colIndices.longitude]) : 0;
    let latVal = colIndices.latitude !== -1 ? parseFloat(row[colIndices.latitude]) : 0;
    
    if (isNaN(lonVal) || isNaN(latVal) || lonVal === 0 || latVal === 0) {
      lonVal = 128.2570;
      latVal = 35.3168;
    }
    
    const diameterVal = colIndices.diameter !== -1 ? String(row[colIndices.diameter] || '').trim() : '';
    const installDateVal = colIndices.installDate !== -1 ? String(row[colIndices.installDate] || '').trim() : '';
    const detailsVal = colIndices.details !== -1 ? String(row[colIndices.details] || '').trim() : '';

    parsedData.push({
      serialNumber: serialVal,
      name: nameVal,
      type: typeVal,
      region: regionVal,
      address: addressVal,
      coordinates: [lonVal, latVal],
      diameter: diameterVal,
      installDate: installDateVal,
      details: detailsVal
    });
  }

  return parsedData;
}

/**
 * Generate Excel file buffer for fire water target list
 * @param {Array<Object>} list - Array of fire water targets
 * @returns {Buffer} - Excel file buffer
 */
function generateFireWaterExcel(list) {
  const excelRows = list.map(item => ({
    '일련번호/관리번호': item.serialNumber || '',
    '소방용수구분': item.type,
    '용수명/명칭': item.name,
    '관서/안전센터': item.region + '119안전센터',
    '소재지/주소': item.address,
    '경도(X)': item.location?.coordinates?.[0] ?? '',
    '위도(Y)': item.location?.coordinates?.[1] ?? '',
    '구경(mm)': item.diameter || '',
    '설치일자': item.installDate || '',
    '기타상세/비고': item.details || ''
  }));

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(excelRows);
  xlsx.utils.book_append_sheet(wb, ws, "소방용수 대상물 목록");
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generate Excel file buffer for fire water inspection results
 * @param {Array<Object>} list - Array of fire water targets
 * @param {Object} inspectionMap - Map of fireWater ID to latest inspection object
 * @param {string} currentQuarter - Current quarter string
 * @returns {Buffer} - Excel file buffer
 */
function generateFireWaterResultsExcel(list, inspectionMap, currentQuarter) {
  const excelRows = list.map(item => {
    const latestInspection = inspectionMap[item._id.toString()] || null;
    const isInspected = latestInspection ? latestInspection.quarter === currentQuarter : false;
    const insp = isInspected ? latestInspection : null;

    return {
      '일련번호/관리번호': item.serialNumber || '',
      '소방용수구분': item.type,
      '용수명/명칭': item.name,
      '관서/안전센터': item.region + '119안전센터',
      '소재지/주소': item.address,
      '경도(X)': item.location?.coordinates?.[0] ?? '',
      '위도(Y)': item.location?.coordinates?.[1] ?? '',
      '구경(mm)': item.diameter || '',
      '설치일자': item.installDate || '',
      '점검여부': isInspected ? '점검완료' : '미점검',
      '점검일시': insp ? new Date(insp.createdAt).toLocaleDateString() : '',
      '점검자': insp ? `${insp.affiliation} ${insp.inspectorName}` : '',
      '몸체외관상태': insp ? insp.itemsStatus?.bodyStatus || '' : '',
      '표지판상태': insp ? insp.itemsStatus?.signStatus || '' : '',
      '밸브작동상태': insp ? insp.itemsStatus?.valveStatus || '' : '',
      '수압방수상태': insp ? insp.itemsStatus?.waterStatus || '' : '',
      '특이사항': insp ? insp.notes || '특이사항 없음' : ''
    };
  });

  // Sort by region, then inspection status, then name
  excelRows.sort((a, b) => {
    if (a['관서/안전센터'] !== b['관서/안전센터']) {
      return a['관서/안전센터'].localeCompare(b['관서/안전센터']);
    }
    if (a['점검여부'] !== b['점검여부']) {
      return b['점검여부'].localeCompare(a['점검여부']); // '완료' first
    }
    return a['용수명/명칭'].localeCompare(b['용수명/명칭'], 'ko', { numeric: true });
  });

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(excelRows);
  xlsx.utils.book_append_sheet(wb, ws, "소방용수 점검 결과");
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  parseFireWaterExcel,
  generateFireWaterExcel,
  generateFireWaterResultsExcel
};
