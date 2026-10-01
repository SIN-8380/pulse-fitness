import StyledSelect from './StyledSelect.js';
import { ref, computed, watch } from 'vue/dist/vue.esm-bundler.js';
import { fitnessOptions, calculateBMI, saveFitnessProfile } from '../utils/fitness.js';

export default {
  components:{StyledSelect},
  props: {stepped:{type:Boolean,default:false}, profile:{type:Object,default:()=>({})}, settings:{type:Object,default:()=>({})}, submitLabel:{type:String,default:'Save changes'}},
  emits:['saved'],
  setup(props, {emit}) {
    const draft = ref({}), error = ref(''), success = ref('');
    const step = ref(0), form = ref(null);
    const steps = ['About you', 'Measurements', 'Training'];
    const validateStep = () => {
      const fields = form.value?.querySelectorAll(props.stepped ? `[data-step="${step.value}"] input, [data-step="${step.value}"] select` : 'input, select') || [];
      for (const field of fields) if (!field.reportValidity()) return false;
      return true;
    };
    const goBack = () => {step.value = Math.max(0, step.value - 1); error.value = '';};
    watch(() => [props.profile, props.settings], () => {draft.value = {sex:'',experience:'',goal:'',equipment:'',...props.profile.fitness,name:props.profile.name || '',username:props.profile.username || '',email:props.settings.email || ''};}, {immediate:true});
    const bmi = computed(() => calculateBMI(draft.value));
    const save = () => {
      error.value = ''; success.value = '';
      if (!validateStep()) return;
      if (props.stepped && step.value < steps.length - 1) {step.value++; return;}
      try { const saved = saveFitnessProfile(localStorage, props.profile, props.settings, draft.value); emit('saved',saved); success.value = 'Profile saved.'; }
      catch (e) { error.value = e.message; }
    };
    return {draft, error, success, bmi, fitnessOptions, save, step, steps, form, goBack};
  },
  template: `<form ref="form" class="fitness-form" novalidate @submit.prevent="save">
    <div v-if="stepped" class="setup-step-heading" aria-live="polite"><p>STEP {{step + 1}} OF {{steps.length}}</p><h3>{{steps[step]}}</h3></div>
    <fieldset v-show="!stepped || step === 0" data-step="0" class="fitness-fields"><legend class="sr-only">About you</legend>
      <label>Your name <input v-model="draft.name" required maxlength="80" autocomplete="name" placeholder="Your name"></label>
      <label>Username<input v-model="draft.username" maxlength="30" autocomplete="username" placeholder="Username (optional)" pattern="[a-zA-Z0-9_]{1,30}" title="Use letters, numbers or underscores"></label>
      <label class="fitness-wide">Email<input v-model="draft.email" type="email" autocomplete="email" placeholder="sample@gmail.com (optional)"></label>
    </fieldset>
    <fieldset v-show="!stepped || step === 1" data-step="1" class="fitness-fields"><legend class="sr-only">Measurements</legend>
      <label>Height (cm)<input v-model="draft.heightCm" type="number" min="50" max="300" step="0.1" inputmode="decimal" placeholder="Height (optional)"></label>
      <label>Weight (kg)<input v-model="draft.weightKg" type="number" min="10" max="600" step="0.1" inputmode="decimal" placeholder="Weight (optional)"></label>
      <div class="fitness-bmi fitness-wide"><span>Calculated BMI</span><output>{{bmi}}</output></div>
      <label>Sex<styled-select v-model="draft.sex"><option value="">Select (optional)</option><option v-for="choice in fitnessOptions.sex" :key="choice">{{choice}}</option></styled-select></label>
    </fieldset>
    <fieldset v-show="!stepped || step === 2" data-step="2" class="fitness-fields"><legend class="sr-only">Training</legend>
      <label>Have you worked out before?<styled-select v-model="draft.experience"><option value="">Select (optional)</option><option v-for="choice in fitnessOptions.experience" :key="choice">{{choice}}</option></styled-select></label>
      <label>Your main goal<styled-select v-model="draft.goal"><option value="">Select (optional)</option><option v-for="choice in fitnessOptions.goal" :key="choice">{{choice}}</option></styled-select></label>
      <label>Equipment<styled-select v-model="draft.equipment"><option value="">Select (optional)</option><option v-for="choice in fitnessOptions.equipment" :key="choice">{{choice}}</option></styled-select></label>
      <label>Planned training days per week<input v-model="draft.daysPerWeek" type="number" min="1" max="7" step="1" placeholder="1–7 days (optional)"></label>
    </fieldset>
    <p v-if="error" role="alert" class="text-sm text-red-400">{{error}}</p><p v-if="success" role="status" class="text-sm text-brand-400">{{success}}</p>
    <div class="setup-actions"><button type="submit" class="fitness-submit">{{stepped && step < steps.length - 1 ? 'Continue' : submitLabel}}</button></div>
    <div v-if="stepped" class="setup-progress" aria-label="Setup progress"><span v-for="(label, index) in steps" :key="label" class="setup-dot" :class="{'is-current':index === step,'is-complete':index < step}" :aria-current="index === step ? 'step' : undefined"><span class="sr-only">{{label}}: {{index === step ? 'current step' : index < step ? 'completed' : 'upcoming'}}</span></span></div>
  </form>`
};
