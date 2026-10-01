/** settings: shared refs and actions are explicitly accessed through ctx. */
export function initSettings(ctx) {
  ctx.submitReport = () => {
    if (!ctx.problemDescription.value.trim()) return;
    ctx.downloadJSON({
      description: ctx.problemDescription.value,
      version: 'PULSE local'
    }, 'pulse-problem-report.json');
    ctx.notice.value = 'Report downloaded. No report was sent.';
    ctx.problemDescription.value = '';
    ctx.showReportModal.value = false;
  };
  ctx.confirmSignOut = () => { window.location.assign(new URL('login.html', document.baseURI)); };
  ctx.unblockUser = username => {
    ctx.userSettings.value.blockedUsers = ctx.userSettings.value.blockedUsers.filter(u => u !== username);
    ctx.saveSettingsToStorage();
  };
  ctx.applySettings = () => {
    document.documentElement.classList.toggle('light-mode', ctx.userSettings.value.theme === 'light' || ctx.userSettings.value.theme === 'system' && !ctx.systemTheme.matches);
    document.documentElement.classList.toggle('reduce-motion', ctx.userSettings.value.reducedAnimations);
    document.documentElement.style.fontSize = {
      small: '14px',
      medium: '16px',
      large: '19px'
    }[ctx.userSettings.value.textSize] || '16px';
    ctx.updateWakeLock();
    if (!ctx.userSettings.value.voiceInstructions) window.speechSynthesis?.cancel();
  };
  ctx.toggleReminders = async () => {
    ctx.userSettings.value.remindersEnabled = !ctx.userSettings.value.remindersEnabled;
    if (ctx.userSettings.value.remindersEnabled && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (_) {}
    }
    ctx.saveSettingsToStorage();
    if (ctx.userSettings.value.remindersEnabled) ctx.notice.value = 'Reminders work while this page is open. Browser alerts depend on notification permission.';
  };
  ctx.checkReminders = () => {
    ctx.clockDay.value = new Date().toDateString();
    if (!ctx.userSettings.value.remindersEnabled) return;
    const now = new Date(),
      time = now.toTimeString().slice(0, 5),
      day = now.toDateString();
    let previous;
    try {
      previous = JSON.parse(localStorage.getItem('pulse_last_reminder') || 'null');
    } catch (_) {}
    if (time >= ctx.userSettings.value.reminderTime && previous !== day) {
      ctx.safeSave('pulse_last_reminder', day);
      ctx.notice.value = 'Workout reminder: your routines are ready when you are.';
      if ('Notification' in window && Notification.permission === 'granted') try {
        new Notification('PULSE workout reminder', {
          body: 'Your routines are ready when you are.'
        });
      } catch (_) {}
    }
  };
}
