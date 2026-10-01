import { defineConfig } from 'vite';
export default defineConfig({base:'./',build:{rollupOptions:{input:{main:'index.html',login:'login.html'}}},define:{__VUE_OPTIONS_API__:true,__VUE_PROD_DEVTOOLS__:false,__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:false}});
