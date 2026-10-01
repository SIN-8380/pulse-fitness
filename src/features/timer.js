/** timer: shared refs and actions are explicitly accessed through ctx. */
export function initTimer(ctx) {
  ctx.confirmCancelWorkout = () => {
    ctx.pauseTimer();
    ctx.showCancelModal.value = true;
  };
  ctx.confirmEndWorkout = () => {
    clearInterval(ctx.timerInterval);
    window.speechSynthesis?.cancel();
    ctx.showCancelModal.value = false;
    ctx.currentRoutine.value = null;
    ctx.activeTab.value = 'dashboard';
  };
  ctx.phase = () => ctx.timerState.value === 'PAUSED' ? ctx.pausedPreviousState.value : ctx.timerState.value;
  ctx.cue = (message, beep = true) => {
    if (ctx.userSettings.value.soundEnabled && beep) {
      try {
        ctx.audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        ctx.audioContext.resume();
        const o = ctx.audioContext.createOscillator(),
          g = ctx.audioContext.createGain();
        o.frequency.value = 880;
        g.gain.value = ctx.userSettings.value.volume / 100 * .12;
        o.connect(g);
        g.connect(ctx.audioContext.destination);
        o.start();
        o.stop(ctx.audioContext.currentTime + .15);
      } catch (_) {
        ctx.notice.value = 'Audio is unavailable in this browser.';
      }
    }
    if (message && ctx.userSettings.value.voiceInstructions && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(message);
      u.lang = {
        en: 'en-US',
        fil: 'fil-PH',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        ja: 'ja-JP'
      }[ctx.userSettings.value.language] || 'en-US';
      u.volume = ctx.userSettings.value.volume / 100;
      speechSynthesis.speak(u);
    }
  };
  ctx.updateWakeLock = async () => {
    const wanted = ctx.userSettings.value.keepScreenAwake && ctx.activeTab.value === 'active-workout' && ctx.timerState.value !== 'PAUSED' && document.visibilityState === 'visible';
    if (!wanted) {
      if (ctx.wakeLock) await ctx.wakeLock.release();
      ctx.wakeLock = null;
      return;
    }
    if (!('wakeLock' in navigator)) {
      ctx.notice.value = 'Keep screen awake is unavailable in this browser.';
      return;
    }
    try {
      if (!ctx.wakeLock || ctx.wakeLock.released) ctx.wakeLock = await navigator.wakeLock.request('screen');
    } catch (_) {
      ctx.notice.value = 'Screen-awake request was unavailable. Check browser permissions or battery settings.';
    }
  };
  ctx.enterPhase = (value, seconds, at = Date.now()) => {
    ctx.timerState.value = value;
    ctx.phaseStarted = at;
    ctx.phaseEnd = at + seconds * 1000;
    ctx.lastCue = -1;
    ctx.displaySeconds.value = seconds;
    ctx.updateWakeLock();
  };
  ctx.finishWorkout = at => {
    clearInterval(ctx.timerInterval);
    ctx.workoutHistory.value.unshift({
      id: 'hist-' + Date.now(),
      routineTitle: ctx.currentRoutine.value.title,
      durationSeconds: Math.max(0, Math.round((at - ctx.workoutStartTime - ctx.pauseTotal) / 1000)),
      setsCompleted: ctx.currentRoutine.value.exercises.reduce((n, e) => n + e.sets, 0),
      timestamp: at
    });
    ctx.saveHistoryToStorage();
    ctx.activeTab.value = 'dashboard';
    ctx.currentRoutine.value = null;
    ctx.updateWakeLock();
    ctx.cue('Workout completed');
  };
  ctx.advance = (at, automatic = false) => {
    const ex = ctx.currentExercise.value;
    if (ctx.currentSet.value < ex.sets) ctx.currentSet.value++;else if (ctx.currentExerciseIndex.value < ctx.currentRoutine.value.exercises.length - 1) {
      ctx.currentExerciseIndex.value++;
      ctx.currentSet.value = 1;
    } else {
      ctx.finishWorkout(at);
      return;
    }
    ctx.enterPhase('EXERCISE', ctx.currentExercise.value.type === 'time' ? ctx.currentExercise.value.duration : 0, at);
    if (automatic && !ctx.userSettings.value.autoStartNextSet) {
      ctx.pausedPreviousState.value = 'EXERCISE';
      ctx.frozenMs = Math.max(0, ctx.phaseEnd - at);
      ctx.pauseStarted = at;
      ctx.timerState.value = 'PAUSED';
      clearInterval(ctx.timerInterval);
      ctx.notice.value = 'Next set ready. Press Resume to begin.';
      ctx.updateWakeLock();
    }
  };
  ctx.endSet = at => {
    if (ctx.currentSet.value === ctx.currentExercise.value.sets && ctx.currentExerciseIndex.value === ctx.currentRoutine.value.exercises.length - 1) {
      ctx.finishWorkout(at);
      return;
    }
    const rest = ctx.currentExercise.value.restBetweenSets ?? 0;
    if (rest > 0) ctx.enterPhase('REST', rest, at);else ctx.advance(at, true);
  };
  ctx.tick = () => {
    if (!ctx.currentRoutine.value || ctx.timerState.value === 'PAUSED') return;
    const now = Date.now();
    const initialPhase = ctx.timerState.value;
    while (ctx.currentRoutine.value && ctx.timerState.value !== 'PAUSED') {
      if (ctx.timerState.value === 'EXERCISE' && ctx.currentExercise.value.type === 'rep') {
        ctx.displaySeconds.value = Math.floor(Math.max(0, now - ctx.phaseStarted) / 1000);
        break;
      }
      if (now < ctx.phaseEnd) {
        ctx.displaySeconds.value = Math.ceil((ctx.phaseEnd - now) / 1000);
        break;
      }
      const at = ctx.phaseEnd;
      if (ctx.timerState.value === 'PREP') ctx.enterPhase('EXERCISE', ctx.currentExercise.value.type === 'time' ? ctx.currentExercise.value.duration : 0, at);else if (ctx.timerState.value === 'REST') ctx.advance(at, true);else ctx.endSet(at);
    }
    if (!ctx.currentRoutine.value || ctx.timerState.value === 'PAUSED') return;
    if (initialPhase !== ctx.timerState.value) ctx.cue(ctx.timerState.value === 'REST' ? 'Rest' : ctx.currentExercise.value.name);
    if (ctx.userSettings.value.finalCountdownCues && ['PREP', 'REST'].includes(ctx.timerState.value) && ctx.displaySeconds.value <= 3 && ctx.lastCue !== ctx.displaySeconds.value) {
      ctx.lastCue = ctx.displaySeconds.value;
      ctx.cue(String(ctx.displaySeconds.value));
    }
  };
  ctx.startTimerInterval = () => {
    clearInterval(ctx.timerInterval);
    ctx.timerInterval = setInterval(ctx.tick, 100);
  };
  ctx.pauseTimer = () => {
    ctx.tick();
    if (!ctx.currentRoutine.value || ctx.timerState.value === 'PAUSED') return;
    const now = Date.now();
    ctx.pausedPreviousState.value = ctx.timerState.value;
    ctx.frozenMs = ctx.phase() === 'EXERCISE' && ctx.currentExercise.value.type === 'rep' ? now - ctx.phaseStarted : Math.max(0, ctx.phaseEnd - now);
    ctx.pauseStarted = now;
    ctx.timerState.value = 'PAUSED';
    clearInterval(ctx.timerInterval);
    window.speechSynthesis?.cancel();
    ctx.updateWakeLock();
  };
  ctx.resumeTimer = () => {
    if (ctx.timerState.value !== 'PAUSED' || !ctx.currentRoutine.value) return;
    const now = Date.now();
    ctx.pauseTotal += now - ctx.pauseStarted;
    ctx.timerState.value = ctx.pausedPreviousState.value;
    ctx.phaseStarted = now - ctx.frozenMs;
    ctx.phaseEnd = now + ctx.frozenMs;
    ctx.startTimerInterval();
    ctx.updateWakeLock();
  };
  ctx.validRoutine = r => r && typeof r.title === 'string' && r.title.trim() && Array.isArray(r.exercises) && r.exercises.length > 0 && r.exercises.length <= 100 && (r.prepCountdown == null || Number.isInteger(r.prepCountdown) && r.prepCountdown >= 0 && r.prepCountdown <= 300) && r.exercises.every(e => typeof e.name === 'string' && e.name.trim() && Number.isInteger(e.sets) && e.sets > 0 && e.sets <= 100 && ['time', 'rep'].includes(e.type) && Number.isInteger(e.restBetweenSets) && e.restBetweenSets >= 0 && e.restBetweenSets <= 3600 && Number.isInteger(e.type === 'time' ? e.duration : e.reps) && (e.type === 'time' ? e.duration : e.reps) > 0);
  ctx.startWorkout = routine => {
    if (!ctx.validRoutine(routine)) {
      ctx.notice.value = 'Add at least one exercise with valid sets, reps or duration, and rest time.';
      return;
    }
    ctx.currentRoutine.value = JSON.parse(JSON.stringify(routine));
    ctx.currentExerciseIndex.value = 0;
    ctx.currentSet.value = 1;
    ctx.workoutStartTime = Date.now();
    ctx.pauseTotal = 0;
    ctx.activeTab.value = 'active-workout';
    ctx.notice.value = '';
    const prep = routine.prepCountdown ?? ctx.userSettings.value.prepCountdown;
    ctx.enterPhase(prep > 0 ? 'PREP' : 'EXERCISE', prep > 0 ? prep : ctx.currentExercise.value.type === 'time' ? ctx.currentExercise.value.duration : 0);
    ctx.cue(prep > 0 ? 'Get ready' : ctx.currentExercise.value.name);
    ctx.startTimerInterval();
  };
  ctx.skipPreparation = () => {
    if (ctx.timerState.value !== 'PREP') return;
    ctx.enterPhase('EXERCISE', ctx.currentExercise.value.type === 'time' ? ctx.currentExercise.value.duration : 0);
    ctx.cue(ctx.currentExercise.value.name);
  };
  ctx.completeSet = () => {
    if (ctx.timerState.value !== 'EXERCISE') return;
    const index = ctx.currentExerciseIndex.value,
      set = ctx.currentSet.value;
    ctx.tick();
    if (ctx.currentRoutine.value && ctx.timerState.value === 'EXERCISE' && index === ctx.currentExerciseIndex.value && set === ctx.currentSet.value) ctx.endSet(Date.now());
  };
  ctx.skipRest = () => {
    if (ctx.timerState.value === 'REST') ctx.advance(Date.now(), true);
  };
  ctx.restartSet = () => {
    if (!ctx.currentRoutine.value) return;
    const wasPaused = ctx.timerState.value === 'PAUSED',
      prev = ctx.phase();
    if (wasPaused) ctx.pauseTotal += Date.now() - ctx.pauseStarted;
    ctx.enterPhase(prev === 'PREP' ? 'PREP' : 'EXERCISE', prev === 'PREP' ? ctx.currentRoutine.value.prepCountdown ?? ctx.userSettings.value.prepCountdown : ctx.currentExercise.value.type === 'time' ? ctx.currentExercise.value.duration : 0);
    if (wasPaused) {
      ctx.frozenMs = ctx.phaseEnd - ctx.phaseStarted;
      ctx.pauseStarted = Date.now();
      ctx.pausedPreviousState.value = ctx.timerState.value;
      ctx.timerState.value = 'PAUSED';
      ctx.updateWakeLock();
    } else ctx.startTimerInterval();
  };
}
