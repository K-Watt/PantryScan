import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Auth not yet wired — Phase 3
    alert('Auth is not yet implemented (Phase 3). Stay tuned!');
  }

  return (
    <div className="container" style={{ maxWidth: '480px' }}>
      <div className="header">
        <h1>Sign In</h1>
        <p>Welcome back to PantryScan</p>
      </div>

      <div className="panel">
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.875rem 1rem',
          marginBottom: '1.5rem',
          color: 'var(--warning)',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}>
          Auth is in Phase 3 — this form is scaffolded but not yet wired to the backend.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginEmail">Email</label>
            <input
              id="loginEmail"
              className="form-control"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="loginPassword">Password</label>
            <input
              id="loginPassword"
              className="form-control"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn" type="submit" style={{ width: '100%', marginBottom: '1rem' }}>
            Sign In
          </button>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
