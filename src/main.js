import StyledSelect from './components/StyledSelect.js';
import { createApp } from 'vue/dist/vue.esm-bundler.js';
import './style.css';
import { createPulseApp } from './app.js';
import Icon from './components/Icon.js';
import BrandLogo from './components/BrandLogo.js';
import FitnessForm from './components/FitnessForm.js';
import {readLocalObject} from './utils/fitness.js';
import ExerciseArt from './components/ExerciseArt.js';

if (!readLocalObject(localStorage, 'pulse_user_profile').onboardingComplete) {
  window.location.replace(new URL('login.html', document.baseURI));
} else {
const app = createApp({ setup: createPulseApp });
app.component('v-icon', Icon);
app.component('styled-select', StyledSelect);
app.component('exercise-art', ExerciseArt);
app.component('fitness-form', FitnessForm);
app.component('brand-logo', BrandLogo);
app.mount('#app');

}
