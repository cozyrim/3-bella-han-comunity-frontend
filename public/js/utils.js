const DEFAULT_AVATAR_URL = 'https://community-image-bucket-1116.s3.ap-northeast-2.amazonaws.com/avatar-default.png';

// ==== 전역 환경 설정 ==== //
window.CONFIG = {
  API_BASE_URL: 'http://community-elb-243542493.ap-northeast-2.elb.amazonaws.com/api/v1',
  LAMBDA_UPLOAD_URL: 'https://yw8frb7w1l.execute-api.ap-northeast-2.amazonaws.com/prod/upload'
};


// 알림 메시지 표시
function showAlert(message, type = 'info') {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    const mainContent = document.querySelector('.main-content') || document.body;
    mainContent.insertBefore(alert, mainContent.firstChild);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 3000);
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 날짜 간단 포맷
function formatDateSimple(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
}

// 파일 유효성 검사
function validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            message: '이미지 파일만 업로드 가능합니다. (JPG, PNG, GIF, WebP)'
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            message: '파일 크기는 10MB를 초과할 수 없습니다.'
        };
    }

    return { valid: true };
}

// 여러 파일 유효성 검사
function validateImageFiles(files) {
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
        const result = validateImageFile(files[i]);
        if (!result.valid) {
            errors.push(`${files[i].name}: ${result.message}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// 이미지 미리보기 생성
function createImagePreview(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        
        reader.onerror = () => {
            reject(new Error('파일 읽기 실패'));
        };
        
        reader.readAsDataURL(file);
    });
}

// 쿼리 파라미터 파싱
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// 쿼리 파라미터 설정
function setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

// 이메일 유효성 검사
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 비밀번호 유효성 검사
function validatePassword(password) {
    const minLength = 4;  // 최소 길이를 4자로 완화
    const maxLength = 20;
    
    if (password.length < minLength) {
        return { valid: false, message: '비밀번호는 4자 이상이어야 합니다.' };
    }
    
    if (password.length > maxLength) {
        return { valid: false, message: '비밀번호는 20자 이하여야 합니다.' };
    }
    
    // 기본적인 비밀번호 검사 (너무 엄격하지 않게)
    if (password.length < 6) {
        return { valid: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' };
    }
    
    return { valid: true };
}

// 닉네임 유효성 검사
function validateNickname(nickname) {
    if (nickname.length < 2) {
        return { valid: false, message: '닉네임은 2자 이상이어야 합니다.' };
    }
    
    if (nickname.length > 10) {
        return { valid: false, message: '닉네임은 10자 이하여야 합니다.' };
    }
    
    if (nickname.includes(' ')) {
        return { valid: false, message: '띄어쓰기는 사용할 수 없습니다.' };
    }
    
    return { valid: true };
}

// 비밀번호 확인 검사
function validatePasswordConfirm(password, passwordConfirm) {
    if (password !== passwordConfirm) {
        return { valid: false, message: '비밀번호가 일치하지 않습니다.' };
    }
    
    return { valid: true };
}

// 폼 그룹 상태 업데이트
function updateFormGroupState(elementId, isValid, message) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const formGroup = element.closest('.form-group');
    
    // helper 요소 ID 계산
    // signupEmail -> emailHelper
    // signupPassword -> passwordHelper
    // signupPasswordConfirm -> passwordConfirmHelper
    // signupNickname -> nicknameHelper
    const helperElementId = elementId.replace('signup', '').charAt(0).toLowerCase() + 
                           elementId.replace('signup', '').slice(1) + 'Helper';
    const helperElement = document.getElementById(helperElementId);
    
    if (formGroup) {
        formGroup.classList.remove('error', 'success');
        
        if (isValid === false) {
            formGroup.classList.add('error');
        } else if (isValid === true) {
            formGroup.classList.add('success');
        }
    }
    
    if (helperElement && message) {
        helperElement.textContent = message;
    }
}

function getCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : '';
}

function getCsrfHeaders() {
    const token = getCookie('XSRF-TOKEN');
    return token ? { 'X-XSRF-TOKEN': token } : {};
}

function formatCount(n) {
    const v = Number(n ?? 0);
    return Number.isFinite(v) ? v.toLocaleString() : '0';
}

// (선택) 자주 쓰는 유틸도 같이
function escapeHtml(str = '') {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getQueryParam(key) {
    return new URLSearchParams(location.search).get(key);
}

function pad2(n){ return n.toString().padStart(2, '0'); }

function formatDateTime(isoOrMs){
  const d = new Date(isoOrMs);
  const yyyy = d.getFullYear();
  const mm   = pad2(d.getMonth()+1);
  const dd   = pad2(d.getDate());
  const hh   = pad2(d.getHours());
  const mi   = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  // 필요하면 초까지: const ss = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function resolveAvatarUrl(url) {
  if (!url || typeof url !== 'string') {
    return DEFAULT_AVATAR_URL;
  }
  // localhost URL이면 S3 기본 이미지로 변환 (배포 환경에서 localhost 접근 불가)
  if (url.includes('localhost:8080') || url.includes('127.0.0.1:8080')) {
    return DEFAULT_AVATAR_URL;
  }
  return url;
}
// 네비게이션 아바타/닉네임 갱신 (세션 기반)
function updateNavigation() {
  try {
    const raw = sessionStorage.getItem('currentUser');
    const user = raw ? JSON.parse(raw) : null;

    const avatar = document.getElementById('navAvatar');
    if (avatar) {
      const url = resolveAvatarUrl(user?.profileImageUrl || user?.userProfileUrl); // ← 키 통일!
      avatar.src = url;
      avatar.onerror = () => { avatar.src = DEFAULT_AVATAR_URL; };
    }

    const nameEl = document.getElementById('navNickname');
    if (nameEl) nameEl.textContent = user?.nickname ?? '';
  } catch (_) {}
}

/* === 전역으로 내보낼 것들 한 번만 등록 === */
window.showAlert         = showAlert;
window.escapeHtml        = escapeHtml;
window.formatDate        = formatDate;        // (utils에 중복 정의 있으면 하나만 남겨둬)
window.formatDateTime    = formatDateTime;
window.getQueryParam     = getQueryParam;     // (중복 정의 1개만 유지)
window.formatCount       = formatCount;
window.getCookie         = getCookie;
window.getCsrfHeaders    = getCsrfHeaders;

window.resolveAvatarUrl  = resolveAvatarUrl;
window.updateNavigation  = updateNavigation;
window.DEFAULT_AVATAR_URL = DEFAULT_AVATAR_URL;