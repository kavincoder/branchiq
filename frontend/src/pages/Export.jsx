import { useState, useMemo } from 'react';
import '../styles/export.css';
import TopNav from '../components/TopNav.jsx';
import {
  IconDownload, IconClock,
  IconArrowRightLeft, IconPercent, IconPiggyBank, IconTrendLine,
} from '../components/icons.jsx';

const today = '2026-04-19';

const CARDS = [
  {
    key: 'transactions',
    name: 'Transactions',
    slug: 'Transactions',
    color: 'blue',
    icon: (p) => <IconArrowRightLeft {...p} />,
    desc: 'All deposits, withdrawals, transfers, and loan repayments across every account.',
    count: 512,
    countLabel: 'rows',
    fields: ['Transaction ID', 'Account No.', 'Type', 'Amount', 'Date', 'Description', 'Anomaly Score'],
    filters: [
      { key: 'type', label: 'Type', options: ['All types', 'Deposit', 'Withdrawal', 'Transfer', 'Loan Repayment'] },
      { key: 'acct', label: 'Account', options: ['All accounts', 'Savings', 'Current', 'Loan'] },
    ],
  },
  {
    key: 'loans',
    name: 'Loans',
    slug: 'Loans',
    color: 'amber',
    icon: (p) => <IconPercent {...p} />,
    desc: 'Loan portfolio with principal, interest, outstanding, status and repayment timeline.',
    count: 48,
    countLabel: 'loans',
    fields: ['Loan ID', 'Borrower', 'Principal', 'Rate', 'Tenure', 'EMI', 'Outstanding', 'Status'],
    filters: [
      { key: 'status', label: 'Status', options: ['All statuses', 'Active', 'Closed', 'Defaulted'] },
      { key: 'type', label: 'Type', options: ['All types', 'Personal', 'Home', 'Business', 'Vehicle'] },
    ],
  },
  {
    key: 'deposits',
    name: 'Deposits',
    slug: 'Deposits',
    color: 'green',
    icon: (p) => <IconPiggyBank {...p} />,
    desc: 'Fixed and recurring deposits with maturity, interest, and auto-renewal settings.',
    count: 127,
    countLabel: 'deposits',
    fields: ['Deposit ID', 'Holder', 'Principal', 'Rate', 'Maturity Date', 'Maturity Amt', 'Status'],
    filters: [
      { key: 'kind', label: 'Kind', options: ['All kinds', 'Fixed Deposit', 'Recurring Deposit'] },
      { key: 'status', label: 'Status', options: ['All statuses', 'Active', 'Matured', 'Closed'] },
    ],
  },
  {
    key: 'investments',
    name: 'Investments',
    slug: 'Investments',
    color: 'purple',
    icon: (p) => <IconTrendLine {...p} />,
    desc: 'Customer investments — mutual funds, SIPs, bonds — with NAV, returns, and holdings.',
    count: 89,
    countLabel: 'holdings',
    fields: ['Investment ID', 'Holder', 'Instrument', 'Units', 'NAV', 'Invested', 'Current Value', 'XIRR'],
    filters: [
      { key: 'type', label: 'Instrument', options: ['All instruments', 'Mutual Fund', 'SIP', 'Bond', 'Equity'] },
      { key: 'status', label: 'Status', options: ['All statuses', 'Active', 'Redeemed'] },
    ],
  },
];

const PRESETS = [
  { label: 'Last 7 days', fn: () => ({ from: '2026-04-12', to: today }) },
  { label: 'Last 30 days', fn: () => ({ from: '2026-03-20', to: today }) },
  { label: 'Last 90 days', fn: () => ({ from: '2026-01-19', to: today }) },
  { label: 'FY 2025–26', fn: () => ({ from: '2025-04-01', to: today }) },
  { label: 'All time', fn: () => ({ from: '', to: '' }) },
];

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="spin">
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" fill="none" />
      <path d="M 12 3 A 9 9 0 0 1 21 12" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ExportCard({ card, onDownload }) {
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState(today);
  const [preset, setPreset] = useState(null);
  const [filters, setFilters] = useState(() =>
    Object.fromEntries(card.filters.map(f => [f.key, f.options[0]]))
  );
  const [status, setStatus] = useState('idle');

  const filename = useMemo(() => {
    const parts = ['BranchIQ', card.slug];
    if (from && to) parts.push(from + '_to_' + to);
    else if (to) parts.push(to);
    else parts.push(today);
    return parts.join('_');
  }, [card.slug, from, to]);

  const applyPreset = (p) => {
    const r = p.fn();
    setFrom(r.from);
    setTo(r.to);
    setPreset(p.label);
  };

  const go = () => {
    if (status === 'loading') return;
    setStatus('loading');
    setTimeout(() => {
      setStatus('done');
      onDownload(card.name, filename);
      setTimeout(() => setStatus('idle'), 2400);
    }, 1600);
  };

  return (
    <div className="export-card">
      <div className="xc-head">
        <div className={`xc-icon ${card.color}`}>{card.icon({ size: 22 })}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="t">{card.name}</h3>
          <div className="d">{card.desc}</div>
        </div>
        <div className="xc-meta">
          <div className="n">{card.count.toLocaleString('en-IN')}</div>
          <div className="l">{card.countLabel}</div>
        </div>
      </div>

      <div className="preset-row">
        {PRESETS.map(p => (
          <button
            key={p.label}
            className={`preset ${preset === p.label ? 'active' : ''}`}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="range-row">
        <div className="field">
          <label>From</label>
          <input className="mono" type="date" value={from} onChange={e => { setFrom(e.target.value); setPreset(null); }} />
        </div>
        <div className="field">
          <label>To</label>
          <input className="mono" type="date" value={to} onChange={e => { setTo(e.target.value); setPreset(null); }} />
        </div>
      </div>

      <div className="range-row">
        {card.filters.map(f => (
          <div className="field" key={f.key}>
            <label>{f.label}</label>
            <select value={filters[f.key]} onChange={e => setFilters(s => ({ ...s, [f.key]: e.target.value }))}>
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 6 }}>
        Filename preview
      </div>
      <div className="filename-preview">
        <span className="chev">❯</span>
        <span className="fn">{filename}</span>
        <span className="ext">.xlsx</span>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
        Includes{' '}
        <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{card.fields.length} columns</span>:{' '}
        {card.fields.join(' · ')}
      </div>

      <button className={`dl-btn ${status === 'done' ? 'done' : ''}`} onClick={go} disabled={status === 'loading'}>
        {status === 'loading' && <><Spinner /> Generating…</>}
        {status === 'done' && <><CheckIcon /> Downloaded <span className="fmt">XLSX</span></>}
        {status === 'idle' && <><IconDownload size={16} /> Download Excel <span className="fmt">XLSX</span></>}
      </button>
    </div>
  );
}

export default function Export() {
  const [toast, setToast] = useState(null);

  const handleDownload = (name, filename) => {
    setToast({ t: 'Download started', d: `${filename}.xlsx — ${name} export ready` });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <>
      <TopNav active="Export" />
      <main>
        <div className="title-row">
          <div>
            <h1>Export Data</h1>
            <div className="sub">Download branch data as Excel workbooks · filters apply before export · all amounts in INR</div>
          </div>
          <div className="actions">
            <button className="btn btn-secondary"><IconClock size={16} /> Export history</button>
          </div>
        </div>

        <div className="summary-strip">
          <div className="ss-ico"><IconDownload size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="ss-t">One-click exports for your records</div>
            <div className="ss-d">
              Native <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>.xlsx</span> format
              with formatted columns, INR currency, and preserved filters. Files are encrypted and audit-logged.
            </div>
          </div>
          <div className="ss-stats">
            <div className="ss-stat"><div className="n">776</div><div className="l">Total rows</div></div>
            <div className="ss-stat"><div className="n">4</div><div className="l">Datasets</div></div>
            <div className="ss-stat"><div className="n">12</div><div className="l">Exports this month</div></div>
          </div>
        </div>

        <div className="export-grid">
          {CARDS.map(c => <ExportCard key={c.key} card={c} onDownload={handleDownload} />)}
        </div>
      </main>

      <div className="toast-wrap">
        {toast && (
          <div className="toast">
            <div className="ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
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
