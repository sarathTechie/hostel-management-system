import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { api } from '../api';

type LoginError = { response?: { data?: { error?: string } } };

export default function LoginPage() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const formData = new FormData(event.currentTarget);

    try {
      const result = await api.post('/auth/login', {
        username: formData.get('username'),
        password: formData.get('password'),
      });
      queryClient.setQueryData(['me'], result.data.user);
      navigate('/');
    } catch (cause) {
      const message = cause && typeof cause === 'object'
        ? (cause as LoginError).response?.data?.error
        : undefined;
      setError(message || 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <div className="login-visual">
        <div className="brand-mark">H</div>
        <div className="login-title">
          <span>HOSTEL MANAGEMENT</span>
          <h1>
            A better way to
            <br />
            run your residence.
          </h1>
          <p>One clear workspace for the people and places that make a hostel feel like home.</p>
        </div>
        <div className="login-foot">RESIDENCE OPERATIONS · VERSION 1.0</div>
      </div>
      <section className="login-form">
        <div className="login-card">
          <div className="brand-mark small">H</div>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to HMS</h2>
          <p className="muted">Use your username or student roll number.</p>
          <form onSubmit={submit}>
            <label>
              Username or roll number
              <input name="username" autoComplete="username" required placeholder="e.g. ADM001" />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
              />
            </label>
            {error && <div className="alert" role="alert">{error}</div>}
            <button className="primary full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'} <ArrowUpRight size={17} />
            </button>
          </form>
          <p className="tiny">Secure access for hostel residents and staff</p>
        </div>
      </section>
    </main>
  );
}
