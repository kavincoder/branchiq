import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import TopNav from '../components/TopNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { IconList, IconShieldCheck, IconX, IconChevronLeft, IconChevronRight } from '../components/icons.jsx';
import { fmtDateTime } from '../utils/format.js';
import { api } from '../api/client.js';
import '../styles/audit.css';

const PAGE_SIZE = 20;

const ACTION_COLOR = {
  create: '#059669', update: '#D97706', delete: '#DC2626',
  login:  '#2563EB', export: '#1A3C6E',
};

export default function AuditLogs() {
  const { user } = useAuth();
  if (user?.role !== 'manager') return <Navigate to="/dashboard" replace />;

  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);

  useEffect(() => {
    // Fetch last 500 entries — paginated to prevent browser/backend OOM on large datasets
    api.get('/users/audit-logs?limit=500&skip=0')
      .then(data => setLogs(data || []))
      .catch(e => console.error('Audit logs load error:', e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter(l => {
      if (actionFilter && l.action !== actionFilter) return false;
      if (q && !(l.record_id || '').toLowerCase().includes(q) &&
               !(l.performed_by_name || '').toLowerCase().includes(q) &&
               !(l.table_name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const hasFilters = actionFilter || search;
  const resetPage  = () => setPage(1);
  const clearFilters = () => { setActionFilter(''); setSearch(''); resetPage(); };

  const counts = {
    create: logs.filter(l => l.action === 'create').length,
    update: logs.filter(l => l.action === 'update').length,
    delete: logs.filter(l => l.action === 'delete').length,
    login:  logs.filter(l => l.action === 'login').length,
  };

  if (loading) {
    return (
      <>
        <TopNav active="Audit Logs" />
        <main>
          <div className="title-row"><div><h1>Audit Logs</h1><div className="sub">Loading…</div></div></div>
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit logs…</div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav active="Audit Logs" />
      <main>
        <div className="title-row">
          <div>
            <h1>Audit Logs</h1>
            <div className="sub">All system activity — read only</div>
          </div>
          <div className="actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--green-pale)', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 13, color: '#059669', fontWeight: 600 }}>
              <IconShieldCheck size={15}/> Tamper-proof log
            </div>
          </div>
        </div>

        <div className="summary-bar" style={{ '--n': 4 }}>
          <div className="stat-card">
            <div className="ico" style={{ background: '#E8EEF7', color: '#1A3C6E' }}><IconList size={22}/></div>
            <div className="body"><div className="label">Total Events</div><div className="val">{logs.length}</div><div className="sub">All time</div></div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#ECFDF5', color: '#059669' }}><IconShieldCheck size={22}/></div>
            <div className="body"><div className="label">Creates</div><div className="val">{counts.create}</div><div className="sub">New records</div></div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#FFFBEB', color: '#D97706' }}><IconShieldCheck size={22}/></div>
            <div className="body"><div className="label">Updates</div><div className="val">{counts.update}</div><div className="sub">Modified records</div></div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#FEF2F2', color: '#DC2626' }}><IconShieldCheck size={22}/></div>
            <div className="body"><div className="label">Deletes</div><div className="val">{counts.delete}</div><div className="sub">Removed records</div></div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-mini">
            <input placeholder="Search record, user, table…" value={search} onChange={e=>{setSearch(e.target.value);resetPage();}}/>
          </div>
          <select className="sel" value={actionFilter} onChange={e=>{setActionFilter(e.target.value);resetPage();}}>
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="export">Export</option>
          </select>
          {hasFilters && <button className="clear-pill" onClick={clearFilters}><IconX size={13}/> Clear</button>}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Staff Activity Feed */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start', marginBottom: 16 }}>
          <div /> {/* spacer — activity feed sits right */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Recent Activity</h3>
                <div className="p-sub">Last 15 events</div>
              </div>
              <IconShieldCheck size={16} style={{ color: 'var(--blue)' }} />
            </div>
            <div style={{ padding: '4px 0 8px' }}>
              {logs.slice(0, 15).map((l, i) => (
                <div key={l.id} style={{
                  padding: '8px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
                  borderBottom: i < 14 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: ACTION_COLOR[l.action] ? `${ACTION_COLOR[l.action]}18` : '#F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: ACTION_COLOR[l.action] || '#64748B',
                    marginTop: 1,
                  }}>
                    {l.action?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.performed_by_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      <span style={{ color: ACTION_COLOR[l.action] || 'inherit', fontWeight: 600 }}>{l.action}</span>
                      {' '}{l.table_name} · <span className="mono" style={{ fontSize: 10 }}>{l.record_id}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                      {fmtDateTime(l.performed_at)}
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div style={{ padding: '16px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No activity yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="panel">
          <table className="tx-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Table</th>
                <th>Record ID</th>
                <th>Performed By</th>
                <th>Date &amp; Time</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty">
                    <div className="ico"><IconList size={28}/></div>
                    <div className="t">No logs found</div>
                    <div className="d">Try adjusting your filters</div>
                  </div>
                </td></tr>
              ) : pageData.map(l => (
                <tr key={l.id}>
                  <td><span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.id}</span></td>
                  <td><span className={`action-chip ${l.action}`}>{l.action}</span></td>
                  <td><span className="tbl-name">{l.table_name}</span></td>
                  <td><span className="id-cell mono" style={{ fontSize: 12 }}>{l.record_id}</span></td>
                  <td style={{ fontSize: 13 }}>{l.performed_by_name}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDateTime(l.performed_at)}</td>
                  <td><span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{l.ip_address}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="panel-foot">
            <span>Showing {filtered.length===0?0:(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
            <div className="pager">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)}><IconChevronLeft size={12}/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce((acc,n,i,arr)=>{if(i>0&&n-arr[i-1]>1)acc.push('…');acc.push(n);return acc;},[]).map((n,i)=>n==='…'?<span key={`e${i}`} style={{padding:'0 4px',fontSize:12,color:'var(--text-muted)'}}>…</span>:<button key={n} className={n===page?'on':''} onClick={()=>setPage(n)}>{n}</button>)}
              <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><IconChevronRight size={12}/></button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
