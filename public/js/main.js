// 전역 상태
let currentUser = null;
// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadUserFromSession();
    initLogoutButton();
});

// sessionStorage에서 사용자 정보 로드
function loadUserFromSession() {
    try {
        const userJson = sessionStorage.getItem('currentUser');
        
        if (userJson) {
            currentUser = JSON.parse(userJson);
            updateNavigation(true);
        } else {
            currentUser = null;
            updateNavigation(false);
        }
    } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
        currentUser = null;
        updateNavigation(false);
    }
}

// 로그아웃 버튼 초기화
function initLogoutButton() {
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', handleLogout);
    }
}

// 네비게이션 업데이트
function updateNavigation(isLoggedInParm) {
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const profileLink = document.getElementById('profileLink');
    const logoutLink = document.getElementById('logoutLink');
    const createPostBtn = document.getElementById('createPostBtn');
    const navAvatar     = document.getElementById('navAvatar');

    // 인자를 안 주면 currentUser 기준으로 판정
    const isLoggedIn = (typeof isLoggedInParam === 'boolean')
        ? isLoggedInParam
        : !!currentUser;

    if (isLoggedIn) {
        if (loginLink) loginLink.style.display = 'none';
        if (signupLink) signupLink.style.display = 'none';
        if (profileLink) {
            profileLink.style.display = 'inline-flex';
            profileLink.href = '/profile'; // 클릭하면 프로필 페이지

            // 현재 유저의 이미지가 있으면 사용, 없으면 기본 이미지
            const src = (currentUser?.profileImageUrl || currentUser?.userProfileUrl || DEFAULT_AVATAR_URL);
            if (navAvatar) {
                navAvatar.src = src || DEFAULT_AVATAR_URL;
                navAvatar.alt = currentUser?.nickname || '프로필';
                navAvatar.onerror = () => { navAvatar.onerror = null; navAvatar.src = DEFAULT_AVATAR_URL; };
            }
            profileLink.title = currentUser?.nickname || '내 프로필';
        }
        if (logoutLink)    logoutLink.style.display    = 'block';
        if (createPostBtn) createPostBtn.style.display = 'block';
        } else {
        if (loginLink)     loginLink.style.display     = 'block';
        if (signupLink)    signupLink.style.display    = 'block';
        if (profileLink)   profileLink.style.display   = 'none';
        if (logoutLink)    logoutLink.style.display    = 'none';
        if (createPostBtn) createPostBtn.style.display = 'none';
        }
    }

// 로그아웃
async function handleLogout(e) {
    if (e) e.preventDefault();
    
    try {
        await authAPI.logout();
    } catch (error) {
        console.error('로그아웃 오류:', error);
    } finally {
        // 성공 실패 관계없이 클라이언트 정보 삭제
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        updateNavigation(false);
        showAlert('로그아웃되었습니다.', 'success');
        
        setTimeout(() => {
            window.location.href = '/';
        }, 500);
    }
}

// 로그인 필수 체크
function requireLogin() {
    const userJson = sessionStorage.getItem('currentUser');
    
    if (!userJson) {
        // 현재 페이지 저장 (로그인 후 돌아오기 위해)
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        
        showAlert('로그인이 필요합니다.', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
        return false;
    }
    
    return true;
}

// 현재 사용자 정보 반환
function getCurrentUser() {
    return currentUser;
}
