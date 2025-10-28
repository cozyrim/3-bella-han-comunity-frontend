// server.js - Express 서버 설정
const express = require('express');
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

// body parser
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
// 라우트 정의
// ============================================

// 홈 페이지
app.get('/', (req, res) => {
    res.render('index', {
        title: '홈',
        showSidebar: false,
        additionalJS: '<script src="/js/home.js"></script>'
    });
});

// 로그인 페이지
app.get('/login', (req, res) => {
    if (req.isLoggedIn) {
        return res.redirect('/');
    }
    res.render('login', {
        title: '로그인',
        showSidebar: false,
        additionalJS: '<script src="/js/auth.js"></script>'
    });
});

// 회원가입 페이지
app.get('/signup', (req, res) => {
    if (req.isLoggedIn) {
        return res.redirect('/');
    }
    res.render('signup', {
        title: '회원가입',
        showSidebar: false,
        additionalJS: '<script src="/js/auth.js"></script>'
    });
});

// 프로필 페이지
app.get('/profile', (req, res) => {
    // 프론트엔드에서 인증 체크하도록 변경
    res.render('profile', {
        title: '내 정보',
        showSidebar: false,
        additionalJS: '<script src="/js/profile.js"></script>'
    });
});

// 비밀번호 변경 페이지
app.get('/change-password', (req, res) => {
    // 프론트엔드에서 인증 체크하도록 변경
    res.render('change-password', {
        title: '비밀번호 변경',
        showSidebar: false,
        additionalJS: '<script src="/js/change-password.js"></script>'
    });
});

// 게시글 작성 페이지
app.get('/create-post', (req, res) => {
    // 프론트엔드에서 인증 체크하도록 변경
    // 실제 인증은 백엔드 API에서 처리
    res.render('create-post', {
        title: '게시글 작성',
        showSidebar: false,
        additionalJS: '<script src="/js/create-post.js"></script>'
    });
});

// 게시글 상세 페이지
app.get('/post-detail', (req, res) => {
    res.render('post-detail', {
        title: '게시글 상세',
        showSidebar: false,
        additionalJS: '<script src="/js/post-detail.js"></script>'
    });
});

// 게시글 수정 페이지
app.get('/edit-post', (req, res) => {
    // 프론트엔드에서 인증 체크하도록 변경
    res.render('edit-post', {
        title: '게시글 수정',
        showSidebar: false,
        additionalJS: '<script src="/js/edit-post.js"></script>'
    });
});

// 404 에러 핸들러
app.use((req, res, next) => {
    res.status(404).render('404', {
        title: '페이지를 찾을 수 없습니다',
        showSidebar: false,
        layout: false // 404 페이지는 레이아웃 없이
    });
});

// 500 에러 핸들러
app.use((err, req, res, next) => {
    console.error('서버 오류:', err);
    res.status(500).render('500', {
        title: '서버 오류',
        showSidebar: false,
        layout: false,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
    console.log(`✅ 환경: ${process.env.NODE_ENV || 'development'}`);
});

// 프로세스 종료 시 정리 작업
process.on('SIGINT', () => {
    console.log('\n⚠️  서버를 종료합니다...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⚠️  서버를 종료합니다...');
    process.exit(0);
});
