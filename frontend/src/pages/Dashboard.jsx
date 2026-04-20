import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from 'recharts';
import TopNav from '../components/TopNav.jsx';
import {
  IconTrendingUp, IconTrendingDown, IconFileText, IconBarChart, IconBank,
  IconTriangle, IconX, IconSparkles, IconRefresh, IconArrowRight,
  IconAlertCircle, IconActivity,
} from '../components/icons.jsx';
import { fmtINR, fmtINRCompact, fmtDateTime, txnLabel, txnClass } from '../utils/format.js';
import { SUMMARY, TRANSACTIONS, MONTHLY_TREND, PORTFOLIO_BREAKDOWN, ANOMALIES } from '../data/mockData.js';
import '../styles/dashboard.css';

const fmtTick = (v) => v === 0 ? '0' : `₹${(v / 100000).toFixed(0)}L`;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="ct-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="ct-row">
          <div className="ct-dot" style={{ background: p.color }} />
          <div className="ct-name">{p.name}</div>
          <div className="ct-val">{fmtINRCompact(p.value)}</div>
        </div>
      ))}
    </div>
  );
}

const STAT_CARDS = [
  {
    label: 'Total Deposits',
    value: fmtINR(SUMMARY.total_deposits),
    change: `+${SUMMARY.deposits_change}%`,
    dir: 'up',
    icon: <IconTrendingUp size={22} />,
    icoBg: '#ECFDF5', icoColor: '#10B981',
  },
  {
    label: 'Total Withdrawals',
    value: fmtINR(SUMMARY.total_withdrawals),
    change: `${SUMMARY.withdrawals_change}%`,
    dir: 'down',
    icon: <IconTrendingDown size={22} />,
    icoBg: '#FEF2F2', icoColor: '#EF4444',
  },
  {
    label: 'Active Loans',
    value: SUMMARY.active_loans,
    change: `+${SUMMARY.loans_new} new`,
    dir: 'up',
    icon: <IconFileText size={22} />,
    icoBg: '#E8EEF7', icoColor: '#1A3C6E',
  },
  {
    label: 'Loan Portfolio',
    value: fmtINRCompact(SUMMARY.total_loan_amount),
    change: `+${SUMMARY.loan_amount_change}%`,
    dir: 'up',
    icon: <IconBank size={22} />,
    icoBg: '#F5F3FF', icoColor: '#8B5CF6',
  },
  {
    label: 'Total Investments',
    value: fmtINRCompact(SUMMARY.total_investments),
    change: 'No change',
    dir: 'nil',
    icon: <IconBarChart size={22} />,
    icoBg: '#FFFBEB', icoColor: '#F59E0B',
  },
];

const totalPortfolio = PORTFOLIO_BREAKDOWN.reduce((s, d) => s + d.value, 0);

const RECENT = TRANSACTIONS.slice(0, 10);

export default function Dashboard() {
  const navigate = useNavigate();
  const [bannerOpen, setBannerOpen] = useState(ANOMALIES.length > 0);
  const [analyzing,  setAnalyzing]  = useState(false);
  const [toast,      setToast]      = useState(null);

  const runAnalysis = async () => {
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 2200));
    setAnalyzing(false);
    setToast({ t: 'Analysis complete', d: `${ANOMALIES.length} anomalies found — ${TRANSACTIONS.length} transactions scanned` });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <>
      <TopNav active="Dashboard" />
      <main>
        {/* Title row */}
        <div className="title-row">
          <div>
            <h1>Dashboard</h1>
            <div className="sub">19 April 2026 · BranchIQ Banking Management</div>
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => navigate('/export')}>Export</button>
            <button className="btn btn-primary" onClick={runAnalysis} disabled={analyzing}>
              {analyzing
                ? <><svg width="14" height="14" viewBox="0 0 24 24" className="spin"><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" fill="none"/><path d="M 12 3 A 9 9 0 0 1 21 12" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg> Analyzing…</>
                : <><IconRefresh size={15}/> Run AI Analysis</>
              }
            </button>
          </div>
        </div>

        {/* Anomaly banner */}
        {bannerOpen && (
          <div className="anomaly-banner">
            <IconTriangle size={18} />
            <div className="ab-text">
              {ANOMALIES.length} suspicious transactions detected.
              <span className="ab-link" onClick={() => navigate('/ai-insights')}>View Anomalies →</span>
            </div>
            <button className="ab-dismiss" onClick={() => setBannerOpen(false)}><IconX size={16} /></button>
          </div>
        )}

        {/* Stat cards */}
        <div className="dash-cards">
          {STAT_CARDS.map(c => (
            <div key={c.label} className="dash-card">
              <div className="dc-top">
                <div className="dc-ico" style={{ background: c.icoBg, color: c.icoColor }}>{c.icon}</div>
                <div className={`dc-trend ${c.dir}`}>{c.change}</div>
              </div>
              <div className="dc-val">{c.value}</div>
              <div className="dc-lbl">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="charts-row">
          {/* Line chart */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Monthly Trend</h3>
                <div className="p-sub">Deposits · Withdrawals · Loan Repayments — last 6 months</div>
              </div>
            </div>
            <div style={{ padding: '20px 24px 16px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={MONTHLY_TREND} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={fmtTick} tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="deposits"       name="Deposits"       stroke="#2E6BE6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="withdrawals"    name="Withdrawals"    stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="loan_repayments" name="Loan Repayments" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut chart */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Portfolio Breakdown</h3>
                <div className="p-sub">Total: {fmtINRCompact(totalPortfolio)}</div>
              </div>
            </div>
            <div style={{ padding: '12px 20px 20px', display: 'flex', alignItems: 'center', gap: 0 }}>
              <div className="donut-wrap" style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={PORTFOLIO_BREAKDOWN}
                      cx="50%" cy="50%"
                      innerRadius={62} outerRadius={88}
                      dataKey="value"
                      strokeWidth={2} stroke="white"
                    >
                      {PORTFOLIO_BREAKDOWN.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <div className="dv">{fmtINRCompact(totalPortfolio)}</div>
                  <div className="dl">Total</div>
                </div>
              </div>
              <div className="pie-legend" style={{ width: 140 }}>
                {PORTFOLIO_BREAKDOWN.map(d => (
                  <div key={d.name} className="pl-row">
                    <div className="pl-dot" style={{ background: d.color }} />
                    <div className="pl-name">{d.name}</div>
                    <div>
                      <div className="pl-val">{fmtINRCompact(d.value)}</div>
                      <div className="pl-pct">{((d.value / totalPortfolio) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row — Recent transactions + Quick insights */}
        <div className="bottom-row">
          {/* Recent transactions */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Recent Transactions</h3>
                <div className="p-sub">Last 10 transactions across all accounts</div>
              </div>
              <button className="btn btn-secondary" style={{ height: 32, fontSize: 12, padding: '0 12px' }} onClick={() => navigate('/transactions')}>
                View all <IconArrowRight size={14} />
              </button>
            </div>
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th className="num">Amount</th>
                  <th>Date</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {RECENT.map(tx => (
                  <tr key={tx.transaction_id} className={tx.is_anomaly ? 'anomaly' : ''}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="id-cell mono" style={{ fontSize: 12 }}>{tx.transaction_id}</span>
                        {tx.is_anomaly && <span className="chip anom"><IconTriangle size={10}/>Anomaly</span>}
                      </div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick insights */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Quick Insights</h3>
                <div className="p-sub">AI-generated from last analysis</div>
              </div>
              <IconSparkles size={18} style={{ color: 'var(--blue)' }} />
            </div>
            <div className="qi-list">
              <div className="qi-item anom">
                <div className="qi-ico"><IconTriangle size={16} style={{ color: 'var(--anomaly)' }} /></div>
                <div className="qi-text"><strong>{ANOMALIES.length} suspicious transactions</strong> detected — largest is ₹7,50,000 withdrawal at 2:14am by Suresh Pillai.</div>
              </div>
              <div className="qi-item warn">
                <div className="qi-ico"><IconAlertCircle size={16} style={{ color: '#D97706' }} /></div>
                <div className="qi-text"><strong>1 high-risk loan</strong> flagged — LN-2026-0001 (Mohammed Farhan, ₹3.5L) is defaulted with risk score 88/100.</div>
              </div>
              <div className="qi-item">
                <div className="qi-ico"><IconTrendingUp size={16} style={{ color: '#10B981' }} /></div>
                <div className="qi-text">Deposits <strong>+18.2%</strong> vs last month. Branch financial health is strong.</div>
              </div>
              <div className="qi-item">
                <div className="qi-ico"><IconActivity size={16} style={{ color: 'var(--blue)' }} /></div>
                <div className="qi-text">Peak transaction hour is <strong>10:00–11:00</strong>. Busiest day is <strong>Monday</strong>.</div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
