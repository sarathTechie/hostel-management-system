import { defineConfig } from 'vitest/config';
import {loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';

export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 const apiTarget=env.VITE_API_TARGET??'http://localhost:4000';
 if(mode==='production'&&!env.VITE_API_URL?.trim()){
  throw new Error('VITE_API_URL must be set to the deployed API base URL before building for production.');
 }

 return {
  plugins:[react()],
  resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},
  server:{port:5173,proxy:{'/api':apiTarget}},
  build:{rollupOptions:{output:{manualChunks(id){
   if(id.includes('node_modules')){
    if(/react|scheduler/.test(id))return 'react-vendor';
    if(id.includes('@tanstack'))return 'query-vendor';
    if(id.includes('lucide-react'))return 'icons';
    if(id.includes('react-hook-form')||id.includes('/zod/'))return 'forms';
   }
  }}}},
  test:{environment:'jsdom'},
 };
});
