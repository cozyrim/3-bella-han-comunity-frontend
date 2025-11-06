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
        dateElement.textContent = formatDateTime(post.createdAt);
    }
    
    // 내용
    const contentElement = document.getElementById('postContent');
    if (contentElement) {
        const formattedContent = escapeHtml(post.content || '').replace(/\n/g, '<br>');
        contentElement.innerHTML = formattedContent;
    }

    // 메타 숫자/색 채우고, 좋아요 클릭 바인딩
  renderDetailMeta(post);
  bindLikeHandler(post.postId);

  // (이미지 슬라이더 렌더는 기존 그대로)
    const imagesElement = document.getElementById('postImages');
    if (imagesElement) {
        imagesElement.innerHTML = '';
        
        if (post.images && post.images.length > 0) {
            renderImageSlider(post.images, imagesElement);
        }
    }
}





function renderDetailMeta(post) {
  document.getElementById('detail-comments').textContent =
    formatCount(post.commentsCount ?? 0);

  document.getElementById('detail-likes').textContent =
    formatCount(post.likesCount ?? 0);

  document.getElementById('detail-views').textContent =
    (post.viewCount ?? 0).toLocaleString();

  // 좋아요 눌림 상태에 따라 색상 강조
  const likeBtn = document.getElementById('detail-like-btn');
  if (likeBtn) {
    const liked = !!post.likedByMe;
    likeBtn.setAttribute('aria-pressed', String(liked));
    likeBtn.style.background = liked ? '#ffe3ea' : '#fff0f3';
    likeBtn.style.borderColor = liked ? '#ffb3c2' : '#ffd6de';
  }
}

function bindLikeHandler(postId) {
  const btn = document.getElementById('detail-like-btn');
  if (!btn || btn.__bound) return;
  btn.__bound = true;

  btn.addEventListener('click', async () => {
    if (!sessionStorage.getItem('accessToken')) {
      showAlert('로그인이 필요합니다.', 'error');
      setTimeout(() => (window.location.href = '/login'), 600);
      return;
    }

    const liked = !!currentPost?.likedByMe;
    btn.disabled = true;

    const res = liked ? await postAPI.unlike(postId) : await postAPI.like(postId);
    btn.disabled = false;

    if (res?.success) {
      const nextLikes = (res.data?.likesCount != null)
        ? Number(res.data.likesCount)
        : Number(currentPost?.likesCount ?? 0) + (liked ? -1 : 1);

      currentPost = { ...currentPost, likedByMe: !liked, likesCount: nextLikes };
      renderDetailMeta(currentPost);                   // 상단 배지 + 버튼 색 같이 갱신
    } else if (res?.status === 401) {
      showAlert('로그인이 필요합니다.', 'error');
      setTimeout(() => (window.location.href = '/login'), 800);
    } else {
      showAlert(res?.message ?? '좋아요 처리 중 오류가 발생했습니다.', 'error');
    }
  });
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
    initCommentUI();
    setupCommentForm(postId);
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

    attachCommentActionHandlers();

    currentPost = { ...currentPost, commentsCount: comments.length };
    renderDetailMeta(currentPost);   // 배지 숫자 즉시 반영

}

// 로그인 여부로 입력폼/안내 토글
function initCommentUI() {
  const isLoggedIn = !!sessionStorage.getItem('currentUser');
  const gate = document.getElementById('commentLoginGate');  // 비로그인 안내
  const form = document.getElementById('commentFormWrap');   // 댓글 작성 폼
  if (!gate || !form) return;

  if (isLoggedIn) {
    gate.style.display = 'none';
    form.style.display = 'block';
  } else {
    gate.style.display = 'block';
    form.style.display = 'none';
  }
}

// 폼 이벤트 바인딩 (글자수/등록)
function setupCommentForm(postId) {
  const textarea = document.getElementById('commentContent');
  const counter  = document.getElementById('commentChars');
  const submit   = document.getElementById('commentSubmitBtn');
  if (!textarea || !counter || !submit) return;

  const MAX = 255;

  const updateState = () => {
    const len = textarea.value.trim().length;
    counter.textContent = `${len} / ${MAX}`;
    submit.disabled = len === 0 || len > MAX;
  };

  textarea.addEventListener('input', updateState);
  updateState();

  submit.addEventListener('click', async () => {
    // 로그인 안전망
    if (!sessionStorage.getItem('currentUser')) {
      showAlert('로그인이 필요합니다.', 'error');
      setTimeout(() => (window.location.href = '/login'), 600);
      return;
    }

    const content = textarea.value.trim();
    if (!content) return;

    submit.disabled = true;
    try {
      // 프로젝트에 따라 이름 다를 수 있어 두 가지 모두 지원
      const createFn = (commentsAPI.createComment || commentsAPI.create);
      if (!createFn) throw new Error('commentsAPI.create(…)/createComment(…) 가 필요합니다.');

      const res = await createFn(postId, content); // 서버: {success, data, message…} 가정
      if (res?.success) {
        textarea.value = '';
        updateState();
        await loadComments(postId);  // 목록 새로고침
      } else if (res?.status === 401) {
        showAlert('로그인이 필요합니다.', 'error');
        setTimeout(() => (window.location.href = '/login'), 600);
      } else {
        showAlert(res?.message || '댓글 등록에 실패했습니다.', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('댓글 등록 중 오류가 발생했습니다.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
}

function enterEditMode(li) {
  const view = li.querySelector('.comment-view');
  const edit = li.querySelector('.comment-edit');
  const input = li.querySelector('.comment-edit-input');
  const count = li.querySelector('.comment-edit-count');

  if (!view || !edit || !input || !count) return;

  // 기존 텍스트를 textarea에 채움 (br → \n)
  const rawHtml = view.innerHTML || '';
  const plain = rawHtml.replace(/<br\s*\/?>/gi, '\n').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  input.value = plain;

  const updateCount = () => { count.textContent = `${input.value.trim().length} / 255`; };
  input.addEventListener('input', updateCount);
  updateCount();

  view.style.display = 'none';
  edit.style.display = 'block';
}

function exitEditMode(li) {
  const view = li.querySelector('.comment-view');
  const edit = li.querySelector('.comment-edit');
  if (!view || !edit) return;
  edit.style.display = 'none';
  view.style.display = 'block';
}

let _commentUpdating = false;
async function saveEditedComment(li, commentId) {
  if (_commentUpdating) return;
  const input = li.querySelector('.comment-edit-input');
  const content = input?.value.trim() || '';
  if (!content || content.length > 255) {
    showAlert('내용은 1~255자여야 합니다.', 'error');
    return;
  }
  _commentUpdating = true;
  try {
    const postId = getQueryParam('id');
    const res = await commentsAPI.update(postId, commentId, content);
    if (res?.success) {
      await loadComments(postId);
      showAlert('댓글이 수정되었습니다.', 'success');
    } else {
      showAlert(res?.message || '댓글 수정에 실패했습니다.', 'error');
    }
  } catch (e) {
    console.error(e);
    showAlert('댓글 수정 중 오류가 발생했습니다.', 'error');
  } finally {
    _commentUpdating = false;
  }
}

let _commentDeleting = false;
async function deleteComment(commentId) {
  if (_commentDeleting) return;
  if (!confirm('이 댓글을 삭제할까요?')) return;
  _commentDeleting = true;
  try {
    const postId = getQueryParam('id');
    const res = await commentsAPI.remove(postId, commentId);
    if (res?.success) {
      await loadComments(postId);
      showAlert('댓글이 삭제되었습니다.', 'success');
    } else {
      showAlert(res?.message || '댓글 삭제에 실패했습니다.', 'error');
    }
  } catch (e) {
    console.error(e);
    showAlert('댓글 삭제 중 오류가 발생했습니다.', 'error');
  } finally {
    _commentDeleting = false;
  }
}



// 단일 댓글 템플릿
function buildCommentItemHTML(comment) {
  const nickname = escapeHtml(comment.authorNickname ?? '익명');
  const content  = escapeHtml(comment.content ?? '').replace(/\n/g, '<br>');
  const created  = comment.createdAt ? formatDateTime(comment.createdAt) : '';
  const mine     = !!comment.mine;

  return `
  <li class="comment-item" data-comment-id="${comment.commentId}" style="border-bottom:1px solid #eee; padding:12px 0;">
    <div class="comment-meta" style="font-size:14px; color:#666;">
      <strong>${nickname}</strong>${mine ? '<span style="margin-left:6px;font-size:12px;color:#007bff;">내 댓글</span>' : ''}
      <span style="margin-left:8px;">· ${created}</span>
    </div>

    <div class="comment-body" style="margin-top:6px; font-size:15px; line-height:1.5;">
      <div class="comment-view">${content}</div>

      <!-- 편집 모드 영역 (초기 숨김) -->
      <div class="comment-edit" style="display:none; margin-top:6px;">
        <textarea class="comment-edit-input" rows="3" maxlength="255" style="width:100%; box-sizing:border-box;"></textarea>
        <div style="display:flex; gap:8px; align-items:center; margin-top:6px;">
          <span class="comment-edit-count" style="font-size:12px; color:#888;">0 / 255</span>
          <div style="margin-left:auto; display:flex; gap:6px;">
            <button class="btn btn-xs comment-edit-save" style="padding:4px 8px; border:1px solid #ddd; border-radius:6px; background:#0d6efd; color:#fff;">저장</button>
            <button class="btn btn-xs comment-edit-cancel" style="padding:4px 8px; border:1px solid #ddd; border-radius:6px; background:#fff;">취소</button>
          </div>
        </div>
      </div>
    </div>

    ${mine ? `
    <div class="comment-actions" style="margin-top:8px; display:flex; gap:8px;">
      <button class="btn btn-xs comment-edit-btn" style="padding:4px 8px; border:1px solid #ddd; border-radius:6px; background:#fff;">수정</button>
      <button class="btn btn-xs comment-delete-btn" style="padding:4px 8px; border:1px solid #ffb4b4; border-radius:6px; background:#fff0f0; color:#d00;">삭제</button>
    </div>
    ` : ''}
  </li>
  `;
}

function attachCommentActionHandlers() {
  const listEl = document.getElementById('commentsList');
  if (!listEl || listEl.__handlersBound) return; // 중복 방지
  listEl.__handlersBound = true;

  listEl.addEventListener('click', async (e) => {
    const li = e.target.closest('.comment-item');
    if (!li) return;
    const commentId = li.getAttribute('data-comment-id');

    // 수정 버튼
    if (e.target.closest('.comment-edit-btn')) {
      enterEditMode(li);
      return;
    }

    // 취소 버튼
    if (e.target.closest('.comment-edit-cancel')) {
      exitEditMode(li);
      return;
    }

    // 저장 버튼
    if (e.target.closest('.comment-edit-save')) {
      await saveEditedComment(li, commentId);
      return;
    }

    // 삭제 버튼
    if (e.target.closest('.comment-delete-btn')) {
      await deleteComment(commentId);
      return;
    }
  });
}


// 목록으로 돌아가기
function goBack() {
    window.location.href = '/';
}