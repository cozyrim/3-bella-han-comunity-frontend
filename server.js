// server.js - Express 서버 설정
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// 보안 설정
app.use(helmet({
    contentSecurityPolicy: false, // CSP는 추후 설정
}));

// 압축 미들웨어
app.use(compression());

// 로깅 미들웨어
app.use(morgan('dev'));

// 쿠키 파서
app.use(cookieParser());

// API 프록시: /api -> 백엔드 (8080)
// 주의: body parser 전에 등록해야 POST body를 백엔드로 전달 가능
app.use('/api', createProxyMiddleware({
    target: 'http://127.0.0.1:8080',
    changeOrigin: true,
    timeout: 60000,
    proxyTimeout: 60000,
    pathRewrite: (path) => path.startsWith('/api/') ? path : '/api' + path,
    cookieDomainRewrite: 'localhost',
    cookiePathRewrite: '/',
    onError: (err, req, res) => {
        console.error(`[프록시 에러] ${req.method} ${req.path} - ${err.message}`);
        res.status(500).json({ error: '백엔드 서버 오류', message: err.message });
    }
}));

// 파일 프록시
app.use('/files', createProxyMiddleware({
    target: 'http://127.0.0.1:8080',
    changeOrigin: true,
    timeout: 60000
}));

// body parser (프록시 이후 등록 - 프록시 경로는 제외)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
    res.render('login', { title: '로그인', showSidebar: false, additionalJS: '<script src="/js/auth.js"></script>' });
});

app.get('/signup', (req, res) => {
    res.render('signup', { title: '회원가입', showSidebar: false, additionalJS: '<script src="/js/auth.js"></script>' });
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
