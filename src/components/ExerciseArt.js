import { ref, computed, watch } from 'vue/dist/vue.esm-bundler.js';
import { getExercise } from '@bryllim/workout-guide';
export default {
  props: {
    slug: String,
    label: String
  },
  setup(props) {
    const failed = ref(false);
    const url = computed(() => {
      const item = getExercise(props.slug),
        path = item?.frames?.[0]?.path;
      return path ? `${import.meta.env.BASE_URL}workout-assets/${path.replace(/^assets\//, '')}` : '';
    });
    watch(() => props.slug, () => {
      failed.value = false;
    });
    return {
      url,
      failed
    };
  },
  template: `<div class="exercise-art" role="img" :aria-label="label || 'Exercise illustration'"><img v-if="url && !failed" :src="url" @error="failed=true" alt="" aria-hidden="true" width="512" height="512" loading="lazy" class="art-visible" /><span v-else class="text-xs text-slate-400">Illustration unavailable</span></div>`
};
