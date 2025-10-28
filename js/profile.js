// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;
    
    loadProfile();
});

// 프로필 로드 (서버에서 최신 정보 조회)
async function loadProfile() {
    try {
        const result = await userAPI.getProfile();
        
        if (result.success && result.data) {
            const user = result.data;
            
            // sessionStorage 업데이트
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            currentUser = user;
            
            // 화면 표시
            const emailInput = document.getElementById('profileEmail');
            const nicknameInput = document.getElementById('profileNickname');
            const userIdDisplay = document.getElementById('userId');
            
            if (emailInput) emailInput.value = user.email || '';
            if (nicknameInput) nicknameInput.value = user.nickname || '';
            if (userIdDisplay) userIdDisplay.textContent = `사용자 ID: ${user.userId || ''}`;
            
            if (user.profileImageUrl) {
                const profileImage = document.getElementById('profileImage');
                if (profileImage) {
                    profileImage.src = user.profileImageUrl;
                }
            }
        } else {
            sessionStorage.removeItem('currentUser');
            showAlert('세션이 만료되었습니다. 다시 로그인해주세요.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }
    } catch (error) {
        console.error('프로필 로드 오류:', error);
        showAlert('프로필을 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 프로필 수정 (백엔드 API 필요)
async function updateProfile() {
    showAlert('프로필 수정 기능은 현재 개발 중입니다.', 'info');
}

// 비밀번호 변경
function goToChangePassword() {
    window.location.href = '/change-password';
}

// 회원 탈퇴 (백엔드 API 필요)
async function deleteAccount() {
    const confirmed = confirm('정말로 회원 탈퇴하시겠습니까?');
    if (!confirmed) return;
    
    showAlert('회원 탈퇴 기능은 현재 개발 중입니다.', 'info');
}
