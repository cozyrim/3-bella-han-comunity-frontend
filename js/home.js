// 게시글 목록 상태
let posts = [];
let nextCursor = null;
let hasNext = false;
let isLoading = false;
let scrollTimeout;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadPosts();
    
    // 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', handleScroll);
});

// 스크롤 이벤트 핸들러
function handleScroll() {
    // 스로틀링: 200ms마다 한 번만 실행
    if (scrollTimeout) return;
    
    scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        
        // 이미 로딩 중이거나 더 이상 데이터가 없으면 중단
        if (isLoading || !hasNext) return;
        
        // 스크롤 위치 계산
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const clientHeight = window.innerHeight || document.documentElement.clientHeight;
        const scrollHeight = document.documentElement.scrollHeight;
        
        // 하단 200px 전에 도달했는지 확인
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            loadMorePosts();
        }
    }, 200);
}

// 게시글 목록 로드
async function loadPosts() {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        const result = await postAPI.getPosts(5);
        
        if (result.success) {
            posts = result.data.items || [];
            hasNext = result.data.hasNext || false;
            nextCursor = result.data.nextCursor || null;
            
            renderPosts();
        } else {
            showAlert(result.message || '게시글을 불러오는데 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('게시글 로드 오류:', error);
        showAlert('게시글을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        isLoading = false;
    }
}

// 더 보기 (무한 스크롤)
async function loadMorePosts() {
    if (isLoading || !hasNext) return;
    
    isLoading = true;
    
    try {
        const result = await postAPI.getPosts(5, nextCursor);
        
        if (result.success) {
            const newPosts = result.data.items || [];
            posts = [...posts, ...newPosts];
            hasNext = result.data.hasNext || false;
            nextCursor = result.data.nextCursor || null;
            
            // 새 게시글만 추가 (기존 게시글은 그대로!)
            appendNewPosts(newPosts);
        } else {
            showAlert(result.message || '게시글을 불러오는데 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('게시글 추가 로드 오류:', error);
        showAlert('게시글을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        isLoading = false;
    }
}

// 게시글 렌더링 (초기 로드용)
function renderPosts() {
    const postList = document.getElementById('postList');
    if (!postList) return;
    
    postList.innerHTML = '';
    
    if (posts.length === 0) {
        postList.innerHTML = '<p class="no-posts">게시글이 없습니다.</p>';
        return;
    }
    
    posts.forEach(post => {
        const postElement = createPostElement(post);
        postList.appendChild(postElement);
    });
}

// 새 게시글만 추가 (무한 스크롤용)
function appendNewPosts(newPosts) {
    const postList = document.getElementById('postList');
    if (!postList) return;
    
    newPosts.forEach(post => {
        const postElement = createPostElement(post);
        postList.appendChild(postElement);
    });
}

// 게시글 요소 생성
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-item';
    postDiv.onclick = () => window.location.href = `/post-detail?id=${post.postId}`;
    
    const date = formatDateSimple(post.createdAt);
    const title = escapeHtml(post.title);
    const content = escapeHtml(post.content);
    
    // 내용 한 줄 미리보기 (50자 제한)
    const contentPreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
    
    // 작성자 닉네임만 표시 (없으면 표시 안 함)
    const authorDisplay = post.authorNickname ? escapeHtml(post.authorNickname) : '';
    
    postDiv.innerHTML = `
        <div class="post-item-header">
            <h3 class="post-item-title" style="font-size: 18px; margin: 0 0 10px 0;">${title}</h3>
        </div>
        <div class="post-item-content" style="color: #666; margin-bottom: 10px;">${contentPreview}</div>
        <div class="post-item-meta" style="font-size: 14px; color: #999;">
            ${authorDisplay ? `${authorDisplay} | ` : ''}${date}
        </div>
        ${post.primaryImageUrl ? `<img src="${post.primaryImageUrl}" alt="게시글 이미지" class="post-item-image" onerror="this.style.display='none'" style="margin-top: 10px;">` : ''}
    `;
    
    return postDiv;
}


