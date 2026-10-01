import {normalizeFitness} from './fitness.js';
/** Pure validation/migration helpers. No UI state is changed until the whole backup is valid. */
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const number = (value, fallback, min, max, label) => {
  if (value === undefined || value === null) return fallback;
  const n = Number(value);
  if (value === '' || !Number.isFinite(n) || n < min || n > max) throw Error(`Invalid ${label}.`);
  return n;
};
const whole = (value, fallback, min, max, label) => {
  const n = number(value, fallback, min, max, label);
  if (!Number.isInteger(n)) throw Error(`${label} must be a whole number.`);
  return n;
};
function normalizeRoutines(list) {
  if (!Array.isArray(list) || list.length > 2000) throw Error('Routines must be a list.');
  return list.map((r, index) => {
    if (!object(r) || typeof r.title !== 'string' || !r.title.trim() || !Array.isArray(r.exercises) || r.exercises.length > 100) throw Error(`Invalid routine ${index + 1}.`);
    // Preserve empty drafts from earlier releases; workout validation prevents starting them.
    return { ...r, id: String(r.id || `imported-${Date.now()}-${index}`), title:r.title.trim(),
      days:Array.isArray(r.days)?r.days.filter(d=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].includes(d)):[],
      ...(r.prepCountdown == null ? {} : {prepCountdown:whole(r.prepCountdown,5,0,300,'preparation time')}),
      exercises:r.exercises.map((e,i)=>{
        if (!object(e) || typeof e.name !== 'string' || !e.name.trim()) throw Error(`Invalid exercise ${i+1} in ${r.title}.`);
        const type=e.type === 'timed' ? 'time' : e.type || 'rep';
        if (!['time','rep'].includes(type)) throw Error(`Invalid exercise type in ${r.title}.`);
        return {...e,type,sets:whole(e.sets,3,1,100,'sets'),reps:whole(e.reps,type==='rep'?10:0,type==='rep'?1:0,100000,'reps'),
          duration:whole(e.duration,type==='time'?30:0,type==='time'?1:0,86400,'duration'),
          restBetweenSets:whole(e.restBetweenSets,15,0,3600,'rest time')};
      })};
  });
}
export function normalizeBackup(data,current) {
  if (!object(data) || !['profile','settings','routines','sharedRoutines','history','achievements'].some(k=>Object.hasOwn(data,k))) throw Error('This is not a PULSE backup.');
  if(data.version != null && (!Number.isInteger(data.version) || data.version > 2 || data.version < 1)) throw Error('Unsupported backup version.');
  const result=JSON.parse(JSON.stringify(current));
  if ('routines' in data) result.routines=normalizeRoutines(data.routines);
  if ('sharedRoutines' in data) result.sharedRoutines=normalizeRoutines(data.sharedRoutines);
  if ('history' in data) {
    if (!Array.isArray(data.history)) throw Error('History must be a list.');
    result.history=data.history.map((h,i)=>{
      if(!object(h))throw Error('Invalid history entry.');
      const timestamp=typeof h.timestamp==='string'&&!/^\d+$/.test(h.timestamp)?Date.parse(h.timestamp):Number(h.timestamp);
      if(!Number.isFinite(timestamp)||timestamp<0||!Number.isFinite(new Date(timestamp).getTime()))throw Error('Invalid history date.');
      return {...h,id:String(h.id||`history-import-${i}`),timestamp,
        durationSeconds:number(h.durationSeconds,0,0,1e9,'session duration'),
        setsCompleted:whole(h.setsCompleted ?? h.totalSetsCompleted,0,0,1e7,'completed sets')};
    });
  }
  if ('profile' in data) {
    if(!object(data.profile))throw Error('Profile must be an object.');
    for(const [k,v] of Object.entries(data.profile)){
      if(['name','username','bio','avatarUrl'].includes(k)) {if(typeof v!=='string')throw Error(`Invalid profile ${k}.`);result.profile[k]=v;}
      if(k==='fitness')result.profile.fitness=normalizeFitness(v);
      if(k==='onboardingComplete'){if(typeof v!=='boolean')throw Error('Invalid onboarding status.');result.profile.onboardingComplete=v;}
      if(k==='interests'){if(!Array.isArray(v)||!v.every(x=>typeof x==='string'))throw Error('Invalid interests.');result.profile[k]=v;}
    }
  }
  if ('settings' in data) {
    if(!object(data.settings))throw Error('Settings must be an object.');
    for(const [k,v] of Object.entries(data.settings)) {
      if(!Object.hasOwn(result.settings,k))continue;
      if(k==='visibility') {
        if(!object(v))throw Error('Invalid visibility settings.');
        for(const [field,choice] of Object.entries(v))if(Object.hasOwn(result.settings.visibility,field)) {
          if(!['public','followers','private'].includes(choice))throw Error('Invalid visibility choice.');result.settings.visibility[field]=choice;
        }
      } else if(k==='blockedUsers') {if(!Array.isArray(v)||!v.every(x=>typeof x==='string'))throw Error('Invalid blocked users.');result.settings[k]=v;}
      else if(typeof result.settings[k]==='boolean'){if(typeof v!=='boolean')throw Error(`Invalid setting ${k}.`);result.settings[k]=v;}
      else if(typeof result.settings[k]==='number')result.settings[k]=whole(v,result.settings[k],0,k==='volume'?100:k==='prepCountdown'?30:180,k);
      else {if(typeof v!=='string')throw Error(`Invalid setting ${k}.`);result.settings[k]=v;}
    }
    for(const [key,values] of Object.entries({theme:['dark','light','system'],textSize:['small','medium','large'],weightUnit:['kg','lbs'],heightUnit:['cm','ft'],language:['en','fil','es','fr','de','ja'],challengeInvites:['everyone','followers','nobody','none']})){
      if(key in data.settings && !values.includes(result.settings[key]))throw Error(`Invalid setting ${key}.`);
    }
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(result.settings.reminderTime))throw Error('Invalid reminder time.');
  }
  if ('achievements' in data) {
    if(!object(data.achievements)||!Object.values(data.achievements).every(v=>Number.isFinite(v)&&v>=0))throw Error('Invalid achievement dates.');
    result.achievements={...data.achievements};
  }
  return result;
}
/** Persist before replacing live state, and restore previous keys if any write fails. */
export function persistBackup(storage,backup) {
  const mapping={profile:'pulse_user_profile',settings:'pulse_settings',routines:'pulse_routines',sharedRoutines:'pulse_shared_routines',history:'pulse_history',achievements:'pulse_achievements'};
  const entries=Object.entries(mapping).map(([field,key])=>[key,JSON.stringify(backup[field])]);
  const previous=entries.map(([key])=>[key,storage.getItem(key)]);
  try {for(const [key,value] of entries)storage.setItem(key,value);}
  catch(error){
    let failed=false;
    for(const [key,value] of previous)try{value===null?storage.removeItem(key):storage.setItem(key,value);}catch(_){failed=true;}
    throw Error(failed?'Storage failed and rollback was incomplete. Keep your backup file.':'Browser storage is unavailable or full. Previous data was kept.');
  }
}
