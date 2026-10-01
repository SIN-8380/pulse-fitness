/** Shared onboarding/profile/backup validation. Measurements are stored in metric units. */
export const fitnessOptions = {
  sex: ['Female', 'Male', 'Prefer not to say'],
  experience: ['New to exercise', 'Returning after a break', 'Exercise regularly'],
  goal: ['Build strength', 'Build muscle', 'Improve endurance', 'Improve mobility', 'General fitness'],
  equipment: ['Bodyweight only', 'Home equipment', 'Gym access']
};
export function normalizeFitness(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid fitness information.');
  const result = {};
  for (const [key, min, max] of [['heightCm',50,300],['weightKg',10,600],['daysPerWeek',1,7]]) {
    const raw = value[key];
    if (raw === '' || raw == null) { result[key] = null; continue; }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < min || n > max || (key === 'daysPerWeek' && !Number.isInteger(n))) throw Error(`Check ${key === 'heightCm' ? 'height' : key === 'weightKg' ? 'weight' : 'training days'}.`);
    result[key] = n;
  }
  for (const [key, choices] of Object.entries(fitnessOptions)) {
    const choice = value[key] ?? '';
    if (choice !== '' && !choices.includes(choice)) throw Error(`Invalid ${key}.`);
    result[key] = choice;
  }
  return result;
}
export function calculateBMI(fitness) {
  const h = Number(fitness?.heightCm), w = Number(fitness?.weightKg);
  return h > 0 && w > 0 ? (w / (h / 100) ** 2).toFixed(1) : '—';
}
/** Two-key transaction; preserve existing routines/history and all unrelated profile fields. */
export function saveFitnessProfile(storage, profile, settings, draft) {
  const name = String(draft.name || '').trim();
  const username = String(draft.username || '').trim().replace(/^@/, '');
  const email = String(draft.email || '').trim();
  if (!name || name.length > 80) throw Error('Enter your name (up to 80 characters).');
  if (username && !/^[a-zA-Z0-9_]{1,30}$/.test(username)) throw Error('Use up to 30 letters, numbers or underscores for your username.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('Check your email address.');
  const updated = {profile:{...profile, name, username, fitness:normalizeFitness(draft), onboardingComplete:true}, settings:{...settings,email}};
  const keys = ['pulse_user_profile','pulse_settings'];
  const previous = keys.map(key => storage.getItem(key));
  try {
    storage.setItem(keys[0], JSON.stringify(updated.profile));
    storage.setItem(keys[1], JSON.stringify(updated.settings));
  } catch (error) {
    for (let i = 0; i < keys.length; i++) try { previous[i] === null ? storage.removeItem(keys[i]) : storage.setItem(keys[i], previous[i]); } catch (_) {}
    throw Error('Could not save your profile. Check browser storage and try again.');
  }
  return updated;
}
export function readLocalObject(storage, key) {
  try { const value = JSON.parse(storage.getItem(key)); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch (_) { return {}; }
}
