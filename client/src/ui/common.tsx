import type { ReactNode } from 'react';
import { ClipboardList } from 'lucide-react';

export function PageHead({eyebrow,title,desc,action}:{eyebrow:string;title:string;desc:string;action?:ReactNode}){return <div className="page-head"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{desc}</p></div>{action}</div>}
export function Loading(){return <div className="loading"><span className="spinner"/>Loading your workspace…</div>}
export function ErrorBox(){return <div className="panel error-state"><h2>Couldn’t load this information</h2><p>Check your connection and refresh the page.</p><button className="secondary" onClick={()=>location.reload()}>Try again</button></div>}
export function Empty({title,text}:{title:string;text:string}){return <div className="empty"><div className="empty-icon"><ClipboardList/></div><b>{title}</b><p>{text}</p></div>}
