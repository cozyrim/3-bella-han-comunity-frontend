// API 기본 URL
const API_BASE_URL = 'http://localhost:8080/api/v1';

const CSRF_DEBUG_URL = 'http://localhost:8080/api/v1/debug/csrf';


// CSRF 토큰 쿠키에서 읽기
function getCsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfCookie() {
    if (getCsrfToken()) return;

    await fetch(CSRF_DEBUG_URL, {
    method: 'GET',
    credentials: 'include', // 쿠키 수신/전송 필수
  });
}

// 공통 API 호출 함수
async function apiCall(endpoint, options = {}) {
    const {
        method = 'GET',
        body = null,
        isFormData = false,
        requiresAuth = true
    } = options;



    // 헤더 구성
    const headers = {};
    
    // JSON 요청인 경우 Content-Type 설정 (FormData는 브라우저가 자동 설정)
    if (!isFormData && body && method.toUpperCase() !== 'GET') {
        headers['Content-Type'] = 'application/json';
    }
    
    // POST, PUT, DELETE, PATCH 요청 시 CSRF 토큰 추가
    const needsCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
    if (needsCsrf) {
        await ensureCsrfCookie();
        const csrfToken = getCsrfToken();
        console.log('CSRF 토큰 확인:', csrfToken);
        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        } else {
            console.warn('⚠️ CSRF 토큰이 없습니다!');
        }
    }

    // 요청 옵션
    const fetchOptions = {
        method,
        headers,
        credentials: 'include', // JSESSIONID, XSRF-TOKEN 쿠키 자동 전송
    };

    // 요청 본문 설정
    if (body && method.toUpperCase() !== 'GET') {
        fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        console.log('=== API 요청 디버깅 ===');
        console.log('메서드:', method);
        console.log('엔드포인트:', endpoint);
        console.log('isFormData:', isFormData);
        console.log('요청 헤더:', headers);
        console.log('현재 쿠키:', document.cookie);
        if (isFormData && body) {
            console.log('FormData 내용:');
            for (let pair of body.entries()) {
                console.log(`  ${pair[0]}:`, pair[1]);
            }
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
        
        // 응답이 비어있는지 확인
        if (!response) {
            throw new Error('서버로부터 응답을 받지 못했습니다.');
        }

        console.log('응답 상태:', response.status);

        // 401 Unauthorized 처리 (세션 만료)
        if (response.status === 401) {
            console.log('401 인증 실패 - 세션 만료');
            sessionStorage.removeItem('currentUser');

            if (requiresAuth) {
                showAlert('로그인이 필요합니다.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            }

            return {
                success: false,
                message: '인증이 필요합니다.',
                status: 401
            };
        }

        // 403 Forbidden 처리
        if (response.status === 403 && needsCsrf) {
            console.error('403 오류 - CSRF 토큰 문제 또는 권한 없음');
            console.log('현재 CSRF 토큰:', getCsrfToken());
            showAlert('접근 권한이 없습니다.', 'error');

            return {
                success: false,
                message: '접근 권한이 없습니다.',
                status: 403
            };
        }


        let data = null;
        if (response.status !== 204) {
      // 서버가 JSON이 아닐 수도 있으니 방어적으로
        data = await response.json().catch(() => null);
        }

        if (response.ok) {
        return {
            success: true,
            data: data?.data ?? null,
            message: data?.message ?? null,
            code: data?.code ?? null
        };
        } else {
        return {
            success: false,
            message: data?.message || '요청 처리 중 오류가 발생했습니다.',
            code: data?.code,
            status: response.status
        };
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        
        // ERR_EMPTY_RESPONSE 오류 처리
        if (error.message.includes('ERR_EMPTY_RESPONSE') || error.message.includes('서버로부터 응답을 받지 못했습니다')) {
            return {
                success: false,
                message: '서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
                error: error.message
            };
        }
        
        // 네트워크 오류 처리
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return {
                success: false,
                message: '네트워크 연결을 확인해주세요.',
                error: error.message
            };
        }
        
        return { 
            success: false, 
            message: '서버와의 통신 중 오류가 발생했습니다.', 
            error: error.message 
        };
    } 
}




    //     // JSON 파싱
    //     const data = await response.json();

    //     if (response.ok) {
    //         return {
    //             success: true,
    //             data: data.data,
    //             message: data.message,
    //             code: data.code
    //         };
    //     } else {
    //         return {
    //             success: false,
    //             message: data.message || '요청 처리 중 오류가 발생했습니다.',
    //             code: data.code,
    //             status: response.status
    //         };
    //     }
    // } 
    


// 인증 API
const authAPI = {
    login: async (email, password) => {
        return apiCall('/auth/login', {
            method: 'POST',
            body: { email, password },
            requiresAuth: false
        });
    },
    
    logout: async () => {
        return apiCall('/auth/logout', {
            method: 'POST'
        });
    }
};

// 사용자 API
const userAPI = {
    signup: async (email, password, nickname, profileImage = null) => {
        if (profileImage) {
            // 프로필 사진이 있는 경우 FormData로 전송
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            formData.append('nickname', nickname);
            formData.append('profileImage', profileImage);
            
            return apiCall('/users/signup', {
                method: 'POST',
                body: formData,
                isFormData: true,
                requiresAuth: false
            });
        } else {
            // 프로필 사진이 없는 경우 JSON으로 전송
            return apiCall('/users/signup', {
                method: 'POST',
                body: { email, password, nickname },
                requiresAuth: false
            });
        }
    },
    
    checkEmail: async (email) => {
        return apiCall(`/users/check-email?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            requiresAuth: false
        });
    },
    
    checkNickname: async (nickname) => {
        return apiCall(`/users/check-nickname?nickname=${encodeURIComponent(nickname)}`, {
            method: 'GET',
            requiresAuth: false
        });
    },
    
    getProfile: async () => {
        return apiCall('/users/me', {
            method: 'GET',
            requiresAuth: true
        });
    }
};

// 게시글 API
const postAPI = {
    getPosts: async (size = 5, cursor = null) => {
        const query = cursor ? `?size=${size}&cursor=${cursor}` : `?size=${size}`;
        return apiCall(`/posts${query}`, {
            method: 'GET',
            requiresAuth: false
        });
    },
    
    getPost: async (postId) => {
        return apiCall(`/posts/${postId}`, {
            method: 'GET',
            requiresAuth: false
        });
    },
    
    createPost: async (title, content, images = []) => {
        const formData = new FormData();
        
        const postData = { title, content };
        formData.append('post', new Blob([JSON.stringify(postData)], { type: 'application/json' }));
        
        images.forEach(image => {
            formData.append('images', image);
        });
        
        return apiCall('/posts', {
            method: 'POST',
            body: formData,
            isFormData: true
        });
    },
    
    updatePost: async (postId, title, content, newImages = [], removeImageIds = []) => {
        const formData = new FormData();
        
        const postData = { title, content, removeImageIds };
        formData.append('post', new Blob([JSON.stringify(postData)], { type: 'application/json' }));
        
        newImages.forEach(image => {
            formData.append('newImages', image);
        });
        
        return apiCall(`/posts/${postId}`, {
            method: 'PATCH',
            body: formData,
            isFormData: true
        });
    },
    
    deletePost: async (postId) => {
        return apiCall(`/posts/${postId}`, {
            method: 'DELETE'
        });
    }
};
