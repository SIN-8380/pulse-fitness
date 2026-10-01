import {cp,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const source=new URL('../node_modules/@bryllim/workout-guide/',import.meta.url);
const destination=new URL('../public/workout-assets/',import.meta.url);
await mkdir(destination,{recursive:true});
await cp(new URL('assets/',source),destination,{recursive:true});
for(const name of ['LICENSE','LICENSE-ASSETS','ATTRIBUTION.md','LICENSES.md']) {
  try { await cp(new URL(name,source), new URL(name,destination)); } catch(error) { if(error.code!=='ENOENT')throw error; }
}
console.log('Workout illustrations copied to public/workout-assets.');
