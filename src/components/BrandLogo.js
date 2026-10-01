import {ref} from 'vue/dist/vue.esm-bundler.js';
import Icon from './Icon.js';
/** Add the user's SVG at public/logo.svg; keep the existing mark until supplied. */
export default {
  components:{'v-icon':Icon},
  setup(){return {failed:ref(false),src:import.meta.env.BASE_URL+'logo.svg'};},
  template:`<span class="inline-flex items-center justify-center"><img v-if="!failed" :src="src" alt="PULSE logo" class="w-full h-full object-contain" @error="failed=true"><v-icon v-else name="zap" class="w-5 h-5"></v-icon></span>`
};
