import { nextTick } from 'vue/dist/vue.esm-bundler.js';

/** profile: shared refs and actions are explicitly accessed through ctx. */
export function initProfile(ctx) {
  ctx.startEditName = () => {
    if (ctx.pendingProfileEdit.value) return;
    ctx.tempName.value = ctx.userProfile.value.name;
    ctx.isEditingName.value = true;
    nextTick(() => document.getElementById('profile-name-input')?.focus());
  };
  ctx.queueProfileEdit = (field, raw) => {
    if (ctx.pendingProfileEdit.value) return;
    ctx.isEditingName.value = false;
    ctx.isEditingUsername.value = false;
    const value = field === 'username' ? raw.trim().replace(/^@/, '') || 'sample' : raw.trim();
    if (!value || value === (ctx.userProfile.value[field] || (field === 'username' ? 'sample' : ''))) return;
    ctx.pendingProfileEdit.value = {field, value};
    nextTick(() => document.getElementById('profile-edit-cancel')?.focus());
  };
  ctx.saveName = () => ctx.queueProfileEdit('name', ctx.tempName.value);
  ctx.startEditUsername = () => {
    if (ctx.pendingProfileEdit.value) return;
    ctx.tempUsername.value = ctx.userProfile.value.username || 'sample';
    ctx.isEditingUsername.value = true;
    nextTick(() => document.getElementById('profile-username-input')?.focus());
  };
  ctx.saveUsername = () => ctx.queueProfileEdit('username', ctx.tempUsername.value);
  ctx.confirmProfileEdit = () => {
    const edit = ctx.pendingProfileEdit.value;
    if (!edit) return;
    ctx.userProfile.value[edit.field] = edit.value;
    ctx.saveProfileToStorage();
    ctx.pendingProfileEdit.value = null;
  };
  ctx.cancelProfileEdit = () => {ctx.pendingProfileEdit.value = null;};
  ctx.cycleProfileConfirmFocus = () => {
    document.getElementById(document.activeElement?.id === 'profile-edit-cancel' ? 'profile-edit-confirm' : 'profile-edit-cancel')?.focus();
  };
  ctx.startEditBio = () => {
    ctx.tempBio.value = ctx.userProfile.value.bio || '';
    ctx.isEditingBio.value = true;
  };
  ctx.saveBio = () => {
    ctx.userProfile.value.bio = ctx.tempBio.value.trim();
    ctx.saveProfileToStorage();
    ctx.isEditingBio.value = false;
  };
  ctx.toggleInterest = interest => {
    if (!ctx.userProfile.value.interests) ctx.userProfile.value.interests = [];
    const idx = ctx.userProfile.value.interests.indexOf(interest);
    if (idx > -1) {
      ctx.userProfile.value.interests.splice(idx, 1);
    } else {
      ctx.userProfile.value.interests.push(interest);
    }
    ctx.saveProfileToStorage();
  };
  ctx.triggerAvatarFileSelect = () => ctx.fileInput.value?.click();
  ctx.onAvatarFileSelected = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      ctx.avatarError.value = 'Please select a valid image file.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      ctx.avatarError.value = 'File size exceeds 5MB limit.';
      return;
    }
    ctx.avatarError.value = '';
    ctx.loadedImageObj = null;
    const reader = new FileReader();
    reader.onload = ev => {
      ctx.rawImageSrc.value = ev.target.result;
      ctx.cropZoom.value = 1;
      ctx.cropOffsetX.value = 0;
      ctx.cropOffsetY.value = 0;
      ctx.showCropModal.value = true;
      const img = new Image();
      img.onload = () => {
        ctx.loadedImageObj = img;
        nextTick(() => ctx.renderCropPreview());
      };
      img.onerror = () => {
        ctx.avatarError.value = 'Could not open this image. Try a JPG, PNG or WebP file.';
        ctx.showCropModal.value = false;
      };
      img.src = ev.target.result;
    };
    reader.onerror = () => { ctx.avatarError.value = 'Could not read this image. Please select it again.'; };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  ctx.renderCropPreview = () => {
    if (!ctx.cropCanvasRef.value || !ctx.loadedImageObj) return;
    const canvas = ctx.cropCanvasRef.value;
    const drawingContext = canvas.getContext('2d');
    if (!drawingContext) return;
    const size = canvas.width;
    const zoom = ctx.cropZoom.value;
    const imgWidth = ctx.loadedImageObj.width;
    const imgHeight = ctx.loadedImageObj.height;
    const minScale = size / Math.min(imgWidth, imgHeight);
    const scale = minScale * zoom;
    const drawW = imgWidth * scale;
    const drawH = imgHeight * scale;
    const maxOffsetX = (drawW - size) / 2;
    const maxOffsetY = (drawH - size) / 2;
    ctx.cropOffsetX.value = Math.max(-maxOffsetX, Math.min(maxOffsetX, ctx.cropOffsetX.value));
    ctx.cropOffsetY.value = Math.max(-maxOffsetY, Math.min(maxOffsetY, ctx.cropOffsetY.value));
    drawingContext.clearRect(0, 0, size, size);
    const x = (size - drawW) / 2 + ctx.cropOffsetX.value;
    const y = (size - drawH) / 2 + ctx.cropOffsetY.value;
    drawingContext.drawImage(ctx.loadedImageObj, x, y, drawW, drawH);
  };
  ctx.startCropDrag = e => {
    ctx.isDraggingCrop = true;
    ctx.cropDragStart = {
      x: e.clientX - ctx.cropOffsetX.value,
      y: e.clientY - ctx.cropOffsetY.value
    };
  };
  ctx.startCropDragTouch = e => {
    if (!e.touches[0]) return;
    ctx.isDraggingCrop = true;
    ctx.cropDragStart = {
      x: e.touches[0].clientX - ctx.cropOffsetX.value,
      y: e.touches[0].clientY - ctx.cropOffsetY.value
    };
  };
  ctx.onCropDrag = e => {
    if (!ctx.isDraggingCrop) return;
    ctx.cropOffsetX.value = e.clientX - ctx.cropDragStart.x;
    ctx.cropOffsetY.value = e.clientY - ctx.cropDragStart.y;
    ctx.renderCropPreview();
  };
  ctx.onCropDragTouch = e => {
    if (!ctx.isDraggingCrop || !e.touches[0]) return;
    ctx.cropOffsetX.value = e.touches[0].clientX - ctx.cropDragStart.x;
    ctx.cropOffsetY.value = e.touches[0].clientY - ctx.cropDragStart.y;
    ctx.renderCropPreview();
  };
  ctx.stopCropDrag = () => {
    ctx.isDraggingCrop = false;
  };
  ctx.applyCroppedAvatar = () => {
    if (!ctx.cropCanvasRef.value || !ctx.loadedImageObj) return;
    ctx.renderCropPreview();
    const compressedDataUrl = ctx.cropCanvasRef.value.toDataURL('image/jpeg', 0.82);
    ctx.userProfile.value.avatarUrl = compressedDataUrl;
    ctx.saveProfileToStorage();
    ctx.showCropModal.value = false;
  };
}
