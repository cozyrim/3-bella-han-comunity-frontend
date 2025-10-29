const API_BASE_URL = '/api/v1';

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
        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
        
        if (!response) {
            throw new Error('서버로부터 응답을 받지 못했습니다.');
        }

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
        if (response.status === 403) {
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
