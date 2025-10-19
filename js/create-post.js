// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (!requireLogin()) return;
    
    const createPostForm = document.getElementById('createPostForm');
    if (createPostForm) {
        createPostForm.addEventListener('submit', handleCreatePost);
    }
    
    const postImages = document.getElementById('postImages');
    if (postImages) {
        postImages.addEventListener('change', handleImagePreview);
    }
});

// 게시글 작성
async function handleCreatePost(e) {
    e.preventDefault();
    
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const imageFiles = document.getElementById('postImages').files;
    
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
    
    const images = Array.from(imageFiles);
    if (images.length > 0) {
        const validation = validateImageFiles(images);
        if (!validation.valid) {
            showAlert(validation.errors.join('\n'), 'error');
            return;
        }
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '작성 중...';
    submitBtn.disabled = true;
    
    try {
        const result = await postAPI.createPost(title, content, images);
        
        if (result.success) {
            showAlert('게시글이 작성되었습니다.', 'success');
            setTimeout(() => {
                window.location.href = '/pages/index.html';
            }, 500);
        } else {
            showAlert(result.message || '게시글 작성에 실패했습니다.', 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('게시글 작성 오류:', error);
        showAlert('게시글 작성 중 오류가 발생했습니다.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 이미지 미리보기
async function handleImagePreview(e) {
    const files = e.target.files;
    const previewContainer = document.getElementById('imagePreview');
    
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    if (files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
        try {
            const preview = await createImagePreview(files[i]);
            
            const img = document.createElement('img');
            img.src = preview;
            img.alt = files[i].name;
            img.className = 'preview-image';
            
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.appendChild(img);
            
            const fileName = document.createElement('span');
            fileName.className = 'preview-filename';
            fileName.textContent = files[i].name;
            previewItem.appendChild(fileName);
            
            previewContainer.appendChild(previewItem);
        } catch (error) {
            console.error('이미지 미리보기 오류:', error);
        }
    }
}
