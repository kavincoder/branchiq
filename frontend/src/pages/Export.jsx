import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import '../styles/export.css';
import TopNav from '../components/TopNav.jsx';
import {
  IconDownload, IconClock,
  IconArrowRightLeft, IconPercent, IconPiggyBank, IconTrendLine,
} from '../components/icons.jsx';
import { api } from '../api/client.js';

const today = new Date().toISOString().slice(0, 10);

// ── Excel styling helpers ──────────────────────────────────────────────────────

/**
 * Apply professional formatting to a worksheet:
 *  - Bold + navy background header row
 *  - Auto-width every column
 *  - Freeze the top row
 *  - Alternating row fill (light blue / white)
 *  - Right-align numeric columns
 *  - Thin borders on all cells
 */
function styleSheet(ws, rows) {
  if (!rows.length) return ws;

  const headers = Object.keys(rows[0]);
  const numericHeaders = new Set(
    headers.filter(h =>
      h.includes('(INR)') || h.includes('(%)') ||
      h.includes('Score') || h.includes('months') ||
      h === 'Amount' || h === 'Principal'
    )
  );

  // ── Column widths (auto-fit based on content) ─────────────────────────────
  const colWidths = headers.map(h => {
    const maxDataLen = rows.reduce((max, row) => {
      const v = row[h];
      const len = v === null || v === undefined ? 0 : String(v).length;
      return Math.max(max, len);
    }, 0);
    return { wch: Math.min(Math.max(h.length + 2, maxDataLen + 2), 40) };
  });
  ws['!cols'] = colWidths;

  // ── Freeze top row ────────────────────────────────────────────────────────
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2', sqref: 'A2' };

  // ── Style each cell ───────────────────────────────────────────────────────
  const range = XLSX.utils.decode_range(ws['!ref']);

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddr]) ws[cellAddr] = { v: '', t: 's' };

      const isHeader = R === 0;
      const isEvenRow = R % 2 === 0;
      const colName = headers[C];
      const isNumeric = numericHeaders.has(colName);

      ws[cellAddr].s = {
        font: {
          name: 'Calibri',
          sz: isHeader ? 11 : 10,
          bold: isHeader,
          color: { rgb: isHeader ? 'FFFFFF' : '1E293B' },
        },
        fill: {
          patternType: 'solid',
          fgColor: {
            rgb: isHeader
              ? '0F172A'          // navy header
              : isEvenRow
                ? 'EFF6FF'        // light blue even rows
                : 'FFFFFF',       // white odd rows
          },
        },
        alignment: {
          horizontal: isHeader ? 'center' : isNumeric ? 'right' : 'left',
          vertical: 'center',
          wrapText: false,
        },
        border: {
          top:    { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left:   { style: 'thin', color: { rgb: 'CBD5E1' } },
          right:  { style: 'thin', color: { rgb: 'CBD5E1' } },
        },
        numFmt: isNumeric && !isHeader ? '#,##0.00' : undefined,
      };
    }
  }

  return ws;
}

function buildWorkbook(sheetName, rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  styleSheet(ws, rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

// ── Data fetchers ──────────────────────────────────────────────────────────────

async function fetchTransactions() {
  const rows = await api.get('/transactions/?limit=10000');
  return (rows || []).map(r => ({
    'Transaction ID':  r.transaction_id,
    'Account No.':     r.account_number,
    'Holder Name':     r.holder_name,
    'Type':            r.transaction_type,
    'Amount (INR)':    parseFloat(r.amount),
    'Date':            r.created_at ? r.created_at.slice(0, 10) : '',
    'Note':            r.note || '',
    'Anomaly Score':   r.anomaly_score != null ? parseFloat(r.anomaly_score) : '',
    'Anomaly Reason':  r.anomaly_reason || '',
    'Dismissed':       r.anomaly_dismissed ? 'Yes' : 'No',
  }));
}

async function fetchLoans() {
  const rows = await api.get('/loans/?limit=10000');
  return (rows || []).map(r => ({
    'Loan ID':            r.loan_id,
    'Account No.':        r.account_number,
    'Holder Name':        r.holder_name,
    'Principal (INR)':    parseFloat(r.principal_amount),
    'Interest Rate (%)':  parseFloat(r.interest_rate),
    'Risk Score':         r.risk_score != null ? parseFloat(r.risk_score) : '',
    'Status':             r.status,
    'Start Date':         r.start_date  ? r.start_date.slice(0, 10)  : '',
    'End Date':           r.end_date    ? r.end_date.slice(0, 10)    : '',
    'Note':               r.note || '',
  }));
}

async function fetchDeposits() {
  const rows = await api.get('/deposits/?limit=10000');
  return (rows || []).map(r => ({
    'Deposit ID':         r.deposit_id,
    'Account No.':        r.account_number,
    'Holder Name':        r.holder_name,
    'Deposit Type':       r.deposit_type,
    'Principal (INR)':    parseFloat(r.principal),
    'Interest Rate (%)':  parseFloat(r.interest_rate),
    'Status':             r.status,
    'Start Date':         r.start_date     ? r.start_date.slice(0, 10)     : '',
    'Maturity Date':      r.maturity_date  ? r.maturity_date.slice(0, 10)  : '',
    'Note':               r.note || '',
    'Created Date':       r.created_at     ? r.created_at.slice(0, 10)     : '',
  }));
}

async function fetchInvestments() {
  const rows = await api.get('/investments/?limit=10000');
  return (rows || []).map(r => ({
    'Investment ID':       r.investment_id,
    'Account No.':         r.account_number,
    'Holder Name':         r.holder_name,
    'Investment Type':     r.investment_type,
    'Amount (INR)':        parseFloat(r.amount),
    'Interest Rate (%)':   parseFloat(r.interest_rate ?? r.expected_return_rate ?? 0),
    'Status':              r.status,
    'Start Date':          r.start_date ? r.start_date.slice(0, 10) : '',
    'End Date':            r.end_date   ? r.end_date.slice(0, 10)   : '',
    'Note':                r.note || r.notes || '',
  }));
}

const CARDS = [
  {
    key: 'transactions',
    name: 'Transactions',
    slug: 'Transactions',
    color: 'blue',
    icon: (p) => <IconArrowRightLeft {...p} />,
    desc: 'All deposits, withdrawals, transfers, and loan repayments across every account.',
    countLabel: 'rows',
    fetchData: fetchTransactions,
    filters: [
      { key: 'type', label: 'Type', options: ['All types', 'deposit', 'withdrawal', 'transfer', 'loan_repayment'] },
    ],
  },
  {
    key: 'loans',
    name: 'Loans',
    slug: 'Loans',
    color: 'amber',
    icon: (p) => <IconPercent {...p} />,
    desc: 'Loan portfolio with principal, interest, outstanding, status and repayment timeline.',
    countLabel: 'loans',
    fetchData: fetchLoans,
    filters: [
      { key: 'status', label: 'Status', options: ['All statuses', 'active', 'closed', 'defaulted'] },
    ],
  },
  {
    key: 'deposits',
    name: 'Deposits',
    slug: 'Deposits',
    color: 'green',
    icon: (p) => <IconPiggyBank {...p} />,
    desc: 'Fixed and recurring deposits with maturity, interest, and auto-renewal settings.',
    countLabel: 'deposits',
    fetchData: fetchDeposits,
    filters: [
      { key: 'status', label: 'Status', options: ['All statuses', 'active', 'matured', 'withdrawn'] },
    ],
  },
  {
    key: 'investments',
    name: 'Investments',
    slug: 'Investments',
    color: 'purple',
    icon: (p) => <IconTrendLine {...p} />,
    desc: 'Customer investments — mutual funds, SIPs, bonds — with returns and holdings.',
    countLabel: 'holdings',
    fetchData: fetchInvestments,
    filters: [
      { key: 'status', label: 'Status', options: ['All statuses', 'active', 'matured', 'liquidated'] },
    ],
  },
];

const PRESETS = [
  { label: 'Last 7 days',  fn: () => ({ from: daysAgo(7),  to: today }) },
  { label: 'Last 30 days', fn: () => ({ from: daysAgo(30), to: today }) },
  { label: 'Last 90 days', fn: () => ({ from: daysAgo(90), to: today }) },
  { label: 'FY 2025–26',   fn: () => ({ from: '2025-04-01', to: today }) },
  { label: 'All time',     fn: () => ({ from: '', to: '' }) },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

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
  const [to, setTo]     = useState(today);
  const [preset, setPreset] = useState(null);
  const [filters, setFilters] = useState(() =>
    Object.fromEntries(card.filters.map(f => [f.key, f.options[0]]))
  );
  const [rowCount, setRowCount] = useState(null);
  const [status, setStatus]     = useState('idle');
  const [error, setError]       = useState(null);

  const filename = useMemo(() => {
    const parts = ['BranchIQ', card.slug];
    if (from && to) parts.push(from + '_to_' + to);
    else parts.push(today);
    return parts.join('_');
  }, [card.slug, from, to]);

  const applyPreset = (p) => {
    const r = p.fn();
    setFrom(r.from);
    setTo(r.to);
    setPreset(p.label);
  };

  const go = async () => {
    if (status === 'loading') return;
    setStatus('loading');
    setError(null);
    try {
      let data = await card.fetchData();

      // Date range filter
      if (from || to) {
        data = data.filter(row => {
          const dateVal = row['Date'] || row['Start Date'] || row['Created Date'] || '';
          if (!dateVal) return true;
          if (from && dateVal < from) return false;
          if (to   && dateVal > to)   return false;
          return true;
        });
      }

      // Dropdown filters
      card.filters.forEach(f => {
        const val = filters[f.key];
        if (!val || val.startsWith('All ')) return;
        data = data.filter(row =>
          Object.values(row).some(v => String(v).toLowerCase() === val.toLowerCase())
        );
      });

      setRowCount(data.length);

      if (data.length === 0) {
        setError('No records match the selected filters.');
        setStatus('idle');
        return;
      }

      // Build styled workbook
      const wb = buildWorkbook(card.name, data);
      XLSX.writeFile(wb, `${filename}.xlsx`);

      setStatus('done');
      onDownload(card.name, filename, data.length);
      setTimeout(() => setStatus('idle'), 2400);
    } catch (e) {
      setError(e.message || 'Export failed');
      setStatus('idle');
    }
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
          <div className="n">{rowCount !== null ? rowCount.toLocaleString('en-IN') : '—'}</div>
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

      {error && (
        <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 8 }}>
          {error}
        </div>
      )}

      <button className={`dl-btn ${status === 'done' ? 'done' : ''}`} onClick={go} disabled={status === 'loading'}>
        {status === 'loading' && <><Spinner /> Fetching &amp; generating…</>}
        {status === 'done'    && <><CheckIcon /> Downloaded <span className="fmt">XLSX</span></>}
        {status === 'idle'    && <><IconDownload size={16} /> Download Excel <span className="fmt">XLSX</span></>}
      </button>
    </div>
  );
}

export default function Export() {
  const [toast, setToast] = useState(null);

  const handleDownload = (name, filename, count) => {
    setToast({ t: 'Download started', d: `${filename}.xlsx — ${count} rows exported` });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <>
      <TopNav active="Export" />
      <main>
        <div className="title-row">
          <div>
            <h1>Export Data</h1>
            <div className="sub">Download real branch data as Excel workbooks · filters apply before export · all amounts in INR</div>
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
              with formatted columns, INR currency, and preserved filters. Data is fetched live from the database.
            </div>
          </div>
          <div className="ss-stats">
            <div className="ss-stat"><div className="n">4</div><div className="l">Datasets</div></div>
            <div className="ss-stat"><div className="n">Live</div><div className="l">Data source</div></div>
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
