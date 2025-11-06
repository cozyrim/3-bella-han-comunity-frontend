const API_BASE_URL = 'http://localhost:3000/api/v1';


// Access 토큰 저장/조회 유틸
function getAccessToken() {
    return sessionStorage.getItem('accessToken');
}
function setAccessToken(token) {
    if (token) sessionStorage.setItem('accessToken', token);
}
function clearAuth() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('currentUser');
}

// refresh 호출 (쿠키 필요)
async function refreshAccessToken() {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // ★ 리프레시 쿠키 전송
    });

    if (!res.ok) return null;

    // 바디의 data.accessToken + 헤더 Authorization 모두 지원
    let json = null;
    try { json = await res.json(); } catch {}
    const bodyToken = json?.data?.accessToken;
    const headerToken = res.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

    const newAccess = bodyToken || headerToken;
    if (newAccess) setAccessToken(newAccess);
    return newAccess || null;
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

    if (requiresAuth) {
        const token = sessionStorage.getItem('accessToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    } 

    // 요청 옵션
    // ★ 리프레시 쿠키 사용을 위해 항상 include
  const fetchOptions = {
    method,
    headers,
    credentials: 'include',
  };
  if (body && method.toUpperCase() !== 'GET') {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  // 내부 함수: 실제 호출
  const doFetch = async () => {
    const resp = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    // 204 등 바디 없는 응답 방어
    let data = null;
    if (resp.status !== 204) {
      try { data = await resp.json(); } catch {}
    }
    return { resp, data };
  };

    try {
    // 1차 호출
    let { resp, data } = await doFetch();

    // 401 → 자동 리프레시 → 1회 재시도
    if (resp.status === 401 && requiresAuth) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Authorization 헤더 갱신 후 재시도
        fetchOptions.headers = { ...fetchOptions.headers, Authorization: `Bearer ${newToken}` };
        ({ resp, data } = await doFetch());
      } else {
        clearAuth();
      }
    }

    // 403 처리
    if (resp.status === 403) {
      return { success: false, message: '접근 권한이 없습니다.', status: 403 };
    }

    // 정상/에러 공통 포맷
    if (resp.ok) {
      return {
        success: true,
        data: data?.data ?? null,
        message: data?.message ?? null,
        code: data?.code ?? null,
        status: resp.status,
      };
    } else {
      // 401일 때 로그인 페이지 유도 등
      if (resp.status === 401 && requiresAuth) {
        return { success: false, message: '인증이 필요합니다.', status: 401 };
      }
      return {
        success: false,
        message: data?.message || '요청 처리 중 오류가 발생했습니다.',
        code: data?.code,
        status: resp.status
      };
    }
  } catch (e) {
    console.error('API 호출 오류:', e);
    return { success: false, message: '서버와의 통신 중 오류가 발생했습니다.', error: e.message };
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
    // 서버 쿠키 삭제 + DB revoke
    const out = await apiCall('/auth/logout', { method: 'POST' });
    if (out.success) clearAuth(); // 클라이언트 상태도 정리
    return out;
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
    },

    like: async (postId) => {
        return apiCall(`/posts/${postId}/likes`, {
            method: 'POST'
        });
    },

    unlike: async (postId) => {
        return apiCall(`/posts/${postId}/likes`, {
            method: 'DELETE'
        });
    }
};

// 댓글 API
window.commentsAPI = {
   // 목록 (공개라면 requiresAuth:false, 보호라면 true로 바꿔)
    getComments(postId) {
      return apiCall(`/posts/${postId}/comments`, {
        method: 'GET',
        requiresAuth: true,
      });
    },

   // 생성 (보통 인증 필요)
    create(postId, content) {
      return apiCall(`/posts/${postId}/comments`, {
        method: 'POST',
        body: { content },
        requiresAuth: true,
      });
    },

    update(postId, commentId, content) {
      return apiCall(`/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        body: { content },
        requiresAuth: true,
      });
    },

    remove(postId, commentId) {
      return apiCall(`/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
    },
  };

// 배치 카운트 API (가능한 경우)
window.commentsAPI.getCounts = async function (postIds) {
  // 백엔드 스펙: POST /api/v1/posts/comments/counts  바디: { postIds: [...] }
  return apiCall('/posts/comments/counts', {
    method: 'POST',
    body: { postIds },
    // 댓글 수는 공개로도 괜찮으면 false, 보호면 true
    requiresAuth: false
  }).then(res => res.success ? (res.data || {}) : {});
};


