const dotenv = require('dotenv');
const path = require('path');
const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.local';
dotenv.config({ path: path.join(__dirname, envFile) });
console.log(`ENV Loaded: ${envFile}`);
console.log('API_BASE_URL =', process.env.API_BASE_URL);


// server.js - Express 서버 설정
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// 백엔드 API 서버(프록시 타깃)는 서버용 ENV로만 사용
const API_PROXY_TARGET = process.env.API_BASE_URL; // 예: http://backend:8080
const STATIC_URL = process.env.STATIC_URL;
const LAMBDA_UPLOAD_URL = process.env.LAMBDA_UPLOAD_URL;


// EJS 전역으로 환경 변수 전달 (클라이언트용 값만 노출)
// - API_BASE_URL: 브라우저에서 호출할 프록시 경로 (/api/v1)
// - STATIC_URL: S3 퍼블릭 URL (이미지 베이스 경로)
app.locals.ENV = {
  API_BASE_URL: '/api/v1',
  STATIC_URL,
  LAMBDA_UPLOAD_URL,
  MODE: process.env.NODE_ENV,
};

// --- EJS 렌더링 전 주입
app.use((req, res, next) => {
  res.locals.__ENV__ = app.locals.ENV;
  next();
});

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// 보안 설정
app.use(helmet({
    contentSecurityPolicy: false,
}));

// 압축 미들웨어
app.use(compression());

// 로깅 미들웨어
app.use(morgan('dev'));

// 쿠키 파서
app.use(cookieParser());


// API 프록시: /api -> 백엔드 (8080)
// body parser 전에 등록해야 POST body를 백엔드로 전달 가능
app.use('/api', createProxyMiddleware({
  target: API_PROXY_TARGET,
  changeOrigin: true,
  xfwd: true,
  timeout: 60000,
  proxyTimeout: 60000,
  pathRewrite: (path) => path,  // 경로 그대로 전달 (/api/v1/posts → /api/v1/posts)
  cookieDomainRewrite: 'localhost',
  cookiePathRewrite: '/',
  logLevel: 'debug',
  onProxyReq(proxyReq, req) {
    console.log('[PROXY→]', req.method, req.originalUrl);
  },
  onProxyRes(proxyRes, req) {
    console.log('[PROXY←]', req.method, req.originalUrl, '→', proxyRes.statusCode);
  },
  onError(err, req, res) {
    console.error('[PROXY ERR]', req.method, req.originalUrl, '-', err.message);
    res.status(500).json({ success:false, code:'E500', message:'프록시 에러', detail: err.message });
  }
}));


// 파일 프록시 (/files → 백엔드 파일 엔드포인트)
// 현재 백엔드는 필요 시 S3 URL을 직접 내려주지만,
// 과거 로컬 업로드 파일(/files/...)을 위해 프록시를 유지한다.
app.use('/files', createProxyMiddleware({
  target: API_PROXY_TARGET,
  changeOrigin: true,
  timeout: 60000,
}));

// Lambda 업로드 프록시 (/api/upload → Lambda 함수)
// CORS 문제 해결을 위해 Express 서버를 통해 프록시
app.use('/api/upload', createProxyMiddleware({
  target: process.env.LAMBDA_UPLOAD_URL || 'https://yw8frb7w1l.execute-api.ap-northeast-2.amazonaws.com/prod',
  changeOrigin: true,
  pathRewrite: { '^/api/upload': '/upload' },
  timeout: 60000,
  proxyTimeout: 60000,
  onProxyReq(proxyReq, req) {
    console.log('[LAMBDA PROXY→]', req.method, req.originalUrl);
  },
  onProxyRes(proxyRes, req) {
    // CORS 헤더 추가
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
    console.log('[LAMBDA PROXY←]', req.method, req.originalUrl, '→', proxyRes.statusCode);
  },
  onError(err, req, res) {
    console.error('[LAMBDA PROXY ERR]', req.method, req.originalUrl, '-', err.message);
    res.status(500).json({ success: false, message: 'Lambda 업로드 오류', detail: err.message });
  }
}));

// body parser (프록시 이후 등록 - 프록시 경로는 제외)
// 이미지 업로드를 위해 크기 제한 증가 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 레이아웃 미들웨어
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// 인증 상태 확인 미들웨어
const checkAuth = (req, res, next) => {
    // 쿠키에서 JSESSIONID 확인 (Spring Boot 세션)
    const sessionId = req.cookies.JSESSIONID;
    // 또는 accessToken 확인
    const accessToken = req.cookies.accessToken;
    
    // 둘 중 하나라도 있으면 로그인 상태로 간주
    req.isLoggedIn = !!(sessionId || accessToken);
    next();
};

app.use(checkAuth);

// 공통 데이터 설정 미들웨어
app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.isLoggedIn = req.isLoggedIn;
    next();
});



// ============================================
// 라우트
app.get('/', (req, res) => {
    res.render('index', { title: '홈', showSidebar: false, additionalJS: '<script src="/js/home.js"></script>' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: '로그인', showSidebar: false, additionalJS: '<script type="module" src="/js/auth.js"></script>' });
});

app.get('/signup', (req, res) => {
    res.render('signup', { title: '회원가입', showSidebar: false, additionalJS: '<script type="module" src="/js/auth.js"></script>' });
});

app.get('/profile', (req, res) => {
    res.render('profile', { title: '내 정보', showSidebar: false, additionalJS: '<script src="/js/profile.js"></script>' });
});

app.get('/change-password', (req, res) => {
    res.render('change-password', { title: '비밀번호 변경', showSidebar: false, additionalJS: '<script src="/js/change-password.js"></script>' });
});

app.get('/create-post', (req, res) => {
    res.render('create-post', { title: '게시글 작성', showSidebar: false, additionalJS: '<script src="/js/create-post.js"></script>' });
});

app.get('/post-detail', (req, res) => {
    res.render('post-detail', { title: '게시글 상세', showSidebar: false, additionalJS: '<script src="/js/post-detail.js"></script>' });
});

app.get('/edit-post', (req, res) => {
    res.render('edit-post', { title: '게시글 수정', showSidebar: false, additionalJS: '<script src="/js/edit-post.js"></script>' });
});

// 에러 핸들러
app.use((req, res, next) => {
    res.status(404).render('404', { title: '404', showSidebar: false, layout: false });
});

app.use((err, req, res, next) => {
    console.error('[서버 오류]', err.message);
    res.status(500).render('500', { title: '500', showSidebar: false, layout: false });
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`✅ 서버 실행: http://localhost:${PORT}`);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
