// API_BASE_URL은 main.js에서 선언됨

// 페이지 로드 시 인증 체크
document.addEventListener('DOMContentLoaded', function() {
    checkAuthForPasswordChange();
});

// 비밀번호 변경 페이지 인증 확인
async function checkAuthForPasswordChange() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
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
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/users/me/password`, {
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
            showAlert('비밀번호가 변경되었습니다. 다시 로그인해주세요.', 'success');
            // 비밀번호 변경 후 로그아웃 처리
            sessionStorage.clear();
            setTimeout(() => {
                location.href = '/login';
            }, 1500);
        } else {
            showAlert(json.message || '비밀번호 변경에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        showAlert('비밀번호 변경 중 오류가 발생했습니다.', 'error');
    }
});
