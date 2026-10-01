import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ref,computed,watch,nextTick} from 'vue';
import {searchExercises,getExercise} from '@bryllim/workout-guide';
import {normalizeBackup,persistBackup} from '../src/utils/backup.js';
import {compile} from '@vue/compiler-dom';
const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
let now=100000;class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
let counter=0;const intervals=new Map();const values=new Map();
const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
let confirmation=true;
const sandbox={console,ref,computed,watch,nextTick,onMounted(){},onUnmounted(){},searchExercises,getExercise,normalizeBackup,persistBackup,
window:{matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}})},document:{visibilityState:'visible',body:{style:{}},documentElement:{classList:{toggle(){}},style:{}},addEventListener(){},removeEventListener(){}},navigator:{},localStorage:storage,Date:Clock,setInterval:fn=>{intervals.set(++counter,fn);return counter;},clearInterval:id=>intervals.delete(id),setTimeout,clearTimeout,alert(){},confirm:()=>confirmation};
vm.createContext(sandbox);
for(const name of ['state','catalog','metrics','storage','settings','profile','routines','timer','lifecycle']){
 const code=read('src/features/'+name+'.js').replace(/^import .*;\s*$/gm,'').replaceAll('export function','function').replaceAll('import.meta.env.BASE_URL',"'/'");vm.runInContext(code,sandbox);
}
vm.runInContext(read('src/app.js').replace(/^import .*;\s*$/gm,'').replaceAll('export function','function')+'\nthis.api = createPulseApp();',sandbox);
const a=sandbox.api;
a.userSettings.value.soundEnabled=false;a.userSettings.value.keepScreenAwake=false;
const advance=ms=>{now+=ms;for(const fn of [...intervals.values()])fn();};
const r={title:'Test',prepCountdown:2,exercises:[{name:'Push-up',catalogId:'push-up',type:'time',sets:2,reps:10,duration:3,restBetweenSets:2}]};
a.startWorkout(r);assert.equal(a.timerState.value,'PREP');advance(1000);a.pauseTimer();advance(5000);a.resumeTimer();advance(1000);assert.equal(a.timerState.value,'EXERCISE');advance(3000);assert.equal(a.timerState.value,'REST');a.pauseTimer();advance(4000);a.resumeTimer();advance(5000);assert.equal(a.activeTab.value,'dashboard');assert.equal(a.workoutHistory.value[0].durationSeconds,10);
a.librarySearch.value='push up';assert(a.libraryItems.value.some(e=>e.slug==='push-up'));a.selectedLibraryExercise.value=getExercise('push-up');a.addCatalogToRoutine(null);assert.equal(a.editingRoutine.value.exercises[0].catalogId,'push-up');
let clicks=0;a.jsonFileInput.value={click(){clicks++;}};a.triggerRestoreJSONSelect();assert.equal(clicks,1);
const legacy={profile:{name:'L A W'},routines:[{title:'Legacy',exercises:[{name:'Plank',type:'timed',sets:'2',duration:'30',restBetweenSets:'0'}]}],history:[{timestamp:10000,durationSeconds:42,totalSetsCompleted:2}]};
const input={files:[{size:100,text:async()=>JSON.stringify(legacy)}],value:'backup.json'};await a.onRestoreJSONSelected({target:input});
assert.equal(a.userProfile.value.name,'L A W');assert.equal(a.routines.value[0].exercises[0].type,'time');assert.equal(a.workoutHistory.value[0].setsCompleted,2);assert.equal(a.restoreBusy.value,false);assert.equal(input.value,'');assert(a.notice.value.startsWith('Backup restored'));
const previous=JSON.stringify(a.routines.value);input.files=[{size:5,text:async()=>'{bad'}];await a.onRestoreJSONSelected({target:input});assert.equal(JSON.stringify(a.routines.value),previous);assert(a.notice.value.startsWith('Restore failed'));
confirmation=false;input.files=[{size:100,text:async()=>JSON.stringify({...legacy,routines:[]})}];await a.onRestoreJSONSelected({target:input});assert.equal(JSON.stringify(a.routines.value),previous);confirmation=true;
const snapshot={profile:a.userProfile.value,settings:a.userSettings.value,routines:a.routines.value,sharedRoutines:[],history:a.workoutHistory.value,achievements:{'ach-1':1000}};
const restored=normalizeBackup(JSON.parse(JSON.stringify({version:2,...snapshot})),snapshot);assert.equal(restored.achievements['ach-1'],1000);persistBackup(storage,restored);
const before=new Map(values);let writes=0;const failing={...storage,setItem(k,v){if(++writes===3)throw Error('Quota');storage.setItem(k,v);}};
assert.throws(()=>persistBackup(failing,{...restored,profile:{name:'Changed'}}),/Previous data was kept/);assert.deepEqual(values,before);
assert.throws(()=>normalizeBackup({settings:{prepCountdown:-3}},snapshot),/Invalid/);
const html=read('index.html');compile(html.split('<body')[1].replace(/^[^>]*>/,'').split('<script type="module"')[0]);assert.equal((html.match(/ref="jsonFileInput"/g)||[]).length,1);assert(html.indexOf('ref="jsonFileInput"')<html.indexOf('<!-- TOP HEADER'));
assert(!html.includes('convertKg'));assert(html.includes('Developed by'));assert(html.includes('L A W'));assert(!read('src/components/ExerciseArt.js').includes('setInterval'));
console.log('PASS: modular app initialization, timer pause/resume, catalog editing, restore file picker, legacy restore, malformed/cancelled restore, backup round-trip and rollback, template compilation, static artwork and requested UI changes.');
// Regression: app state and the canvas drawing context must not shadow each other.
let drawn=null, cleared=false;
a.cropCanvasRef.value={width:200,getContext:()=>({clearRect(){cleared=true;},drawImage(...args){drawn=args;}}),toDataURL:()=> 'data:image/jpeg;base64,test-avatar'};
vm.runInContext('this.profileCtx = {}; initState(profileCtx); initStorage(profileCtx); initProfile(profileCtx);',sandbox);
sandbox.document.getElementById=()=>({focus(){}});
const pc=sandbox.profileCtx;pc.cropCanvasRef.value=a.cropCanvasRef.value;pc.loadedImageObj={width:400,height:200};
pc.renderCropPreview();assert(cleared);assert.equal(drawn[1],-100);assert.equal(drawn[2],0);assert.equal(drawn[3],400);
pc.cropZoom.value=2;pc.cropOffsetX.value=10000;pc.renderCropPreview();assert.equal(pc.cropOffsetX.value,300);
pc.applyCroppedAvatar();assert.equal(pc.userProfile.value.avatarUrl,'data:image/jpeg;base64,test-avatar');assert.equal(JSON.parse(storage.getItem('pulse_user_profile')).avatarUrl,pc.userProfile.value.avatarUrl);
pc.userProfile.value.username='';pc.startEditUsername();assert.equal(pc.tempUsername.value,'sample');
pc.userProfile.value.username='existing_user';pc.startEditUsername();assert.equal(pc.tempUsername.value,'existing_user');
assert(!read('src/components/FitnessForm.js').includes('@click="goBack"'));
console.log('PASS: crop drawing, zoom/offset clamping, avatar saving, username fallback and setup Back removal.');
// Edits must leave input mode immediately and persist only after confirmation.
sandbox.document.getElementById=()=>({focus(){}});
pc.tempName.value='New Name';pc.isEditingName.value=true;const oldName=pc.userProfile.value.name;
pc.saveName();assert.equal(pc.isEditingName.value,false);assert.equal(pc.userProfile.value.name,oldName);assert.equal(pc.pendingProfileEdit.value.value,'New Name');
pc.cancelProfileEdit();assert.equal(pc.userProfile.value.name,oldName);assert.equal(pc.pendingProfileEdit.value,null);
pc.saveName();pc.confirmProfileEdit();assert.equal(pc.userProfile.value.name,'New Name');assert.equal(JSON.parse(storage.getItem('pulse_user_profile')).name,'New Name');
pc.tempUsername.value='new_handle';pc.isEditingUsername.value=true;pc.saveUsername();assert.equal(pc.isEditingUsername.value,false);pc.confirmProfileEdit();assert.equal(pc.userProfile.value.username,'new_handle');
assert.equal(a.settingsCategory.value,null);a.showSettingsView.value=true;await nextTick();a.settingsCategory.value='workout';a.showSettingsView.value=false;await nextTick();assert.equal(a.settingsCategory.value,null);
console.log('PASS: profile confirmation/cancellation and settings accordion reset.');
// Focus newly mounted editors so clicking away reliably produces blur.
let focused='';sandbox.document.getElementById=id=>({focus(){focused=id;}});
pc.startEditName();await nextTick();assert.equal(focused,'profile-name-input');
pc.tempName.value='Confirmed after blur';pc.saveName();await nextTick();assert.equal(pc.isEditingName.value,false);assert.equal(focused,'profile-edit-cancel');pc.cancelProfileEdit();
pc.startEditUsername();await nextTick();assert.equal(focused,'profile-username-input');
const css=read('src/style.css');assert(!css.includes('.fitness-fields label>span {display:none;}'));
// Use a controlled scheduler to verify 3-second expiry and replacement cancellation.
let timeoutId=0;const notices=new Map();sandbox.setTimeout=(fn,delay)=>{notices.set(++timeoutId,{fn,delay});return timeoutId;};sandbox.clearTimeout=id=>notices.delete(id);
a.notice.value='First notice';await nextTick();assert.equal(notices.size,1);assert.equal([...notices.values()][0].delay,3000);
a.notice.value='Replacement';await nextTick();assert.equal(notices.size,1);[...notices.values()][0].fn();await nextTick();assert.equal(a.notice.value,'');assert.equal(notices.size,0);
console.log('PASS: inline editor focus, confirmation focus, visible dropdown CSS and 3-second toast lifecycle.');
