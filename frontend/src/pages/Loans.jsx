import { useState, useMemo } from 'react';
import TopNav from '../components/TopNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconPlus, IconEdit, IconTrash, IconX,
  IconFileText, IconAlertCircle, IconTrendingUp, IconChevronLeft, IconChevronRight,
} from '../components/icons.jsx';
import { fmtINR, fmtINRCompact, fmtDate, riskClass, riskLabel } from '../utils/format.js';
import { LOANS } from '../data/mockData.js';
import '../styles/loans.css';

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  account_number: '', holder_name: '', purpose: '',
  principal_amount: '', interest_rate: '', start_date: '', end_date: '',
  status: 'active',
};

function nextLoanId(loans) {
  const nums = loans.map(l => parseInt(l.loan_id.split('-')[2]));
  return `LN-2026-${String(Math.max(...nums) + 1).padStart(4, '0')}`;
}

function calcCompound(principal, rate, start, end) {
  const P = parseFloat(principal);
  const r = parseFloat(rate) / 100;
  if (!P || !r || !start || !end) return null;
  const t = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24 * 365.25);
  if (t <= 0) return null;
  const A = P * Math.pow(1 + r / 4, 4 * t);
  const months = t * 12;
  const monthlyRate = r / 12;
  const emi = months > 0
    ? (P * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : 0;
  return { maturity: A, interest: A - P, years: t.toFixed(1), emi };
}

function RiskBar({ score }) {
  const color = score <= 30 ? '#10B981' : score <= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="risk-bar-wrap">
      <div className="risk-bar">
        <div className="risk-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="risk-score-num" style={{ color }}>{score}</span>
    </div>
  );
}

export default function Loans() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [loans, setLoans] = useState(LOANS);

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter,   setRiskFilter]   = useState('');
  const [page,         setPage]         = useState(1);

  const [drawerMode, setDrawerMode] = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState({});
  const [editId,     setEditId]     = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = (t, d) => { setToast({ t, d }); setTimeout(() => setToast(null), 3500); };

  const activeLoans    = loans.filter(l => l.status === 'active');
  const defaultedLoans = loans.filter(l => l.status === 'defaulted');
  const totalPortfolio = activeLoans.reduce((s, l) => s + l.outstanding_balance, 0);
  const avgRisk        = activeLoans.length
    ? Math.round(activeLoans.reduce((s, l) => s + l.risk_score, 0) / activeLoans.length)
    : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return loans.filter(l => {
      if (q && !l.loan_id.toLowerCase().includes(q) &&
               !l.holder_name.toLowerCase().includes(q) &&
               !l.account_number.toLowerCase().includes(q) &&
               !l.purpose.toLowerCase().includes(q)) return false;
      if (statusFilter && l.status !== statusFilter) return false;
      if (riskFilter === 'low'    && l.risk_score > 30)  return false;
      if (riskFilter === 'medium' && (l.risk_score <= 30 || l.risk_score > 60)) return false;
      if (riskFilter === 'high'   && l.risk_score <= 60) return false;
      return true;
    });
  }, [loans, search, statusFilter, riskFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || statusFilter || riskFilter;
  const resetPage  = () => setPage(1);
  const clearFilters = () => { setSearch(''); setStatusFilter(''); setRiskFilter(''); resetPage(); };

  const openAdd = () => { setForm(EMPTY_FORM); setFormErr({}); setEditId(null); setDrawerMode('add'); };
  const openEdit = (l) => {
    setForm({
      account_number: l.account_number, holder_name: l.holder_name,
      purpose: l.purpose, principal_amount: String(l.principal_amount),
      interest_rate: String(l.interest_rate), start_date: l.start_date,
      end_date: l.end_date, status: l.status,
    });
    setFormErr({}); setEditId(l.loan_id); setDrawerMode('edit');
  };
  const closeDrawer = () => setDrawerMode(null);
  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFormErr(e => ({ ...e, [k]: '' })); };

  const calc = useMemo(() =>
    calcCompound(form.principal_amount, form.interest_rate, form.start_date, form.end_date),
    [form.principal_amount, form.interest_rate, form.start_date, form.end_date]
  );

  const saveDrawer = () => {
    const errs = {};
    if (!form.account_number.trim()) errs.account_number = 'Required';
    if (!form.holder_name.trim())    errs.holder_name    = 'Required';
    if (!form.purpose.trim())        errs.purpose        = 'Required';
    const P = parseFloat(form.principal_amount);
    const R = parseFloat(form.interest_rate);
    if (!form.principal_amount || isNaN(P) || P <= 0) errs.principal_amount = 'Enter a valid amount';
    if (!form.interest_rate || isNaN(R) || R <= 0)    errs.interest_rate    = 'Enter a valid rate';
    if (!form.start_date) errs.start_date = 'Required';
    if (!form.end_date)   errs.end_date   = 'Required';
    if (form.start_date && form.end_date && form.end_date <= form.start_date) errs.end_date = 'Must be after start date';
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    if (drawerMode === 'add') {
      const newLoan = {
        loan_id:             nextLoanId(loans),
        account_number:      form.account_number.trim(),
        holder_name:         form.holder_name.trim(),
        purpose:             form.purpose.trim(),
        principal_amount:    P,
        interest_rate:       R,
        outstanding_balance: P,
        total_paid:          0,
        status:              form.status,
        start_date:          form.start_date,
        end_date:            form.end_date,
        risk_score:          0,
      };
      setLoans(prev => [newLoan, ...prev]);
      showToast('Loan added', `${newLoan.loan_id} · ${fmtINR(P)}`);
    } else {
      setLoans(prev => prev.map(l => l.loan_id === editId
        ? { ...l,
            account_number:   form.account_number.trim(),
            holder_name:      form.holder_name.trim(),
            purpose:          form.purpose.trim(),
            principal_amount: P,
            interest_rate:    R,
            start_date:       form.start_date,
            end_date:         form.end_date,
            status:           form.status,
          }
        : l
      ));
      showToast('Loan updated', `${editId} · ${fmtINR(P)}`);
    }
    closeDrawer();
    setPage(1);
  };

  const confirmDelete = () => {
    const id = deleteTarget.loan_id;
    setLoans(prev => prev.filter(l => l.loan_id !== id));
    setDeleteTarget(null);
    showToast('Loan deleted', id);
  };

  return (
    <>
      <TopNav active="Loans" />
      <main>
        {/* Title row */}
        <div className="title-row">
          <div>
            <h1>Loans</h1>
            <div className="sub">19 April 2026 · Loan portfolio management</div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={15} /> Add Loan
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="summary-bar" style={{ '--n': 4 }}>
          <div className="stat-card">
            <div className="ico" style={{ background: '#E8EEF7', color: '#1A3C6E' }}><IconFileText size={22} /></div>
            <div className="body">
              <div className="label">Active Loans</div>
              <div className="val">{activeLoans.length}</div>
              <div className="sub">{loans.filter(l => l.status === 'closed').length} closed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#F5F3FF', color: '#8B5CF6' }}><IconTrendingUp size={22} /></div>
            <div className="body">
              <div className="label">Active Portfolio</div>
              <div className="val">{fmtINRCompact(totalPortfolio)}</div>
              <div className="sub">Outstanding balance</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#FEF2F2', color: '#EF4444' }}><IconAlertCircle size={22} /></div>
            <div className="body">
              <div className="label">Defaulted</div>
              <div className="val">{defaultedLoans.length}</div>
              <div className="sub">Requires attention</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#FFFBEB', color: '#F59E0B' }}><IconAlertCircle size={22} /></div>
            <div className="body">
              <div className="label">Avg Risk Score</div>
              <div className="val">{avgRisk}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>/100</span></div>
              <div className="sub">Active loans only</div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="search-mini">
            <input
              placeholder="Search ID, name, account, purpose…"
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
            />
          </div>
          <select className="sel" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); resetPage(); }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="defaulted">Defaulted</option>
          </select>
          <select className="sel" value={riskFilter} onChange={e => { setRiskFilter(e.target.value); resetPage(); }}>
            <option value="">All Risk Levels</option>
            <option value="low">Low Risk (≤30)</option>
            <option value="medium">Medium Risk (31–60)</option>
            <option value="high">High Risk (&gt;60)</option>
          </select>
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
                <th>Loan ID</th>
                <th>Account</th>
                <th>Purpose</th>
                <th className="num">Principal</th>
                <th className="num">Outstanding</th>
                <th>Rate</th>
                <th>Risk</th>
                <th>Status</th>
                <th>End Date</th>
                {isManager && <th style={{ width: 80 }}></th>}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 10 : 9}>
                    <div className="empty">
                      <div className="ico"><IconFileText size={28} /></div>
                      <div className="t">No loans found</div>
                      <div className="d">Try adjusting your filters</div>
                    </div>
                  </td>
                </tr>
              ) : pageData.map(l => (
                <tr key={l.loan_id} className={l.status === 'defaulted' ? 'anomaly' : ''}>
                  <td>
                    <div className="id-cell mono" style={{ fontSize: 12 }}>{l.loan_id}</div>
                    <div className="acc mono">{l.account_number}</div>
                  </td>
                  <td>
                    <div className="holder">{l.holder_name}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 160 }}>{l.purpose}</td>
                  <td className="amount mono">{fmtINR(l.principal_amount)}</td>
                  <td className={`amount mono ${l.status === 'defaulted' ? 'neg' : ''}`}>
                    {l.outstanding_balance > 0 ? fmtINR(l.outstanding_balance) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{l.interest_rate}%</span>
                  </td>
                  <td>
                    {l.status === 'closed'
                      ? <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                      : <>
                          <RiskBar score={l.risk_score} />
                          <span className={`badge ${riskClass(l.risk_score)}`} style={{ fontSize: 10, marginTop: 4 }}>
                            {riskLabel(l.risk_score)}
                          </span>
                        </>
                    }
                  </td>
                  <td><span className={`status ${l.status}`}>{l.status.charAt(0).toUpperCase() + l.status.slice(1)}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDate(l.end_date)}</td>
                  {isManager && (
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(l)}><IconEdit size={14} /></button>
                        <button className="btn-icon" title="Delete" style={{ color: 'var(--red)' }} onClick={() => setDeleteTarget(l)}><IconTrash size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="panel-foot">
            <span>
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="pager">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevronLeft size={12} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i-1] > 1) acc.push('…'); acc.push(n); return acc; }, [])
                .map((n, i) => n === '…'
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
            <h3>{drawerMode === 'edit' ? 'Edit Loan' : 'Add Loan'}</h3>
            {drawerMode === 'edit' && <div className="sub">{editId}</div>}
          </div>
          <button className="btn-icon" onClick={closeDrawer}><IconX size={18} /></button>
        </div>
        <div className="drawer-body">
          <div className="fld">
            <label>Account Number <span className="req">*</span></label>
            <input value={form.account_number} onChange={e => setF('account_number', e.target.value)}
              placeholder="e.g. ACC-2026-0023"
              style={formErr.account_number ? { borderColor: 'var(--red)' } : {}} />
            {formErr.account_number && <div className="help" style={{ color: 'var(--red)' }}>{formErr.account_number}</div>}
          </div>
          <div className="fld">
            <label>Account Holder Name <span className="req">*</span></label>
            <input value={form.holder_name} onChange={e => setF('holder_name', e.target.value)}
              placeholder="e.g. Ravi Kumar"
              style={formErr.holder_name ? { borderColor: 'var(--red)' } : {}} />
            {formErr.holder_name && <div className="help" style={{ color: 'var(--red)' }}>{formErr.holder_name}</div>}
          </div>
          <div className="fld">
            <label>Purpose <span className="req">*</span></label>
            <input value={form.purpose} onChange={e => setF('purpose', e.target.value)}
              placeholder="e.g. Home renovation"
              style={formErr.purpose ? { borderColor: 'var(--red)' } : {}} />
            {formErr.purpose && <div className="help" style={{ color: 'var(--red)' }}>{formErr.purpose}</div>}
          </div>
          <div className="fld">
            <label>Principal Amount (₹) <span className="req">*</span></label>
            <div className="inr-input" style={formErr.principal_amount ? { borderColor: 'var(--red)' } : {}}>
              <span className="prefix">₹</span>
              <input type="number" min="1" step="0.01" value={form.principal_amount}
                onChange={e => setF('principal_amount', e.target.value)} placeholder="0.00" />
            </div>
            {formErr.principal_amount && <div className="help" style={{ color: 'var(--red)' }}>{formErr.principal_amount}</div>}
          </div>
          <div className="fld">
            <label>Annual Interest Rate (%) <span className="req">*</span></label>
            <div className="inr-input" style={formErr.interest_rate ? { borderColor: 'var(--red)' } : {}}>
              <span className="prefix" style={{ fontSize: 13 }}>%</span>
              <input type="number" min="0.1" max="30" step="0.1" value={form.interest_rate}
                onChange={e => setF('interest_rate', e.target.value)} placeholder="e.g. 12.5" />
            </div>
            {formErr.interest_rate && <div className="help" style={{ color: 'var(--red)' }}>{formErr.interest_rate}</div>}
          </div>
          <div className="fld">
            <label>Loan Term</label>
            <div className="row2">
              <div className="fld" style={{ gap: 4 }}>
                <label style={{ fontSize: 11 }}>Start Date <span className="req">*</span></label>
                <input type="date" value={form.start_date} onChange={e => setF('start_date', e.target.value)}
                  style={formErr.start_date ? { borderColor: 'var(--red)' } : {}} />
                {formErr.start_date && <div className="help" style={{ color: 'var(--red)' }}>{formErr.start_date}</div>}
              </div>
              <div className="fld" style={{ gap: 4 }}>
                <label style={{ fontSize: 11 }}>End Date <span className="req">*</span></label>
                <input type="date" value={form.end_date} onChange={e => setF('end_date', e.target.value)}
                  style={formErr.end_date ? { borderColor: 'var(--red)' } : {}} />
                {formErr.end_date && <div className="help" style={{ color: 'var(--red)' }}>{formErr.end_date}</div>}
              </div>
            </div>
          </div>
          <div className="fld">
            <label>Status</label>
            <select value={form.status} onChange={e => setF('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>

          {/* Live compound interest preview */}
          {calc && (
            <div className="calc-preview">
              <div className="cp-row">
                <span className="cp-key">Maturity Amount</span>
                <span className="cp-val">{fmtINR(Math.round(calc.maturity))}</span>
              </div>
              <div className="cp-divider" />
              <div className="cp-row">
                <span className="cp-key">Total Interest</span>
                <span className="cp-val">{fmtINR(Math.round(calc.interest))}</span>
              </div>
              <div className="cp-row">
                <span className="cp-key">Est. Monthly EMI</span>
                <span className="cp-val">{fmtINR(Math.round(calc.emi))}</span>
              </div>
              <div className="cp-sub">Quarterly compounding · A = P(1 + r/4)^(4t) · Term: {calc.years} years</div>
            </div>
          )}
        </div>
        <div className="drawer-foot">
          <button className="btn btn-secondary" onClick={closeDrawer}>Cancel</button>
          <button className="btn btn-primary" onClick={saveDrawer}>
            {drawerMode === 'edit' ? 'Save Changes' : 'Add Loan'}
          </button>
        </div>
      </div>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon"><IconTrash size={22} /></div>
            <div className="modal-title">Delete Loan?</div>
            <div className="modal-sub">
              This will permanently delete <strong>{deleteTarget.loan_id}</strong> ({fmtINR(deleteTarget.principal_amount)} · {deleteTarget.holder_name}).
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
