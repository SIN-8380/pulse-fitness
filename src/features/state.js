import { ref } from 'vue/dist/vue.esm-bundler.js';
import { searchExercises } from '@bryllim/workout-guide';

/** state: shared refs and actions are explicitly accessed through ctx. */
export function initState(ctx) {
  ctx.catalog = searchExercises('');
  ctx.libraryTab = ref('workouts');
  ctx.librarySearch = ref('');
  ctx.libraryEquipment = ref('');
  ctx.libraryMuscle = ref('');
  ctx.libraryPage = ref(1);
  ctx.selectedLibraryExercise = ref(null);
  ctx.detailExercise = ref(null);
  ctx.detailOpener = undefined;
  ctx.exerciseSearch = ref('');
  ctx.activeTab = ref('dashboard');
  ctx.showProfileView = ref(false);
  ctx.showSettingsView = ref(false);
  ctx.showCancelModal = ref(false);
  ctx.showRoutineModal = ref(false);
  ctx.showCropModal = ref(false);
  ctx.showSharePickerModal = ref(false);
  ctx.showInterestSelector = ref(false);
  ctx.showReportModal = ref(false);
  ctx.showPrivacyModal = ref(false);
  ctx.settingsCategory = ref(null);
  ctx.pendingProfileEdit = ref(null);
  ctx.problemDescription = ref('');
  ctx.jsonFileInput = ref(null);
  ctx.isEditingName = ref(false);
  ctx.tempName = ref('');
  ctx.isEditingUsername = ref(false);
  ctx.tempUsername = ref('');
  ctx.isEditingBio = ref(false);
  ctx.tempBio = ref('');
  ctx.profileTab = ref('overview');
  ctx.avatarError = ref('');
  ctx.rawImageSrc = ref('');
  ctx.cropZoom = ref(1);
  ctx.cropOffsetX = ref(0);
  ctx.cropOffsetY = ref(0);
  ctx.fileInput = ref(null);
  ctx.cropCanvasRef = ref(null);
  ctx.loadedImageObj = null;
  ctx.isDraggingCrop = false;
  ctx.cropDragStart = {
    x: 0,
    y: 0
  };
  ctx.sharedRoutines = ref([]);
  ctx.workoutHistory = ref([]);
  ctx.settingCategories = [{
    id: 'workout',
    label: 'Workout Preparation & Timers',
    desc: 'Countdowns, rest intervals, screen lock & set auto-start',
    icon: 'clock'
  }, {
    id: 'sound',
    label: 'Sound & Voice Feedback',
    desc: 'Audio alerts, volume levels, and voice instructions',
    icon: 'volume-2'
  }, {
    id: 'display',
    label: 'Display & Accessibility',
    desc: 'Theme, text size, and animation preferences',
    icon: 'layout-dashboard'
  }, {
    id: 'units',
    label: 'Units & Language',
    desc: 'Imperial/metric units and language selection',
    icon: 'globe'
  }, {
    id: 'notifications',
    label: 'Notifications & Reminders',
    desc: 'Daily workout alerts and weekly summaries',
    icon: 'bell'
  }, {
    id: 'privacy',
    label: 'Privacy & Visibility',
    desc: 'Profile visibility and stats privacy',
    icon: 'shield'
  }, {
    id: 'social',
    label: 'Social & Interactions',
    desc: 'Challenge invites, notifications, and blocked users',
    icon: 'users'
  }, {
    id: 'data',
    label: 'Data Management & Backups',
    desc: 'Export, import JSON backups, or reset storage',
    icon: 'database'
  }, {
    id: 'account',
    label: 'Local Profile',
    desc: 'Profile details and welcome page',
    icon: 'user'
  }, {
    id: 'about',
    label: 'About & Help',
    desc: 'App version, bug reports, and artwork credits',
    icon: 'info'
  }];
  ctx.ALL_DAYS = [{
    key: 'Mon',
    label: 'M'
  }, {
    key: 'Tue',
    label: 'T'
  }, {
    key: 'Wed',
    label: 'W'
  }, {
    key: 'Thu',
    label: 'Th'
  }, {
    key: 'Fri',
    label: 'F'
  }, {
    key: 'Sat',
    label: 'Sa'
  }, {
    key: 'Sun',
    label: 'Su'
  }];
  ctx.ALL_INTERESTS = ['Strength Training', 'Calisthenics', 'Cardio', 'Home Workouts', 'Yoga & Mobility', 'HIIT', 'Powerlifting', 'Pilates'];
  ctx.userProfile = ref({
    name: '',
    username: '',
    bio: '',
    avatarUrl: '',
    interests: []
  });
  ctx.userSettings = ref({
    prepCountdown: 5,
    defaultRestTime: 30,
    autoStartNextSet: true,
    keepScreenAwake: true,
    soundEnabled: true,
    volume: 80,
    voiceInstructions: false,
    finalCountdownCues: true,
    theme: 'dark',
    textSize: 'medium',
    reducedAnimations: false,
    weightUnit: 'kg',
    heightUnit: 'cm',
    language: 'en',
    remindersEnabled: false,
    reminderTime: '18:00',
    weeklySummary: true,
    isProfilePublic: true,
    visibility: {
      stats: 'public',
      routines: 'public',
      activity: 'followers',
      achievements: 'public'
    },
    challengeInvites: 'followers',
    followerRequestNotifs: true,
    blockedUsers: [],
    email: ''
  });
  ctx.routines = ref([]);
  ctx.editingRoutine = ref({
    id: null,
    title: '',
    description: '',
    days: [],
    exercises: []
  });
  ctx.currentRoutine = ref(null);
  ctx.currentExerciseIndex = ref(0);
  ctx.currentSet = ref(1);
  ctx.timerState = ref('EXERCISE');
  ctx.pausedPreviousState = ref('EXERCISE');
  ctx.displaySeconds = ref(0);
  ctx.timerInterval = null;
  ctx.workoutStartTime = 0;
  ctx.restoreBusy = ref(false);
  ctx.phaseStarted = 0;
  ctx.phaseEnd = 0;
  ctx.frozenMs = 0;
  ctx.pauseStarted = 0;
  ctx.pauseTotal = 0;
  ctx.lastCue = -1;
  ctx.audioContext = undefined;
  ctx.wakeLock = undefined;
  ctx.reminderInterval = undefined;
  ctx.notice = ref('');
  ctx.unlockedAchievements = ref({});
  ctx.clockDay = ref(new Date().toDateString());
  ctx.systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
}
