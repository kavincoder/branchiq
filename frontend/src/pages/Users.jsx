import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import TopNav from '../components/TopNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconPlus, IconX, IconEye, IconEyeOff, IconUsers, IconUser, IconCheck,
} from '../components/icons.jsx';
import { fmtDate } from '../utils/format.js';
import { api } from '../api/client.js';
import '../styles/users.css';

const EMPTY_FORM = { full_name: '', username: '', role: 'staff', password: '' };

export default function Users() {
  const { user } = useAuth();
  if (user?.role !== 'manager') return <Navigate to="/dashboard" replace />;

  const [staff,       setStaff]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [toggling,    setToggling]    = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formErr,     setFormErr]     = useState({});
  const [showPw,      setShowPw]      = useState(false);
  const [toggleTarget,setToggleTarget]= useState(null);
  const [toast,       setToast]       = useState(null);

  const showToast = (t, d) => { setToast({ t, d }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    api.get('/users/')
      .then(data => setStaff(data))
      .catch(e => console.error('Users load error:', e))
      .finally(() => setLoading(false));
  }, []);

  const totalStaff   = staff.length;
  const activeStaff  = staff.filter(s => s.is_active).length;
  const managers     = staff.filter(s => s.role === 'manager').length;
  const inactiveStaff= staff.filter(s => !s.is_active).length;

  const openDrawer  = () => { setForm(EMPTY_FORM); setFormErr({}); setShowPw(false); setDrawerOpen(true); };
  const closeDrawer = () => setDrawerOpen(false);
  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFormErr(e => ({ ...e, [k]: '' })); };

  const saveDrawer = async () => {
    const errs = {};
    if (!form.full_name.trim())  errs.full_name  = 'Required';
    if (!form.username.trim())   errs.username   = 'Required';
    if (staff.some(s => s.username === form.username.trim())) errs.username = 'Username already exists';
    if (!form.password.trim())   errs.password   = 'Required';
    if (form.password.length < 8) errs.password  = 'Minimum 8 characters';
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    setSaving(true);
    try {
      const created = await api.post('/users/', {
        full_name: form.full_name.trim(),
        username:  form.username.trim(),
        role:      form.role,
        password:  form.password,
      });
      setStaff(prev => [...prev, created]);
      showToast('Staff added', `${created.full_name} · ${created.user_id}`);
      closeDrawer();
    } catch (e) {
      if (e.message?.toLowerCase().includes('username')) {
        setFormErr(err => ({ ...err, username: 'Username already exists' }));
      } else {
        showToast('Failed to add staff', e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmToggle = async () => {
    const id = toggleTarget.user_id;
    const newStatus = !toggleTarget.is_active;
    setToggling(true);
    try {
      const updated = await api.put(`/users/${id}/status`, { is_active: newStatus });
      setStaff(prev => prev.map(s => s.user_id === id ? updated : s));
      const action = newStatus ? 'activated' : 'deactivated';
      showToast(`Account ${action}`, toggleTarget.full_name);
    } catch (e) {
      showToast('Update failed', e.message);
    } finally {
      setToggling(false);
      setToggleTarget(null);
    }
  };

  if (loading) {
    return (
      <>
        <TopNav active="Users" />
        <main>
          <div className="title-row"><div><h1>User Management</h1><div className="sub">Loading…</div></div></div>
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users…</div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav active="Users" />
      <main>
        <div className="title-row">
          <div>
            <h1>User Management</h1>
            <div className="sub">Branch staff accounts</div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={openDrawer}>
              <IconPlus size={15} /> Add Staff
            </button>
          </div>
        </div>

        <div className="summary-bar" style={{ '--n': 4 }}>
          <div className="stat-card">
            <div className="ico" style={{ background: '#E8EEF7', color: '#1A3C6E' }}><IconUsers size={22} /></div>
            <div className="body"><div className="label">Total Staff</div><div className="val">{totalStaff}</div><div className="sub">All accounts</div></div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#ECFDF5', color: '#10B981' }}><IconCheck size={22} /></div>
            <div className="body"><div className="label">Active</div><div className="val">{activeStaff}</div><div className="sub">Currently active</div></div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#F5F3FF', color: '#8B5CF6' }}><IconUser size={22} /></div>
            <div className="body"><div className="label">Managers</div><div className="val">{managers}</div><div className="sub">Branch managers</div></div>
          </div>
          <div className="stat-card">
            <div className="ico" style={{ background: '#FEF2F2', color: '#EF4444' }}><IconUser size={22} /></div>
            <div className="body"><div className="label">Inactive</div><div className="val">{inactiveStaff}</div><div className="sub">Deactivated accounts</div></div>
          </div>
        </div>

        <div className="panel">
          <table className="tx-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Member Since</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.user_id} className={!s.is_active ? 'inactive' : ''}>
                  <td><span className="id-cell mono" style={{ fontSize: 12 }}>{s.user_id}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                        {s.initials || s.full_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <span className="holder">{s.full_name}</span>
                    </div>
                  </td>
                  <td><span className="acc mono">{s.username}</span></td>
                  <td><span className={`role-badge ${s.role}`}>{s.role === 'manager' ? 'Manager' : 'Staff'}</span></td>
                  <td>
                    <span className={`status ${s.is_active ? 'active' : 'closed'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDate(s.created_at)}</td>
                  <td>
                    {s.user_id !== user?.user_id && (
                      <button
                        className={`btn ${s.is_active ? 'btn-secondary' : 'btn-ghost'}`}
                        style={{ height: 30, fontSize: 12, padding: '0 12px' }}
                        onClick={() => setToggleTarget(s)}
                      >
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {s.user_id === user?.user_id && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Staff Drawer */}
      <div className={`drawer-overlay${drawerOpen?' open':''}`} onClick={closeDrawer} />
      <div className={`drawer${drawerOpen?' open':''}`}>
        <div className="drawer-head">
          <div><h3>Add Staff</h3></div>
          <button className="btn-icon" onClick={closeDrawer}><IconX size={18}/></button>
        </div>
        <div className="drawer-body">
          <div className="fld">
            <label>Full Name <span className="req">*</span></label>
            <input value={form.full_name} onChange={e=>setF('full_name',e.target.value)} placeholder="e.g. Priya Sharma" style={formErr.full_name?{borderColor:'var(--red)'}:{}}/>
            {formErr.full_name && <div className="help" style={{color:'var(--red)'}}>{formErr.full_name}</div>}
          </div>
          <div className="fld">
            <label>Username <span className="req">*</span></label>
            <input value={form.username} onChange={e=>setF('username',e.target.value)} placeholder="e.g. priya.staff" style={formErr.username?{borderColor:'var(--red)'}:{}}/>
            {formErr.username && <div className="help" style={{color:'var(--red)'}}>{formErr.username}</div>}
          </div>
          <div className="fld">
            <label>Role <span className="req">*</span></label>
            <select value={form.role} onChange={e=>setF('role',e.target.value)}>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="fld">
            <label>Password <span className="req">*</span></label>
            <div className="pw-field">
              <input
                type={showPw?'text':'password'}
                value={form.password}
                onChange={e=>setF('password',e.target.value)}
                placeholder="Min. 8 characters"
                style={formErr.password?{borderColor:'var(--red)'}:{}}
              />
              <button type="button" className="pw-toggle" onClick={()=>setShowPw(v=>!v)}>
                {showPw ? <IconEyeOff size={15}/> : <IconEye size={15}/>}
              </button>
            </div>
            {formErr.password && <div className="help" style={{color:'var(--red)'}}>{formErr.password}</div>}
          </div>
        </div>
        <div className="drawer-foot">
          <button className="btn btn-secondary" onClick={closeDrawer} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={saveDrawer} disabled={saving}>{saving ? 'Adding…' : 'Add Staff'}</button>
        </div>
      </div>

      {/* Deactivate / Activate confirm modal */}
      {toggleTarget && (
        <div className="modal-overlay" onClick={()=>setToggleTarget(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-icon" style={{ background: toggleTarget.is_active ? 'var(--red-pale)' : 'var(--green-pale)', color: toggleTarget.is_active ? 'var(--red)' : '#059669' }}>
              <IconUser size={22}/>
            </div>
            <div className="modal-title">{toggleTarget.is_active ? 'Deactivate' : 'Activate'} Account?</div>
            <div className="modal-sub">
              {toggleTarget.is_active
                ? <>This will prevent <strong>{toggleTarget.full_name}</strong> from logging in. They can be reactivated at any time.</>
                : <>This will restore login access for <strong>{toggleTarget.full_name}</strong>.</>
              }
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={()=>setToggleTarget(null)} disabled={toggling}>Cancel</button>
              <button className={`btn ${toggleTarget.is_active ? 'btn-danger' : 'btn-primary'}`} onClick={confirmToggle} disabled={toggling}>
                {toggling ? 'Updating…' : toggleTarget.is_active ? 'Deactivate' : 'Activate'}
              </button>
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
