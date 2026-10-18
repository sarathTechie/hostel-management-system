import React from 'react'; import {createRoot} from 'react-dom/client'; import {QueryClient,QueryClientProvider} from '@tanstack/react-query'; import {BrowserRouter} from 'react-router-dom'; import App from './ui/App'; import './ui.css'; import './ui-extra.css';
const qc=new QueryClient({defaultOptions:{queries:{retry:1,staleTime:20_000}}});
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={qc}><BrowserRouter><App/></BrowserRouter></QueryClientProvider></React.StrictMode>);
