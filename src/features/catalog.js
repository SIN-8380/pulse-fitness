import { computed, nextTick } from 'vue/dist/vue.esm-bundler.js';
import { searchExercises, getExercise } from '@bryllim/workout-guide';

/** catalog: shared refs and actions are explicitly accessed through ctx. */
export function initCatalog(ctx) {
  ctx.openExerciseDetails = (item, event) => {
    ctx.detailOpener = event?.currentTarget;
    ctx.detailExercise.value = item;
    nextTick(() => document.getElementById('close-exercise-detail')?.focus());
  };
  ctx.closeExerciseDetails = () => {
    ctx.detailExercise.value = null;
    nextTick(() => ctx.detailOpener?.isConnected && ctx.detailOpener.focus());
  };
  ctx.handleDetailKeys = event => {
    if (ctx.selectedLibraryExercise.value) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      ctx.closeExerciseDetails();
    }
    if (event.key === 'Tab') {
      const items = [...event.currentTarget.querySelectorAll('button:not(:disabled), a[href]')];
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };
  ctx.equipmentOptions = [...new Set(ctx.catalog.map(e => e.equipment).filter(Boolean))].sort();
  ctx.muscleOptions = [...new Set(ctx.catalog.map(e => e.primaryMuscle).filter(Boolean))].sort();
  ctx.libraryMatches = computed(() => searchExercises(ctx.librarySearch.value).filter(e => (!ctx.libraryEquipment.value || e.equipment === ctx.libraryEquipment.value) && (!ctx.libraryMuscle.value || e.primaryMuscle === ctx.libraryMuscle.value)));
  ctx.libraryPages = computed(() => Math.max(1, Math.ceil(ctx.libraryMatches.value.length / 24)));
  ctx.libraryItems = computed(() => ctx.libraryMatches.value.slice((ctx.libraryPage.value - 1) * 24, ctx.libraryPage.value * 24));
  ctx.exerciseResults = computed(() => searchExercises(ctx.exerciseSearch.value).slice(0, 24));
  ctx.exerciseAsset = (slug, frame = 1) => {
    const item = getExercise(slug);
    const path = item?.frames?.find(f => f.index === frame)?.path;
    return path ? `${import.meta.env.BASE_URL}workout-assets/${path.replace(/^assets\//, '')}` : '';
  };
  ctx.attachExercise = (ex, item) => {
    if (!item) return;
    ex.catalogId = item.slug;
    ex.name = item.name;
    ex.type = /time|duration|stretch/i.test(item.exerciseType) || item.isStretch ? 'time' : 'rep';
    if (!(ex.reps > 0)) ex.reps = 10;
    if (!(ex.duration > 0)) ex.duration = 30;
  };
  ctx.linkIllustration = (ex, slug) => {
    if (!slug) {
      delete ex.catalogId;
      return;
    }
    ctx.attachExercise(ex, getExercise(slug));
  };
  ctx.addCatalogToRoutine = routine => {
    const item = ctx.selectedLibraryExercise.value;
    if (!item) return;
    if (routine) ctx.editRoutine(routine);else {
      ctx.openCreateRoutineModal();
      ctx.editingRoutine.value.exercises = [];
    }
    ctx.addExerciseToRoutine();
    ctx.attachExercise(ctx.editingRoutine.value.exercises.at(-1), item);
    ctx.selectedLibraryExercise.value = null;
    ctx.detailExercise.value = null;
  };
}
