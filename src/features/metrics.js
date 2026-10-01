import { computed } from 'vue/dist/vue.esm-bundler.js';

/** metrics: shared refs and actions are explicitly accessed through ctx. */
export function initMetrics(ctx) {
  ctx.currentExercise = computed(() => {
    if (!ctx.currentRoutine.value || !ctx.currentRoutine.value.exercises) return null;
    return ctx.currentRoutine.value.exercises[ctx.currentExerciseIndex.value] || null;
  });
  ctx.stats = computed(() => {
    const history = ctx.workoutHistory.value || [];
    const totalSessions = history.length;
    const totalTime = history.reduce((sum, h) => sum + (h.durationSeconds || 0), 0);
    const totalSets = history.reduce((sum, h) => sum + (h.setsCompleted || 0), 0);
    if (history.length === 0) {
      return {
        totalSessions,
        totalTime,
        totalSets,
        streakDays: 0,
        longestStreak: 0
      };
    }
    const dates = history.map(h => {
      const d = new Date(h.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
    const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
    let currentStreak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let todayMs = today.getTime();
    let yesterdayMs = todayMs - 86400000;
    let checkMs = uniqueDates[0] === todayMs ? todayMs : uniqueDates[0] === yesterdayMs ? yesterdayMs : null;
    if (checkMs !== null) {
      for (let dMs of uniqueDates) {
        if (dMs === checkMs) {
          currentStreak++;
          checkMs -= 86400000;
        } else if (dMs < checkMs) {
          break;
        }
      }
    }
    let longestStreak = 0, run = 0, previous;
    for (const ms of uniqueDates) {
      const day = new Date(ms);
      const ordinal = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) / 86400000;
      run = previous === ordinal + 1 ? run + 1 : 1;
      longestStreak = Math.max(longestStreak, run);
      previous = ordinal;
    }
    return {totalSessions, totalTime, totalSets, streakDays: currentStreak, longestStreak};
  });
  ctx.stateStrokeColor = computed(() => {
    if (ctx.timerState.value === 'PAUSED') return '#f59e0b'; // Amber
    if (ctx.timerState.value === 'PREP') return '#34d399'; // Green
    if (ctx.timerState.value === 'REST') return '#60a5fa'; // Blue
    return '#8b5cf6'; // Violet
  });
  ctx.ringDashOffset = computed(() => {
    const circumference = 2 * Math.PI * 88;
    const activeState = ctx.timerState.value === 'PAUSED' ? ctx.pausedPreviousState.value : ctx.timerState.value;
    if (activeState === 'REST') {
      const total = ctx.currentExercise.value?.restBetweenSets ?? 15;
      if (total <= 0) return 0;
      const progress = Math.max(0, Math.min(1, ctx.displaySeconds.value / total));
      return circumference * (1 - progress);
    }
    if (activeState === 'PREP') {
      const total = ctx.currentRoutine.value?.prepCountdown ?? 5;
      if (total <= 0) return 0;
      const progress = Math.max(0, Math.min(1, ctx.displaySeconds.value / total));
      return circumference * (1 - progress);
    }
    if (ctx.currentExercise.value?.type === 'time') {
      const total = ctx.currentExercise.value?.duration || 30;
      if (total <= 0) return 0;
      const progress = Math.max(0, Math.min(1, ctx.displaySeconds.value / total));
      return circumference * (1 - progress);
    }
    const fillProgress = ctx.displaySeconds.value % 60 / 60;
    return circumference * (1 - fillProgress);
  });
  ctx.nextUpText = computed(() => {
    if (!ctx.currentRoutine.value) return 'None';
    const ex = ctx.currentExercise.value;
    if (!ex) return 'Workout Complete';
    if (ctx.timerState.value === 'PREP') {
      return `${ex.name} (Set 1)`;
    }
    if (ctx.currentSet.value < ex.sets) {
      return `${ex.name} (Set ${ctx.currentSet.value + 1})`;
    } else if (ctx.currentExerciseIndex.value < ctx.currentRoutine.value.exercises.length - 1) {
      const nextEx = ctx.currentRoutine.value.exercises[ctx.currentExerciseIndex.value + 1];
      return `${nextEx.name} (Set 1)`;
    } else {
      return 'Session Complete!';
    }
  });
  ctx.weeklyActivityChart = computed(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    ctx.clockDay.value;
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    return days.map((day, i) => {
      const start = new Date(monday);
      start.setDate(start.getDate() + i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return {
        day,
        minutes: Math.round(ctx.workoutHistory.value.filter(h => h.timestamp >= +start && h.timestamp < +end).reduce((n, h) => n + h.durationSeconds, 0) / 60)
      };
    });
  });
  ctx.weeklyTotalMinutes = computed(() => {
    return ctx.weeklyActivityChart.value.reduce((acc, curr) => acc + curr.minutes, 0);
  });
  ctx.chartPoints = computed(() => {
    const chartWidth = 700;
    const chartHeight = 100;
    const maxMins = Math.max(60, ...ctx.weeklyActivityChart.value.map(d => d.minutes));
    const count = ctx.weeklyActivityChart.value.length;
    return ctx.weeklyActivityChart.value.map((d, i) => {
      const x = i / (count - 1) * chartWidth;
      const y = chartHeight + 20 - d.minutes / maxMins * chartHeight;
      return {
        x,
        y,
        minutes: d.minutes
      };
    });
  });
  ctx.svgLinePath = computed(() => {
    const pts = ctx.chartPoints.value;
    if (!pts.length) return '';
    return pts.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '');
  });
  ctx.svgAreaPath = computed(() => {
    const pts = ctx.chartPoints.value;
    if (!pts.length) return '';
    const line = ctx.svgLinePath.value;
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x} 160 L ${first.x} 160 Z`;
  });
  ctx.userAchievements = computed(() => {
    const totalSess = ctx.stats.value.totalSessions;
    const streak = ctx.stats.value.streakDays;
    const totalS = ctx.stats.value.totalSets;
    return [{
      id: 'ach-1',
      title: 'First Step',
      description: 'Completed your first workout session.',
      icon: 'zap',
      unlocked: !!ctx.unlockedAchievements.value['ach-1'] || totalSess >= 1
    }, {
      id: 'ach-2',
      title: '10 Club',
      description: 'Reached 10 completed workouts.',
      icon: 'trophy',
      unlocked: !!ctx.unlockedAchievements.value['ach-2'] || totalSess >= 10
    }, {
      id: 'ach-3',
      title: 'Three-Day Streak',
      description: 'Maintained an active streak of 3+ days.',
      icon: 'flame',
      unlocked: !!ctx.unlockedAchievements.value['ach-3'] || streak >= 3
    }, {
      id: 'ach-4',
      title: 'Iron Will',
      description: 'Accumulated 50+ total sets.',
      icon: 'layers',
      unlocked: !!ctx.unlockedAchievements.value['ach-4'] || totalS >= 50
    }];
  });
  ctx.calculatedBMI = computed(() => {
    const w = ctx.userProfile.value?.fitness?.weightKg || 0;
    const h = ctx.userProfile.value?.fitness?.heightCm || 0;
    if (!w || !h || h <= 0) return '0.0';
    const bmi = w / (h / 100 * (h / 100));
    return bmi.toFixed(1);
  });
  ctx.formatSeconds = sec => {
    const m = Math.floor(Math.abs(sec) / 60);
    const s = Math.abs(sec) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  ctx.formatDurationWords = sec => `${Math.floor(sec / 60)} mins`;
}
