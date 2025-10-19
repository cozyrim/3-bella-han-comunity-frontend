// 게시글 상태
let currentPost = null;
let currentImageIndex = 0;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    const postId = getQueryParam('id');
    
    if (!postId) {
        showAlert('잘못된 접근입니다.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        return;
    }
    
    loadPost(postId);
    
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => handleDeletePost(postId));
    }
    
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            window.location.href = `edit-post.html?id=${postId}`;
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
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (error) {
        console.error('게시글 로드 오류:', error);
        showAlert('게시글을 불러오는 중 오류가 발생했습니다.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
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
                window.location.href = 'index.html';
            }, 500);
        } else {
            showAlert(result.message || '게시글 삭제에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        showAlert('게시글 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 목록으로 돌아가기
function goBack() {
    window.location.href = 'index.html';
}
