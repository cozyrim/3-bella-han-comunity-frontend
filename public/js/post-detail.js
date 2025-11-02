const postId = getQueryParam('id');
console.log('postId from URL =', postId);

// 게시글 상태
let currentPost = null;
let currentImageIndex = 0;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    const postId = getQueryParam('id');
    
    if (!postId) {
        showAlert('잘못된 접근입니다.', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        return;
    }
    
    loadPost(postId);
    
    loadComments(postId);

    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => handleDeletePost(postId));
    }
    
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            window.location.href = `/edit-post?id=${postId}`;
        });
    }
    
    // 키보드 화살표 키로 이미지 슬라이더 제어
    document.addEventListener('keydown', function(e) {
        if (currentPost && currentPost.images && currentPost.images.length > 1) {
            if (e.key === 'ArrowLeft') {
                changeImage(-1, currentPost.images);
            } else if (e.key === 'ArrowRight') {
                changeImage(1, currentPost.images);
            }
        }
    });
});

// 게시글 로드
async function loadPost(postId) {
    try {
        const result = await postAPI.getPost(postId);
        
        if (result.success && result.data) {
            currentPost = result.data;
            renderPost(currentPost);
            
            // 작성자인 경우 수정/삭제 버튼 표시
            if (currentUser && currentPost.authorId === currentUser.userId) {
                showActionButtons();
            }
        } else {
            showAlert(result.message || '게시글을 불러올 수 없습니다.', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    } catch (error) {
        console.error('게시글 로드 오류:', error);
        showAlert('게시글을 불러오는 중 오류가 발생했습니다.', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
}

// 게시글 렌더링
function renderPost(post) {
    // 제목
    const titleElement = document.getElementById('postTitle');
    if (titleElement) {
        titleElement.textContent = post.title || '';
    }
    
    // 작성자
    const authorElement = document.getElementById('postAuthor');
    if (authorElement) {
        authorElement.textContent = post.authorNickname || '익명';
    }
    
    // 날짜
    const dateElement = document.getElementById('postDate');
    if (dateElement) {
        dateElement.textContent = formatDate(post.createdAt);
    }
    
    // 내용
    const contentElement = document.getElementById('postContent');
    if (contentElement) {
        const formattedContent = escapeHtml(post.content || '').replace(/\n/g, '<br>');
        contentElement.innerHTML = formattedContent;
    }
    
    // 조회수
    const viewsEl = document.getElementById('postViews');
    if( viewsEl) {
        const views = (typeof post.viewCount === 'number') ? post.viewCount : (post.viewCount ?? 0);
        viewsEl.textContent = `👁️${views.toLocaleString()}`;
    }

    // 좋아요
    const metaRight = document.querySelector('#postDetailMetaArea');
    if (metaRight && !document.getElementById('likeSection')) {
        const likeWrap = document.createElement('div');
        likeWrap.id = 'likeSection';
        likeWrap.innerHTML = `
            <button id="likeBtn" type="button" class="like-btn"
                style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border:1px solid #ffd6de;border-radius:999px;background:#fff0f3;cursor:pointer;">
                <i class="fa fa-heart" aria-hidden="true" style="color:#ff4d6d;"></i>
                <span id="likeBtnLabel">좋아요</span>
                <strong id="likesCount" style="margin-left:4px;">${formatCount(post.likesCount)}</strong>
                
            </button>
            
        `;
        metaRight.prepend(likeWrap);
        
    // 초기 liked 상태를 서버가 내려주면 반영(없으면 false로)
    updateLikeButtonUI(!!post.likedByMe);
    attachLikeHandlers(post.postId);
}

function updateLikeButtonUI(liked) {
    const btn = document.getElementById('likeBtn');
    const label = document.getElementById('likeBtnLabel');
    if (!btn || !label) return;

    if (liked) {
        btn.style.background = '#ffe3ea';
        btn.style.borderColor = '#ffb3c2';
        label.textContent = '💔';
        btn.setAttribute('data-liked', 'true');
    } else {
        btn.style.background = '#fff0f3';
        btn.style.borderColor = '#ffd6de';
        label.textContent = '❤️';
        btn.setAttribute('data-liked', 'false');
    }
}
function attachLikeHandlers(postId) {
  const btn = document.getElementById('likeBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const liked = btn.getAttribute('data-liked') === 'true';

    // like/unlike로 분기
    const res = liked ? await postAPI.unlike(postId) : await postAPI.like(postId);

    if (res?.success) {
      // 서버가 최신 카운트를 내려주지 않는 케이스 대비
      const c = document.getElementById('likesCount');
      const next = (res.data?.likesCount != null)
        ? Number(res.data.likesCount)
        : Number(currentPost?.likesCount ?? 0) + (liked ? -1 : 1);

      if (c) c.textContent = formatCount(next);
      updateLikeButtonUI(!liked);
      currentPost = { ...currentPost, likedByMe: !liked, likesCount: next };
    } else if (res?.status === 401) {
      showAlert('로그인이 필요합니다.', 'error');
      setTimeout(() => (window.location.href = '/login'), 800);
    } else {
      showAlert(res?.message ?? '좋아요 처리 중 오류가 발생했습니다.', 'error');
    }
  });
}




    // 이미지 슬라이더 렌더링
    const imagesElement = document.getElementById('postImages');
    if (imagesElement) {
        imagesElement.innerHTML = '';
        
        if (post.images && post.images.length > 0) {
            renderImageSlider(post.images, imagesElement);
        }
    }
}

// 이미지 슬라이더 렌더링
function renderImageSlider(images, container) {
    // 슬라이더 컨테이너
    const slider = document.createElement('div');
    slider.className = 'image-slider';
    slider.style.position = 'relative';
    slider.style.maxWidth = '800px';
    slider.style.margin = '20px auto';
    
    // 이미지 컨테이너
    const imageContainer = document.createElement('div');
    imageContainer.className = 'slider-images';
    imageContainer.style.position = 'relative';
    imageContainer.style.width = '100%';
    imageContainer.style.overflow = 'hidden';
    
    // 이미지 추가
    images.forEach((image, index) => {
        if (image.url) {
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = `이미지 ${index + 1}`;
            img.className = 'slider-image';
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.maxHeight = '600px';
            img.style.objectFit = 'contain';
            img.style.display = index === 0 ? 'block' : 'none';
            img.dataset.index = index;
            img.onerror = function() {
                console.error('이미지 로드 실패:', image.url);
                this.remove();
            };
            imageContainer.appendChild(img);
        }
    });
    
    slider.appendChild(imageContainer);
    
    // 이미지가 2개 이상일 때만 네비게이션 표시
    if (images.length > 1) {
        // 이전 버튼
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider-btn slider-prev';
        prevBtn.innerHTML = '&#10094;';
        prevBtn.style.position = 'absolute';
        prevBtn.style.left = '10px';
        prevBtn.style.top = '50%';
        prevBtn.style.transform = 'translateY(-50%)';
        prevBtn.style.background = 'rgba(0,0,0,0.5)';
        prevBtn.style.color = 'white';
        prevBtn.style.border = 'none';
        prevBtn.style.padding = '15px 20px';
        prevBtn.style.cursor = 'pointer';
        prevBtn.style.fontSize = '18px';
        prevBtn.style.borderRadius = '5px';
        prevBtn.style.zIndex = '10';
        prevBtn.onclick = () => changeImage(-1, images);
        
        // 다음 버튼
        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider-btn slider-next';
        nextBtn.innerHTML = '&#10095;';
        nextBtn.style.position = 'absolute';
        nextBtn.style.right = '10px';
        nextBtn.style.top = '50%';
        nextBtn.style.transform = 'translateY(-50%)';
        nextBtn.style.background = 'rgba(0,0,0,0.5)';
        nextBtn.style.color = 'white';
        nextBtn.style.border = 'none';
        nextBtn.style.padding = '15px 20px';
        nextBtn.style.cursor = 'pointer';
        nextBtn.style.fontSize = '18px';
        nextBtn.style.borderRadius = '5px';
        nextBtn.style.zIndex = '10';
        nextBtn.onclick = () => changeImage(1, images);
        
        // 인디케이터
        const indicators = document.createElement('div');
        indicators.className = 'slider-indicators';
        indicators.style.textAlign = 'center';
        indicators.style.marginTop = '10px';
        
        for (let i = 0; i < images.length; i++) {
            const dot = document.createElement('span');
            dot.className = 'indicator-dot';
            dot.style.display = 'inline-block';
            dot.style.width = '10px';
            dot.style.height = '10px';
            dot.style.borderRadius = '50%';
            dot.style.background = i === 0 ? '#007bff' : '#ddd';
            dot.style.margin = '0 5px';
            dot.style.cursor = 'pointer';
            dot.dataset.index = i;
            dot.onclick = () => goToImage(i, images);
            indicators.appendChild(dot);
        }
        
        slider.appendChild(prevBtn);
        slider.appendChild(nextBtn);
        slider.appendChild(indicators);
        
        // 이미지 개수 표시
        const counter = document.createElement('div');
        counter.className = 'image-counter';
        counter.id = 'imageCounter';
        counter.textContent = `1 / ${images.length}`;
        counter.style.textAlign = 'center';
        counter.style.marginTop = '10px';
        counter.style.fontSize = '14px';
        counter.style.color = '#666';
        slider.appendChild(counter);
    }
    
    container.appendChild(slider);
}

// 이미지 변경
function changeImage(direction, images) {
    currentImageIndex += direction;
    
    // 순환
    if (currentImageIndex < 0) {
        currentImageIndex = images.length - 1;
    } else if (currentImageIndex >= images.length) {
        currentImageIndex = 0;
    }
    
    updateSliderDisplay(images);
}

// 특정 이미지로 이동
function goToImage(index, images) {
    currentImageIndex = index;
    updateSliderDisplay(images);
}

// 슬라이더 화면 업데이트
function updateSliderDisplay(images) {
    // 이미지 표시/숨김
    const sliderImages = document.querySelectorAll('.slider-image');
    sliderImages.forEach((img, index) => {
        img.style.display = index === currentImageIndex ? 'block' : 'none';
    });
    
    // 인디케이터 업데이트
    const dots = document.querySelectorAll('.indicator-dot');
    dots.forEach((dot, index) => {
        dot.style.background = index === currentImageIndex ? '#007bff' : '#ddd';
    });
    
    // 카운터 업데이트
    const counter = document.getElementById('imageCounter');
    if (counter) {
        counter.textContent = `${currentImageIndex + 1} / ${images.length}`;
    }
}

// 수정/삭제 버튼 표시
function showActionButtons() {
    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) {
        actionButtons.style.display = 'inline-block';
    }
}

// 게시글 삭제
async function handleDeletePost(postId) {
    const confirmed = confirm('정말로 이 게시글을 삭제하시겠습니까?');
    if (!confirmed) return;
    
    try {
        const result = await postAPI.deletePost(postId);
        
        if (result.success) {
            showAlert('게시글이 삭제되었습니다.', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } else {
            showAlert(result.message || '게시글 삭제에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        showAlert('게시글 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 댓글 목록 로드
async function loadComments(postId) {
    try {
        const result = await commentsAPI.getComments(postId);

        if (!result.success) {
            console.warn('댓글 로드 실패:', result.message || result.code || result.status);
            renderComments([]);
            return;
        }
        const comments = Array.isArray(result.data) ? result.data : [];
        renderComments(comments);
    } catch (error) {
        console.error('댓글 로드 오류:', error);
        renderComments([]);
    }
}

// 댓글 렌더링
function renderComments(comments) {
    const listEl = document.getElementById('commentsList');
    const countEl = document.getElementById('commentCount');
    if (!listEl) return;

    if(countEl) countEl.textContent = comments.length ?? 0;

    if (!comments.length) {
        listEl.innerHTML = `
      <li style="color:#888; padding:8px 0;">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</li>
    `;
    return;
    }

    // 목록 렌더
    const html = comments.map(buildCommentItemHTML).join('');
    listEl.innerHTML = html;

    // 페이지넹시녀/더보기는 서버 스펙 정해지면 on/off

}

// 단일 댓글 템플릿
function buildCommentItemHTML(comment) {
    const nickname = escapeHtml(comment.authorNickname ?? '익명');
    const content = escapeHtml(comment.content ?? '').replace(/\n/g, '<br>');
    const created = comment.createdAt ? formatDate(comment.createdAt) : '';
    const mineBadge = comment.mine ? `<span style="margin-left:6px; font-size:12px; color:#007bff;">내 댓글</span>` : '';

    return `
    <li class="comment-item" data-comment-id="${comment.commentId}" style="border-bottom:1px solid #eee; padding:12px 0;">
        <div class= "comment-meta" style="font-size:14px; color: #666;">
            <strong>${nickname}</strong>${mineBadge}
            <span style="margin-left:8px;">. ${created}</span>
            </div>
        <div class="comment-body" style="margin-top:6px; font-size:15px; line-height:1.5;">
        ${content}
        </div>
        
        <!--
        <div class="comment-actions" style="margin-top:8px;">
            <button class="btn btn-xs">좋아요 ${comment.likesCount ?? 0}</button>
            ${comment.mine ? '<button class="btn btn-xs btn-outline">수정</button><button class="btn btn-xs btn-danger-outline">삭제</button>' : ''}
        </div>
        -->
        </li>
    `;
}




// 목록으로 돌아가기
function goBack() {
    window.location.href = '/';
}
