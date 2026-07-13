const xlsx = require('xlsx');
const path = require('path');

const file1 = path.join(__dirname, '../../산악안전시설물 관리 현황(간이구급함).csv');
const file2 = path.join(__dirname, '../../산악안전시설물 관리 현황(산악위치표지판).csv');

console.log('--- File 1: 간이구급함 (Array) ---');
try {
  const wb1 = xlsx.readFile(file1);
  const sheet1 = wb1.Sheets[wb1.SheetNames[0]];
  const data1 = xlsx.utils.sheet_to_json(sheet1, { header: 1 });
  console.log('Headers:', data1[0]);
  console.log('Row 1:', data1[1]);
  console.log('Row 2:', data1[2]);
} catch (e) {
  console.error('Error reading File 1:', e);
}

console.log('\n--- File 2: 산악위치표지판 (Array) ---');
try {
  const wb2 = xlsx.readFile(file2);
  const sheet2 = wb2.Sheets[wb2.SheetNames[0]];
  const data2 = xlsx.utils.sheet_to_json(sheet2, { header: 1 });
  console.log('Headers:', data2[0]);
  console.log('Row 1:', data2[1]);
  console.log('Row 2:', data2[2]);
} catch (e) {
  console.error('Error reading File 2:', e);
}
