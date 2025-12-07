// 클라이언트에서 사용할 기본 API / 정적 파일 URL
// - 배포 환경: window.__ENV__ 값 사용 (Express에서 주입)
// - 로컬/비정상 환경: 안전한 기본값(/api/v1, S3 URL) 사용
const API_BASE_URL = window.__ENV__?.API_BASE_URL || '/api/v1';
const STATIC_URL =
  window.__ENV__?.STATIC_URL ||
  'https://community-image-bucket-1116.s3.ap-northeast-2.amazonaws.com/';
const LAMBDA_UPLOAD_URL = window.__ENV__?.LAMBDA_UPLOAD_URL;
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

    // 에러 처리
    if (!resp.ok) {
      // 403 Forbidden 디버깅
      if (resp.status === 403) {
        console.error('❌ 403 Forbidden:', {
          endpoint,
          method,
          hasToken: !!sessionStorage.getItem('accessToken'),
          tokenPreview: sessionStorage.getItem('accessToken')?.substring(0, 20) + '...',
          responseData: data
        });
      }
      return {
        success: false,
        status: resp.status,
        message: data?.message || '요청 처리 중 오류가 발생했습니다.',
        code: data?.code || null,
        raw: data
      };
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
    signup: async (email, password, nickname, profileImageUrl = null) => {
            // 프로필 사진이 있는 경우 s3에 업로드된 이미지 URL (문자열) 전송
            return apiCall('/users/signup', {
                method: 'POST',
                body: { email, password, nickname, profileImageUrl },
                requiresAuth: false
            });
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
window.postAPI = {
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
        // images가 File 객체 배열이면 FormData 사용, URL 문자열 배열이면 JSON 사용
        const isFileArray = images.length > 0 && images[0] instanceof File;
        
        if (isFileArray) {
            // 파일 업로드 방식 (FormData)
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
        } else {
            // S3 URL 리스트 전송 방식 (JSON)
            return apiCall('/posts', {
                method: 'POST',
                body: { title, content, imageUrls: images },
                requiresAuth: true
            });
        }
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

// Lambda 업로드 API 호출 함수
async function uploadToLambda(file, folder = "others") {
  const formData = new FormData();

  if (file instanceof File) {
    formData.append("file", file, file.name);
  } else if (file instanceof Blob) {
    formData.append("file", file, "upload.jpg");
  } else {
    console.error("⚠️ file이 Blob/File 객체가 아닙니다:", file);
    throw new Error("Lambda 업로드 실패: 잘못된 파일 객체");
  }

  formData.append("folder", folder);

  // Lambda 업로드를 Express 프록시를 통해 호출 (CORS 문제 해결)
  // /api/upload → Express 서버 → Lambda 함수
  const lambdaUrl = '/api/upload';
  
  console.log("📤 Lambda 업로드 시작 (프록시 경유):", lambdaUrl);

  let resp;
  try {
    resp = await fetch(lambdaUrl, {
      method: "POST",
      body: formData,
      credentials: 'include' // 쿠키 전송 (필요한 경우)
    });
    console.log("📥 fetch 응답 도착:", resp.status);
  } catch (err) {
    console.error("❌ fetch 단계에서 실패:", err);
    return;
  }

  let result;
  try {
    result = await resp.json();
    console.log("📦 JSON 파싱 성공:", result);
  } catch (err) {
    console.error("❌ JSON 파싱 실패:", err);
    return;
  }

  let parsedBody;
  try {
    parsedBody =
      typeof result.body === "string"
        ? JSON.parse(result.body)
        : result.body || result;
    console.log("🧩 parsedBody:", parsedBody);
  } catch (err) {
    console.error("❌ parsedBody 파싱 실패:", err);
    return;
  }

  const uploadedUrl =
    parsedBody?.data?.filePath ||
    parsedBody?.filePath ||
    parsedBody?.body?.data?.filePath ||
    parsedBody?.body?.filePath ||
    null;

  if (!uploadedUrl) {
    console.error("❌ Lambda 응답 구조 문제:", parsedBody);
    throw new Error("Lambda 응답에 filePath 없음");
  }

  console.log("✅ 업로드 완료, URL:", uploadedUrl);
  return uploadedUrl;
}