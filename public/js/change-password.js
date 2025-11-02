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
    
    if (newPassword !== confirmPassword) {
        showAlert('새 비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('비밀번호는 6자 이상이어야 합니다.', 'error');
        return;
    }
    
    // 실제로는 백엔드에 비밀번호 변경 API가 필요합니다
    showAlert('비밀번호 변경 기능은 백엔드 API가 필요합니다.', 'info');
});
