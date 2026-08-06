const mongoose = require('mongoose');

const fireWaterSchema = new mongoose.Schema({
  serialNumber: { type: String }, // 일련번호/관리번호
  masterId: { type: String, default: '' }, // MASTER_ID (e.g. UYR-0001)
  name: { type: String, required: true }, // 용수명
  type: { 
    type: String, 
    required: true, 
    enum: ['지상소화전', '지하소화전', '급수탑', '저수조', '비상소화장치'] 
  }, // 구분
  legalType: { type: String, enum: ['법정', '비법정'], default: '법정' }, // 법정구분
  hydId: { type: String, default: '' }, // HYD_ID
  fireStation: { type: String, default: '의령소방서' }, // 소방서
  region: { 
    type: String, 
    required: true, 
    enum: ['의령', '부림', '정곡'] 
  }, // 관서 (안전센터)
  subUnit: { type: String, default: '' }, // 지역대
  city: { type: String, default: '의령군' }, // 시군구
  town: { type: String, default: '' }, // 읍면동
  village: { type: String, default: '' }, // 리
  address: { type: String, required: true }, // 위치(주소)
  nearbyBuilding: { type: String, default: '' }, // 주변대상물
  nearbyDistance: { type: Number, default: 0 }, // 주변대상물거리(m)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  diameter: { type: String, default: '' }, // 구경 (mm)
  waterPressure: { type: String, default: '' }, // 수압 (Mpa)
  signBoard: { type: String, default: '×' }, // 표지판설치 (○/×)
  protectiveFrame: { type: String, default: '×' }, // 보호틀설치 (○/×)
  installDate: { type: String, default: '' }, // 설치년도/일자
  installer: { type: String, default: '시군' }, // 설치자
  inspector: { type: String, default: '소방서' }, // 점검자
  manager: { type: String, default: '시군' }, // 유지관리주체

  // Data Audit & Matching
  matchingStatus: { type: String, default: '자동매칭' }, // 매칭상태 (자동매칭/수동매칭/검수필요)
  matchingReason: { type: String, default: '관리번호 완전일치' }, // 매칭근거
  auditResult: { type: String, default: '정상' }, // 검수결과 (정상/좌표오차/수압미흡/정보누락 등)
  needsAudit: { type: String, default: 'N' }, // 검수필요 (Y/N)

  // Defect log summary
  defectCount: { type: Number, default: 0 }, // 누적 불량이력 건수
  defects: [{
    defectDetail: String, // 불량사항
    checkDate: String,   // 조사일시
    actionDate: String,  // 승인/조치일시
    status: { type: String, default: '조치완료' }, // 처리상태 (미조치/조치중/조치완료)
    remarks: String      // 비고
  }],

  details: { type: String, default: '' } // 기타상세/비고
}, { timestamps: true });

fireWaterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('FireWater', fireWaterSchema);

