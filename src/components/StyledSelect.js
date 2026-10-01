import {ref,computed,onMounted,onUpdated,onUnmounted,nextTick,useId} from 'vue/dist/vue.esm-bundler.js';
export default {
 inheritAttrs:false,
 props:{modelValue:{default:undefined},value:{default:undefined}},
 emits:['update:modelValue','change'],
 setup(props,{emit}){
  const native=ref(null),trigger=ref(null),panel=ref(null),options=ref([]),open=ref(false),active=ref(0),position=ref({});
  const id='select-'+useId();
  const selected=computed(()=>String(props.modelValue ?? props.value ?? ''));
  const label=computed(()=>options.value.find(o=>o.value===selected.value)?.label || options.value[0]?.label || 'Select');
  const sync=()=>{const items=Array.from(native.value?.options || []).map(o=>({value:o.value,label:o.textContent,disabled:o.disabled}));if(JSON.stringify(items)!==JSON.stringify(options.value))options.value=items;};
  const close=()=>{open.value=false;};
  const locate=()=>{if(!trigger.value)return;const r=trigger.value.getBoundingClientRect(),below=innerHeight-r.bottom-12,above=r.top-12;const up=below<180&&above>below;position.value={left:Math.max(8,Math.min(r.left,innerWidth-r.width-8))+'px',width:Math.min(r.width,innerWidth-16)+'px',maxHeight:Math.min(280,Math.max(80,up?above:below))+'px',...(up?{bottom:innerHeight-r.top+6+'px'}:{top:r.bottom+6+'px'})};};
  const reveal=()=>nextTick(()=>panel.value?.querySelector('[data-active="true"]')?.scrollIntoView({block:'nearest'}));
  const toggle=()=>{if(open.value){close();return;}sync();active.value=Math.max(0,options.value.findIndex(o=>o.value===selected.value));locate();open.value=true;reveal();};
  const choose=i=>{const o=options.value[i];if(!o||o.disabled)return;emit('update:modelValue',o.value);emit('change',{target:{value:o.value}});close();trigger.value?.focus();};
  let typed='',typingTimer;
  const key=e=>{
   if(e.key==='Escape'){close();e.preventDefault();return;}
   if(e.key==='Tab'){close();return;}
   if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(e.key)){
    e.preventDefault();if(!open.value){toggle();return;}
    if(e.key==='Enter'||e.key===' '){choose(active.value);return;}
    const delta=e.key==='ArrowUp'?-1:1;
    let n=e.key==='Home'?0:e.key==='End'?options.value.length-1:Math.min(options.value.length-1,Math.max(0,active.value+delta));
    while(options.value[n]?.disabled&&n>=0&&n<options.value.length)n+=delta;
    if(options.value[n])active.value=n;reveal();
   }else if(e.key.length===1){if(!open.value)toggle();typed+=e.key.toLowerCase();clearTimeout(typingTimer);typingTimer=setTimeout(()=>typed='',600);const i=options.value.findIndex(o=>!o.disabled&&o.label.toLowerCase().startsWith(typed));if(i>=0){active.value=i;reveal();}}
  };
  const outside=e=>{if(!trigger.value?.contains(e.target)&&!panel.value?.contains(e.target))close();};
  const scrolled=e=>{if(open.value&&!panel.value?.contains(e.target))locate();};
  onMounted(()=>{sync();document.addEventListener('pointerdown',outside);window.addEventListener('resize',close);window.addEventListener('scroll',scrolled,true);});onUpdated(sync);
  onUnmounted(()=>{clearTimeout(typingTimer);document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',close);window.removeEventListener('scroll',scrolled,true);});
  return {native,trigger,panel,options,open,active,position,id,selected,label,toggle,choose,key};
 },
 template:`<span class="styled-select" :class="$attrs.class"><select ref="native" hidden aria-hidden="true" tabindex="-1"><slot></slot></select><button ref="trigger" type="button" class="select-trigger" :id="$attrs.id" :disabled="$attrs.disabled" :aria-label="$attrs['aria-label']" role="combobox" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="id" :aria-activedescendant="open ? id+'-'+active : undefined" @click="toggle" @keydown="key"><span>{{label}}</span><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m6 8 4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><teleport to="body"><div v-if="open" ref="panel" :id="id" role="listbox" class="select-panel" :style="position" :aria-label="$attrs['aria-label'] || 'Choices'"><div v-for="(option,i) in options" :key="option.value" :id="id+'-'+i" role="option" :aria-selected="option.value===selected" :aria-disabled="option.disabled" :data-active="i===active" :class="{'is-selected':option.value===selected}" @pointerdown.prevent @click="choose(i)" @pointermove="active=i"><span>{{option.label}}</span></div></div></teleport></span>`
};
