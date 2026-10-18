import { Link } from 'react-router-dom';
import { Search, ShieldCheck } from 'lucide-react';

export function AuthServiceError({onRetry}:{onRetry:()=>void}){return <main className="login-load"><section className="panel auth-error"><h1>HMS is temporarily unavailable</h1><p>We could not check your session. Your account data is still protected. Try again in a moment.</p><button className="primary" onClick={onRetry}>Retry session check</button></section></main>}
export function AccessDenied(){return <section className="panel not-found"><div className="empty-icon"><ShieldCheck/></div><p className="eyebrow">ACCESS CONTROL</p><h1>Access denied</h1><p className="muted">Your account role does not have access to this workspace.</p><Link className="primary" to="/">Return to overview</Link></section>}
export function NotFound(){return <section className="panel not-found"><div className="empty-icon"><Search/></div><p className="eyebrow">404 · PAGE NOT FOUND</p><h1>This workspace page doesn’t exist</h1><p className="muted">Check the address or return to your overview.</p><Link className="primary" to="/">Go to overview</Link></section>}
