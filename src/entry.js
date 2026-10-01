import {createApp, ref} from 'vue/dist/vue.esm-bundler.js';
import BrandLogo from './components/BrandLogo.js';
import FitnessForm from './components/FitnessForm.js';
import Icon from './components/Icon.js';
import {readLocalObject} from './utils/fitness.js';
import './style.css';
createApp({
  components:{FitnessForm, BrandLogo, 'v-icon':Icon},
  setup() {
    const profile = ref(readLocalObject(localStorage,'pulse_user_profile'));
    const settings = ref(readLocalObject(localStorage,'pulse_settings'));
    const editing = ref(!profile.value.onboardingComplete);
    const enter = () => { window.location.assign(new URL('index.html',window.location.href)); };
    const saved = value => {profile.value = value.profile; settings.value = value.settings; enter();};
    return {profile,settings,editing,enter,saved};
  }
}).mount('#entry');
