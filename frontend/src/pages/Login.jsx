import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { IconEye, IconEyeOff, IconUser, IconLock, IconShieldCheck, IconBarChart, IconDownload } from '../components/icons.jsx';
import '../styles/login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Please enter both username and password'); return; }
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(username.trim(), password);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
  };

  const fill = (u, p) => { setUsername(u); setPassword(p); setError(''); };

  return (
    <div className="login-wrap">
      {/* Left brand panel */}
      <div className="login-left">
        <div className="ll-logo">
          <span className="wordmark"><span className="branch">Branch</span><span className="iq">IQ</span></span>
        </div>
        <h1 className="ll-headline">Banking Intelligence, Built for Your Branch</h1>
        <div className="ll-features">
          <div className="ll-feat"><div className="ll-feat-ico"><IconBarChart size={16}/></div>Real-time Transaction Tracking</div>
          <div className="ll-feat"><div className="ll-feat-ico"><IconShieldCheck size={16}/></div>AI Anomaly Detection</div>
          <div className="ll-feat"><div className="ll-feat-ico"><IconDownload size={16}/></div>Instant Excel Reports</div>
        </div>
        <div className="ll-footer">Secure internal portal — authorized staff only</div>
      </div>

      {/* Right form panel */}
      <div className="login-right">
        <div className="login-box">
          <div className="lb-logo">
            <span className="wordmark"><span className="branch">Branch</span><span className="iq">IQ</span></span>
            <span className="portal-tag">Staff Portal</span>
          </div>
          <h2 className="lb-heading">Welcome back</h2>
          <p className="lb-sub">Sign in to your branch dashboard</p>

          <form className="login-form" onSubmit={submit}>
            {error && <div className="login-error">{error}</div>}

            <div className="fld">
              <label>Username</label>
              <div className="fld-icon">
                <span className="fi"><IconUser size={16}/></span>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="fld">
              <label>Password</label>
              <div className="fld-icon">
                <span className="fi"><IconLock size={16}/></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                  {showPw ? <IconEyeOff size={16}/> : <IconEye size={16}/>}
                </button>
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading
                ? <><svg width="16" height="16" viewBox="0 0 24 24" className="spin"><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" fill="none"/><path d="M 12 3 A 9 9 0 0 1 21 12" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg> Signing in…</>
                : 'Sign In'
              }
            </button>
          </form>

          <p className="login-help">Having trouble signing in?<br/>Contact your branch manager.</p>

          <div className="dev-creds">
            <div className="dc-label">Demo credentials</div>
            <div className="dc-row" style={{ cursor:'pointer' }} onClick={() => fill('arjun.manager','password123')}>
              Manager → <span>arjun.manager</span> / password123
            </div>
            <div className="dc-row" style={{ cursor:'pointer', marginBottom:0 }} onClick={() => fill('priya.staff','password123')}>
              Staff &nbsp;&nbsp;→ <span>priya.staff</span> / password123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
