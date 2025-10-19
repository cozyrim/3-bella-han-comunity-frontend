// 로그인 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        
        // Enter 키 지원
        document.getElementById('loginPassword')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
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
            // 사용자 정보 저장 (JSESSIONID, XSRF-TOKEN 쿠키는 자동 저장됨)
            sessionStorage.setItem('currentUser', JSON.stringify(result.data));

            showAlert('로그인 성공!', 'success');

            setTimeout(() => {
                window.location.href = '/pages/index.html';
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

// 회원가입 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.addEventListener('click', handleSignup);
    }
});

// 회원가입 처리
async function handleSignup() {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm')?.value;
    const nickname = document.getElementById('signupNickname').value.trim();
    
    if (!email || !password || !nickname) {
        showAlert('모든 필드를 입력해주세요.', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('올바른 이메일 형식이 아닙니다.', 'error');
        return;
    }
    
    if (password.length < 4) {
        showAlert('비밀번호는 최소 4자 이상이어야 합니다.', 'error');
        return;
    }
    
    if (passwordConfirm && password !== passwordConfirm) {
        showAlert('비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (nickname.length < 2 || nickname.length > 20) {
        showAlert('닉네임은 2~20자 사이여야 합니다.', 'error');
        return;
    }
    
    const signupBtn = document.getElementById('signupBtn');
    const originalText = signupBtn.textContent;
    signupBtn.textContent = '가입 중...';
    signupBtn.disabled = true;
    
    try {
        const result = await userAPI.signup(email, password, nickname);
        
        if (result.success) {
            showAlert('회원가입 성공! 로그인 페이지로 이동합니다.', 'success');
            
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 1000);
        } else {
            showAlert(result.message || '회원가입에 실패했습니다.', 'error');
            signupBtn.textContent = originalText;
            signupBtn.disabled = false;
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        showAlert('회원가입 중 오류가 발생했습니다.', 'error');
        signupBtn.textContent = originalText;
        signupBtn.disabled = false;
    }
}
