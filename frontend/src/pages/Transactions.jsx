import { useState, useMemo } from 'react';
import TopNav from '../components/TopNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconPlus, IconEdit, IconTrash, IconTriangle, IconX,
  IconChevronLeft, IconChevronRight, IconTrendingUp, IconTrendingDown, IconList,
} from '../components/icons.jsx';
import { fmtINR, fmtINRCompact, fmtDateTime, txnLabel, txnClass } from '../utils/format.js';
import { TRANSACTIONS } from '../data/mockData.js';
import '../styles/transactions.css';

const PAGE_SIZE = 20;
const EMPTY_FORM = { account_number: '', holder_name: '', type: 'deposit', amount: '', notes: '' };

function nextTxnId(txns) {
  const max = Math.max(...txns.map(t => parseInt(t.transaction_id.split('-')[2])));
  return `TXN-2026-${String(max + 1).padStart(4, '0')}`;
}

function byName(user) {
  if (!user?.full_name) return 'Staff';
  const parts = user.full_name.split(' ');
  return parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');
}

export default function Transactions() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [txns, setTxns] = useState(TRANSACTIONS);

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

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = (t, d) => {
    setToast({ t, d });
    setTimeout(() => setToast(null), 3500);
  };

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
      if (dateFrom && t.transaction_date.slice(0,10) < dateFrom) return false;
      if (dateTo   && t.transaction_date.slice(0,10) > dateTo)   return false;
      return true;
    });
  }, [txns, search, typeFilter, anomalyOnly, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || typeFilter || anomalyOnly || dateFrom || dateTo;

  const resetPage    = () => setPage(1);
  const clearFilters = () => { setSearch(''); setTypeFilter(''); setAnomalyOnly(false); setDateFrom(''); setDateTo(''); resetPage(); };

  const openAdd = () => {
    setForm(EMPTY_FORM); setFormErr({}); setEditId(null); setDrawerMode('add');
  };
  const openEdit = (tx) => {
    setForm({ account_number: tx.account_number, holder_name: tx.holder_name, type: tx.type, amount: String(tx.amount), notes: tx.notes || '' });
    setFormErr({}); setEditId(tx.transaction_id); setDrawerMode('edit');
  };
  const closeDrawer = () => setDrawerMode(null);

  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFormErr(e => ({ ...e, [k]: '' })); };

  const saveDrawer = () => {
    const errs = {};
    if (!form.account_number.trim()) errs.account_number = 'Required';
    if (!form.holder_name.trim())    errs.holder_name    = 'Required';
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount';
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    if (drawerMode === 'add') {
      const newTx = {
        transaction_id:   nextTxnId(txns),
        account_number:   form.account_number.trim(),
        holder_name:      form.holder_name.trim(),
        type:             form.type,
        amount:           amt,
        transaction_date: new Date().toISOString(),
        created_by_name:  byName(user),
        is_anomaly:       false,
        notes:            form.notes,
      };
      setTxns(prev => [newTx, ...prev]);
      showToast('Transaction added', `${newTx.transaction_id} · ${fmtINR(amt)}`);
    } else {
      setTxns(prev => prev.map(t => t.transaction_id === editId
        ? { ...t, account_number: form.account_number.trim(), holder_name: form.holder_name.trim(), type: form.type, amount: amt }
        : t
      ));
      showToast('Transaction updated', `${editId} · ${fmtINR(amt)}`);
    }
    closeDrawer();
    setPage(1);
  };

  const confirmDelete = () => {
    const id = deleteTarget.transaction_id;
    setTxns(prev => prev.filter(t => t.transaction_id !== id));
    setDeleteTarget(null);
    showToast('Transaction deleted', id);
  };

  const scoreColor = (s) => s >= 0.8 ? '#EF4444' : s >= 0.6 ? '#F59E0B' : '#10B981';

  return (
    <>
      <TopNav active="Transactions" />
      <main>
        {/* Title row */}
        <div className="title-row">
          <div>
            <h1>Transactions</h1>
            <div className="sub">19 April 2026 · All branch transactions</div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={15} /> Add Transaction
            </button>
          </div>
        </div>

        {/* Summary bar — 4 cards */}
        <div className="summary-bar" style={{ '--n': 4 }}>
          <div className="stat-card">
            <div className="ico" style={{ background: '#E8EEF7', color: '#1A3C6E' }}><IconList size={22} /></div>
            <div className="body">
              <div className="label">Total Transactions</div>
              <div className="val">{txns.length}</div>
              <div className="sub">All time</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#ECFDF5', color: '#10B981' }}><IconTrendingUp size={22} /></div>
            <div className="body">
              <div className="label">Total Deposits</div>
              <div className="val">{fmtINRCompact(totalDeposits)}</div>
              <div className="sub">{txns.filter(t => t.type === 'deposit').length} transactions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#FEF2F2', color: '#EF4444' }}><IconTrendingDown size={22} /></div>
            <div className="body">
              <div className="label">Total Withdrawals</div>
              <div className="val">{fmtINRCompact(totalWithdrawals)}</div>
              <div className="sub">{txns.filter(t => t.type === 'withdrawal').length} transactions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#FEE2E2', color: '#DC2626' }}><IconTriangle size={22} /></div>
            <div className="body">
              <div className="label">Anomalies</div>
              <div className="val">{anomalyCount}</div>
              <div className="sub">Flagged by AI</div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="search-mini">
            <input
              placeholder="Search ID, name, account…"
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
            />
          </div>
          <select className="sel" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); resetPage(); }}>
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer</option>
            <option value="loan_repayment">Loan Repayment</option>
          </select>
          <div className="date-range">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); resetPage(); }} placeholder="From" />
            <span className="sep">–</span>
            <input type="date" value={dateTo}   onChange={e => { setDateTo(e.target.value);   resetPage(); }} placeholder="To"   />
          </div>
          <button
            className={`btn-anom-toggle${anomalyOnly ? ' on' : ''}`}
            onClick={() => { setAnomalyOnly(v => !v); resetPage(); }}
          >
            <IconTriangle size={13} /> Anomalies only
          </button>
          {hasFilters && (
            <button className="clear-pill" onClick={clearFilters}>
              <IconX size={13} /> Clear
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table panel */}
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
                <tr>
                  <td colSpan={isManager ? 7 : 6}>
                    <div className="empty">
                      <div className="ico"><IconList size={28} /></div>
                      <div className="t">No transactions found</div>
                      <div className="d">Try adjusting your filters</div>
                    </div>
                  </td>
                </tr>
              ) : pageData.map(tx => (
                <tr key={tx.transaction_id} className={tx.is_anomaly ? 'anomaly' : ''}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="id-cell mono" style={{ fontSize: 12 }}>{tx.transaction_id}</span>
                      {tx.is_anomaly && (
                        <span className="chip anom"><IconTriangle size={10} /> Anomaly</span>
                      )}
                    </div>
                    {tx.is_anomaly && tx.anomaly_reason_plain && (
                      <div style={{ fontSize: 11, color: 'var(--anomaly)', marginTop: 3, maxWidth: 220, lineHeight: 1.3 }}>
                        {tx.anomaly_reason_plain}
                      </div>
                    )}
                    {tx.is_anomaly && tx.anomaly_score != null && (
                      <div className="score-bar-wrap" style={{ marginTop: 5, maxWidth: 160 }}>
                        <div className="score-bar">
                          <div className="score-bar-fill" style={{ width: `${tx.anomaly_score * 100}%`, background: scoreColor(tx.anomaly_score) }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor(tx.anomaly_score), fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                          {(tx.anomaly_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="holder">{tx.holder_name}</div>
                    <div className="acc mono">{tx.account_number}</div>
                  </td>
                  <td><span className={`chip ${txnClass(tx.type)}`}>{txnLabel(tx.type)}</span></td>
                  <td className={`amount ${tx.type === 'deposit' ? 'pos' : tx.type === 'withdrawal' ? 'neg' : ''} mono`}>
                    {fmtINR(tx.amount)}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDateTime(tx.transaction_date)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{tx.created_by_name}</td>
                  {isManager && (
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(tx)}><IconEdit size={14} /></button>
                        <button className="btn-icon" title="Delete" style={{ color: 'var(--red)' }} onClick={() => setDeleteTarget(tx)}><IconTrash size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination footer */}
          <div className="panel-foot">
            <span>
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="pager">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevronLeft size={12} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === '…'
                    ? <span key={`e${i}`} style={{ padding: '0 4px', fontSize: 12, color: 'var(--text-muted)' }}>…</span>
                    : <button key={n} className={n === page ? 'on' : ''} onClick={() => setPage(n)}>{n}</button>
                )
              }
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><IconChevronRight size={12} /></button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Add / Edit Drawer ── */}
      <div className={`drawer-overlay${drawerMode ? ' open' : ''}`} onClick={closeDrawer} />
      <div className={`drawer${drawerMode ? ' open' : ''}`}>
        <div className="drawer-head">
          <div>
            <h3>{drawerMode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}</h3>
            {drawerMode === 'edit' && <div className="sub">{editId}</div>}
          </div>
          <button className="btn-icon" onClick={closeDrawer}><IconX size={18} /></button>
        </div>
        <div className="drawer-body">
          <div className="fld">
            <label>Account Number <span className="req">*</span></label>
            <input
              value={form.account_number}
              onChange={e => setF('account_number', e.target.value)}
              placeholder="e.g. ACC-2026-0023"
              style={formErr.account_number ? { borderColor: 'var(--red)' } : {}}
            />
            {formErr.account_number && <div className="help" style={{ color: 'var(--red)' }}>{formErr.account_number}</div>}
          </div>
          <div className="fld">
            <label>Account Holder Name <span className="req">*</span></label>
            <input
              value={form.holder_name}
              onChange={e => setF('holder_name', e.target.value)}
              placeholder="e.g. Ravi Kumar"
              style={formErr.holder_name ? { borderColor: 'var(--red)' } : {}}
            />
            {formErr.holder_name && <div className="help" style={{ color: 'var(--red)' }}>{formErr.holder_name}</div>}
          </div>
          <div className="fld">
            <label>Transaction Type <span className="req">*</span></label>
            <select value={form.type} onChange={e => setF('type', e.target.value)}>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="loan_repayment">Loan Repayment</option>
            </select>
          </div>
          <div className="fld">
            <label>Amount (₹) <span className="req">*</span></label>
            <div className="inr-input" style={formErr.amount ? { borderColor: 'var(--red)' } : {}}>
              <span className="prefix">₹</span>
              <input
                type="number" min="1" step="0.01"
                value={form.amount}
                onChange={e => setF('amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
            {formErr.amount && <div className="help" style={{ color: 'var(--red)' }}>{formErr.amount}</div>}
            {form.amount && !isNaN(parseFloat(form.amount)) && parseFloat(form.amount) > 0 && (
              <div className="help">{fmtINR(parseFloat(form.amount))}</div>
            )}
          </div>
          <div className="fld">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setF('notes', e.target.value)}
              placeholder="Optional notes…"
              rows={3}
            />
          </div>
        </div>
        <div className="drawer-foot">
          <button className="btn btn-secondary" onClick={closeDrawer}>Cancel</button>
          <button className="btn btn-primary" onClick={saveDrawer}>
            {drawerMode === 'edit' ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon"><IconTrash size={22} /></div>
            <div className="modal-title">Delete Transaction?</div>
            <div className="modal-sub">
              This will permanently delete <strong>{deleteTarget.transaction_id}</strong> ({fmtINR(deleteTarget.amount)} · {txnLabel(deleteTarget.type)}).
              This action cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className="toast-wrap">
        {toast && (
          <div className="toast">
            <div className="ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="t">{toast.t}</div>
              <div className="d">{toast.d}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
