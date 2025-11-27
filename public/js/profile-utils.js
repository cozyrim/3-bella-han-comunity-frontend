// === Validation rules ===
window.NICK_REGEX = /^[a-zA-Z0-9가-힣_]{2,20}$/;

export function validateEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
export function validateNickname(v){
  if (!v) return { valid:false, message:'닉네임을 입력해주세요.' };
  if (!NICK_REGEX.test(v)) return { valid:false, message:'2~20자의 한글/영문/숫자/_ 만 가능합니다.' };
  if (v.length > 10) return { valid:false, message:'닉네임은 10자 이하여야 합니다.' };
  return { valid:true, message:'사용 가능한 형식입니다.' };
}
export function validatePassword(v){
  if (!v || v.length < 6 || v.length > 20) return { valid:false, message:'6~20자' };
  return { valid:true, message:'OK' };
}
export function validatePasswordConfirm(pw, confirm){
  if (pw !== confirm) return { valid:false, message:'비밀번호가 일치하지 않습니다.' };
  return { valid:true, message:'일치합니다.' };
}

// === Image helpers ===
export function validateImageFile(file){
  if (!file) return { valid:false, message:'파일이 없습니다.' };
  if (!file.type.startsWith('image/')) return { valid:false, message:'이미지 파일만 가능합니다.' };
  if (file.size > 5 * 1024 * 1024) return { valid:false, message:'이미지는 5MB 이하' };
  return { valid:true, message:'OK' };
}

export function createImagePreview(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// === Debounce ===
export function debounce(fn, ms=400){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=>fn(...args), ms);
  };
}

/**
 * 이미지 인풋과 미리보기 DOM을 한 번에 묶어주는 유틸
 * @param {{inputEl:HTMLInputElement, previewImgEl?:HTMLImageElement, previewContainerEl?:HTMLElement, helperEl?:HTMLElement, onValid:(file)=>void, onInvalid?:(msg)=>void}}
 */
export function wireImagePicker({inputEl, previewImgEl, previewContainerEl, helperEl, onValid, onInvalid}){
  inputEl.addEventListener('change', async (e)=>{
    const file = e.target.files?.[0];
    if (!file){ if(previewContainerEl) previewContainerEl.innerHTML=''; return; }
    const check = validateImageFile(file);
    if (!check.valid){ onInvalid?.(check.message); inputEl.value=''; return; }

    const url = await createImagePreview(file);
    if (previewImgEl) previewImgEl.src = url;
    if (previewContainerEl) previewContainerEl.innerHTML = `<img src="${url}" alt="미리보기">`;
    if (helperEl){ helperEl.textContent = '이미지 선택됨'; helperEl.style.color = '#2e7d32'; }
    onValid?.(file);
  });
}