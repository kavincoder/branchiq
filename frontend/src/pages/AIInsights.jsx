import { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import TopNav from '../components/TopNav.jsx';
import {
  IconSparkles, IconTriangle, IconAlertCircle, IconActivity,
  IconRefresh, IconTrendingUp, IconTrendingDown,
} from '../components/icons.jsx';
import { fmtINR, fmtINRCompact, fmtDateTime } from '../utils/format.js';
import { ANOMALIES, INSIGHTS, LOAN_PERF_PIE, AI_HISTORY } from '../data/mockData.js';
import '../styles/ai-insights.css';

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
  const [anomalies,  setAnomalies]  = useState(ANOMALIES.map(a => ({ ...a })));
  const [analyzing,  setAnalyzing]  = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (t, d) => { setToast({ t, d }); setTimeout(() => setToast(null), 3500); };

  const runAnalysis = async () => {
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 2200));
    setAnalyzing(false);
    showToast('Analysis complete', `${anomalies.length} anomalies · ${INSIGHTS.transactions_scanned} transactions scanned`);
  };

  const dismissAnomaly = (id) => {
    setAnomalies(prev => prev.map(a => a.transaction_id === id ? { ...a, anomaly_dismissed: true } : a));
  };

  const mc = INSIGHTS.monthly_comparison;

  return (
    <>
      <TopNav active="AI Insights" />
      <main>
        <div className="title-row">
          <div>
            <h1>AI Insights</h1>
            <div className="sub">19 April 2026 · Anomaly detection &amp; branch analytics</div>
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

        {/* Last analysis info bar */}
        <div className="ai-info-bar">
          <div className="aib-item">
            <div className="aib-label">Last Run</div>
            <div className="aib-val">{fmtDateTime(INSIGHTS.last_run)}</div>
          </div>
          <div className="aib-sep" />
          <div className="aib-item">
            <div className="aib-label">Transactions Scanned</div>
            <div className="aib-val">{INSIGHTS.transactions_scanned}</div>
          </div>
          <div className="aib-sep" />
          <div className="aib-item">
            <div className="aib-label">Anomalies Found</div>
            <div className="aib-val" style={{ color: 'var(--anomaly)' }}>{anomalies.filter(a => !a.anomaly_dismissed).length}</div>
          </div>
          <div className="aib-sep" />
          <div className="aib-item">
            <div className="aib-label">Peak Hour</div>
            <div className="aib-val">{INSIGHTS.peak_hour}</div>
          </div>
          <div className="aib-sep" />
          <div className="aib-item">
            <div className="aib-label">Busiest Day</div>
            <div className="aib-val">{INSIGHTS.busiest_day}</div>
          </div>
        </div>

        {/* Row 1: Anomaly table + Loan performance */}
        <div className="insights-row">
          {/* Anomalies panel */}
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
                {anomalies.map(a => (
                  <tr key={a.transaction_id} className={!a.anomaly_dismissed ? 'anomaly' : ''}>
                    <td><span className="id-cell mono" style={{ fontSize: 12 }}>{a.transaction_id}</span></td>
                    <td>
                      <div className="holder">{a.holder_name}</div>
                      <div className="acc mono">{a.account_number}</div>
                    </td>
                    <td><span className="chip withdrawal">Withdrawal</span></td>
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

          {/* Loan performance donut */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Loan Performance</h3>
                <div className="p-sub">{INSIGHTS.loan_performance.active_count} active loans</div>
              </div>
              <IconActivity size={18} style={{ color: 'var(--blue)', flexShrink: 0 }} />
            </div>
            <div style={{ padding: '20px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={LOAN_PERF_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={2} stroke="white">
                    {LOAN_PERF_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {LOAN_PERF_PIE.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{d.name}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{d.value}%</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--red-pale)', borderRadius: 8, fontSize: 13, color: 'var(--anomaly)', fontWeight: 500 }}>
                {INSIGHTS.loan_performance.defaulted_count} defaulted loan{INSIGHTS.loan_performance.defaulted_count !== 1 ? 's' : ''} — immediate review recommended
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Monthly comparison + Trends & Dormant */}
        <div className="insights-row-2">
          {/* Monthly comparison */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Monthly Comparison</h3>
                <div className="p-sub">April 2026 vs March 2026</div>
              </div>
            </div>
            <div className="mc-grid">
              {[
                { label: 'Deposits',        this: mc.deposits.this_month,        chg: mc.deposits.change_pct },
                { label: 'Withdrawals',     this: mc.withdrawals.this_month,     chg: mc.withdrawals.change_pct },
                { label: 'Loan Repayments', this: mc.loan_repayments.this_month, chg: mc.loan_repayments.change_pct },
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
              ))}
            </div>
          </div>

          {/* Trend alerts + Dormant accounts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Trend Alerts</h3>
                  <div className="p-sub">AI-detected patterns</div>
                </div>
                <IconAlertCircle size={18} style={{ color: '#D97706', flexShrink: 0 }} />
              </div>
              <div className="trend-list">
                {INSIGHTS.trend_alerts.map((alert, i) => (
                  <div key={i} className={`trend-item ${alert.severity}`}>
                    <div className="ti-ico">
                      {alert.severity === 'warning'
                        ? <IconAlertCircle size={15} style={{ color: '#D97706' }} />
                        : <IconActivity size={15} style={{ color: '#2563EB' }} />
                      }
                    </div>
                    <span style={{ flex: 1 }}>{alert.text}</span>
                    <span className={`ti-pct ${alert.change_pct >= 0 ? '' : 'down'}`} style={{ color: alert.change_pct >= 0 ? '#059669' : 'var(--anomaly)' }}>
                      {alert.change_pct >= 0 ? '+' : ''}{alert.change_pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Dormant Accounts</h3>
                  <div className="p-sub">No activity in 30+ days</div>
                </div>
              </div>
              <div className="dormant-list">
                {INSIGHTS.dormant_accounts.map(acc => (
                  <div key={acc.account_number} className="dormant-item">
                    <div className="di-acc">
                      <div className="di-name">{acc.holder_name}</div>
                      <div className="di-num">{acc.account_number}</div>
                    </div>
                    <div className="di-days">{acc.days_dormant} days dormant</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis history */}
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
                <th className="num">Txns Scanned</th>
                <th className="num">Anomalies</th>
                <th className="num">Loans Scored</th>
                <th className="num">Dormant Accs</th>
              </tr>
            </thead>
            <tbody>
              {AI_HISTORY.map(r => (
                <tr key={r.run_id}>
                  <td><span className="ai-run-badge">{r.run_id}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDateTime(r.run_at)}</td>
                  <td style={{ fontSize: 13 }}>{r.run_by_name}</td>
                  <td className="amount mono">{r.transactions_scanned}</td>
                  <td className="num">
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color: r.anomalies_found > 0 ? 'var(--anomaly)' : '#059669' }}>
                      {r.anomalies_found}
                    </span>
                  </td>
                  <td className="amount mono">{r.loans_scored}</td>
                  <td className="amount mono">{r.dormant_accounts}</td>
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
