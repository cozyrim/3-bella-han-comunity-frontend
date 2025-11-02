// 게시글 상태
let currentPost = null;
let removeImageIds = [];

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;
    
    const postId = getQueryParam('id');
    
    if (!postId) {
        showAlert('잘못된 접근입니다.', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        return;
    }
    
    loadPostForEdit(postId);
    
    const editPostForm = document.getElementById('editPostForm');
    if (editPostForm) {
        editPostForm.addEventListener('submit', (e) => handleUpdatePost(e, postId));
    }
    
    const editPostImages = document.getElementById('editPostImages');
    if (editPostImages) {
        editPostImages.addEventListener('change', handleNewImagePreview);
    }
});

// 수정할 게시글 로드
async function loadPostForEdit(postId) {
    try {
        const result = await postAPI.getPost(postId);
        
        if (result.success && result.data) {
            currentPost = result.data;
            
            // 작성자 확인
            if (!currentUser || currentPost.authorId !== currentUser.userId) {
                showAlert('게시글 작성자만 수정할 수 있습니다.', 'error');
                setTimeout(() => {
                    window.location.href = `/post-detail?id=${postId}`;
                }, 1000);
                return;
            }
            
            // 폼에 데이터 채우기
            document.getElementById('editPostTitle').value = currentPost.title || '';
            document.getElementById('editPostContent').value = currentPost.content || '';
            
            // 기존 이미지 표시
            renderExistingImages(currentPost.images || []);
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

// 기존 이미지 렌더링
function renderExistingImages(images) {
    const container = document.getElementById('existingImages');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (images.length === 0) {
        container.innerHTML = '<p>등록된 이미지가 없습니다.</p>';
        return;
    }
    
    images.forEach(image => {
        const imageItem = document.createElement('div');
        imageItem.className = 'existing-image-item';
        imageItem.style.display = 'inline-block';
        imageItem.style.position = 'relative';
        imageItem.style.margin = '10px';
        
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = '기존 이미지';
        img.style.width = '150px';
        img.style.height = '150px';
        img.style.objectFit = 'cover';
        img.style.border = image.isPrimary ? '3px solid #007bff' : '1px solid #ddd';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-delete-image';
        deleteBtn.textContent = '삭제';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '5px';
        deleteBtn.style.right = '5px';
        deleteBtn.style.padding = '5px 10px';
        deleteBtn.style.fontSize = '12px';
        deleteBtn.onclick = () => markImageForDeletion(image.imageId, imageItem);
        
        imageItem.appendChild(img);
        imageItem.appendChild(deleteBtn);
        
        if (image.isPrimary) {
            const badge = document.createElement('span');
            badge.textContent = '대표';
            badge.style.position = 'absolute';
            badge.style.top = '5px';
            badge.style.left = '5px';
            badge.style.background = '#007bff';
            badge.style.color = 'white';
            badge.style.padding = '2px 8px';
            badge.style.fontSize = '12px';
            badge.style.borderRadius = '3px';
            imageItem.appendChild(badge);
        }
        
        container.appendChild(imageItem);
    });
}

// 이미지 삭제 표시
function markImageForDeletion(imageId, imageElement) {
    const confirmed = confirm('이 이미지를 삭제하시겠습니까?');
    if (!confirmed) return;
    
    removeImageIds.push(imageId);
    imageElement.style.opacity = '0.3';
    imageElement.style.pointerEvents = 'none';
    
    const deleteBtn = imageElement.querySelector('.btn-delete-image');
    if (deleteBtn) {
        deleteBtn.textContent = '삭제 예정';
        deleteBtn.disabled = true;
    }
}

// 새 이미지 미리보기
async function handleNewImagePreview(e) {
    const files = e.target.files;
    const previewContainer = document.getElementById('newImagePreview');
    
    if (!previewContainer) {
        const container = document.createElement('div');
        container.id = 'newImagePreview';
        container.style.marginTop = '10px';
        e.target.parentElement.appendChild(container);
    }
    
    const preview = document.getElementById('newImagePreview');
    preview.innerHTML = '';
    
    if (files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
        try {
            const previewUrl = await createImagePreview(files[i]);
            
            const imgWrapper = document.createElement('div');
            imgWrapper.style.display = 'inline-block';
            imgWrapper.style.margin = '10px';
            
            const img = document.createElement('img');
            img.src = previewUrl;
            img.alt = files[i].name;
            img.style.width = '150px';
            img.style.height = '150px';
            img.style.objectFit = 'cover';
            img.style.border = '1px solid #ddd';
            
            const fileName = document.createElement('p');
            fileName.textContent = files[i].name;
            fileName.style.fontSize = '12px';
            fileName.style.margin = '5px 0 0 0';
            
            imgWrapper.appendChild(img);
            imgWrapper.appendChild(fileName);
            preview.appendChild(imgWrapper);
        } catch (error) {
            console.error('이미지 미리보기 오류:', error);
        }
    }
}

// 게시글 수정 처리
async function handleUpdatePost(e, postId) {
    e.preventDefault();
    
    const title = document.getElementById('editPostTitle').value.trim();
    const content = document.getElementById('editPostContent').value.trim();
    const newImageFiles = document.getElementById('editPostImages').files;
    
    if (!title) {
        showAlert('제목을 입력해주세요.', 'error');
        return;
    }
    
    if (title.length > 100) {
        showAlert('제목은 100자를 초과할 수 없습니다.', 'error');
        return;
    }
    
    if (!content) {
        showAlert('내용을 입력해주세요.', 'error');
        return;
    }
    
    if (content.length > 5000) {
        showAlert('내용은 5000자를 초과할 수 없습니다.', 'error');
        return;
    }
    
    const newImages = Array.from(newImageFiles);
    if (newImages.length > 0) {
        const validation = validateImageFiles(newImages);
        if (!validation.valid) {
            showAlert(validation.errors.join('\n'), 'error');
            return;
        }
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '수정 중...';
    submitBtn.disabled = true;
    
    try {
        const result = await postAPI.updatePost(postId, title, content, newImages, removeImageIds);
        
        if (result.success) {
            showAlert('게시글이 수정되었습니다.', 'success');
            setTimeout(() => {
                window.location.href = `/post-detail?id=${postId}`;
            }, 500);
        } else {
            showAlert(result.message || '게시글 수정에 실패했습니다.', 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('게시글 수정 오류:', error);
        showAlert('게시글 수정 중 오류가 발생했습니다.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 상세 페이지로 돌아가기
function goBackToDetail() {
    const postId = getQueryParam('id');
    if (postId) {
        window.location.href = `/post-detail?id=${postId}`;
    } else {
        window.location.href = '/';
    }
}
