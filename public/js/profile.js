// 페이지 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // 로그인 필수면 여기서 체크
  const userJson = sessionStorage.getItem('currentUser');
  if (!userJson) {
    showAlert('로그인이 필요합니다.', 'error');
    setTimeout(() => (window.location.href = '/login'), 800);
    return;
  }
    await loadProfile();

  // 프로필 이미지 변경 버튼 / 이미지 클릭 시 파일 선택창 열기
  const avatarBtn = document.getElementById('avatarEditBtn');
  const fileInput = document.getElementById('editProfileImage');
  const avatarImg = document.getElementById('profileAvatar');

  if (avatarBtn && fileInput) {
  avatarBtn.addEventListener('click', () => fileInput.click());
  }

  if (avatarImg && fileInput) {
    // 프로필 이미지를 클릭해도 파일 선택 가능
    avatarImg.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById('profileAvatar');
    const reader = new FileReader();
    reader.onload = (evt) => (preview.src = evt.target.result);
    reader.readAsDataURL(file);
  });
  }
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
    sessionStorage.setItem('currentUser', JSON.stringify(normalized));
    currentUser = normalized;
    updateNavigation(true); // 네비 즉시 반영

    // 화면 채우기
    document.getElementById('profileEmail').value    = user.email ?? '';
    document.getElementById('profileNickname').value = user.nickname ?? '';

    // ★ 프로필 아바타 채우기 (id 주의!)
    const img = document.getElementById('profileAvatar');
    if (img) {
      // resolveAvatarUrl 사용하여 localhost URL 자동 변환
      const avatarUrl = resolveAvatarUrl(normalized.profileImageUrl || normalized.userProfileUrl);
      img.src = avatarUrl;
      img.alt = normalized.nickname ?? '프로필';
      img.onerror = () => { img.onerror = null; img.src = DEFAULT_AVATAR_URL; };
    }
  } catch (e) {
    console.error(e);
    showAlert('프로필을 불러오는 중 오류가 발생했습니다.', 'error');
  }
}

// 프로필 수정 
async function handleProfileUpdate() {
  const nickname = document.getElementById('profileNickname').value.trim();
  const fileInput = document.getElementById('editProfileImage');
  const imageFile = fileInput ? fileInput.files[0] : null;

  let uploadedUrl = null;

  if (imageFile) {
    try {
      uploadedUrl = await uploadToLambda(imageFile, "profile"); // 폴더 구분
      console.log("S3 업로드 완료 URL:", uploadedUrl);
    } catch (e) {
      console.error(e);
      showAlert('프로필 이미지 업로드 실패', 'error');
      return;
    }
  }


  const payload = {
    nickname: nickname || null,
    profileImageUrl: uploadedUrl || null
  };

  try {
    const resp = await fetch(`${window.CONFIG.API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    const json = await resp.json();
    if (resp.ok && json.code === 'SUCCESS') {
      // 세션 / 네비게이션 갱신
      const updatedUser = json.data;
      
      // 필드명 정규화 (profileImageUrl 또는 userProfileUrl 통일)
      const normalized = {
        ...updatedUser,
        profileImageUrl: updatedUser.profileImageUrl || updatedUser.userProfileUrl || '',
        userProfileUrl: updatedUser.userProfileUrl || updatedUser.profileImageUrl || ''
      };
      
      // currentUser 전역 변수 업데이트 (main.js에서 사용)
      currentUser = normalized;
      sessionStorage.setItem('currentUser', JSON.stringify(normalized));
      
      // 네비게이션 즉시 갱신 (이미지 반영)
      updateNavigation(true);
      
      // 성공 메시지 표시 후 홈 화면으로 리다이렉트
      showAlert('프로필이 업데이트되었습니다. 홈 화면으로 이동합니다.', 'success');
      
      // replace를 사용하여 히스토리에 남기지 않고 리다이렉트
      setTimeout(() => {
        window.location.replace('/');
      }, 1000);
      return; // 함수 즉시 종료
    } else {
      showAlert(json.message || '프로필 수정 중 오류 발생', 'error');
    }
  } catch (error) {
    console.error('프로필 수정 오류:', error);
    showAlert('서버 통신 오류가 발생했습니다.', 'error');
  }
}

function goToChangePassword() {
  window.location.href = '/change-password';
}

// 회원 탈퇴 (백엔드 API 필요)
async function deleteAccount() {
    const confirmed = confirm('정말로 회원 탈퇴하시겠습니까?');
    if (!confirmed) return;
    
    showAlert('회원 탈퇴 기능은 현재 개발 중입니다.', 'info');
}
