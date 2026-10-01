/** routines: shared refs and actions are explicitly accessed through ctx. */
export function initRoutines(ctx) {
  ctx.openShareRoutinePicker = () => {
    ctx.showSharePickerModal.value = true;
  };
  ctx.publishRoutine = routine => {
    const exists = ctx.sharedRoutines.value.some(s => s.title === routine.title);
    if (exists) {
      alert('This routine is already published to your shared list.');
      ctx.showSharePickerModal.value = false;
      return;
    }
    ctx.sharedRoutines.value.push(JSON.parse(JSON.stringify(routine)));
    ctx.saveSharedRoutinesToStorage();
    ctx.showSharePickerModal.value = false;
  };
  ctx.unshareRoutine = id => {
    ctx.sharedRoutines.value = ctx.sharedRoutines.value.filter(s => s.id !== id);
    ctx.saveSharedRoutinesToStorage();
  };
  ctx.copyPublicRoutine = pub => {
    const newRoutine = {
      id: 'routine-' + Date.now(),
      title: pub.title + ' (Copy)',
      description: pub.description,
      days: [],
      exercises: JSON.parse(JSON.stringify(pub.exercises))
    };
    ctx.routines.value.push(newRoutine);
    ctx.saveRoutinesToStorage();
    alert(`"${pub.title}" saved as a new copy in your workout routines!`);
  };
  ctx.openCreateRoutineModal = () => {
    ctx.editingRoutine.value = {
      id: null,
      title: '',
      description: '',
      prepCountdown: ctx.userSettings.value.prepCountdown ?? 5,
      days: [],
      exercises: []
    };
    ctx.showRoutineModal.value = true;
  };
  ctx.editRoutine = routine => {
    ctx.editingRoutine.value = JSON.parse(JSON.stringify(routine));
    if (!ctx.editingRoutine.value.days) ctx.editingRoutine.value.days = [];
    if (ctx.editingRoutine.value.prepCountdown === undefined) {
      ctx.editingRoutine.value.prepCountdown = ctx.userSettings.value.prepCountdown ?? 5;
    }
    ctx.showRoutineModal.value = true;
  };
  ctx.duplicateRoutine = routine => {
    const dup = JSON.parse(JSON.stringify(routine));
    dup.id = 'routine-' + Date.now();
    dup.title += ' (Copy)';
    if (!dup.days) dup.days = [];
    ctx.routines.value.push(dup);
    ctx.saveRoutinesToStorage();
  };
  ctx.confirmDeleteRoutine = routine => {
    if (confirm(`Are you sure you want to delete "${routine.title}"?`)) {
      ctx.routines.value = ctx.routines.value.filter(r => r.id !== routine.id);
      ctx.saveRoutinesToStorage();
    }
  };
  ctx.toggleDaySelection = dayKey => {
    if (!ctx.editingRoutine.value.days) ctx.editingRoutine.value.days = [];
    const idx = ctx.editingRoutine.value.days.indexOf(dayKey);
    if (idx > -1) {
      ctx.editingRoutine.value.days.splice(idx, 1);
    } else {
      ctx.editingRoutine.value.days.push(dayKey);
    }
  };
  ctx.setSchedulePreset = preset => {
    if (preset === 'weekdays') {
      ctx.editingRoutine.value.days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    } else if (preset === 'weekends') {
      ctx.editingRoutine.value.days = ['Sat', 'Sun'];
    } else if (preset === 'everyday') {
      ctx.editingRoutine.value.days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else if (preset === 'clear') {
      ctx.editingRoutine.value.days = [];
    }
  };
  ctx.addExerciseToRoutine = () => {
    ctx.editingRoutine.value.exercises.push({
      name: '',
      type: 'rep',
      sets: 3,
      reps: 10,
      duration: 0,
      restBetweenSets: ctx.userSettings.value.defaultRestTime
    });
  };
  ctx.removeExerciseFromRoutine = idx => ctx.editingRoutine.value.exercises.splice(idx, 1);
  ctx.saveRoutine = () => {
    if (!ctx.validRoutine(ctx.editingRoutine.value)) {
      ctx.notice.value = 'Check routine title, exercise names, sets, reps, duration and rest. At least one exercise is required.';
      return;
    }
    if (ctx.editingRoutine.value.id) {
      const idx = ctx.routines.value.findIndex(r => r.id === ctx.editingRoutine.value.id);
      if (idx !== -1) ctx.routines.value[idx] = JSON.parse(JSON.stringify(ctx.editingRoutine.value));
    } else {
      ctx.editingRoutine.value.id = 'routine-' + Date.now();
      ctx.routines.value.push(JSON.parse(JSON.stringify(ctx.editingRoutine.value)));
    }
    ctx.saveRoutinesToStorage();
    ctx.showRoutineModal.value = false;
  };
}
