import { normalizeBackup, persistBackup } from '../utils/backup.js';

/** storage: shared refs and actions are explicitly accessed through ctx. */
export function initStorage(ctx) {
  ctx.loadLocalStorage = () => {
    try {
      const p = localStorage.getItem('pulse_user_profile');
      if (p) ctx.userProfile.value = {
        ...ctx.userProfile.value,
        ...JSON.parse(p)
      };
      const s = localStorage.getItem('pulse_settings');
      if (s) ctx.userSettings.value = {
        ...ctx.userSettings.value,
        ...JSON.parse(s)
      };
      const r = localStorage.getItem('pulse_routines');
      if (r) ctx.routines.value = JSON.parse(r);
      const sr = localStorage.getItem('pulse_shared_routines');
      if (sr) ctx.sharedRoutines.value = JSON.parse(sr);
      const h = localStorage.getItem('pulse_history');
      if (h) ctx.workoutHistory.value = JSON.parse(h);
    } catch (e) {
      console.error('Error loading local storage:', e);
    }
  };
  ctx.triggerRestoreJSONSelect = () => {
    // This input lives outside the settings v-for, so its ref is one element.
    if (!ctx.restoreBusy.value) ctx.jsonFileInput.value?.click();
  };
  ctx.onRestoreJSONSelected = async event => {
    const input = event.target,
      file = input.files?.[0];
    if (!file || ctx.restoreBusy.value) return;
    ctx.restoreBusy.value = true;
    try {
      if (file.size > 20 * 1024 * 1024) throw Error('Backup is larger than 20 MB.');
      let data;
      try {
        data = JSON.parse(await file.text());
      } catch (_) {
        throw Error('Choose a valid JSON backup exported from PULSE.');
      }
      const normalized = normalizeBackup(data, {
        profile: ctx.userProfile.value,
        settings: ctx.userSettings.value,
        routines: ctx.routines.value,
        sharedRoutines: ctx.sharedRoutines.value,
        history: ctx.workoutHistory.value,
        achievements: ctx.unlockedAchievements.value
      });
      if (!confirm(`Restore ${normalized.routines.length} routines and ${normalized.history.length} history entries? This replaces the corresponding local data.`)) return;
      persistBackup(localStorage, normalized);
      ctx.userProfile.value = normalized.profile;
      ctx.userSettings.value = normalized.settings;
      ctx.routines.value = normalized.routines;
      ctx.sharedRoutines.value = normalized.sharedRoutines;
      ctx.workoutHistory.value = normalized.history;
      ctx.unlockedAchievements.value = normalized.achievements;
      ctx.applySettings();
      ctx.notice.value = 'Backup restored successfully. Your data is saved in this browser.';
    } catch (error) {
      ctx.notice.value = 'Restore failed: ' + error.message;
    } finally {
      ctx.restoreBusy.value = false;
      input.value = '';
    }
  };
  ctx.saveProfileToStorage = () => ctx.safeSave('pulse_user_profile', ctx.userProfile.value);
  ctx.saveSettingsToStorage = () => {
    for (const [k, max, fallback] of [['prepCountdown', 30, 5], ['defaultRestTime', 180, 30], ['volume', 100, 80]]) {
      const n = Number(ctx.userSettings.value[k]);
      ctx.userSettings.value[k] = Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n))) : fallback;
    }
    ctx.safeSave('pulse_settings', ctx.userSettings.value);
    ctx.applySettings();
  };
  ctx.saveRoutinesToStorage = () => ctx.safeSave('pulse_routines', ctx.routines.value);
  ctx.saveSharedRoutinesToStorage = () => ctx.safeSave('pulse_shared_routines', ctx.sharedRoutines.value);
  ctx.saveHistoryToStorage = () => ctx.safeSave('pulse_history', ctx.workoutHistory.value);
  ctx.downloadJSON = (data, name) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  ctx.exportDataJSON = () => ctx.downloadJSON({
    version: 2,
    profile: ctx.userProfile.value,
    settings: ctx.userSettings.value,
    routines: ctx.routines.value,
    sharedRoutines: ctx.sharedRoutines.value,
    history: ctx.workoutHistory.value,
    achievements: ctx.unlockedAchievements.value
  }, 'pulse-backup.json');
  ctx.resetApplicationData = () => {
    if (confirm('Reset all application routines and saved stats?')) {
      localStorage.removeItem('pulse_user_profile');
      localStorage.removeItem('pulse_settings');
      localStorage.removeItem('pulse_routines');
      localStorage.removeItem('pulse_shared_routines');
      localStorage.removeItem('pulse_history');
      localStorage.removeItem('pulse_achievements');
      localStorage.removeItem('pulse_last_reminder');
      location.reload();
    }
  };
  ctx.safeSave = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      ctx.notice.value = 'Could not save data. Export a backup and check browser storage.';
    }
  };
}
