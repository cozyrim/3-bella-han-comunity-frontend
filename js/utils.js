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
