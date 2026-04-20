import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconBell, IconChevronDown, IconPercent, IconPiggyBank, IconTrendLine,
  IconLogOut, IconUser, IconSettings, IconList, IconUsers,
} from './icons.jsx';

export default function TopNav({ active = 'Dashboard' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const portfolioRef = useRef(null);
  const userRef      = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (portfolioRef.current && !portfolioRef.current.contains(e.target)) setPortfolioOpen(false);
      if (userRef.current      && !userRef.current.contains(e.target))      setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPortfolioActive = ['Loans','Deposits','Investments'].includes(active);

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to="/dashboard" className="wordmark">
          <span className="branch">Branch</span><span className="iq">IQ</span>
        </Link>
      </div>

      <div className="nav-center">
        <Link to="/dashboard"    className={`nav-link ${active === 'Dashboard'   ? 'active' : ''}`}>Dashboard</Link>
        <Link to="/transactions" className={`nav-link ${active === 'Transactions'? 'active' : ''}`}>Transactions</Link>

        {/* Portfolio dropdown */}
        <div ref={portfolioRef} style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
          <button
            onClick={() => setPortfolioOpen(o => !o)}
            className={`nav-link ${isPortfolioActive ? 'active' : ''}`}
            style={{ background: 'none', border: 0, cursor: 'pointer' }}
          >
            Portfolio <IconChevronDown size={14} />
          </button>
          {portfolioOpen && (
            <div className="port-drop">
              <Link to="/loans"       className="port-item" onClick={() => setPortfolioOpen(false)}><span className="p-ico amber"><IconPercent size={16}/></span>Loans</Link>
              <Link to="/deposits"    className="port-item" onClick={() => setPortfolioOpen(false)}><span className="p-ico green"><IconPiggyBank size={16}/></span>Deposits</Link>
              <Link to="/investments" className="port-item" onClick={() => setPortfolioOpen(false)}><span className="p-ico purple"><IconTrendLine size={16}/></span>Investments</Link>
            </div>
          )}
        </div>

        <Link to="/ai-insights" className={`nav-link ${active === 'AI Insights' ? 'active' : ''}`}>AI Insights</Link>
        <Link to="/export"      className={`nav-link ${active === 'Export'      ? 'active' : ''}`}>Export</Link>
      </div>

      <div className="nav-right">
        <input className="search" placeholder="Search anything..." />
        <div className="bell">
          <IconBell size={20} />
          <span className="bell-badge">3</span>
        </div>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <div className="user" onClick={() => setUserMenuOpen(o => !o)}>
            <div className="avatar">{user?.initials || user?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2) || 'U'}</div>
            <div className="user-meta">
              <div className="name">{user?.full_name || 'User'}</div>
              <div className="role">{user?.role === 'manager' ? 'Branch Manager' : 'Staff'}</div>
            </div>
            <IconChevronDown size={14} />
          </div>
          {userMenuOpen && (
            <div className="user-drop">
              <div className="ud-name">{user?.full_name}</div>
              <div className="ud-role">{user?.role === 'manager' ? 'Branch Manager' : 'Staff'} · {user?.user_id}</div>
              <div className="ud-sep" />
              {user?.role === 'manager' && <>
                <Link to="/users"      className="ud-item" onClick={() => setUserMenuOpen(false)}><IconUsers size={15}/>User Management</Link>
                <Link to="/audit-logs" className="ud-item" onClick={() => setUserMenuOpen(false)}><IconList size={15}/>Audit Logs</Link>
                <div className="ud-sep" />
              </>}
              <button className="ud-item ud-logout" onClick={handleLogout}><IconLogOut size={15}/>Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
