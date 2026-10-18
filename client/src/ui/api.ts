import axios from 'axios'; export const api=axios.create({baseURL:'/api/v1',withCredentials:true,timeout:15000});
api.interceptors.response.use(x=>x,e=>{const endpoint=String(e.config?.url??'');if(e.response?.status===401&&!endpoint.endsWith('/auth/login')&&!endpoint.endsWith('/auth/logout'))window.dispatchEvent(new Event('hms:unauthorized'));return Promise.reject(e)});
