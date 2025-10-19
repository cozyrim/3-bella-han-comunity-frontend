// 게시글 목록 상태
let posts = [];
let nextCursor = null;
let hasNext = false;
let isLoading = false;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadPosts();
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMorePosts);
    }
});

// 게시글 목록 로드
async function loadPosts() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    
    try {
        const result = await postAPI.getPosts(5);
        
        if (result.success) {
            posts = result.data.items || [];
            hasNext = result.data.hasNext || false;
            nextCursor = result.data.nextCursor || null;
            
            renderPosts();
            updateLoadMoreButton();
        } else {
            showAlert(result.message || '게시글을 불러오는데 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('게시글 로드 오류:', error);
        showAlert('게시글을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// 더 보기
async function loadMorePosts() {
    if (isLoading || !hasNext) return;
    
    isLoading = true;
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const originalText = loadMoreBtn.textContent;
    loadMoreBtn.textContent = '로딩 중...';
    loadMoreBtn.disabled = true;
    
    try {
        const result = await postAPI.getPosts(5, nextCursor);
        
        if (result.success) {
            posts = [...posts, ...(result.data.items || [])];
            hasNext = result.data.hasNext || false;
            nextCursor = result.data.nextCursor || null;
            
            renderPosts();
            updateLoadMoreButton();
        } else {
            showAlert(result.message || '게시글을 불러오는데 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('게시글 추가 로드 오류:', error);
        showAlert('게시글을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        isLoading = false;
        loadMoreBtn.textContent = originalText;
        loadMoreBtn.disabled = false;
    }
}

// 게시글 렌더링
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

// 게시글 요소 생성
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-item';
    postDiv.onclick = () => window.location.href = `/pages/post-detail.html?id=${post.postId}`;
    
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

// 더 보기 버튼 업데이트
function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = hasNext ? 'block' : 'none';
    }
}

// 로딩 표시
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'block';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}
