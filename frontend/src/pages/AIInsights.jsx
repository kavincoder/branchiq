import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import TopNav from '../components/TopNav.jsx';
import {
  IconSparkles, IconTriangle, IconAlertCircle, IconActivity,
  IconRefresh,
} from '../components/icons.jsx';
import { fmtINR, fmtINRCompact, fmtDateTime } from '../utils/format.js';
import { api } from '../api/client.js';
import '../styles/ai-insights.css';

function adaptTxn(t) {
  return {
    ...t,
    amount: parseFloat(t.amount),
    anomaly_score: parseFloat(t.anomaly_score || 0),
    anomaly_reason_plain: t.anomaly_reason || 'Unusual pattern detected',
    transaction_type: t.transaction_type,
  };
}

function ScoreBar({ score }) {
  const color = score >= 0.8 ? '#EF4444' : score >= 0.6 ? '#F59E0B' : '#10B981';
  return (
    <div className="score-bar-wrap">
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${score*100}%`, background: color }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace', minWidth: 32 }}>
        {(score*100).toFixed(0)}%
      </span>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="ct-row">
        <div className="ct-dot" style={{ background: payload[0].payload.color }} />
        <div className="ct-name">{payload[0].name}</div>
        <div className="ct-val">{payload[0].value}%</div>
      </div>
    </div>
  );
}

export default function AIInsights() {
  const [anomalies,  setAnomalies]  = useState([]);
  const [insights,   setInsights]   = useState(null);
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [analyzing,  setAnalyzing]  = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (t, d) => { setToast({ t, d }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    async function load() {
      try {
        const [anom, ins, hist] = await Promise.all([
          api.get('/ai/anomalies'),
          api.get('/ai/insights'),
          api.get('/ai/history'),
        ]);
        setAnomalies(anom.map(adaptTxn));
        setInsights(ins);
        setHistory(hist);
      } catch (e) {
        console.error('AI Insights load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await api.post('/ai/run');
      const [anom, ins, hist] = await Promise.all([
        api.get('/ai/anomalies'),
        api.get('/ai/insights'),
        api.get('/ai/history'),
      ]);
      setAnomalies(anom.map(adaptTxn));
      setInsights(ins);
      setHistory(hist);
      showToast('Analysis complete', `${result.anomalies_flagged ?? anom.length} anomalies · ${result.transactions_scanned ?? ins?.transactions_scanned ?? '—'} transactions scanned`);
    } catch (e) {
      showToast('Analysis failed', e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const dismissAnomaly = async (id) => {
    try {
      await api.post(`/ai/anomalies/${id}/dismiss`);
      setAnomalies(prev => prev.map(a => a.transaction_id === id ? { ...a, anomaly_dismissed: true } : a));
    } catch (e) {
      showToast('Dismiss failed', e.message);
    }
  };

  // Weekly anomaly trend — bucket anomalies by calendar week (last 5 weeks)
  const weeklyAnomalyTrend = useMemo(() => {
    const now = new Date();
    const weeks = Array.from({ length: 5 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - (4 - i) * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const label = `W${i + 1}`;
      const count = anomalies.filter(a => {
        const d = new Date(a.created_at || a.transaction_date);
        return d >= weekStart && d <= weekEnd;
      }).length;
      return { week: label, anomalies: count };
    });
    return weeks;
  }, [anomalies]);

  const loanPerfPie = insights ? (() => {
    const total = insights.loan_performance.active_count + insights.loan_performance.defaulted_count;
    if (total === 0) return [];
    const activeP  = Math.round((insights.loan_performance.active_count / total) * 100);
    const defaultP = 100 - activeP;
    return [
      { name: 'Active',    value: activeP,  color: '#2E6BE6' },
      { name: 'Defaulted', value: defaultP, color: '#EF4444' },
    ];
  })() : [];

  const mc = insights?.monthly_comparison;

  if (loading) {
    return (
      <>
        <TopNav active="AI Insights" />
        <main>
          <div className="title-row"><div><h1>AI Insights</h1><div className="sub">Loading…</div></div></div>
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading insights…</div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav active="AI Insights" />
      <main>
        <div className="title-row">
          <div>
            <h1>AI Insights</h1>
            <div className="sub">Anomaly detection &amp; branch analytics</div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={runAnalysis} disabled={analyzing}>
              {analyzing
                ? <><svg width="14" height="14" viewBox="0 0 24 24" className="spin"><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" fill="none"/><path d="M 12 3 A 9 9 0 0 1 21 12" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg> Analyzing…</>
                : <><IconRefresh size={15}/> Run Analysis</>
              }
            </button>
          </div>
        </div>

        <div className="ai-info-bar">
          <div className="aib-item">
            <div className="aib-label">Last Run</div>
            <div className="aib-val">{insights?.last_run ? fmtDateTime(insights.last_run) : 'Never'}</div>
          </div>
          <div className="aib-sep" />
          <div className="aib-item">
            <div className="aib-label">Transactions Scanned</div>
            <div className="aib-val">{insights?.transactions_scanned ?? '—'}</div>
          </div>
          <div className="aib-sep" />
          <div className="aib-item">
            <div className="aib-label">Anomalies Found</div>
            <div className="aib-val" style={{ color: 'var(--anomaly)' }}>{anomalies.filter(a => !a.anomaly_dismissed).length}</div>
          </div>
          <div className="aib-sep" />
          <div className="aib-item">
            <div className="aib-label">Active Loans</div>
            <div className="aib-val">{insights?.loan_performance?.active_count ?? '—'}</div>
          </div>
          <div className="aib-sep" />
          <div className="aib-item">
            <div className="aib-label">Defaulted Loans</div>
            <div className="aib-val" style={{ color: insights?.loan_performance?.defaulted_count > 0 ? 'var(--anomaly)' : undefined }}>
              {insights?.loan_performance?.defaulted_count ?? '—'}
            </div>
          </div>
        </div>

        <div className="insights-row">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Flagged Anomalies</h3>
                <div className="p-sub">{anomalies.filter(a=>!a.anomaly_dismissed).length} active · AI-detected suspicious transactions</div>
              </div>
              <IconTriangle size={18} style={{ color: 'var(--anomaly)', flexShrink: 0 }} />
            </div>
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th className="num">Amount</th>
                  <th>Score</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {anomalies.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-muted)', padding:'24px' }}>No anomalies detected</td></tr>
                ) : anomalies.map(a => (
                  <tr key={a.transaction_id} className={!a.anomaly_dismissed ? 'anomaly' : ''}>
                    <td><span className="id-cell mono" style={{ fontSize: 12 }}>{a.transaction_id}</span></td>
                    <td>
                      <div className="holder">{a.holder_name}</div>
                      <div className="acc mono">{a.account_number}</div>
                    </td>
                    <td><span className={`chip ${a.transaction_type === 'deposit' ? 'deposit' : 'withdrawal'}`}>{a.transaction_type}</span></td>
                    <td className="amount neg mono">{fmtINR(a.amount)}</td>
                    <td style={{ minWidth: 120 }}><ScoreBar score={a.anomaly_score} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 180 }}>{a.anomaly_reason_plain}</td>
                    <td>
                      <button
                        className={`btn-dismiss${a.anomaly_dismissed?' dismissed':''}`}
                        onClick={() => !a.anomaly_dismissed && dismissAnomaly(a.transaction_id)}
                      >
                        {a.anomaly_dismissed ? 'Dismissed' : 'Dismiss'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Loan Performance</h3>
                <div className="p-sub">{insights?.loan_performance?.active_count ?? 0} active loans</div>
              </div>
              <IconActivity size={18} style={{ color: 'var(--blue)', flexShrink: 0 }} />
            </div>
            <div style={{ padding: '20px' }}>
              {loanPerfPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={loanPerfPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={2} stroke="white">
                        {loanPerfPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {loanPerfPie.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{d.name}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No loan data</div>
              )}
              {insights?.loan_performance?.defaulted_count > 0 && (
                <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--red-pale)', borderRadius: 8, fontSize: 13, color: 'var(--anomaly)', fontWeight: 500 }}>
                  {insights.loan_performance.defaulted_count} defaulted loan{insights.loan_performance.defaulted_count !== 1 ? 's' : ''} — immediate review recommended
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="insights-row-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Monthly Comparison</h3>
                <div className="p-sub">This month vs last month</div>
              </div>
            </div>
            <div className="mc-grid">
              {mc ? [
                { label: 'Deposits',    this: mc.deposits?.this_month    ?? 0, chg: mc.deposits?.change_pct    ?? 0 },
                { label: 'Withdrawals', this: mc.withdrawals?.this_month ?? 0, chg: mc.withdrawals?.change_pct ?? 0 },
              ].map(row => (
                <div key={row.label} className="mc-item">
                  <span className="mc-label">{row.label}</span>
                  <div className="mc-vals">
                    <span className="mc-this">{fmtINRCompact(row.this)}</span>
                    <span className={`mc-chg ${row.chg >= 0 ? 'up' : 'down'}`}>
                      {row.chg >= 0 ? '▲' : '▼'} {Math.abs(row.chg)}% vs last month
                    </span>
                  </div>
                </div>
              )) : <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No data</div>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Dormant Accounts</h3>
                  <div className="p-sub">No activity in 30+ days</div>
                </div>
              </div>
              <div className="dormant-list">
                {insights?.dormant_accounts?.length > 0 ? insights.dormant_accounts.map(acc => (
                  <div key={acc.account_number} className="dormant-item">
                    <div className="di-acc">
                      <div className="di-name">{acc.holder_name}</div>
                      <div className="di-num">{acc.account_number}</div>
                    </div>
                    <div className="di-days">{acc.days_dormant} days dormant</div>
                  </div>
                )) : (
                  <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13 }}>No dormant accounts</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly trend sparkline */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <div>
              <h3>Anomaly Trend</h3>
              <div className="p-sub">Flagged transactions by week · last 5 weeks</div>
            </div>
            <IconTriangle size={18} style={{ color: 'var(--anomaly)', flexShrink: 0 }} />
          </div>
          <div style={{ padding: '8px 24px 20px' }}>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyAnomalyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} width={24} />
                <Tooltip
                  formatter={(v) => [v, 'Anomalies']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                />
                <Bar dataKey="anomalies" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Analysis History</h3>
              <div className="p-sub">Previous AI runs — last 5</div>
            </div>
            <IconSparkles size={18} style={{ color: 'var(--blue)' }} />
          </div>
          <table className="tx-table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Run At</th>
                <th>Run By</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--text-muted)', padding:'24px' }}>No analysis runs yet</td></tr>
              ) : history.map(r => (
                <tr key={r.run_id}>
                  <td><span className="ai-run-badge">{r.run_id}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDateTime(r.run_at)}</td>
                  <td style={{ fontSize: 13 }}>{r.run_by_name}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.extra_info || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <div className="toast-wrap">
        {toast && (
          <div className="toast">
            <div className="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div style={{ flex: 1 }}><div className="t">{toast.t}</div><div className="d">{toast.d}</div></div>
          </div>
        )}
      </div>
    </>
  );
}
