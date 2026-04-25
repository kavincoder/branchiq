import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import {
  IconBell, IconChevronDown, IconPercent, IconPiggyBank, IconTrendLine,
  IconLogOut, IconUser, IconSettings, IconList, IconUsers,
  IconArrowRightLeft,
} from './icons.jsx';

export default function TopNav({ active = 'Dashboard' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searching,     setSearching]     = useState(false);
  const [overdueCount,  setOverdueCount]  = useState(0);

  useEffect(() => {
    api.get('/loans/overdue-count')
      .then(data => setOverdueCount(data?.count || 0))
      .catch(() => {});
  }, []);
  const portfolioRef = useRef(null);
  const userRef      = useRef(null);
  const searchRef    = useRef(null);
  const searchTimer  = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (portfolioRef.current && !portfolioRef.current.contains(e.target)) setPortfolioOpen(false);
      if (userRef.current      && !userRef.current.contains(e.target))      setUserMenuOpen(false);
      if (searchRef.current    && !searchRef.current.contains(e.target))    setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced live search across transactions and loans
  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchOpen(true);
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const [txns, loans] = await Promise.all([
          api.get(`/transactions/?limit=100`),
          api.get(`/loans/?limit=100`),
        ]);
        const lq = q.toLowerCase();
        const txnMatches = (txns || [])
          .filter(t => t.holder_name?.toLowerCase().includes(lq) || t.account_number?.toLowerCase().includes(lq) || t.transaction_id?.toLowerCase().includes(lq))
          .slice(0, 4)
          .map(t => ({ type: 'txn', id: t.transaction_id, label: t.holder_name, sub: `${t.transaction_id} · ${t.transaction_type}`, route: '/transactions' }));
        const loanMatches = (loans || [])
          .filter(l => l.borrower_name?.toLowerCase().includes(lq) || l.account_number?.toLowerCase().includes(lq) || l.loan_id?.toLowerCase().includes(lq))
          .slice(0, 4)
          .map(l => ({ type: 'loan', id: l.loan_id, label: l.borrower_name, sub: `${l.loan_id} · ${l.loan_type}`, route: '/loans' }));
        setSearchResults([...txnMatches, ...loanMatches]);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
  };

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
            style={{ background: 'none', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Portfolio
            {overdueCount > 0 && (
              <span style={{
                background: '#EF4444', color: 'white', borderRadius: '50%',
                width: 16, height: 16, fontSize: 9, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{overdueCount > 9 ? '9+' : overdueCount}</span>
            )}
            <IconChevronDown size={14} />
          </button>
          {portfolioOpen && (
            <div className="port-drop">
              <Link to="/loans" className="port-item" onClick={() => setPortfolioOpen(false)}>
                <span className="p-ico amber"><IconPercent size={16}/></span>
                Loans
                {overdueCount > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: '#EF4444', color: 'white',
                    borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700,
                  }}>{overdueCount} overdue</span>
                )}
              </Link>
              <Link to="/deposits"    className="port-item" onClick={() => setPortfolioOpen(false)}><span className="p-ico green"><IconPiggyBank size={16}/></span>Deposits</Link>
              <Link to="/investments" className="port-item" onClick={() => setPortfolioOpen(false)}><span className="p-ico purple"><IconTrendLine size={16}/></span>Investments</Link>
            </div>
          )}
        </div>

        <Link to="/ai-insights" className={`nav-link ${active === 'AI Insights' ? 'active' : ''}`}>AI Insights</Link>
        <Link to="/export"      className={`nav-link ${active === 'Export'      ? 'active' : ''}`}>Export</Link>
      </div>

      <div className="nav-right">
        <div ref={searchRef} style={{ position: 'relative' }}>
          <input
            className="search"
            placeholder="Search transactions, loans…"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setSearchOpen(true)}
          />
          {searchOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden', minWidth: 280,
            }}>
              {searching && (
                <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>Searching…</div>
              )}
              {!searching && searchResults.length === 0 && (
                <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>No results for "{searchQuery}"</div>
              )}
              {!searching && searchResults.map(r => (
                <div
                  key={r.id}
                  onClick={() => { navigate(r.route); setSearchOpen(false); setSearchQuery(''); }}
                  style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <IconArrowRightLeft size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{r.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
