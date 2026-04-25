import { useState, useEffect } from 'react';
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
const PORTFOLIO_BREAKDOWN = [
  { name: 'Loans',       value: 0, color: '#2E6BE6' },
  { name: 'Investments', value: 0, color: '#F59E0B' },
];
import { api } from '../api/client.js';
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

function adaptTxn(t) {
  return {
    ...t,
    type: t.transaction_type,
    transaction_date: t.created_at,
    notes: t.note,
    is_anomaly: t.anomaly_score >= 0.6,
    anomaly_reason_plain: t.anomaly_reason,
    created_by_name: t.created_by_name || 'Staff',
    amount: parseFloat(t.amount),
  };
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Computed at render time, not module load — avoids stale date if page is cached
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const [summary,      setSummary]      = useState(null);
  const [recentTxns,   setRecentTxns]   = useState([]);
  const [anomalies,    setAnomalies]    = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [snapshot,     setSnapshot]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [bannerOpen,   setBannerOpen]   = useState(true);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [toast,        setToast]        = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [sum, txns, anom, trend, snap] = await Promise.all([
          api.get('/ai/summary'),
          api.get('/transactions/?limit=10'),
          api.get('/ai/anomalies'),
          api.get('/ai/monthly-trend'),
          api.get('/ai/daily-snapshot'),
        ]);
        setMonthlyTrend(trend || []);
        setSummary(sum);
        setRecentTxns(txns.map(adaptTxn));
        setAnomalies(anom.map(adaptTxn));
        setSnapshot(snap);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const portfolioBreakdown = summary
    ? [
        { name: 'Loans',       value: summary.total_loan_amount, color: '#2E6BE6' },
        { name: 'Investments', value: summary.total_investments,  color: '#F59E0B' },
      ]
    : PORTFOLIO_BREAKDOWN;

  const totalPortfolio = portfolioBreakdown.reduce((s, d) => s + d.value, 0);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await api.post('/ai/run');
      const anom = await api.get('/ai/anomalies');
      setAnomalies(anom.map(adaptTxn));
      setToast({ t: 'Analysis complete', d: `${result.anomalies_flagged ?? anom.length} anomalies · ${result.transactions_scanned ?? '—'} transactions scanned` });
    } catch (e) {
      setToast({ t: 'Analysis failed', d: e.message });
    } finally {
      setAnalyzing(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const statCards = summary
    ? [
        { label: 'Total Deposits',    value: fmtINR(summary.total_deposits),    change: `${summary.deposits_change >= 0 ? '+' : ''}${summary.deposits_change}%`,    dir: summary.deposits_change >= 0 ? 'up' : 'down',  icon: <IconTrendingUp size={22}/>,    icoBg:'#ECFDF5', icoColor:'#10B981' },
        { label: 'Total Withdrawals', value: fmtINR(summary.total_withdrawals), change: `${summary.withdrawals_change >= 0 ? '+' : ''}${summary.withdrawals_change}%`, dir: summary.withdrawals_change < 0 ? 'down' : 'up', icon: <IconTrendingDown size={22}/>,  icoBg:'#FEF2F2', icoColor:'#EF4444' },
        { label: 'Active Loans',      value: summary.active_loans,              change: `+${summary.loans_new} new`,                                                    dir: 'up',                                          icon: <IconFileText size={22}/>,      icoBg:'#E8EEF7', icoColor:'#1A3C6E' },
        { label: 'Loan Portfolio',    value: fmtINRCompact(summary.total_loan_amount), change: 'Active loans',                                                          dir: 'nil',                                         icon: <IconBank size={22}/>,          icoBg:'#F5F3FF', icoColor:'#8B5CF6' },
        { label: 'Total Investments', value: fmtINRCompact(summary.total_investments), change: 'Active only',                                                           dir: 'nil',                                         icon: <IconBarChart size={22}/>,      icoBg:'#FFFBEB', icoColor:'#F59E0B' },
      ]
    : [];

  if (loading) {
    return (
      <>
        <TopNav active="Dashboard" />
        <main>
          <div className="title-row"><div><h1>Dashboard</h1><div className="sub">Loading…</div></div></div>
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard data…</div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav active="Dashboard" />
      <main>
        <div className="title-row">
          <div>
            <h1>Dashboard</h1>
            <div className="sub">{today} · BranchIQ Banking Management</div>
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

        {/* ── Today's snapshot bar ─────────────────────────────────────── */}
        {snapshot && (
          <div style={{
            display: 'flex', gap: 12, marginBottom: 20,
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 20px', alignItems: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
              Today
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--border)', margin: '0 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Deposits</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#10B981' }}>
                {fmtINRCompact(snapshot.deposits_today.amount)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({snapshot.deposits_today.count} txns)</span>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--border)', margin: '0 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Withdrawals</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#EF4444' }}>
                {fmtINRCompact(snapshot.withdrawals_today.amount)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({snapshot.withdrawals_today.count} txns)</span>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--border)', margin: '0 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Total transactions today</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>
                {snapshot.total_today}
              </span>
            </div>
          </div>
        )}

        {bannerOpen && anomalies.filter(a => !a.anomaly_dismissed).length > 0 && (
          <div className="anomaly-banner">
            <IconTriangle size={18} />
            <div className="ab-text">
              {anomalies.filter(a => !a.anomaly_dismissed).length} suspicious transactions detected.
              <span className="ab-link" onClick={() => navigate('/ai-insights')}>View Anomalies →</span>
            </div>
            <button className="ab-dismiss" onClick={() => setBannerOpen(false)}><IconX size={16} /></button>
          </div>
        )}

        <div className="dash-cards">
          {statCards.map(c => (
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

        <div className="charts-row">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Monthly Trend</h3>
                <div className="p-sub">Deposits · Withdrawals · Loan Repayments — last 6 months</div>
              </div>
            </div>
            <div style={{ padding: '20px 24px 16px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={fmtTick} tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="deposits"        name="Deposits"        stroke="#2E6BE6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="withdrawals"     name="Withdrawals"     stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="loan_repayments" name="Loan Repayments" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

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
                    <Pie data={portfolioBreakdown} cx="50%" cy="50%" innerRadius={62} outerRadius={88} dataKey="value" strokeWidth={2} stroke="white">
                      {portfolioBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
                {portfolioBreakdown.map(d => (
                  <div key={d.name} className="pl-row">
                    <div className="pl-dot" style={{ background: d.color }} />
                    <div className="pl-name">{d.name}</div>
                    <div>
                      <div className="pl-val">{fmtINRCompact(d.value)}</div>
                      <div className="pl-pct">{totalPortfolio > 0 ? ((d.value / totalPortfolio) * 100).toFixed(1) : '0.0'}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bottom-row">
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
                {recentTxns.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-muted)', padding:'24px' }}>No transactions yet</td></tr>
                ) : recentTxns.map(tx => (
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top accounts by volume */}
            {snapshot?.top_accounts?.length > 0 && (
              <div className="panel">
                <div className="panel-head">
                  <div>
                    <h3>Top Accounts</h3>
                    <div className="p-sub">By transaction volume · this month</div>
                  </div>
                  <IconBarChart size={18} style={{ color: 'var(--blue)' }} />
                </div>
                <div style={{ padding: '4px 0 12px' }}>
                  {snapshot.top_accounts.map((a, i) => {
                    const maxAmt = snapshot.top_accounts[0].total_amount;
                    const pct = maxAmt > 0 ? (a.total_amount / maxAmt) * 100 : 0;
                    return (
                      <div key={a.account_number} style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.holder_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{a.account_number}</div>
                          <div style={{ marginTop: 4, height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--blue)', borderRadius: 2, transition: 'width 0.4s' }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>{fmtINRCompact(a.total_amount)}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.txn_count} txns</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                <div className="qi-text">
                  <strong>{anomalies.filter(a => !a.anomaly_dismissed).length} suspicious transactions</strong> detected by AI anomaly detection.
                </div>
              </div>
              {summary && summary.active_loans > 0 && (
                <div className="qi-item warn">
                  <div className="qi-ico"><IconAlertCircle size={16} style={{ color: '#D97706' }} /></div>
                  <div className="qi-text"><strong>{summary.active_loans} active loans</strong> — portfolio value {fmtINRCompact(summary.total_loan_amount)}.</div>
                </div>
              )}
              {summary && summary.deposits_change !== 0 && (
                <div className="qi-item">
                  <div className="qi-ico"><IconTrendingUp size={16} style={{ color: '#10B981' }} /></div>
                  <div className="qi-text">Deposits <strong>{summary.deposits_change >= 0 ? '+' : ''}{summary.deposits_change}%</strong> vs last month.</div>
                </div>
              )}
              <div className="qi-item">
                <div className="qi-ico"><IconActivity size={16} style={{ color: 'var(--blue)' }} /></div>
                <div className="qi-text">Total investments: <strong>{fmtINRCompact(summary?.total_investments ?? 0)}</strong> across active portfolio.</div>
              </div>
            </div>
          </div>
          </div>  {/* end flex column wrapping top-accounts + quick-insights */}
        </div>
      </main>

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
