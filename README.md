# 아무 말 대잔치 - 커뮤니티 프론트엔드

Spring Boot 백엔드와 연동되는 커뮤니티 프론트엔드 프로젝트입니다.

## 🚀 기술 스택

- **서버**: Express.js 5.x
- **템플릿 엔진**: EJS (Embedded JavaScript)
- **스타일링**: Vanilla CSS (반응형 디자인)
- **JavaScript**: ES6+ (순수 JavaScript, 프레임워크 사용 안 함)

## 📁 프로젝트 구조

```
3-bella-han-comunity-frontend/
├── views/                      # EJS 템플릿 파일
│   ├── partials/              # 공통 컴포넌트 (header, footer, sidebar)
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   └── sidebar.ejs
│   ├── layout.ejs             # 공통 레이아웃
│   ├── index.ejs              # 홈 페이지
│   ├── login.ejs              # 로그인
│   ├── signup.ejs             # 회원가입
│   ├── profile.ejs            # 프로필
│   ├── create-post.ejs        # 게시글 작성
│   ├── edit-post.ejs          # 게시글 수정
│   ├── post-detail.ejs        # 게시글 상세
│   ├── change-password.ejs    # 비밀번호 변경
│   ├── 404.ejs                # 404 에러
│   └── 500.ejs                # 500 에러
├── css/                       # 스타일시트
│   └── style.css
├── js/                        # JavaScript 파일
│   ├── constants.js           # 상수 관리
│   ├── utils.js               # 유틸리티 함수
│   ├── api.js                 # API 호출
│   ├── main.js                # 공통 로직
│   ├── auth.js                # 인증 관련
│   ├── home.js                # 홈 페이지
│   ├── profile.js             # 프로필
│   ├── create-post.js         # 게시글 작성
│   ├── edit-post.js           # 게시글 수정
│   ├── post-detail.js         # 게시글 상세
│   └── change-password.js     # 비밀번호 변경
├── server.js                  # Express 서버 설정
├── package.json               # 의존성 관리
└── README.md

```

## ✨ 주요 기능

### 1. 공통 레이아웃 시스템
- **Header**: 네비게이션 바, 로그인 상태에 따른 메뉴 변경
- **Sidebar**: 카테고리, 인기 게시글, 최근 댓글
- **Footer**: 사이트 정보 및 링크
- **레이아웃 재사용**: EJS 템플릿을 활용한 효율적인 코드 관리

### 2. 사용자 인증
- 회원가입 (이메일, 비밀번호, 닉네임, 프로필 사진)
- 로그인/로그아웃
- 프로필 관리
- 비밀번호 변경

### 3. 게시글 관리
- 게시글 목록 조회 (무한 스크롤)
- 게시글 작성 (이미지 업로드 지원)
- 게시글 상세 조회
- 게시글 수정/삭제

### 4. 반응형 디자인
- 모바일, 태블릿, 데스크톱 대응
- 사이드바 자동 재배치 (모바일에서는 하단으로 이동)

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`env.example` 파일을 참고하여 `.env` 파일을 생성합니다:

```bash
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:8080/api
```

### 3. 개발 서버 실행

```bash
# 개발 모드 (nodemon 사용 - 파일 변경 시 자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

서버가 실행되면 브라우저에서 `http://localhost:5500`로 접속할 수 있습니다.

## 🏗️ Express 서버 구조

### 미들웨어 구성
- **helmet**: 보안 헤더 설정
- **compression**: Gzip 압축
- **morgan**: HTTP 요청 로깅
- **cookie-parser**: 쿠키 파싱
- **express.static**: 정적 파일 서빙

### 라우팅
- `/` - 홈 페이지 (게시글 목록)
- `/login` - 로그인
- `/signup` - 회원가입
- `/profile` - 프로필
- `/change-password` - 비밀번호 변경
- `/create-post` - 게시글 작성
- `/post-detail` - 게시글 상세
- `/edit-post` - 게시글 수정

### 인증 미들웨어
- 쿠키 기반 인증 체크
- 보호된 라우트 자동 리다이렉션

## 📦 의존성

### Production Dependencies
- `express`: 웹 서버 프레임워크
- `ejs`: 템플릿 엔진
- `express-ejs-layouts`: 레이아웃 관리
- `helmet`: 보안 헤더
- `compression`: 응답 압축
- `morgan`: 로깅
- `cookie-parser`: 쿠키 파싱
- `dotenv`: 환경 변수 관리

### Development Dependencies
- `nodemon`: 개발 중 자동 재시작

## 🎨 디자인 시스템

### 색상 팔레트
프로젝트의 색상은 `js/constants.js`에서 중앙 관리됩니다:
- Primary: `#007bff`
- Secondary: `#6c757d`
- Danger: `#dc3545`
- Success: `#28a745`

### 타이포그래피
- 기본 폰트: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`
- 반응형 폰트 크기 적용

### 컴포넌트
- 버튼 (primary, secondary, danger)
- 폼 요소 (input, textarea, file upload)
- 카드 (게시글 아이템)
- 네비게이션 바
- 사이드바

## 🔧 개발 가이드

### 새 페이지 추가하기

1. `views/` 디렉토리에 EJS 파일 생성
2. `server.js`에 라우트 추가
3. 필요한 경우 `js/` 디렉토리에 JavaScript 파일 추가

### 스타일 수정
- `css/style.css`에서 전역 스타일 관리
- 반응형 디자인을 위한 미디어 쿼리 사용

### API 연동
- `js/api.js`에서 API 호출 함수 정의
- `js/constants.js`에서 API URL 관리

## 📝 커밋 규칙

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `docs`: 문서 수정
- `chore`: 빌드 업무, 패키지 매니저 수정 등

## 🚀 배포

### 프로덕션 빌드
```bash
NODE_ENV=production npm start
```

### 환경 변수 설정
프로덕션 환경에서는 반드시 `.env` 파일을 설정하고, 시크릿 키를 변경하세요.

## 📄 라이선스

ISC

## 👥 기여자

- Bella Han ([@cozyrim](https://github.com/cozyrim))

