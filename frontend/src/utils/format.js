export const fmtINR = (n) =>
  n == null ? '—' : '₹' + Number(n).toLocaleString('en-IN');

export const fmtINRCompact = (n) => {
  if (!n && n !== 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return '₹' + Number(n).toLocaleString('en-IN');
};

export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()} ${h}:${m}`;
};

export const txnLabel = (t) => ({ deposit:'Deposit', withdrawal:'Withdrawal', transfer:'Transfer', loan_repayment:'Loan Repayment' }[t] || t);
export const txnClass = (t) => ({ deposit:'deposit', withdrawal:'withdrawal', transfer:'transfer', loan_repayment:'repay' }[t] || '');

export const riskClass = (score) => {
  if (score <= 30) return 'b-green';
  if (score <= 60) return 'b-amber';
  return 'b-red';
};
export const riskLabel = (score) => {
  if (score <= 30) return 'Low Risk';
  if (score <= 60) return 'Medium Risk';
  return 'High Risk';
};
