import { watch, onMounted, onUnmounted } from 'vue/dist/vue.esm-bundler.js';

/** lifecycle: shared refs and actions are explicitly accessed through ctx. */
export function initLifecycle(ctx) {
  let noticeTimeout;
  watch(ctx.notice, value => {
    clearTimeout(noticeTimeout);
    if (value) noticeTimeout = setTimeout(() => { ctx.notice.value = ''; }, 3000);
  });
  watch(ctx.showSettingsView, () => { ctx.settingsCategory.value = null; });
  watch(ctx.detailExercise, value => {
    document.body.style.overflow = value ? 'hidden' : '';
  });
  watch([ctx.librarySearch, ctx.libraryEquipment, ctx.libraryMuscle], () => {
    ctx.libraryPage.value = 1;
  });
  ctx.onVisible = () => {
    ctx.tick();
    ctx.updateWakeLock();
    ctx.checkReminders();
  };
  onMounted(() => {
    ctx.loadLocalStorage();
    try {
      ctx.unlockedAchievements.value = JSON.parse(localStorage.getItem('pulse_achievements') || '{}');
    } catch (_) {}
    ctx.applySettings();
    ctx.checkReminders();
    ctx.reminderInterval = setInterval(ctx.checkReminders, 15000);
    document.addEventListener('visibilitychange', ctx.onVisible);
    ctx.systemTheme.addEventListener('change', ctx.applySettings);
    watch(ctx.userAchievements, list => {
      let changed = false;
      for (const a of list) if (a.unlocked && !ctx.unlockedAchievements.value[a.id]) {
        ctx.unlockedAchievements.value[a.id] = Date.now();
        changed = true;
      }
      if (changed) ctx.safeSave('pulse_achievements', ctx.unlockedAchievements.value);
    }, {
      immediate: true
    });
    watch(ctx.activeTab, ctx.updateWakeLock);
  });
  onUnmounted(() => {
    clearTimeout(noticeTimeout);
    clearInterval(ctx.timerInterval);
    clearInterval(ctx.reminderInterval);
    ctx.wakeLock?.release();
    window.speechSynthesis?.cancel();
    document.removeEventListener('visibilitychange', ctx.onVisible);
    ctx.systemTheme.removeEventListener('change', ctx.applySettings);
  });
}
