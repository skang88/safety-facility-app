# 🌊 수난안전시설물 점검 관리 시스템 (Safety Facility App)

수난안전시설물(구명환, 구명조끼, 구명줄, 드로우백 등)의 위치와 상태를 관리하고, 정기 점검 결과를 기록 및 출력할 수 있는 웹 기반 통합 관리 플랫폼입니다.

---

## 🚀 주요 기능

- **📊 대시보드 (Dashboard)**
  - 센터별/장비별 현황 요약 통계 제공
  - 점검 상태(양호/불량/미점검) 모니터링 시각화
- **🗺️ 지도 뷰 (Map View)**
  - Leaflet 지도를 통한 시설물의 정확한 위치 매핑 및 표시
- **📋 시설물 목록 및 관리 (List View)**
  - 안전시설물 목록 조회, 검색 및 필터링 기능
  - 개별 시설물의 상세 정보 관리 및 신규 점검 이력 등록
- **🖨️ 보고서 출력 기능 (Report View)**
  - 각 시설물에 대한 상세 정보(위치, 지도, 사진, 장비 상태, 특이사항)를 A4 용지 포맷의 깔끔한 인쇄 화면으로 출력
  - **A4 한 장 완벽 최적화**: 레이아웃 컴팩트 조정을 통해 모든 데이터가 1페이지 내에 딱 맞춰 인쇄/PDF 저장되도록 개선 완료

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
- **Framework / Build Tool:** React (v18), Vite
- **Styling:** Tailwind CSS, PostCSS, Lucide React (아이콘)
- **Map:** Leaflet, React Leaflet (지도 매핑)
- **HTTP Client:** Axios
- **Routing:** React Router DOM (v6)

### Backend
- **Runtime / Framework:** Node.js, Express
- **Database:** MongoDB (Mongoose ODM)
- **File Upload:** Multer (사진 업로드)
- **Image Processing:** Sharp (이미지 리사이징/최적화)
- **Excel Parser:** xlsx (안전시설물 엑셀 데이터 파싱 및 임포트)

### Devops & Environments
- **Containerization:** Docker, Docker Compose
- **CI/CD:** Jenkins (`Jenkinsfile` 설정 포함)

---

## 📂 프로젝트 구조 (Directory Structure)

```text
safety-facility-app/
├── backend/               # Express 백엔드 API 서버
│   ├── controllers/      # 비즈니스 로직 컨트롤러
│   ├── models/           # Mongoose 데이터베이스 스키마 정의
│   ├── routes/           # API 엔드포인트 라우팅
│   ├── scripts/          # 데이터 가공 및 임포트 스크립트
│   ├── server.js         # 백엔드 진입점 파일
│   └── package.json
│
├── frontend/              # React 프론트엔드 앱
│   ├── src/
│   │   ├── components/   # 모달 및 공통 컴포넌트
│   │   ├── pages/        # 주요 화면 구성 (Dashboard, MapView, ListView, ReportView)
│   │   ├── App.jsx       # 라우터 및 메인 레이아웃
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── docker-compose.yml     # 멀티 컨테이너 환경 설정 파일
└── Jenkinsfile            # Jenkins 배포 파이프라인 구성 파일
```

---

## 💻 로컬 개발 환경 실행 방법

### 1. Docker Compose를 통한 원클릭 실행 (권장)
프로젝트 루트 디렉토리에서 아래 명령어를 실행하면 MongoDB, Express 백엔드, React 프론트엔드가 모두 구성 및 연동되어 실행됩니다.

```bash
docker-compose up --build
```
- **프론트엔드 접속 주소:** `http://localhost` (Nginx 프록시를 통해 백엔드 연동)
- **백엔드 API 주소:** `http://localhost:5050`
- **MongoDB 주소:** `mongodb://localhost:27017`

---

### 2. 개별 서비스를 수동으로 실행할 경우

#### 데이터베이스 실행
로컬 컴퓨터에 MongoDB가 구동 중이어야 합니다. 기본 포트는 `27017`입니다.

#### 백엔드 (Backend)
1. `backend` 폴더로 이동합니다.
2. 의존성 패키지를 설치합니다.
   ```bash
   cd backend
   npm install
   ```
3. (선택사항) 초기 데이터를 데이터베이스에 입력(시딩)하거나 엑셀 파일로부터 시설물 정보를 가져옵니다.
   ```bash
   # 시드 데이터 삽입
   node seed.js
   
   # 또는 엑셀 데이터 임포트 실행
   npm run import-data
   ```
4. 백엔드 개발 서버를 구동합니다.
   ```bash
   npm run dev
   ```

#### 프론트엔드 (Frontend)
1. `frontend` 폴더로 이동합니다.
2. 의존성 패키지를 설치합니다.
   ```bash
   cd frontend
   npm install
   ```
3. 프론트엔드 개발 서버를 구동합니다.
   ```bash
   npm run dev
   ```
4. 터미널에 나타나는 로컬 개발 주소(예: `http://localhost:5173`)로 접속합니다.

---

## 📝 최근 수정 사항

- **A4 보고서 인쇄 레이아웃 개선**:
  - `ReportView.jsx` 파일에서 보고서 출력 시 특정 상황(특이사항 항목 존재 등)에 따라 2페이지로 나뉘던 문제를 수정했습니다.
  - 지도 영역 높이 조정 (`h-48` -> `h-44`), 이미지 영역 높이 조정 (`h-64` -> `h-56`), 각 컴포넌트 마진 조절 및 특이사항 최소 높이 조정(`min-h-[100px]` -> `min-h-[80px]`)을 적용하여 **한 페이지(A4 1장) 내에 모든 정보가 여유 있게 들어오도록 완벽히 조정**했습니다.
