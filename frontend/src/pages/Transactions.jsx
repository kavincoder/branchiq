import { useState, useMemo, useEffect, useRef } from 'react';
import TopNav from '../components/TopNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconPlus, IconEdit, IconTrash, IconTriangle, IconX,
  IconChevronLeft, IconChevronRight, IconTrendingUp, IconTrendingDown, IconList,
} from '../components/icons.jsx';
import { fmtINR, fmtINRCompact, fmtDateTime, txnLabel, txnClass } from '../utils/format.js';
import { api } from '../api/client.js';
import '../styles/transactions.css';

const PAGE_SIZE = 20;
const EMPTY_FORM = { account_number: '', holder_name: '', type: 'deposit', amount: '', notes: '' };

function nextTxnId(txns) {
  if (!txns.length) return 'TXN-2026-0001';
  const max = Math.max(...txns.map(t => parseInt(t.transaction_id.split('-')[2]) || 0));
  return `TXN-2026-${String(max + 1).padStart(4, '0')}`;
}

function byName(user) {
  if (!user?.full_name) return 'Staff';
  const parts = user.full_name.split(' ');
  return parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');
}

function adaptTxn(t) {
  return {
    ...t,
    type: t.transaction_type,
    transaction_date: t.created_at,
    notes: t.note,
    is_anomaly: t.anomaly_score >= 0.6,
    anomaly_reason_plain: t.anomaly_reason,
    created_by_name: t.created_by_name || byName(null),
    amount: parseFloat(t.amount),
  };
}

export default function Transactions() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [txns,    setTxns]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [page,        setPage]        = useState(1);

  const [drawerMode, setDrawerMode] = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState({});
  const [editId,     setEditId]     = useState(null);
  const [saving,     setSaving]     = useState(false);

  // Autocomplete state
  const [nameDrop,    setNameDrop]    = useState([]);
  const [accDrop,     setAccDrop]     = useState([]);
  const nameDropRef = useRef(null);
  const accDropRef  = useRef(null);

  // Close autocomplete dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (nameDropRef.current && !nameDropRef.current.contains(e.target)) setNameDrop([]);
      if (accDropRef.current  && !accDropRef.current.contains(e.target))  setAccDrop([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Deduplicated account list built from loaded transactions
  const knownAccounts = useMemo(() => {
    const seen = new Map();
    txns.forEach(t => {
      if (t.account_number && !seen.has(t.account_number))
        seen.set(t.account_number, t.holder_name);
    });
    return Array.from(seen.entries()).map(([account_number, holder_name]) => ({ account_number, holder_name }));
  }, [txns]);

  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const [toast,          setToast]          = useState(null);
  const [dupWarning,     setDupWarning]     = useState(false);   // duplicate warning modal
  const [pendingPayload, setPendingPayload] = useState(null);    // payload waiting for dup confirm
  const [openLoans,      setOpenLoans]      = useState([]);      // loans for loan_repayment link
  const [linkedLoan,     setLinkedLoan]     = useState('');      // selected loan ID

  const showToast = (t, d) => { setToast({ t, d }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    api.get('/transactions/?limit=500')
      .then(data => { setTxns(data.map(adaptTxn)); setLoading(false); })
      .catch(e  => { setError(e.message); setLoading(false); });
  }, []);

  const totalDeposits    = txns.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = txns.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
  const anomalyCount     = txns.filter(t => t.is_anomaly).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txns.filter(t => {
      if (q && !t.transaction_id.toLowerCase().includes(q) &&
               !t.holder_name.toLowerCase().includes(q) &&
               !t.account_number.toLowerCase().includes(q)) return false;
      if (typeFilter && t.type !== typeFilter) return false;
      if (anomalyOnly && !t.is_anomaly) return false;
      if (dateFrom && t.transaction_date?.slice(0,10) < dateFrom) return false;
      if (dateTo   && t.transaction_date?.slice(0,10) > dateTo)   return false;
      return true;
    });
  }, [txns, search, typeFilter, anomalyOnly, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || typeFilter || anomalyOnly || dateFrom || dateTo;

  const resetPage    = () => setPage(1);
  const clearFilters = () => { setSearch(''); setTypeFilter(''); setAnomalyOnly(false); setDateFrom(''); setDateTo(''); resetPage(); };

  const openAdd = () => {
    setForm(EMPTY_FORM); setFormErr({}); setEditId(null);
    setLinkedLoan(''); setOpenLoans([]);
    setDrawerMode('add');
  };
  const openEdit = (tx) => {
    setForm({ account_number: tx.account_number, holder_name: tx.holder_name, type: tx.type, amount: String(tx.amount), notes: tx.notes || '' });
    setFormErr({}); setEditId(tx.transaction_id);
    setLinkedLoan(''); setOpenLoans([]);
    setDrawerMode('edit');
  };
  const closeDrawer = () => { setDrawerMode(null); setNameDrop([]); setAccDrop([]); setLinkedLoan(''); setOpenLoans([]); };

  // Fetch open loans when type=loan_repayment and account_number is set
  useEffect(() => {
    if (form.type === 'loan_repayment' && form.account_number.trim().length >= 3) {
      api.get(`/loans/?loan_status=active&limit=100`)
        .then(data => {
          const acc = form.account_number.trim().toLowerCase();
          setOpenLoans((data || []).filter(l => l.account_number.toLowerCase().includes(acc)));
        })
        .catch(() => setOpenLoans([]));
    } else {
      setOpenLoans([]);
      setLinkedLoan('');
    }
  }, [form.type, form.account_number]);

  // Last 5 unique accounts for quick-pick chips
  const recentAccounts = useMemo(() => {
    const seen = new Map();
    [...txns].sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .forEach(t => { if (!seen.has(t.account_number)) seen.set(t.account_number, t.holder_name); });
    return Array.from(seen.entries()).slice(0, 5).map(([account_number, holder_name]) => ({ account_number, holder_name }));
  }, [txns]);
  const setF = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setFormErr(e => ({ ...e, [k]: '' }));
    if (k === 'holder_name') {
      const q = v.trim().toLowerCase();
      setNameDrop(q.length < 1 ? [] : knownAccounts.filter(a => a.holder_name.toLowerCase().includes(q)).slice(0, 6));
      setAccDrop([]);
    }
    if (k === 'account_number') {
      const q = v.trim().toLowerCase();
      setAccDrop(q.length < 1 ? [] : knownAccounts.filter(a => a.account_number.toLowerCase().includes(q)).slice(0, 6));
      setNameDrop([]);
    }
  };

  const pickAccount = (acct) => {
    setForm(f => ({ ...f, holder_name: acct.holder_name, account_number: acct.account_number }));
    setFormErr(e => ({ ...e, holder_name: '', account_number: '' }));
    setNameDrop([]);
    setAccDrop([]);
  };

  const doSave = async (payload) => {
    setSaving(true);
    try {
      if (drawerMode === 'add') {
        const created = await api.post('/transactions/', payload);
        setTxns(prev => [adaptTxn(created), ...prev]);
        showToast('Transaction added', `${created.transaction_id} · ${fmtINR(payload.amount)}`);
      } else {
        const editPayload = {
          account_number:   form.account_number.trim(),
          holder_name:      form.holder_name.trim(),
          transaction_type: form.type,
          amount:           payload.amount,
          note:             form.notes,
        };
        const updated = await api.put(`/transactions/${editId}`, editPayload);
        setTxns(prev => prev.map(t => t.transaction_id === editId ? adaptTxn(updated) : t));
        showToast('Transaction updated', `${editId} · ${fmtINR(payload.amount)}`);
      }
      closeDrawer();
      setPage(1);
    } catch (e) {
      showToast('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveDrawer = async () => {
    const errs = {};
    if (!form.account_number.trim()) errs.account_number = 'Required';
    if (!form.holder_name.trim())    errs.holder_name    = 'Required';
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount';
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    const payload = {
      transaction_id:   nextTxnId(txns),
      account_number:   form.account_number.trim(),
      holder_name:      form.holder_name.trim(),
      transaction_type: form.type,
      amount:           amt,
      note:             linkedLoan ? `Loan repayment: ${linkedLoan}${form.notes ? ' · ' + form.notes : ''}` : form.notes,
    };

    // Duplicate check — same account + type + amount within last 24 hours
    if (drawerMode === 'add') {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const isDup = txns.some(t =>
        t.account_number === payload.account_number &&
        t.type === form.type &&
        Math.abs(t.amount - amt) < 0.01 &&
        new Date(t.transaction_date).getTime() > cutoff
      );
      if (isDup) {
        setPendingPayload(payload);
        setDupWarning(true);
        return;
      }
    }

    doSave(payload);
  };

  const confirmDelete = async () => {
    const id = deleteTarget.transaction_id;
    setDeleting(true);
    try {
      await api.delete(`/transactions/${id}`);
      setTxns(prev => prev.filter(t => t.transaction_id !== id));
      setDeleteTarget(null);
      showToast('Transaction deleted', id);
    } catch (e) {
      showToast('Error', e.message);
    } finally {
      setDeleting(false);
    }
  };

  const scoreColor = (s) => s >= 0.8 ? '#EF4444' : s >= 0.6 ? '#F59E0B' : '#10B981';

  if (loading) return (
    <>
      <TopNav active="Transactions" />
      <main>
        <div className="title-row"><div><h1>Transactions</h1><div className="sub">Loading…</div></div></div>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading transactions…</div>
      </main>
    </>
  );

  if (error) return (
    <>
      <TopNav active="Transactions" />
      <main>
        <div className="title-row"><div><h1>Transactions</h1></div></div>
        <div className="panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--red)' }}>Error: {error}</div>
      </main>
    </>
  );

  return (
    <>
      <TopNav active="Transactions" />
      <main>
        <div className="title-row">
          <div>
            <h1>Transactions</h1>
            <div className="sub">{new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })} · All branch transactions</div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={15} /> Add Transaction
            </button>
          </div>
        </div>

        <div className="summary-bar" style={{ '--n': 4 }}>
          <div className="stat-card">
            <div className="ico" style={{ background: '#E8EEF7', color: '#1A3C6E' }}><IconList size={22} /></div>
            <div className="body"><div className="label">Total Transactions</div><div className="val">{txns.length}</div><div className="sub">All time</div></div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#ECFDF5', color: '#10B981' }}><IconTrendingUp size={22} /></div>
            <div className="body"><div className="label">Total Deposits</div><div className="val">{fmtINRCompact(totalDeposits)}</div><div className="sub">{txns.filter(t => t.type === 'deposit').length} transactions</div></div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#FEF2F2', color: '#EF4444' }}><IconTrendingDown size={22} /></div>
            <div className="body"><div className="label">Total Withdrawals</div><div className="val">{fmtINRCompact(totalWithdrawals)}</div><div className="sub">{txns.filter(t => t.type === 'withdrawal').length} transactions</div></div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#FEE2E2', color: '#DC2626' }}><IconTriangle size={22} /></div>
            <div className="body"><div className="label">Anomalies</div><div className="val">{anomalyCount}</div><div className="sub">Flagged by AI</div></div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-mini">
            <input placeholder="Search ID, name, account…" value={search} onChange={e => { setSearch(e.target.value); resetPage(); }} />
          </div>
          <select className="sel" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); resetPage(); }}>
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer</option>
            <option value="loan_repayment">Loan Repayment</option>
          </select>
          <div className="date-range">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); resetPage(); }} />
            <span className="sep">–</span>
            <input type="date" value={dateTo}   onChange={e => { setDateTo(e.target.value);   resetPage(); }} />
          </div>
          <button className={`btn-anom-toggle${anomalyOnly ? ' on' : ''}`} onClick={() => { setAnomalyOnly(v => !v); resetPage(); }}>
            <IconTriangle size={13} /> Anomalies only
          </button>
          {hasFilters && <button className="clear-pill" onClick={clearFilters}><IconX size={13} /> Clear</button>}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="panel">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Account</th>
                <th>Type</th>
                <th className="num">Amount</th>
                <th>Date</th>
                <th>By</th>
                {isManager && <th style={{ width: 80 }}></th>}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={isManager ? 7 : 6}>
                  <div className="empty"><div className="ico"><IconList size={28} /></div><div className="t">No transactions found</div><div className="d">Try adjusting your filters</div></div>
                </td></tr>
              ) : pageData.map(tx => (
                <tr key={tx.transaction_id} className={tx.is_anomaly ? 'anomaly' : ''}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="id-cell mono" style={{ fontSize: 12 }}>{tx.transaction_id}</span>
                      {tx.is_anomaly && <span className="chip anom"><IconTriangle size={10} /> Anomaly</span>}
                    </div>
                    {tx.is_anomaly && tx.anomaly_reason_plain && (
                      <div style={{ fontSize: 11, color: 'var(--anomaly)', marginTop: 3, maxWidth: 220, lineHeight: 1.3 }}>{tx.anomaly_reason_plain}</div>
                    )}
                    {tx.is_anomaly && tx.anomaly_score != null && (
                      <div className="score-bar-wrap" style={{ marginTop: 5, maxWidth: 160 }}>
                        <div className="score-bar"><div className="score-bar-fill" style={{ width: `${tx.anomaly_score * 100}%`, background: scoreColor(tx.anomaly_score) }} /></div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor(tx.anomaly_score), fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{(tx.anomaly_score * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="holder">{tx.holder_name}</div>
                    <div
                      className="acc mono"
                      title="Click to filter by this account"
                      style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                      onClick={() => { setSearch(tx.account_number); resetPage(); }}
                    >{tx.account_number}</div>
                  </td>
                  <td><span className={`chip ${txnClass(tx.type)}`}>{txnLabel(tx.type)}</span></td>
                  <td className={`amount ${tx.type === 'deposit' ? 'pos' : tx.type === 'withdrawal' ? 'neg' : ''} mono`}>{fmtINR(tx.amount)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDateTime(tx.transaction_date)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{tx.created_by_name}</td>
                  {isManager && (
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" title="Edit"   onClick={() => openEdit(tx)}><IconEdit size={14} /></button>
                        <button className="btn-icon" title="Delete" style={{ color: 'var(--red)' }} onClick={() => setDeleteTarget(tx)}><IconTrash size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="panel-foot">
            <span>Showing {filtered.length === 0 ? 0 : (page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="pager">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}><IconChevronLeft size={12}/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce((acc,n,i,arr)=>{if(i>0&&n-arr[i-1]>1)acc.push('…');acc.push(n);return acc;},[]).map((n,i)=>n==='…'?<span key={`e${i}`} style={{padding:'0 4px',fontSize:12,color:'var(--text-muted)'}}>…</span>:<button key={n} className={n===page?'on':''} onClick={()=>setPage(n)}>{n}</button>)}
              <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}><IconChevronRight size={12}/></button>
            </div>
          </div>
        </div>
      </main>

      {/* Add / Edit Drawer */}
      <div className={`drawer-overlay${drawerMode ? ' open' : ''}`} onClick={closeDrawer} />
      <div className={`drawer${drawerMode ? ' open' : ''}`}>
        <div className="drawer-head">
          <div><h3>{drawerMode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}</h3>{drawerMode === 'edit' && <div className="sub">{editId}</div>}</div>
          <button className="btn-icon" onClick={closeDrawer}><IconX size={18} /></button>
        </div>
        <div className="drawer-body">
          {/* Recent accounts quick-pick chips */}
          {drawerMode === 'add' && recentAccounts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                Recent Accounts
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recentAccounts.map(a => (
                  <button
                    key={a.account_number}
                    type="button"
                    onClick={() => pickAccount(a)}
                    style={{
                      padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)',
                      background: form.account_number === a.account_number ? 'var(--navy)' : 'var(--bg)',
                      color: form.account_number === a.account_number ? 'white' : 'var(--text-2)',
                      fontSize: 12, cursor: 'pointer', transition: 'all 120ms',
                      fontFamily: 'inherit',
                    }}
                  >
                    {a.holder_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Holder Name with autocomplete */}
          <div className="fld" ref={nameDropRef} style={{ position: 'relative' }}>
            <label>Account Holder Name <span className="req">*</span></label>
            <input
              value={form.holder_name}
              onChange={e => setF('holder_name', e.target.value)}
              placeholder="e.g. Kavin Kumar"
              autoComplete="off"
              style={formErr.holder_name ? { borderColor: 'var(--red)' } : {}}
            />
            {formErr.holder_name && <div className="help" style={{ color: 'var(--red)' }}>{formErr.holder_name}</div>}
            {nameDrop.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
                background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', marginTop: 2,
              }}>
                {nameDrop.map(a => (
                  <div
                    key={a.account_number}
                    onMouseDown={e => { e.preventDefault(); pickAccount(a); }}
                    style={{
                      padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{a.holder_name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{a.account_number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Number with autocomplete */}
          <div className="fld" ref={accDropRef} style={{ position: 'relative' }}>
            <label>Account Number <span className="req">*</span></label>
            <input
              value={form.account_number}
              onChange={e => setF('account_number', e.target.value)}
              placeholder="e.g. ACC-10001"
              autoComplete="off"
              style={formErr.account_number ? { borderColor: 'var(--red)' } : {}}
            />
            {formErr.account_number && <div className="help" style={{ color: 'var(--red)' }}>{formErr.account_number}</div>}
            {accDrop.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
                background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', marginTop: 2,
              }}>
                {accDrop.map(a => (
                  <div
                    key={a.account_number}
                    onMouseDown={e => { e.preventDefault(); pickAccount(a); }}
                    style={{
                      padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{a.account_number}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{a.holder_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="fld">
            <label>Transaction Type <span className="req">*</span></label>
            <select value={form.type} onChange={e=>setF('type',e.target.value)}>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="loan_repayment">Loan Repayment</option>
            </select>
          </div>
          <div className="fld">
            <label>Amount (₹) <span className="req">*</span></label>
            <div className="inr-input" style={formErr.amount?{borderColor:'var(--red)'}:{}}>
              <span className="prefix">₹</span>
              <input type="number" min="1" step="0.01" value={form.amount} onChange={e=>setF('amount',e.target.value)} placeholder="0.00"/>
            </div>
            {formErr.amount && <div className="help" style={{color:'var(--red)'}}>{formErr.amount}</div>}
            {form.amount && !isNaN(parseFloat(form.amount)) && parseFloat(form.amount)>0 && <div className="help">{fmtINR(parseFloat(form.amount))}</div>}
          </div>
          {/* Loan repayment link — only visible when type=loan_repayment */}
          {form.type === 'loan_repayment' && (
            <div className="fld">
              <label>Link to Loan</label>
              {openLoans.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
                  {form.account_number.trim().length >= 3 ? 'No open loans found for this account' : 'Enter account number to see open loans'}
                </div>
              ) : (
                <select value={linkedLoan} onChange={e => setLinkedLoan(e.target.value)}>
                  <option value="">— Select loan (optional) —</option>
                  {openLoans.map(l => (
                    <option key={l.loan_id} value={l.loan_id}>
                      {l.loan_id} · {fmtINR(parseFloat(l.principal_amount))} · {l.holder_name}
                    </option>
                  ))}
                </select>
              )}
              {linkedLoan && <div className="help" style={{ color: 'var(--blue)' }}>Repayment will be linked to {linkedLoan}</div>}
            </div>
          )}
          <div className="fld">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e=>setF('notes',e.target.value)} placeholder="Optional notes…" rows={3}/>
          </div>
        </div>
        <div className="drawer-foot">
          <button className="btn btn-secondary" onClick={closeDrawer}>Cancel</button>
          <button className="btn btn-primary" onClick={saveDrawer} disabled={saving}>
            {saving ? 'Saving…' : drawerMode === 'edit' ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>
      </div>

      {/* Duplicate warning modal */}
      {dupWarning && (
        <div className="modal-overlay" onClick={() => { setDupWarning(false); setPendingPayload(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <IconTriangle size={22} />
            </div>
            <div className="modal-title">Possible Duplicate</div>
            <div className="modal-sub">
              A <strong>{form.type}</strong> of <strong>{fmtINR(parseFloat(form.amount))}</strong> for this account was already recorded in the last 24 hours.
              Are you sure you want to add another?
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setDupWarning(false); setPendingPayload(null); }}>Go Back</button>
              <button className="btn btn-primary" onClick={() => { setDupWarning(false); doSave(pendingPayload); setPendingPayload(null); }}>
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-icon"><IconTrash size={22} /></div>
            <div className="modal-title">Delete Transaction?</div>
            <div className="modal-sub">Permanently delete <strong>{deleteTarget.transaction_id}</strong> ({fmtINR(deleteTarget.amount)} · {txnLabel(deleteTarget.type)}). This cannot be undone.</div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-wrap">
        {toast && (
          <div className="toast">
            <div className="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div style={{flex:1}}><div className="t">{toast.t}</div><div className="d">{toast.d}</div></div>
          </div>
        )}
      </div>
    </>
  );
}
