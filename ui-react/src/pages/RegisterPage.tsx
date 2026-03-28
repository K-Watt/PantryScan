import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      alert('Passwords do not match.');
      return;
    }
    // Auth not yet wired — Phase 3
    alert('Registration is not yet implemented (Phase 3). Stay tuned!');
  }

  return (
    <div className="container" style={{ maxWidth: '480px' }}>
      <div className="header">
        <h1>Create Account</h1>
        <p>Join PantryScan Family Hub</p>
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
            <label htmlFor="regName">Display Name</label>
            <input
              id="regName"
              className="form-control"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="regEmail">Email</label>
            <input
              id="regEmail"
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
            <label htmlFor="regPassword">Password</label>
            <input
              id="regPassword"
              className="form-control"
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="regConfirm">Confirm Password</label>
            <input
              id="regConfirm"
              className="form-control"
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <button className="btn" type="submit" style={{ width: '100%', marginBottom: '1rem' }}>
            Create Account
          </button>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
