// constants.js - 프로젝트 전역 상수 관리

// API 설정 (Express 프록시 사용)
const API_CONFIG = {
    BASE_URL: '/api/v1',  // Express 서버의 프록시 경로 사용
    TIMEOUT: 30000,
    RETRY_COUNT: 3
};

// 색상 테마
const COLORS = {
    primary: '#007bff',
    primaryHover: '#0056b3',
    secondary: '#6c757d',
    secondaryHover: '#545b62',
    danger: '#dc3545',
    dangerHover: '#c82333',
    success: '#28a745',
    info: '#17a2b8',
    warning: '#ffc107',
    light: '#f8f9fa',
    dark: '#333',
    white: '#fff',
    border: '#ddd',
    text: '#333',
    textLight: '#666',
    background: '#f8f9fa'
};

// 페이지 경로
const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    PROFILE: '/profile',
    CREATE_POST: '/create-post',
    EDIT_POST: '/edit-post',
    POST_DETAIL: '/post-detail',
    CHANGE_PASSWORD: '/change-password'
};

// 메시지
const MESSAGES = {
    ERROR: {
        NETWORK: '네트워크 오류가 발생했습니다.',
        UNAUTHORIZED: '로그인이 필요합니다.',
        FORBIDDEN: '권한이 없습니다.',
        NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
        SERVER: '서버 오류가 발생했습니다.',
        UNKNOWN: '알 수 없는 오류가 발생했습니다.'
    },
    SUCCESS: {
        LOGIN: '로그인되었습니다.',
        LOGOUT: '로그아웃되었습니다.',
        SIGNUP: '회원가입이 완료되었습니다.',
        POST_CREATED: '게시글이 작성되었습니다.',
        POST_UPDATED: '게시글이 수정되었습니다.',
        POST_DELETED: '게시글이 삭제되었습니다.',
        PASSWORD_CHANGED: '비밀번호가 변경되었습니다.',
        PROFILE_UPDATED: '프로필이 수정되었습니다.'
    },
    CONFIRM: {
        LOGOUT: '로그아웃 하시겠습니까?',
        DELETE_POST: '게시글을 삭제하시겠습니까?',
        DELETE_ACCOUNT: '정말로 회원탈퇴 하시겠습니까?'
    }
};

// 유효성 검사 정규식
const VALIDATION = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    NICKNAME: /^[가-힣a-zA-Z0-9]{2,10}$/
};

// 로컬 스토리지 키
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_INFO: 'userInfo'
};

// 페이지네이션 설정
const PAGINATION = {
    DEFAULT_PAGE: 0,
    DEFAULT_SIZE: 10,
    MAX_SIZE: 100
};

// 파일 업로드 설정
const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
};

// 브라우저 환경에서만 exports 사용
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        COLORS,
        ROUTES,
        MESSAGES,
        VALIDATION,
        STORAGE_KEYS,
        PAGINATION,
        FILE_UPLOAD
    };
}

