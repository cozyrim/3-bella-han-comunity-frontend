// API 기본 URL
const API_BASE_URL = 'http://localhost:8080/api/v1';

// CSRF 토큰 (임시로 비활성화됨)
function getCsrfToken() {
    return null; // CSRF 비활성화 상태
}

// 공통 API 호출 함수
async function apiCall(endpoint, options = {}) {
    const {
        method = 'GET',
        body = null,
        isFormData = false,
        requiresAuth = true
    } = options;

    const headers = {};

    if (!isFormData && body) {
        headers['Content-Type'] = 'application/json';
    }

    // CSRF 토큰 (임시로 비활성화됨)
    // if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
    //     const csrfToken = getCsrfToken();
    //     if (csrfToken) {
    //         headers['X-XSRF-TOKEN'] = csrfToken;
    //     }
    // }

    const fetchOptions = {
        method,
        headers,
        credentials: 'include', // JSESSIONID, XSRF-TOKEN 쿠키 자동 전송
    };

    if (body && method.toUpperCase() !== 'GET') {
        fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        console.log('API 요청:', method, endpoint); // 디버깅
        console.log('요청 헤더:', fetchOptions.headers); // 디버깅
        console.log('쿠키:', document.cookie); // 디버깅

        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

        console.log('응답 상태:', response.status); // 디버깅

        // 401 Unauthorized 처리 (세션 만료)
        if (response.status === 401) {
            console.log('401 인증 실패 - 세션 만료'); // 디버깅
            sessionStorage.removeItem('currentUser');

            if (requiresAuth) {
                showAlert('로그인이 필요합니다.', 'error');
                setTimeout(() => {
                    window.location.href = '/pages/login.html';
                }, 1000);
            }

            return {
                success: false,
                message: '인증이 필요합니다.',
                status: 401
            };
        }

        // 403 Forbidden 처리 (임시로 비활성화됨)
        if (response.status === 403) {
            console.error('403 오류 - 권한 없음');
            showAlert('접근 권한이 없습니다.', 'error');

            return {
                success: false,
                message: '접근 권한이 없습니다.',
                status: 403
            };
        }

        // JSON 파싱 (200번대 응답만)
        const data = await response.json();

        if (response.ok) {
            return {
                success: true,
                data: data.data,
                message: data.message,
                code: data.code
            };
        } else {
            return {
                success: false,
                message: data.message || '요청 처리 중 오류가 발생했습니다.',
                code: data.code,
                status: response.status
            };
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        return {
            success: false,
            message: '네트워크 오류가 발생했습니다.',
            error: error.message
        };
    }
}

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
    signup: async (email, password, nickname) => {
        return apiCall('/users/signup', {
            method: 'POST',
            body: { email, password, nickname },
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
