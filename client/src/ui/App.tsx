import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, ChevronDown, ClipboardList, LogOut, Menu as MenuIcon, X } from 'lucide-react';
import { api } from './api';
import LoginPage from './pages/LoginPage';
import RoomsPage from './RoomsPage';
import ReportsPage from './ReportsPage';
import type { User } from './types';
import { nav } from './navigation';
import StudentsPage from './pages/StudentsPage';
import FeesPage from './pages/FeesPage';
import ComplaintsPage from './pages/ComplaintsPage';
import VisitorsPage from './pages/VisitorsPage';
import LeavesPage from './pages/LeavesPage';
import NoticesPage from './pages/NoticesPage';
import MessPage from './pages/MessPage';
import AccountsPage from './pages/AccountsPage';
import AuditPage from './pages/AuditPage';
import DashboardPage from './pages/DashboardPage';
import MyRoomPage from './pages/MyRoomPage';
import MyProfilePage from './pages/MyProfilePage';
import HelpPage from './pages/HelpPage';
import NotificationsPage from './pages/NotificationsPage';
import { AccessDenied, AuthServiceError, NotFound } from './pages/SystemPages';
const labels:Record<string,string>={ADMIN:'Admin / Warden',ACCOUNTANT:'Accountant',STUDENT:'Student'};
const recordPages = [
  { path: '/students', Page: StudentsPage },
  { path: '/fees', Page: FeesPage },
  { path: '/complaints', Page: ComplaintsPage },
  { path: '/visitors', Page: VisitorsPage },
  { path: '/leaves', Page: LeavesPage },
  { path: '/notices', Page: NoticesPage },
  { path: '/mess', Page: MessPage },
  { path: '/accounts', Page: AccountsPage },
  { path: '/audit', Page: AuditPage },
  { path: '/notifications', Page: NotificationsPage },
] as const;
function Shell({user,children}:{user:User;children:React.ReactNode}){
 const [open,setOpen]=useState(false),[profileOpen,setProfileOpen]=useState(false),[logoutBusy,setLogoutBusy]=useState(false),[logoutError,setLogoutError]=useState('');
 const loc=useLocation(),navigate=useNavigate(),qc=useQueryClient(),profileRef=useRef<HTMLDivElement>(null);
 const logout=async()=>{setLogoutBusy(true);setLogoutError('');try{const result=await api.post('/auth/logout');if(!result.data?.ok)throw new Error('The server did not confirm logout.');await qc.cancelQueries();qc.clear();qc.setQueryData(['me'],null);if(import.meta.env.MODE==='test')navigate('/login',{replace:true});else window.location.assign('/login')}catch(error:any){const status=error?.response?.status;setLogoutError(status?`Sign out could not be confirmed (HTTP ${status}). Your session may still be active; please retry.`:'Sign out could not reach the server. Your session may still be active; check the connection and retry.')}finally{setLogoutBusy(false)}};
 useEffect(()=>{const onPointer=(event:PointerEvent)=>{if(profileRef.current&&!profileRef.current.contains(event.target as Node))setProfileOpen(false)};const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setProfileOpen(false)};document.addEventListener('pointerdown',onPointer);document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('pointerdown',onPointer);document.removeEventListener('keydown',onKey)}},[]);
 const currentBase=nav.find(n=>n.to===loc.pathname)?.label??(loc.pathname==='/help'?'Help & FAQ':'Page not found');const current=user.role==='STUDENT'&&loc.pathname==='/fees'?'My fees':user.role==='STUDENT'&&loc.pathname==='/complaints'?'My complaints':currentBase;
 return <div className="shell"><aside className={'sidebar '+(open?'show':'')}><div className="brand"><div className="brand-mark">H</div><div><b>Residence</b><small>HOSTEL MANAGEMENT</small></div><button aria-label="Close navigation" className="icon-btn side-close" onClick={()=>setOpen(false)}><X/></button></div><div className="side-label">WORKSPACE</div><nav aria-label="Main navigation">{nav.filter(n=>n.roles.includes(user.role)).map(n=><Link onClick={()=>setOpen(false)} aria-current={loc.pathname===n.to?'page':undefined} className={loc.pathname===n.to?'active':''} key={n.to} to={n.to}><n.icon size={18}/><span>{user.role==='STUDENT'&&n.to==='/fees'?'My fees':user.role==='STUDENT'&&n.to==='/complaints'?'My complaints':n.label}</span></Link>)}</nav><div className="side-bottom"><div className="help-card"><div className="help-icon"><ClipboardList size={17}/></div><b>Need a hand?</b><p>Find answers in the help guide.</p><Link to="/help">Open help guide <ArrowUpRight size={14}/></Link></div><div className="profile"><span className="avatar">{user.name.slice(0,1).toUpperCase()}</span><span className="profile-copy"><b>{user.name}</b><small>{labels[user.role]}</small></span></div></div></aside><button aria-label="Open navigation" aria-expanded={open} className="mobile-menu icon-btn" onClick={()=>setOpen(!open)}><MenuIcon/></button>{open&&<div className="scrim" onClick={()=>setOpen(false)}/>}<div className="workspace"><header className="topbar"><div className="crumb"><span>Residence</span><span className="slash">/</span><b>{current}</b></div><div className="top-user"><span className="status-dot"/>Workspace active<div className="account-menu" ref={profileRef}><button className="account-toggle" aria-label={`Account menu for ${user.name}`} aria-expanded={profileOpen} aria-haspopup="menu" onClick={()=>setProfileOpen(v=>!v)}><span className="avatar mini">{user.name.slice(0,1).toUpperCase()}</span><span className="account-toggle-copy"><b>{user.name}</b><small>{labels[user.role]}</small></span><ChevronDown size={15}/></button>{profileOpen&&<div className="account-dropdown" role="menu"><div className="account-summary"><b>{user.name}</b><small>{user.username} · {labels[user.role]}</small></div><button role="menuitem" className="logout-action" disabled={logoutBusy} onClick={()=>void logout()}><LogOut size={16}/>{logoutBusy?'Signing out…':'Log out'}</button>{logoutError&&<p className="logout-error" role="alert">{logoutError}</p>}</div>}</div></div></header><main className="main">{children}</main><footer className="footer">Hostel Management System <span>·</span> Made for smoother residence operations</footer></div></div>
}
export default function App(){
 const qc=useQueryClient(),navigate=useNavigate(),loc=useLocation();
 const {data,isLoading,isError,error,refetch}=useQuery({queryKey:['me'],queryFn:()=>api.get('/auth/me').then(r=>r.data.user),retry:false});
 useEffect(()=>{const onUnauthorized=()=>{qc.clear();if(window.location.pathname!=='/login'){if(import.meta.env.MODE==='test')navigate('/login',{replace:true});else window.location.assign('/login')}};window.addEventListener('hms:unauthorized',onUnauthorized);return()=>window.removeEventListener('hms:unauthorized',onUnauthorized)},[navigate,qc]);
 if(loc.pathname==='/login')return data?<Navigate to="/" replace/>:<LoginPage/>;
 if(isLoading)return <div className="login-load"><span className="spinner"/>Opening your secure workspace…</div>;
 if(isError&&(error as any)?.response?.status!==401)return <AuthServiceError onRetry={()=>void refetch()}/>;
 if(!data)return <Navigate to="/login" replace/>;
 const user=data as User,permitted=(p:string)=>nav.find(n=>n.to===p)?.roles.includes(user.role)??false;
 return <Shell user={user}><Routes><Route path="/" element={<DashboardPage user={user}/>}/><Route path="/rooms" element={permitted('/rooms')?<RoomsPage/>:<AccessDenied/>}/><Route path="/my-room" element={permitted('/my-room')?<MyRoomPage/>:<AccessDenied/>}/><Route path="/my-profile" element={permitted('/my-profile')?<MyProfilePage/>:<AccessDenied/>}/><Route path="/reports" element={permitted('/reports')?<ReportsPage user={user}/>:<AccessDenied/>}/><Route path="/help" element={<HelpPage/>}/>{recordPages.map(({path,Page})=><Route key={path} path={path} element={permitted(path)?<Page user={user}/>:<AccessDenied/>}/>)}<Route path="*" element={<NotFound/>}/></Routes></Shell>
}
