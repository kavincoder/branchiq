import { useState, useMemo, useEffect } from 'react';
import TopNav from '../components/TopNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconPlus, IconEdit, IconTrash, IconX,
  IconPiggyBank, IconPercent, IconTrendingUp, IconChevronLeft, IconChevronRight,
} from '../components/icons.jsx';
import { fmtINR, fmtINRCompact, fmtDate } from '../utils/format.js';
import { api } from '../api/client.js';
import '../styles/deposits.css';

const PAGE_SIZE = 20;
const EMPTY_FORM = {
  holder_name: '', phone: '', deposit_type: 'fixed',
  deposit_amount: '', interest_rate: '', start_date: '', maturity_date: '',
  status: 'active',
};

function nextDepositId(deposits) {
  if (!deposits.length) return 'DEP-2026-0001';
  const nums = deposits.map(d => parseInt(d.deposit_id.split('-')[2]) || 0);
  return `DEP-2026-${String(Math.max(...nums) + 1).padStart(4, '0')}`;
}

function calcMaturity(amount, rate, start, end) {
  const P = parseFloat(amount), r = parseFloat(rate) / 100;
  if (!P || !r || !start || !end) return null;
  const t = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24 * 365.25);
  if (t <= 0) return null;
  const maturity = P * (1 + r * t);
  return { maturity, interest: maturity - P, years: t.toFixed(1) };
}

function statusLabel(s) {
  return { active: 'Active', matured: 'Matured', withdrawn: 'Withdrawn' }[s] || s;
}

function adaptDeposit(d) {
  const depositAmount = parseFloat(d.principal);
  const intRate       = parseFloat(d.interest_rate);
  let maturityAmount  = null;
  if (d.maturity_date && d.deposit_type === 'fixed') {
    const calc = calcMaturity(depositAmount, intRate, String(d.start_date), String(d.maturity_date));
    maturityAmount = calc ? Math.round(calc.maturity) : null;
  }
  return {
    ...d,
    deposit_amount:  depositAmount,
    interest_rate:   intRate,
    phone:           d.account_number,
    maturity_amount: maturityAmount,
    start_date:      String(d.start_date),
    maturity_date:   d.maturity_date ? String(d.maturity_date) : null,
    created_by_name: d.created_by_name || 'Staff',
  };
}

export default function Deposits() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [deposits, setDeposits] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);

  const [drawerMode, setDrawerMode] = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState({});
  const [editId,     setEditId]     = useState(null);
  const [saving,     setSaving]     = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toast,        setToast]        = useState(null);

  const showToast = (t, d) => { setToast({ t, d }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    api.get('/deposits/?limit=500')
      .then(data => { setDeposits(data.map(adaptDeposit)); setLoading(false); })
      .catch(e  => { setError(e.message); setLoading(false); });
  }, []);

  const activeDeposits  = deposits.filter(d => d.status === 'active');
  const maturedDeposits = deposits.filter(d => d.status === 'matured');
  const totalActive     = activeDeposits.reduce((s, d) => s + d.deposit_amount, 0);
  const avgRate         = activeDeposits.length
    ? (activeDeposits.reduce((s, d) => s + d.interest_rate, 0) / activeDeposits.length).toFixed(1)
    : '0.0';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deposits.filter(d => {
      if (q && !d.deposit_id.toLowerCase().includes(q) && !d.holder_name.toLowerCase().includes(q) && !d.phone.includes(q)) return false;
      if (typeFilter   && d.deposit_type !== typeFilter)   return false;
      if (statusFilter && d.status       !== statusFilter) return false;
      return true;
    });
  }, [deposits, search, typeFilter, statusFilter]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData     = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const hasFilters   = search || typeFilter || statusFilter;
  const resetPage    = () => setPage(1);
  const clearFilters = () => { setSearch(''); setTypeFilter(''); setStatusFilter(''); resetPage(); };

  const openAdd = () => { setForm(EMPTY_FORM); setFormErr({}); setEditId(null); setDrawerMode('add'); };
  const openEdit = (d) => {
    setForm({ holder_name: d.holder_name, phone: d.phone, deposit_type: d.deposit_type, deposit_amount: String(d.deposit_amount), interest_rate: String(d.interest_rate), start_date: d.start_date, maturity_date: d.maturity_date || '', status: d.status });
    setFormErr({}); setEditId(d.deposit_id); setDrawerMode('edit');
  };
  const closeDrawer = () => setDrawerMode(null);
  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFormErr(e => ({ ...e, [k]: '' })); };

  const calc = useMemo(() => {
    if (form.deposit_type !== 'fixed') return null;
    return calcMaturity(form.deposit_amount, form.interest_rate, form.start_date, form.maturity_date);
  }, [form.deposit_type, form.deposit_amount, form.interest_rate, form.start_date, form.maturity_date]);

  const saveDrawer = async () => {
    const errs = {};
    if (!form.holder_name.trim()) errs.holder_name = 'Required';
    if (!form.phone.trim())       errs.phone       = 'Required';
    const amt  = parseFloat(form.deposit_amount);
    const rate = parseFloat(form.interest_rate);
    if (!form.deposit_amount || isNaN(amt)  || amt  <= 0) errs.deposit_amount = 'Enter a valid amount';
    if (!form.interest_rate  || isNaN(rate) || rate <= 0) errs.interest_rate  = 'Enter a valid rate';
    if (!form.start_date) errs.start_date = 'Required';
    if (form.deposit_type === 'fixed') {
      if (!form.maturity_date) errs.maturity_date = 'Required for fixed deposits';
      else if (form.maturity_date <= form.start_date) errs.maturity_date = 'Must be after start date';
    }
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    setSaving(true);
    try {
      const basePayload = {
        account_number: form.phone.trim(),
        holder_name:    form.holder_name.trim(),
        deposit_type:   form.deposit_type,
        principal:      amt,
        interest_rate:  rate,
        status:         form.status,
        start_date:     form.start_date,
        maturity_date:  form.deposit_type === 'fixed' ? form.maturity_date : null,
      };

      if (drawerMode === 'add') {
        const payload = { deposit_id: nextDepositId(deposits), ...basePayload };
        const created = await api.post('/deposits/', payload);
        setDeposits(prev => [adaptDeposit(created), ...prev]);
        showToast('Deposit added', `${created.deposit_id} · ${fmtINR(amt)}`);
      } else {
        const updated = await api.put(`/deposits/${editId}`, basePayload);
        setDeposits(prev => prev.map(d => d.deposit_id === editId ? adaptDeposit(updated) : d));
        showToast('Deposit updated', `${editId} · ${fmtINR(amt)}`);
      }
      closeDrawer(); setPage(1);
    } catch (e) {
      showToast('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/deposits/${deleteTarget.deposit_id}`);
      setDeposits(prev => prev.filter(d => d.deposit_id !== deleteTarget.deposit_id));
      showToast('Deposit deleted', deleteTarget.deposit_id);
      setDeleteTarget(null);
    } catch (e) { showToast('Error', e.message); }
    finally { setDeleting(false); }
  };

  if (loading) return (<><TopNav active="Deposits"/><main><div className="title-row"><div><h1>Deposits</h1><div className="sub">Loading…</div></div></div><div style={{padding:'60px',textAlign:'center',color:'var(--text-muted)'}}>Loading deposits…</div></main></>);
  if (error)   return (<><TopNav active="Deposits"/><main><div className="title-row"><div><h1>Deposits</h1></div></div><div className="panel" style={{padding:'32px',textAlign:'center',color:'var(--red)'}}>Error: {error}</div></main></>);

  return (
    <>
      <TopNav active="Deposits" />
      <main>
        <div className="title-row">
          <div><h1>Deposits</h1><div className="sub">{new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})} · Fixed &amp; savings deposit management</div></div>
          <div className="actions"><button className="btn btn-primary" onClick={openAdd}><IconPlus size={15}/> Add Deposit</button></div>
        </div>

        <div className="summary-bar" style={{'--n':4}}>
          <div className="stat-card"><div className="ico" style={{background:'#ECFDF5',color:'#10B981'}}><IconPiggyBank size={22}/></div><div className="body"><div className="label">Active Deposits</div><div className="val">{activeDeposits.length}</div><div className="sub">{maturedDeposits.length} matured</div></div></div>
          <div className="stat-card"><div className="ico" style={{background:'#E8EEF7',color:'#1A3C6E'}}><IconTrendingUp size={22}/></div><div className="body"><div className="label">Total Active Amount</div><div className="val">{fmtINRCompact(totalActive)}</div><div className="sub">Principal deposited</div></div></div>
          <div className="stat-card"><div className="ico" style={{background:'#EFF6FF',color:'#2563EB'}}><IconTrendingUp size={22}/></div><div className="body"><div className="label">Matured</div><div className="val">{maturedDeposits.length}</div><div className="sub">Awaiting action</div></div></div>
          <div className="stat-card"><div className="ico" style={{background:'#FFFBEB',color:'#F59E0B'}}><IconPercent size={22}/></div><div className="body"><div className="label">Avg Interest Rate</div><div className="val">{avgRate}<span style={{fontSize:14,fontWeight:500,color:'var(--text-2)'}}>%</span></div><div className="sub">Active deposits</div></div></div>
        </div>

        <div className="filter-bar">
          <div className="search-mini"><input placeholder="Search ID, name, account…" value={search} onChange={e=>{setSearch(e.target.value);resetPage();}}/></div>
          <select className="sel" value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);resetPage();}}>
            <option value="">All Types</option><option value="fixed">Fixed Deposit</option><option value="savings">Savings</option>
          </select>
          <select className="sel" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);resetPage();}}>
            <option value="">All Statuses</option><option value="active">Active</option><option value="matured">Matured</option><option value="withdrawn">Withdrawn</option>
          </select>
          {hasFilters && <button className="clear-pill" onClick={clearFilters}><IconX size={13}/> Clear</button>}
          <span style={{marginLeft:'auto',fontSize:12,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{filtered.length} result{filtered.length!==1?'s':''}</span>
        </div>

        <div className="panel">
          <table className="tx-table">
            <thead>
              <tr><th>Deposit ID</th><th>Holder</th><th>Type</th><th className="num">Amount</th><th>Rate</th><th className="num">Maturity Amount</th><th>Maturity Date</th><th>Status</th><th>By</th>{isManager&&<th style={{width:80}}></th>}</tr>
            </thead>
            <tbody>
              {pageData.length===0?(
                <tr><td colSpan={isManager?10:9}><div className="empty"><div className="ico"><IconPiggyBank size={28}/></div><div className="t">No deposits found</div><div className="d">Try adjusting your filters</div></div></td></tr>
              ):pageData.map(d=>(
                <tr key={d.deposit_id}>
                  <td><div className="id-cell mono" style={{fontSize:12}}>{d.deposit_id}</div><div className="acc" style={{fontSize:11,color:'var(--text-muted)'}}>{d.start_date}</div></td>
                  <td><div className="holder">{d.holder_name}</div><div className="acc mono">{d.phone}</div></td>
                  <td><span className={`chip ${d.deposit_type}`}>{d.deposit_type==='fixed'?'Fixed':'Savings'}</span></td>
                  <td className="amount mono">{fmtINR(d.deposit_amount)}</td>
                  <td><span className="mono" style={{fontSize:13,fontWeight:600}}>{d.interest_rate}%</span></td>
                  <td className="amount mono">{d.maturity_amount?fmtINR(d.maturity_amount):<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                  <td style={{fontSize:12,color:'var(--text-2)'}}>{d.maturity_date?fmtDate(d.maturity_date):<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                  <td><span className={`status ${d.status}`}>{statusLabel(d.status)}</span></td>
                  <td style={{fontSize:12,color:'var(--text-2)'}}>{d.created_by_name}</td>
                  {isManager&&<td><div className="row-actions"><button className="btn-icon" onClick={()=>openEdit(d)}><IconEdit size={14}/></button><button className="btn-icon" style={{color:'var(--red)'}} onClick={()=>setDeleteTarget(d)}><IconTrash size={14}/></button></div></td>}
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

      <div className={`drawer-overlay${drawerMode?' open':''}`} onClick={closeDrawer}/>
      <div className={`drawer${drawerMode?' open':''}`}>
        <div className="drawer-head">
          <div><h3>{drawerMode==='edit'?'Edit Deposit':'Add Deposit'}</h3>{drawerMode==='edit'&&<div className="sub">{editId}</div>}</div>
          <button className="btn-icon" onClick={closeDrawer}><IconX size={18}/></button>
        </div>
        <div className="drawer-body">
          <div className="fld"><label>Account Holder Name <span className="req">*</span></label><input value={form.holder_name} onChange={e=>setF('holder_name',e.target.value)} placeholder="e.g. Kavin Kumar" style={formErr.holder_name?{borderColor:'var(--red)'}:{}}/>{formErr.holder_name&&<div className="help" style={{color:'var(--red)'}}>{formErr.holder_name}</div>}</div>
          <div className="fld"><label>Account / Phone <span className="req">*</span></label><input value={form.phone} onChange={e=>setF('phone',e.target.value)} placeholder="e.g. ACC-10001" style={formErr.phone?{borderColor:'var(--red)'}:{}}/>{formErr.phone&&<div className="help" style={{color:'var(--red)'}}>{formErr.phone}</div>}</div>
          <div className="fld"><label>Deposit Type <span className="req">*</span></label><select value={form.deposit_type} onChange={e=>setF('deposit_type',e.target.value)}><option value="fixed">Fixed Deposit</option><option value="savings">Savings Account</option></select></div>
          <div className="fld"><label>Deposit Amount (₹) <span className="req">*</span></label><div className="inr-input" style={formErr.deposit_amount?{borderColor:'var(--red)'}:{}}><span className="prefix">₹</span><input type="number" min="1" step="0.01" value={form.deposit_amount} onChange={e=>setF('deposit_amount',e.target.value)} placeholder="0.00"/></div>{formErr.deposit_amount&&<div className="help" style={{color:'var(--red)'}}>{formErr.deposit_amount}</div>}</div>
          <div className="fld"><label>Annual Interest Rate (%) <span className="req">*</span></label><div className="inr-input" style={formErr.interest_rate?{borderColor:'var(--red)'}:{}}><span className="prefix" style={{fontSize:13}}>%</span><input type="number" min="0.1" max="20" step="0.1" value={form.interest_rate} onChange={e=>setF('interest_rate',e.target.value)} placeholder="e.g. 7.5"/></div>{formErr.interest_rate&&<div className="help" style={{color:'var(--red)'}}>{formErr.interest_rate}</div>}</div>
          <div className="fld"><label>Start Date <span className="req">*</span></label><input type="date" value={form.start_date} onChange={e=>setF('start_date',e.target.value)} style={formErr.start_date?{borderColor:'var(--red)'}:{}}/>{formErr.start_date&&<div className="help" style={{color:'var(--red)'}}>{formErr.start_date}</div>}</div>
          {form.deposit_type==='fixed'&&<div className="fld"><label>Maturity Date <span className="req">*</span></label><input type="date" value={form.maturity_date} onChange={e=>setF('maturity_date',e.target.value)} style={formErr.maturity_date?{borderColor:'var(--red)'}:{}}/>{formErr.maturity_date&&<div className="help" style={{color:'var(--red)'}}>{formErr.maturity_date}</div>}</div>}
          <div className="fld"><label>Status</label><select value={form.status} onChange={e=>setF('status',e.target.value)}><option value="active">Active</option><option value="matured">Matured</option><option value="withdrawn">Withdrawn</option></select></div>
          {calc&&<div className="calc-preview"><div className="cp-row"><span className="cp-key">Maturity Amount</span><span className="cp-val">{fmtINR(Math.round(calc.maturity))}</span></div><div className="cp-divider"/><div className="cp-row"><span className="cp-key">Total Interest Earned</span><span className="cp-val">{fmtINR(Math.round(calc.interest))}</span></div><div className="cp-sub">Simple interest · Term: {calc.years} years</div></div>}
        </div>
        <div className="drawer-foot">
          <button className="btn btn-secondary" onClick={closeDrawer}>Cancel</button>
          <button className="btn btn-primary" onClick={saveDrawer} disabled={saving}>{saving?'Saving…':drawerMode==='edit'?'Save Changes':'Add Deposit'}</button>
        </div>
      </div>

      {deleteTarget&&<div className="modal-overlay" onClick={()=>setDeleteTarget(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-icon"><IconTrash size={22}/></div><div className="modal-title">Delete Deposit?</div><div className="modal-sub">Permanently delete <strong>{deleteTarget.deposit_id}</strong> ({fmtINR(deleteTarget.deposit_amount)} · {deleteTarget.holder_name}). Cannot be undone.</div><div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setDeleteTarget(null)}>Cancel</button><button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>{deleting?'Deleting…':'Delete'}</button></div></div></div>}

      <div className="toast-wrap">{toast&&<div className="toast"><div className="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div style={{flex:1}}><div className="t">{toast.t}</div><div className="d">{toast.d}</div></div></div>}</div>
    </>
  );
}
