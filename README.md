# 커뮤니티 프론트엔드

Spring Boot 백엔드와 완벽하게 연동되는 커뮤니티 프론트엔드 프로젝트입니다.

## 🚀 주요 기능

### 인증 & 보안
- ✅ **세션 기반 인증** (JSESSIONID 쿠키)
- ✅ **CSRF 토큰** 자동 처리
- ✅ **Spring Security** 완벽 연동
- ✅ **자동 로그인 상태 유지**

### 사용자 기능
- ✅ 회원가입 (이메일, 비밀번호, 닉네임)
- ✅ 로그인/로그아웃
- ✅ 프로필 조회
- ✅ 사용자 정보 표시

### 게시글 기능
- ✅ 게시글 목록 조회 (무한 스크롤)
- ✅ 게시글 상세 조회
- ✅ 게시글 작성 (이미지 업로드 가능)
- ✅ 게시글 수정/삭제 (작성자만 가능)
- ✅ 이미지 미리보기

## 📁 프로젝트 구조

```
3-bella-han-comunity-frontend/
├── pages/                    # HTML 페이지
│   ├── index.html           # 메인 (게시글 목록)
│   ├── login.html           # 로그인
│   ├── signup.html          # 회원가입
│   ├── profile.html         # 프로필
│   ├── create-post.html     # 게시글 작성
│   ├── post-detail.html     # 게시글 상세
│   └── edit-post.html       # 게시글 수정
├── js/                      # JavaScript 파일
│   ├── api.js              # API 호출 함수 (공통)
│   ├── utils.js            # 유틸리티 함수 (공통)
│   ├── main.js             # 메인 로직 (인증 상태 관리)
│   ├── auth.js             # 로그인/회원가입
│   ├── home.js             # 홈 (게시글 목록)
│   ├── create-post.js      # 게시글 작성
│   ├── post-detail.js      # 게시글 상세
│   ├── edit-post.js        # 게시글 수정
│   └── profile.js          # 프로필
├── css/                    # 스타일시트
│   └── style.css          # 전체 스타일
└── README.md              # 프로젝트 문서 (이 파일)
```

## 🔧 백엔드 API 엔드포인트

### 인증
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/logout` - 로그아웃

### 사용자
- `POST /api/v1/users/signup` - 회원가입
- `GET /api/v1/users/me` - 현재 사용자 정보

### 게시글
- `GET /api/v1/posts` - 게시글 목록
- `GET /api/v1/posts/{id}` - 게시글 상세
- `POST /api/v1/posts` - 게시글 작성 (인증 필요)
- `PATCH /api/v1/posts/{id}` - 게시글 수정 (인증 필요)
- `DELETE /api/v1/posts/{id}` - 게시글 삭제 (인증 필요)

## 💻 사용 방법

### 1. 백엔드 서버 실행

먼저 Spring Boot 백엔드 서버를 실행하세요:

```bash
cd community-backend
./gradlew bootRun
```

백엔드 서버가 `http://localhost:8080`에서 실행됩니다.

### 2. 프론트엔드 실행

#### 방법 1: VS Code Live Server 사용 (권장)

1. VS Code에서 프론트엔드 폴더 열기
2. Live Server 확장 설치
3. `index.html` 우클릭 → "Open with Live Server"
4. 자동으로 `http://localhost:5500`에서 실행됨

#### 방법 2: 간단한 HTTP 서버

```bash
# Python 3
python -m http.server 5500

# Node.js
npx http-server -p 5500
```

### 3. 브라우저에서 접속

```
http://localhost:5500/pages/index.html
```

## 🎯 사용 흐름

### 1. 회원가입
1. "회원가입" 클릭
2. 이메일, 비밀번호, 닉네임 입력
3. "회원가입" 버튼 클릭
4. 자동으로 로그인 페이지로 이동

### 2. 로그인
1. "로그인" 클릭
2. 이메일, 비밀번호 입력
3. "로그인" 버튼 클릭
4. 로그인 성공 시 메인 페이지로 이동
5. **JSESSIONID 쿠키가 자동으로 저장됨**

### 3. 게시글 작성
1. 로그인 후 "글쓰기" 버튼 클릭
2. 제목, 내용 입력
3. 이미지 선택 (선택사항)
4. "작성" 버튼 클릭

### 4. 게시글 조회/수정/삭제
1. 메인 페이지에서 게시글 클릭
2. 게시글 상세 페이지 표시
3. 작성자인 경우 "수정", "삭제" 버튼 표시
4. 수정/삭제 가능

## 🔐 보안 기능

### CSRF 토큰 처리
- 모든 POST/PUT/DELETE/PATCH 요청에 자동으로 CSRF 토큰 포함
- 쿠키에서 `XSRF-TOKEN` 읽어서 `X-XSRF-TOKEN` 헤더로 전송

### 세션 인증
- 로그인 시 `JSESSIONID` 쿠키 자동 저장
- 이후 모든 요청에 쿠키 자동 전송 (`credentials: 'include'`)
- Spring Security가 세션 검증

### XSS 방어
- 모든 사용자 입력 HTML 이스케이프 처리
- `escapeHtml()` 함수로 자동 변환

## 🛠 기술 스택

- **Vanilla JavaScript** (프레임워크 없음)
- **HTML5** & **CSS3**
- **Fetch API** (AJAX 통신)
- **Spring Boot Backend** (세션 기반 인증)

## 📝 API 호출 예시

### 로그인

```javascript
const result = await authAPI.login('user@example.com', '1234');
if (result.success) {
    console.log('로그인 성공:', result.data);
    // { userId: 1, email: '...', nickname: '...' }
}
```

### 게시글 작성

```javascript
const images = document.getElementById('postImages').files;
const result = await postAPI.createPost('제목', '내용', Array.from(images));
if (result.success) {
    console.log('게시글 작성 성공:', result.data);
}
```

### 게시글 목록 조회

```javascript
const result = await postAPI.getPosts(5, null);
if (result.success) {
    const posts = result.data.items;
    const hasNext = result.data.hasNext;
    const nextCursor = result.data.nextCursor;
}
```

## 🐛 문제 해결

### CORS 오류 발생 시
백엔드 `SecurityConfig.java`에서 프론트엔드 URL이 허용되었는지 확인:
```java
config.setAllowedOrigins(List.of(
    "http://localhost:5500",  // Live Server
    "http://127.0.0.1:5500"
));
```

### 세션이 유지되지 않을 때
- 브라우저 쿠키 설정 확인
- `credentials: 'include'` 옵션 확인
- 백엔드 CORS 설정에서 `setAllowCredentials(true)` 확인

### CSRF 토큰 오류 시
- 쿠키에 `XSRF-TOKEN`이 있는지 확인
- POST/PUT/DELETE 요청 시 `X-XSRF-TOKEN` 헤더가 포함되었는지 확인

## 📚 참고 자료

- [Spring Security 세션 인증](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html)
- [CSRF 보호](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)
- [Fetch API](https://developer.mozilla.org/ko/docs/Web/API/Fetch_API)

## ✨ 작성자

- **Bella Han** (3-bella-han-community-frontend)
- Spring Boot Backend 완벽 연동
- 세션 기반 인증 구현
