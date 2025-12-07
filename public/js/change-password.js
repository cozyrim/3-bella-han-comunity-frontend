// API_BASE_URL은 main.js에서 선언됨

// 페이지 로드 시 인증 체크
document.addEventListener('DOMContentLoaded', function() {
    checkAuthForPasswordChange();
});

// 비밀번호 변경 페이지 인증 확인
async function checkAuthForPasswordChange() {
    try {
        // 로그인 여부 확인: JWT 토큰을 포함해서 현재 사용자 조회
        const baseUrl = window.CONFIG?.API_BASE_URL || (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '/api/v1');
        const token = sessionStorage.getItem('accessToken');

        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${baseUrl}/users/me`, {
            method: 'GET',
            credentials: 'include',
            headers
        });
        
        if (!response.ok) {
            showAlert('로그인이 필요합니다.', 'error');
            location.href = '/login';
        }
    } catch (error) {
        console.error('인증 확인 오류:', error);
        showAlert('인증 확인 중 오류가 발생했습니다.', 'error');
        location.href = '/login';
    }
}

// 비밀번호 변경 처리
document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    // 유효성 검사
    if (!currentPassword || currentPassword.trim() === '') {
        showAlert('현재 비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    if (!newPassword || newPassword.trim() === '') {
        showAlert('새 비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showAlert('비밀번호는 8자 이상이어야 합니다.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('새 비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (currentPassword === newPassword) {
        showAlert('새 비밀번호는 현재 비밀번호와 달라야 합니다.', 'error');
        return;
    }
    
    try {
        const baseUrl = window.CONFIG?.API_BASE_URL || (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '/api/v1');
        const response = await fetch(`${baseUrl}/users/me/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
            },
            credentials: 'include',
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const json = await response.json();
        
        if (response.ok && json.code === 'SUCCESS') {
            showAlert('비밀번호가 변경되었습니다. 홈 화면으로 이동합니다.', 'success');
            // 비밀번호 변경 후 로그아웃 처리
            sessionStorage.clear();
            setTimeout(() => {
                location.href = '/';
            }, 1500);
        } else {
            showAlert(json.message || '비밀번호 변경에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        showAlert('비밀번호 변경 중 오류가 발생했습니다.', 'error');
    }
});
