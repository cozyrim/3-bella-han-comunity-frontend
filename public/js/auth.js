// 인증 페이지 초기화 (로그인 + 회원가입 통합)
document.addEventListener('DOMContentLoaded', function() {
    // 이미 로그인 상태면 홈으로 리다이렉트
    const userJson = sessionStorage.getItem('currentUser');
    if (userJson) {
        window.location.href = '/';
        return;
    }
    
    // 로그인 페이지
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        
        // Enter 키 지원
        document.getElementById('loginPassword')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    // 회원가입 페이지
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.addEventListener('click', handleSignup);
        
        // 프로필 사진 업로드
        const profileImageInput = document.getElementById('profileImage');
        if (profileImageInput) {
            
            profileImageInput.addEventListener('change', handleProfileImageChange);
            
        } else {
            console.error(' profileImage 요소를 찾을 수 없습니다!');
        }
        
        // 실시간 유효성 검사
        setupRealTimeValidation();
        checkFormValidity();
    }
});

// 로그인 처리
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email) {
        showAlert('이메일을 입력해주세요.', 'error');
        return;
    }
    
    if (!password) {
        showAlert('비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('올바른 이메일 형식이 아닙니다.', 'error');
        return;
    }
    
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = '로그인 중...';
    loginBtn.disabled = true;
    
    try {
        const result = await authAPI.login(email, password);
        
        if (result.success) {
            
            const loginResp = result.data; // LoginResponse
            const user = loginResp?.user;
            const token = loginResp?.accessToken;

            if (token) sessionStorage.setItem('accessToken', token);
            if (user)  sessionStorage.setItem('currentUser', JSON.stringify(user));

            showAlert('로그인 성공!', 'success');

            setTimeout(() => {
                // 이전 페이지가 있으면 그곳으로, 없으면 홈으로
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            }, 500);
        } else {
            showAlert(result.message || '로그인에 실패했습니다.', 'error');
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        showAlert('로그인 중 오류가 발생했습니다.', 'error');
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}


// 프로필 사진 변경 처리
async function handleProfileImageChange(e) {
    
    const file = e.target.files[0];
    
    const preview = document.getElementById('profileImagePreview');
    const helper = document.getElementById('profileHelper');
    
    if (!file) {
        // 파일이 선택되지 않은 경우 기본 상태로 복원
        preview.innerHTML = `
            <div class="profile-placeholder">
                <span class="plus-icon">+</span>
                <p>프로필 사진을 추가해주세요</p>
            </div>
        `;
        helper.textContent = '*프로필 사진을 추가해주세요.';
        helper.style.color = '#666';
        return;
    }
    
    // 파일 유효성 검사
    const validation = validateImageFile(file);
    if (!validation.valid) {
        showAlert(validation.message, 'error');
        e.target.value = '';
        return;
    }
    
    try {
        // 이미지 미리보기 생성
        
        const previewUrl = await createImagePreview(file);
        
        
        preview.innerHTML = `
            <img src="${previewUrl}" alt="프로필 미리보기">
        `;
        
        
        helper.textContent = '프로필 사진이 선택되었습니다.';
        helper.style.color = '#28a745';
        
        // 폼 유효성 검사 업데이트
        checkFormValidity();
    } catch (error) {
        console.error(' 이미지 미리보기 오류:', error);
        showAlert('이미지 미리보기를 생성할 수 없습니다.', 'error');
    }
}

// 디바운싱을 위한 타이머 저장
let emailCheckTimer = null;
let nicknameCheckTimer = null;

// 전역 플래그/캐시
let _emailValid = false;
let _nicknameValid = false;
let _passwordValid = false;
let _passwordConfirmValid = false;

let _lastCheckedEmail = '';
let _lastCheckedNickname = '';

let _emailReqSeq = 0;
let _nicknameReqSeq = 0;
let _isSubmitting = false;

// 버튼 토글 전용 함수 추가(서버 호출 금지)
function updateSignupButton() {
    const signupBtn = document.getElementById('signupBtn');
    if(!signupBtn) return;

    const enable = _emailValid && _nicknameValid && _passwordValid && _passwordConfirmValid && !_isSubmitting;
    signupBtn.disabled = !enable;
    signupBtn.style.backgroundColor = enable ? '#7F6AEE' : '#ACADEB';
}




// 실시간 유효성 검사 설정 - 이벤트 연결
function setupRealTimeValidation() {
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const passwordConfirmInput = document.getElementById('signupPasswordConfirm');
    const nicknameInput = document.getElementById('signupNickname');
    
    if (emailInput) {
        emailInput.addEventListener('blur', () => validateEmailField());
        emailInput.addEventListener('input', () => {
            // 디바운싱: 500ms 후에 중복 검사 실행
            clearTimeout(emailCheckTimer);
            emailCheckTimer = setTimeout(() => {
                validateEmailField();
            }, 500);
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', () => validatePasswordField());
        passwordInput.addEventListener('input', () => validatePasswordField());
    }
    
    if (passwordConfirmInput) {
        passwordConfirmInput.addEventListener('blur', () => validatePasswordConfirmField());
        passwordConfirmInput.addEventListener('input', () => validatePasswordConfirmField());
    }
    
    if (nicknameInput) {
        nicknameInput.addEventListener('blur', () => validateNicknameField());
        nicknameInput.addEventListener('input', () => {
            // 디바운싱: 500ms 후에 중복 검사 실행
            clearTimeout(nicknameCheckTimer);
            nicknameCheckTimer = setTimeout(() => {
                validateNicknameField();
            }, 500);
        });
    }
}

// 이메일 유효성 검사 (중복 검사 포함)
async function validateEmailField() {
    const email = document.getElementById('signupEmail').value.trim();
    const helper = document.getElementById('emailHelper');
    
    if (!email) {
        updateFormGroupState('signupEmail', null, '이메일을 입력해주세요.');
        _emailValid = false;
        checkFormValidity();
        return false;
    }
    
    if (email.length < 5 || !validateEmail(email)) {
        updateFormGroupState('signupEmail', false, '올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)');
        _emailValid = false;
        checkFormValidity();
        return false;
    }
    

// 같은 값이면 서버 재요청 스킵
    if (email === _lastCheckedEmail) {
        checkFormValidity();
        return _emailValid;
    }
    // 요청 순번
    const mySeq = ++_emailReqSeq;

    // 이메일 중복 검사
    try {
        const result = await userAPI.checkEmail(email);
        console.log('이메일 중복 검사 결과:', result);
        if (mySeq !== _emailReqSeq) return false; // 오래된 응답 버림


        if (result.success && result.data === false) {
            // 사용 가능
            updateFormGroupState('signupEmail', true, '사용 가능한 이메일입니다.');
            _emailValid = true;
            _lastCheckedEmail = email;
        } else if (result.success && result.data === true) {
            updateFormGroupState('signupEmail', false, '*중복된 이메일입니다.');
            _emailValid = false;
            _lastCheckedEmail = email;
        } else {
            updateFormGroupState('signupEmail', null, '이메일 중복 검사 중 오류가 발생했습니다.');
            _emailValid = false;
        }
    } catch (error){
        console.error('이메일 중복 검사 API 오류:', errorResponsePlugin);
        updateFormGroupState('signupEmail', null, '이메일 중복 검사 중 오류가 발생했습니다.');
    } finally {
        checkFormValidity(); // 여기서는 동기판정만 함
    }
    return _emailValid;
}

// 비밀번호 유효성 검사
function validatePasswordField() {
    const password = document.getElementById('signupPassword').value;
    const helper = document.getElementById('passwordHelper');
    
    if (!password) {
        updateFormGroupState('signupPassword', null, '비밀번호는 6자 이상, 20자 이하입니다.');
        _passwordValid = false;
        checkFormValidity();
        return false;
    }
    
    const validation = validatePassword(password);
    if (!validation.valid) {
        updateFormGroupState('signupPassword', false, `*${validation.message}`);
        _passwordValid = false;
        checkFormValidity();
        return false;
    }
    
    updateFormGroupState('signupPassword', true, '올바른 비밀번호 형식입니다.');
    _passwordValid = true;
    // 비밀번호 확인 필드도 다시 검사
    if (document.getElementById('signupPasswordConfirm').value) {
        validatePasswordConfirmField();
    }
    checkFormValidity();
    return true;
}

// 비밀번호 확인 유효성 검사
function validatePasswordConfirmField() {
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    const helper = document.getElementById('passwordConfirmHelper');
    
    if (!passwordConfirm) {
        updateFormGroupState('signupPasswordConfirm', null, '비밀번호를 한번더 입력해주세요');
        _passwordConfirmValid = false;
        checkFormValidity();
        return false;
    }
    
    const validation = validatePasswordConfirm(password, passwordConfirm);
    if (!validation.valid) {
        updateFormGroupState('signupPasswordConfirm', false, `*${validation.message}`);
        _passwordConfirmValid = false;
        checkFormValidity();
        return false;
    }
    
    updateFormGroupState('signupPasswordConfirm', true, '비밀번호가 일치합니다.');
    _passwordConfirmValid = true;
    checkFormValidity();
    return true;
}

// 닉네임 유효성 검사 (중복 검사 포함)
async function validateNicknameField() {
    const nickname = document.getElementById('signupNickname').value.trim();
    const helper = document.getElementById('nicknameHelper');
    
    if (!nickname) {
        updateFormGroupState('signupNickname', null, '닉네임을 입력해주세요.');
        _nicknameValid = false;
        checkFormValidity();
        return false;
    }
    
    // 닉네임 형식 검사
    const validation = validateNickname(nickname);
    if (!validation.valid) {
        updateFormGroupState('signupNickname', false, `*${validation.message}`);
        _nicknameValid = false;
        checkFormValidity();
        return false;
    }

    if (nickname.length > 10) {
        updateFormGroupState('signupNickname', false, '*닉네임은 10자 이하여야 합니다.');
        _nicknameValid = false;
        checkFormValidity();
        return false;
    }
    // 같은 값이면 서버 재요청 스킵
    if (nickname === _lastCheckedNickname) {
        checkFormValidity();
        return _nicknameValid;
    }
    const mySeq = ++_nicknameReqSeq;

    // 닉네임 중복 검사
    try {
        const result = await userAPI.checkNickname(nickname);
        console.log('닉네임 중복 검사 결과:', result);
        if (mySeq !== _nicknameReqSeq) return false; // 오래된 응답 버림


        if (result.success && result.data === false) {
            updateFormGroupState('signupNickname', true, '사용 가능한 닉네임입니다.');
                _nicknameValid = true;
                _lastCheckedNickname = nickname;
            } else if (result.success && result.data === true) {
                updateFormGroupState('signupNickname', false, '*중복된 닉네임입니다.');
                _nicknameValid = false;
                _lastCheckedNickname = nickname;
            } else {
            console.error('닉네임 중복 검사 API 오류:', result.message);
            updateFormGroupState('signupNickname', null, '닉네임 중복 검사 중 오류가 발생했습니다.');
            _nicknameValid = false;
        }
    } catch (error) {
        console.error('닉네임 중복 검사 오류:', error);
        updateFormGroupState('signupNickname', null, '닉네임 중복 검사 중 오류가 발생했습니다.');
        _nicknameValid = false;
    } finally {
        checkFormValidity(); // 여기서는 동기판정만 함
    }
    return _nicknameValid
}

//동기 판정으로 변경, 캐시된 플래그만 사용
// 전체 폼 유효성 검사 - 현재 폼이 제출 가능 상태인지 게산해서 가입 버튼 활성/비활성 토글
async function checkFormValidity() {

    updateSignupButton();
}

// 회원가입 처리 - 사용자가 실제로 화원가입 버튼을 눌렀을 때 제출(검사->서버전송->결과처리)
async function handleSignup() {
    const signupBtn = document.getElementById('signupBtn');
    if( signupBtn.disabled ) return; // 이중 클릭 방지

    _isSubmitting = true;
    updateSignupButton(); // 라이브 토글 잠깐 중단


    // 제출 직전 강제 최신화(같은 값이면 서버 재요청은 캐시가 막음)
    const [emailOK, nickOK] = await Promise.all([validateEmailField(), validateNicknameField()]);

    const pwOK = validatePasswordField();
    const pcOK = validatePasswordConfirmField();

    if (!(emailOK && nickOK && pwOK && pcOK)) {
        _isSubmitting = false;
        updateSignupButton();
        showAlert('입력 정보를 확인해주세요.', 'error');
        return;
    }

    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const nickname = document.getElementById('signupNickname').value.trim();
    const profileImage = document.getElementById('profileImage').files[0];
    
    const originalText = signupBtn.textContent;
    signupBtn.textContent = '가입 중...';
    signupBtn.disabled = true;
    
    
    try {
        const result = await userAPI.signup(email, password, nickname, profileImage);
        
        if (result.success) {
            showAlert('회원가입 성공! 로그인 페이지로 이동합니다.', 'success');
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        } else {
            showAlert(result.message || '회원가입에 실패했습니다.', 'error');
            // signupBtn.textContent = originalText;
            // signupBtn.disabled = false;
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        showAlert('회원가입 중 오류가 발생했습니다.', 'error');
    } finally {
        signupBtn.textContent = originalText;
        _isSubmitting = false;
        checkFormValidity();
    }
}
