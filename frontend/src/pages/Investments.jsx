import { useState, useMemo } from 'react';
import TopNav from '../components/TopNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconPlus, IconEdit, IconTrash, IconX,
  IconTrendLine, IconPercent, IconBarChart, IconChevronLeft, IconChevronRight,
} from '../components/icons.jsx';
import { fmtINR, fmtINRCompact, fmtDate } from '../utils/format.js';
import { INVESTMENTS } from '../data/mockData.js';
import '../styles/investments.css';

const PAGE_SIZE = 20;
const EMPTY_FORM = {
  investment_type: 'govt_bond', amount: '', investment_date: '',
  maturity_date: '', expected_return_rate: '', notes: '', status: 'active',
};

const INV_TYPE_LABEL = { govt_bond: 'Govt Bond', mutual_fund: 'Mutual Fund', fixed_deposit: 'Fixed Deposit' };
const INV_TYPE_CLASS = { govt_bond: 'govt-bond', mutual_fund: 'mutual-fund', fixed_deposit: 'inv-fd' };
const STATUS_LABEL   = { active: 'Active', matured: 'Matured', liquidated: 'Liquidated' };

function nextInvId(invs) {
  const nums = invs.map(i => parseInt(i.investment_id.split('-')[2]));
  return `INV-2026-${String(Math.max(...nums) + 1).padStart(4, '0')}`;
}

function calcInvReturn(amount, rate, start, end) {
  const P = parseFloat(amount);
  const r = parseFloat(rate) / 100;
  if (!P || !r || !start || !end) return null;
  const t = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24 * 365.25);
  if (t <= 0) return null;
  const A = P * Math.pow(1 + r, t);
  return { maturity: A, returns: A - P, years: t.toFixed(1) };
}

export default function Investments() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [invs, setInvs] = useState(INVESTMENTS);

  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [statusFilter,setStatusFilter]= useState('');
  const [page,        setPage]        = useState(1);

  const [drawerMode, setDrawerMode] = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState({});
  const [editId,     setEditId]     = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = (t, d) => { setToast({ t, d }); setTimeout(() => setToast(null), 3500); };

  const activeInvs   = invs.filter(i => i.status === 'active');
  const totalInvested= invs.reduce((s, i) => s + i.amount, 0);
  const totalExpected= activeInvs.reduce((s, i) => s + (i.expected_maturity_amount - i.amount), 0);
  const avgRate      = activeInvs.length
    ? (activeInvs.reduce((s, i) => s + i.expected_return_rate, 0) / activeInvs.length).toFixed(1)
    : '0.0';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invs.filter(i => {
      if (q && !i.investment_id.toLowerCase().includes(q) &&
               !INV_TYPE_LABEL[i.investment_type].toLowerCase().includes(q) &&
               !(i.notes || '').toLowerCase().includes(q)) return false;
      if (typeFilter   && i.investment_type !== typeFilter)   return false;
      if (statusFilter && i.status          !== statusFilter) return false;
      return true;
    });
  }, [invs, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || typeFilter || statusFilter;
  const resetPage  = () => setPage(1);
  const clearFilters = () => { setSearch(''); setTypeFilter(''); setStatusFilter(''); resetPage(); };

  const openAdd = () => { setForm(EMPTY_FORM); setFormErr({}); setEditId(null); setDrawerMode('add'); };
  const openEdit = (i) => {
    setForm({
      investment_type:     i.investment_type,
      amount:              String(i.amount),
      investment_date:     i.investment_date,
      maturity_date:       i.maturity_date,
      expected_return_rate:String(i.expected_return_rate),
      notes:               i.notes || '',
      status:              i.status,
    });
    setFormErr({}); setEditId(i.investment_id); setDrawerMode('edit');
  };
  const closeDrawer = () => setDrawerMode(null);
  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFormErr(e => ({ ...e, [k]: '' })); };

  const calc = useMemo(() =>
    calcInvReturn(form.amount, form.expected_return_rate, form.investment_date, form.maturity_date),
    [form.amount, form.expected_return_rate, form.investment_date, form.maturity_date]
  );

  const saveDrawer = () => {
    const errs = {};
    const amt  = parseFloat(form.amount);
    const rate = parseFloat(form.expected_return_rate);
    if (!form.amount || isNaN(amt)  || amt  <= 0) errs.amount               = 'Enter a valid amount';
    if (!form.expected_return_rate || isNaN(rate) || rate <= 0) errs.expected_return_rate = 'Enter a valid rate';
    if (!form.investment_date)  errs.investment_date = 'Required';
    if (!form.maturity_date)    errs.maturity_date   = 'Required';
    if (form.investment_date && form.maturity_date && form.maturity_date <= form.investment_date)
      errs.maturity_date = 'Must be after investment date';
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    const matAmt = calc ? Math.round(calc.maturity) : amt;

    if (drawerMode === 'add') {
      const newInv = {
        investment_id:             nextInvId(invs),
        investment_type:           form.investment_type,
        amount:                    amt,
        investment_date:           form.investment_date,
        expected_return_rate:      rate,
        expected_maturity_amount:  matAmt,
        maturity_date:             form.maturity_date,
        status:                    form.status,
        notes:                     form.notes,
      };
      setInvs(prev => [newInv, ...prev]);
      showToast('Investment added', `${newInv.investment_id} · ${fmtINR(amt)}`);
    } else {
      setInvs(prev => prev.map(i => i.investment_id === editId
        ? { ...i,
            investment_type:          form.investment_type,
            amount:                   amt,
            investment_date:          form.investment_date,
            expected_return_rate:     rate,
            expected_maturity_amount: matAmt,
            maturity_date:            form.maturity_date,
            status:                   form.status,
            notes:                    form.notes,
          }
        : i
      ));
      showToast('Investment updated', `${editId} · ${fmtINR(amt)}`);
    }
    closeDrawer(); setPage(1);
  };

  const confirmDelete = () => {
    const id = deleteTarget.investment_id;
    setInvs(prev => prev.filter(i => i.investment_id !== id));
    setDeleteTarget(null);
    showToast('Investment deleted', id);
  };

  return (
    <>
      <TopNav active="Investments" />
      <main>
        <div className="title-row">
          <div>
            <h1>Investments</h1>
            <div className="sub">19 April 2026 · Branch investment portfolio</div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={15} /> Add Investment
            </button>
          </div>
        </div>

        <div className="summary-bar" style={{ '--n': 4 }}>
          <div className="stat-card">
            <div className="ico" style={{ background: '#F5F3FF', color: '#8B5CF6' }}><IconBarChart size={22} /></div>
            <div className="body">
              <div className="label">Active Investments</div>
              <div className="val">{activeInvs.length}</div>
              <div className="sub">{invs.filter(i => i.status === 'matured').length} matured</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#E8EEF7', color: '#1A3C6E' }}><IconTrendLine size={22} /></div>
            <div className="body">
              <div className="label">Total Invested</div>
              <div className="val">{fmtINRCompact(totalInvested)}</div>
              <div className="sub">All time</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#ECFDF5', color: '#10B981' }}><IconTrendLine size={22} /></div>
            <div className="body">
              <div className="label">Expected Returns</div>
              <div className="val">{fmtINRCompact(totalExpected)}</div>
              <div className="sub">Active investments</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#FFFBEB', color: '#F59E0B' }}><IconPercent size={22} /></div>
            <div className="body">
              <div className="label">Avg Return Rate</div>
              <div className="val">{avgRate}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>%</span></div>
              <div className="sub">Active investments</div>
            </div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-mini">
            <input placeholder="Search ID, type, notes…" value={search} onChange={e => { setSearch(e.target.value); resetPage(); }} />
          </div>
          <select className="sel" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); resetPage(); }}>
            <option value="">All Types</option>
            <option value="govt_bond">Govt Bond</option>
            <option value="mutual_fund">Mutual Fund</option>
            <option value="fixed_deposit">Fixed Deposit</option>
          </select>
          <select className="sel" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); resetPage(); }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="matured">Matured</option>
            <option value="liquidated">Liquidated</option>
          </select>
          {hasFilters && <button className="clear-pill" onClick={clearFilters}><IconX size={13} /> Clear</button>}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="panel">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Investment ID</th>
                <th>Type</th>
                <th className="num">Amount</th>
                <th>Rate</th>
                <th className="num">Expected Maturity</th>
                <th>Maturity Date</th>
                <th>Status</th>
                <th>Notes</th>
                {isManager && <th style={{ width: 80 }}></th>}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={isManager ? 9 : 8}>
                  <div className="empty">
                    <div className="ico"><IconBarChart size={28} /></div>
                    <div className="t">No investments found</div>
                    <div className="d">Try adjusting your filters</div>
                  </div>
                </td></tr>
              ) : pageData.map(i => (
                <tr key={i.investment_id}>
                  <td>
                    <div className="id-cell mono" style={{ fontSize: 12 }}>{i.investment_id}</div>
                    <div className="acc" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{i.investment_date}</div>
                  </td>
                  <td><span className={`chip ${INV_TYPE_CLASS[i.investment_type] || ''}`}>{INV_TYPE_LABEL[i.investment_type] || i.investment_type}</span></td>
                  <td className="amount mono">{fmtINR(i.amount)}</td>
                  <td><span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{i.expected_return_rate}%</span></td>
                  <td className="amount mono pos">{fmtINR(i.expected_maturity_amount)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDate(i.maturity_date)}</td>
                  <td><span className={`status ${i.status}`}>{STATUS_LABEL[i.status] || i.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 180 }}>{i.notes || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  {isManager && (
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(i)}><IconEdit size={14} /></button>
                        <button className="btn-icon" title="Delete" style={{ color: 'var(--red)' }} onClick={() => setDeleteTarget(i)}><IconTrash size={14} /></button>
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

      <div className={`drawer-overlay${drawerMode?' open':''}`} onClick={closeDrawer} />
      <div className={`drawer${drawerMode?' open':''}`}>
        <div className="drawer-head">
          <div>
            <h3>{drawerMode==='edit' ? 'Edit Investment' : 'Add Investment'}</h3>
            {drawerMode==='edit' && <div className="sub">{editId}</div>}
          </div>
          <button className="btn-icon" onClick={closeDrawer}><IconX size={18}/></button>
        </div>
        <div className="drawer-body">
          <div className="fld">
            <label>Investment Type <span className="req">*</span></label>
            <select value={form.investment_type} onChange={e => setF('investment_type', e.target.value)}>
              <option value="govt_bond">Govt Bond</option>
              <option value="mutual_fund">Mutual Fund</option>
              <option value="fixed_deposit">Fixed Deposit</option>
            </select>
          </div>
          <div className="fld">
            <label>Amount (₹) <span className="req">*</span></label>
            <div className="inr-input" style={formErr.amount?{borderColor:'var(--red)'}:{}}>
              <span className="prefix">₹</span>
              <input type="number" min="1" step="0.01" value={form.amount} onChange={e=>setF('amount',e.target.value)} placeholder="0.00"/>
            </div>
            {formErr.amount && <div className="help" style={{color:'var(--red)'}}>{formErr.amount}</div>}
          </div>
          <div className="fld">
            <label>Expected Return Rate (%) <span className="req">*</span></label>
            <div className="inr-input" style={formErr.expected_return_rate?{borderColor:'var(--red)'}:{}}>
              <span className="prefix" style={{fontSize:13}}>%</span>
              <input type="number" min="0.1" max="30" step="0.1" value={form.expected_return_rate} onChange={e=>setF('expected_return_rate',e.target.value)} placeholder="e.g. 8.0"/>
            </div>
            {formErr.expected_return_rate && <div className="help" style={{color:'var(--red)'}}>{formErr.expected_return_rate}</div>}
          </div>
          <div className="fld">
            <label>Investment &amp; Maturity Dates</label>
            <div className="row2">
              <div className="fld" style={{gap:4}}>
                <label style={{fontSize:11}}>Investment Date <span className="req">*</span></label>
                <input type="date" value={form.investment_date} onChange={e=>setF('investment_date',e.target.value)} style={formErr.investment_date?{borderColor:'var(--red)'}:{}}/>
                {formErr.investment_date && <div className="help" style={{color:'var(--red)'}}>{formErr.investment_date}</div>}
              </div>
              <div className="fld" style={{gap:4}}>
                <label style={{fontSize:11}}>Maturity Date <span className="req">*</span></label>
                <input type="date" value={form.maturity_date} onChange={e=>setF('maturity_date',e.target.value)} style={formErr.maturity_date?{borderColor:'var(--red)'}:{}}/>
                {formErr.maturity_date && <div className="help" style={{color:'var(--red)'}}>{formErr.maturity_date}</div>}
              </div>
            </div>
          </div>
          <div className="fld">
            <label>Status</label>
            <select value={form.status} onChange={e=>setF('status',e.target.value)}>
              <option value="active">Active</option>
              <option value="matured">Matured</option>
              <option value="liquidated">Liquidated</option>
            </select>
          </div>
          <div className="fld">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e=>setF('notes',e.target.value)} placeholder="e.g. RBI Bond Series 2026" rows={2}/>
          </div>
          {calc && (
            <div className="calc-preview">
              <div className="cp-row"><span className="cp-key">Expected Maturity</span><span className="cp-val">{fmtINR(Math.round(calc.maturity))}</span></div>
              <div className="cp-divider"/>
              <div className="cp-row"><span className="cp-key">Expected Returns</span><span className="cp-val">{fmtINR(Math.round(calc.returns))}</span></div>
              <div className="cp-sub">Annual compounding · A = P(1+r)^t · Term: {calc.years} years</div>
            </div>
          )}
        </div>
        <div className="drawer-foot">
          <button className="btn btn-secondary" onClick={closeDrawer}>Cancel</button>
          <button className="btn btn-primary" onClick={saveDrawer}>{drawerMode==='edit'?'Save Changes':'Add Investment'}</button>
        </div>
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={()=>setDeleteTarget(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-icon"><IconTrash size={22}/></div>
            <div className="modal-title">Delete Investment?</div>
            <div className="modal-sub">Permanently delete <strong>{deleteTarget.investment_id}</strong> ({fmtINR(deleteTarget.amount)} · {INV_TYPE_LABEL[deleteTarget.investment_type]}). This cannot be undone.</div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={()=>setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
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
