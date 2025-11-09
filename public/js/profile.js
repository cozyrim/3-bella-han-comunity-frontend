// 페이지 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // 로그인 필수면 여기서 체크
  const userJson = sessionStorage.getItem('currentUser');
  if (!userJson) {
    showAlert('로그인이 필요합니다.', 'error');
    setTimeout(() => (window.location.href = '/login'), 800);
    return;
  }
  await loadProfile();   // ← 중요: 실제로 호출!
});

// 프로필 로드 (서버에서 최신 정보 조회)
async function loadProfile() {
  try {
    const result = await userAPI.getProfile(); // /users/me
    if (!result?.success || !result.data) throw new Error('no data');

    const user = result.data;

    // (핵심) 필드명 정규화: 둘 중 아무거나 왔어도 통일해서 저장
    const normalized = {
      ...user,
      profileImageUrl: user.profileImageUrl || user.userProfileUrl || ''
    };


    // 세션/상태 갱신
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    currentUser = normalized;
    updateNavigation(true); // 네비 즉시 반영

    // 화면 채우기
    document.getElementById('profileEmail').value    = user.email ?? '';
    document.getElementById('profileNickname').value = user.nickname ?? '';

    // ★ 프로필 아바타 채우기 (id 주의!)
    const img = document.getElementById('profileAvatar');
    if (img) {
      img.src = normalized.profileImageUrl || DEFAULT_AVATAR_URL;
      img.alt = normalized.nickname ?? '프로필';
      img.onerror = () => { img.onerror = null; img.src = DEFAULT_AVATAR_URL; };
    }
  } catch (e) {
    console.error(e);
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
