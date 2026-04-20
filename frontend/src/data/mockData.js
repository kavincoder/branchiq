// All mock data — matches exact values from UI_FLOW.md section 0.3 & 0.4

export const MOCK_CREDENTIALS = {
  'arjun.manager': { password: 'password123', user: { user_id: 'USR-2026-0001', full_name: 'Arjun Menon', username: 'arjun.manager', role: 'manager', initials: 'AM' } },
  'priya.staff':   { password: 'password123', user: { user_id: 'USR-2026-0002', full_name: 'Priya Sharma',  username: 'priya.staff',   role: 'staff',   initials: 'PS' } },
  'john.staff':    { password: 'password123', user: { user_id: 'USR-2026-0003', full_name: 'John David',    username: 'john.staff',    role: 'staff',   initials: 'JD' } },
};

export const STAFF_LIST = [
  { user_id: 'USR-2026-0001', full_name: 'Arjun Menon',    username: 'arjun.manager', role: 'manager', is_active: true,  created_at: '2026-01-01T09:00:00' },
  { user_id: 'USR-2026-0002', full_name: 'Priya Sharma',   username: 'priya.staff',   role: 'staff',   is_active: true,  created_at: '2026-01-10T09:00:00' },
  { user_id: 'USR-2026-0003', full_name: 'John David',     username: 'john.staff',    role: 'staff',   is_active: true,  created_at: '2026-01-15T09:00:00' },
  { user_id: 'USR-2026-0004', full_name: 'Sneha Kulkarni', username: 'sneha.staff',   role: 'staff',   is_active: false, created_at: '2026-02-01T09:00:00' },
];

export const SUMMARY = {
  total_deposits:     210000,  deposits_change:    18.2,
  total_withdrawals:  60000,   withdrawals_change: -7.4,
  active_loans:       23,      loans_new:          2,
  total_loan_amount:  8750000, loan_amount_change: 3.1,
  total_investments:  1850000, investments_change: 0,
};

export const TRANSACTIONS = [
  { transaction_id:'TXN-2026-0145', account_number:'ACC-2026-0023', holder_name:'Ravi Kumar',       type:'deposit',        amount:75000,  transaction_date:'2026-04-19T09:15:00', created_by_name:'Priya S.', is_anomaly:false },
  { transaction_id:'TXN-2026-0144', account_number:'ACC-2026-0007', holder_name:'Meena Iyer',        type:'loan_repayment', amount:12500,  transaction_date:'2026-04-19T08:45:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0143', account_number:'ACC-2026-0015', holder_name:'Suresh Pillai',     type:'withdrawal',     amount:25000,  transaction_date:'2026-04-18T16:30:00', created_by_name:'Priya S.', is_anomaly:true,  anomaly_score:0.71, anomaly_reason_plain:'Repeated withdrawals same account same day' },
  { transaction_id:'TXN-2026-0142', account_number:'ACC-2026-0031', holder_name:'Anita Rao',         type:'deposit',        amount:150000, transaction_date:'2026-04-18T14:20:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0141', account_number:'ACC-2026-0007', holder_name:'Meena Iyer',        type:'transfer',       amount:30000,  transaction_date:'2026-04-18T11:05:00', created_by_name:'Priya S.', is_anomaly:false },
  { transaction_id:'TXN-2026-0140', account_number:'ACC-2026-0042', holder_name:'Mohammed Farhan',   type:'deposit',        amount:50000,  transaction_date:'2026-04-17T15:50:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0139', account_number:'ACC-2026-0023', holder_name:'Ravi Kumar',        type:'loan_repayment', amount:8333,   transaction_date:'2026-04-17T10:00:00', created_by_name:'Priya S.', is_anomaly:false },
  { transaction_id:'TXN-2026-0138', account_number:'ACC-2026-0015', holder_name:'Suresh Pillai',     type:'withdrawal',     amount:750000, transaction_date:'2026-04-17T02:14:00', created_by_name:'Priya S.', is_anomaly:true,  anomaly_score:0.94, anomaly_reason_plain:'Unusually large withdrawal at odd hours' },
  { transaction_id:'TXN-2026-0137', account_number:'ACC-2026-0031', holder_name:'Anita Rao',         type:'deposit',        amount:20000,  transaction_date:'2026-04-16T12:30:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0136', account_number:'ACC-2026-0042', holder_name:'Mohammed Farhan',   type:'loan_repayment', amount:15000,  transaction_date:'2026-04-16T09:45:00', created_by_name:'Priya S.', is_anomaly:false },
  { transaction_id:'TXN-2026-0135', account_number:'ACC-2026-0023', holder_name:'Ravi Kumar',        type:'deposit',        amount:40000,  transaction_date:'2026-04-15T11:20:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0134', account_number:'ACC-2026-0007', holder_name:'Meena Iyer',        type:'withdrawal',     amount:18000,  transaction_date:'2026-04-15T10:00:00', created_by_name:'Priya S.', is_anomaly:false },
  { transaction_id:'TXN-2026-0133', account_number:'ACC-2026-0031', holder_name:'Anita Rao',         type:'transfer',       amount:55000,  transaction_date:'2026-04-14T15:30:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0132', account_number:'ACC-2026-0042', holder_name:'Mohammed Farhan',   type:'deposit',        amount:80000,  transaction_date:'2026-04-14T09:15:00', created_by_name:'Priya S.', is_anomaly:false },
  { transaction_id:'TXN-2026-0131', account_number:'ACC-2026-0015', holder_name:'Suresh Pillai',     type:'loan_repayment', amount:22000,  transaction_date:'2026-04-13T14:00:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0130', account_number:'ACC-2026-0023', holder_name:'Ravi Kumar',        type:'withdrawal',     amount:15000,  transaction_date:'2026-04-12T11:30:00', created_by_name:'Priya S.', is_anomaly:false },
  { transaction_id:'TXN-2026-0129', account_number:'ACC-2026-0007', holder_name:'Meena Iyer',        type:'deposit',        amount:60000,  transaction_date:'2026-04-11T16:00:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0128', account_number:'ACC-2026-0031', holder_name:'Anita Rao',         type:'loan_repayment', amount:9500,   transaction_date:'2026-04-10T10:30:00', created_by_name:'Priya S.', is_anomaly:false },
  { transaction_id:'TXN-2026-0127', account_number:'ACC-2026-0042', holder_name:'Mohammed Farhan',   type:'withdrawal',     amount:35000,  transaction_date:'2026-04-09T14:45:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0126', account_number:'ACC-2026-0023', holder_name:'Ravi Kumar',        type:'deposit',        amount:100000, transaction_date:'2026-04-08T09:00:00', created_by_name:'Priya S.', is_anomaly:false },
  { transaction_id:'TXN-2026-0125', account_number:'ACC-2026-0015', holder_name:'Suresh Pillai',     type:'transfer',       amount:45000,  transaction_date:'2026-04-07T13:15:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0124', account_number:'ACC-2026-0007', holder_name:'Meena Iyer',        type:'withdrawal',     amount:25000,  transaction_date:'2026-04-06T15:00:00', created_by_name:'Priya S.', is_anomaly:false },
  { transaction_id:'TXN-2026-0123', account_number:'ACC-2026-0031', holder_name:'Anita Rao',         type:'deposit',        amount:75000,  transaction_date:'2026-04-05T10:00:00', created_by_name:'John D.',  is_anomaly:false },
  { transaction_id:'TXN-2026-0102', account_number:'ACC-2026-0031', holder_name:'Anita Rao',         type:'transfer',       amount:280000, transaction_date:'2026-04-10T11:30:00', created_by_name:'Priya S.', is_anomaly:true,  anomaly_score:0.63, anomaly_reason_plain:'Amount 4x above account average' },
];

export const LOANS = [
  { loan_id:'LN-2026-0012', account_number:'ACC-2026-0023', holder_name:'Ravi Kumar',      principal_amount:200000, interest_rate:12.5, outstanding_balance:187450, total_paid:25000,  status:'active',   start_date:'2026-04-19', end_date:'2029-04-19', purpose:'Home renovation',      risk_score:15 },
  { loan_id:'LN-2026-0008', account_number:'ACC-2026-0007', holder_name:'Meena Iyer',       principal_amount:75000,  interest_rate:10.0, outstanding_balance:52340,  total_paid:28000,  status:'active',   start_date:'2025-06-01', end_date:'2028-01-01', purpose:'Education',            risk_score:28 },
  { loan_id:'LN-2026-0003', account_number:'ACC-2026-0015', holder_name:'Suresh Pillai',    principal_amount:500000, interest_rate:14.0, outstanding_balance:421800, total_paid:95000,  status:'active',   start_date:'2025-01-15', end_date:'2030-06-15', purpose:'Business expansion',   risk_score:62 },
  { loan_id:'LN-2025-0019', account_number:'ACC-2026-0008', holder_name:'Kavitha Nair',     principal_amount:100000, interest_rate:11.0, outstanding_balance:0,      total_paid:115600, status:'closed',   start_date:'2024-06-01', end_date:'2026-03-01', purpose:'Vehicle purchase',     risk_score:0  },
  { loan_id:'LN-2026-0001', account_number:'ACC-2026-0042', holder_name:'Mohammed Farhan',  principal_amount:350000, interest_rate:13.5, outstanding_balance:312900, total_paid:45000,  status:'defaulted',start_date:'2026-01-10', end_date:'2027-12-10', purpose:'Personal loan',        risk_score:88 },
  { loan_id:'LN-2026-0006', account_number:'ACC-2026-0023', holder_name:'Ravi Kumar',       principal_amount:120000, interest_rate:11.5, outstanding_balance:98400,  total_paid:27000,  status:'active',   start_date:'2025-09-01', end_date:'2028-09-01', purpose:'Medical expenses',     risk_score:35 },
  { loan_id:'LN-2025-0031', account_number:'ACC-2026-0031', holder_name:'Anita Rao',        principal_amount:250000, interest_rate:12.0, outstanding_balance:182000, total_paid:78000,  status:'active',   start_date:'2025-03-01', end_date:'2029-03-01', purpose:'Home improvement',     risk_score:22 },
  { loan_id:'LN-2025-0027', account_number:'ACC-2026-0007', holder_name:'Meena Iyer',       principal_amount:50000,  interest_rate:9.5,  outstanding_balance:0,      total_paid:56200,  status:'closed',   start_date:'2024-01-01', end_date:'2025-12-01', purpose:'Consumer goods',       risk_score:0  },
];

export const DEPOSITS = [
  { deposit_id:'DEP-2026-0012', holder_name:'Ravi Kumar',      phone:'9876543210', deposit_amount:100000, interest_rate:7.5, deposit_type:'fixed',   start_date:'2026-01-01', maturity_date:'2027-01-01', maturity_amount:107500, status:'active',    created_by_name:'Priya S.' },
  { deposit_id:'DEP-2026-0011', holder_name:'Meena Iyer',       phone:'9123456780', deposit_amount:50000,  interest_rate:6.0, deposit_type:'savings', start_date:'2025-06-01', maturity_date:null,         maturity_amount:null,   status:'active',    created_by_name:'John D.'  },
  { deposit_id:'DEP-2026-0010', holder_name:'Anita Rao',        phone:'9988776655', deposit_amount:200000, interest_rate:8.0, deposit_type:'fixed',   start_date:'2025-04-01', maturity_date:'2026-04-01', maturity_amount:216000, status:'matured',   created_by_name:'Priya S.' },
  { deposit_id:'DEP-2026-0009', holder_name:'Mohammed Farhan',  phone:'9556677889', deposit_amount:75000,  interest_rate:7.0, deposit_type:'fixed',   start_date:'2026-02-15', maturity_date:'2027-02-15', maturity_amount:80250,  status:'active',    created_by_name:'John D.'  },
  { deposit_id:'DEP-2025-0045', holder_name:'Kavitha Nair',     phone:'9445566778', deposit_amount:150000, interest_rate:7.5, deposit_type:'fixed',   start_date:'2024-10-01', maturity_date:'2025-10-01', maturity_amount:161250, status:'withdrawn', created_by_name:'Priya S.' },
  { deposit_id:'DEP-2026-0008', holder_name:'Suresh Pillai',    phone:'9334455667', deposit_amount:80000,  interest_rate:6.5, deposit_type:'savings', start_date:'2025-08-01', maturity_date:null,         maturity_amount:null,   status:'active',    created_by_name:'John D.'  },
  { deposit_id:'DEP-2026-0007', holder_name:'Ravi Kumar',       phone:'9876543210', deposit_amount:250000, interest_rate:8.5, deposit_type:'fixed',   start_date:'2026-03-01', maturity_date:'2028-03-01', maturity_amount:293125, status:'active',    created_by_name:'Priya S.' },
];

export const INVESTMENTS = [
  { investment_id:'INV-2026-0005', investment_type:'govt_bond',    amount:500000, investment_date:'2026-01-15', expected_return_rate:8.0,  expected_maturity_amount:740122, maturity_date:'2031-01-15', status:'active',   notes:'RBI Bond Series 2026'         },
  { investment_id:'INV-2026-0004', investment_type:'mutual_fund',  amount:300000, investment_date:'2025-10-01', expected_return_rate:12.0, expected_maturity_amount:528451, maturity_date:'2030-10-01', status:'active',   notes:'HDFC Equity Fund'             },
  { investment_id:'INV-2026-0003', investment_type:'fixed_deposit',amount:250000, investment_date:'2025-07-01', expected_return_rate:7.5,  expected_maturity_amount:269375, maturity_date:'2026-07-01', status:'active',   notes:'SBI FD'                       },
  { investment_id:'INV-2025-0012', investment_type:'govt_bond',    amount:200000, investment_date:'2024-04-01', expected_return_rate:7.25, expected_maturity_amount:285987, maturity_date:'2029-04-01', status:'active',   notes:'GoI Bond Series A'            },
  { investment_id:'INV-2025-0008', investment_type:'mutual_fund',  amount:150000, investment_date:'2023-01-01', expected_return_rate:14.0, expected_maturity_amount:188100, maturity_date:'2025-01-01', status:'matured',  notes:'ICICI Balanced Advantage'     },
  { investment_id:'INV-2025-0003', investment_type:'fixed_deposit',amount:100000, investment_date:'2024-06-01', expected_return_rate:7.0,  expected_maturity_amount:107000, maturity_date:'2025-06-01', status:'liquidated',notes:'Axis Bank FD — early closure' },
];

export const MONTHLY_TREND = [
  { month:'Nov 2025', deposits:320000, withdrawals:95000,  loan_repayments:72000 },
  { month:'Dec 2025', deposits:410000, withdrawals:120000, loan_repayments:85000 },
  { month:'Jan 2026', deposits:380000, withdrawals:88000,  loan_repayments:79000 },
  { month:'Feb 2026', deposits:450000, withdrawals:110000, loan_repayments:91000 },
  { month:'Mar 2026', deposits:500000, withdrawals:130000, loan_repayments:90000 },
  { month:'Apr 2026', deposits:210000, withdrawals:60000,  loan_repayments:85000 },
];

export const PORTFOLIO_BREAKDOWN = [
  { name:'Loans',       value:8750000, color:'#2E6BE6' },
  { name:'Deposits',    value:4500000, color:'#10B981' },
  { name:'Investments', value:1850000, color:'#F59E0B' },
];

export const ANOMALIES = [
  { transaction_id:'TXN-2026-0138', account_number:'ACC-2026-0015', holder_name:'Suresh Pillai',  type:'withdrawal', amount:750000, transaction_date:'2026-04-17T02:14:00', anomaly_score:0.94, anomaly_reason_plain:'Unusually large withdrawal at odd hours',  anomaly_dismissed:false },
  { transaction_id:'TXN-2026-0143', account_number:'ACC-2026-0015', holder_name:'Suresh Pillai',  type:'withdrawal', amount:25000,  transaction_date:'2026-04-18T16:30:00', anomaly_score:0.71, anomaly_reason_plain:'Repeated withdrawals same account same day',anomaly_dismissed:false },
  { transaction_id:'TXN-2026-0102', account_number:'ACC-2026-0031', holder_name:'Anita Rao',      type:'transfer',   amount:280000, transaction_date:'2026-04-10T11:30:00', anomaly_score:0.63, anomaly_reason_plain:'Amount 4x above account average',           anomaly_dismissed:false },
];

export const INSIGHTS = {
  last_run: '2026-04-19T14:30:00',
  transactions_scanned: 512,
  monthly_comparison: {
    deposits:       { this_month:210000, last_month:500000, change_pct:-58.0 },
    withdrawals:    { this_month:60000,  last_month:130000, change_pct:-53.8 },
    loan_repayments:{ this_month:85000,  last_month:90000,  change_pct:-5.6  },
  },
  loan_performance: { on_time_pct:78.3, late_pct:18.2, defaulted_pct:3.5, defaulted_count:2, active_count:23 },
  trend_alerts: [
    { text:'Withdrawals decreased 53.8% compared to last month', severity:'info',    change_pct:-53.8 },
    { text:'Deposits down 58% vs last month (partial month — Apr not yet complete)', severity:'info',    change_pct:-58.0 },
    { text:'Loan repayments down 5.6% — monitor closely',                            severity:'warning', change_pct:-5.6  },
  ],
  peak_hour:   '10:00 – 11:00',
  busiest_day: 'Monday',
  dormant_accounts: [
    { account_number:'ACC-2026-0008', holder_name:'Kavitha Nair', days_dormant:45, last_activity:'2026-03-05T14:30:00' },
  ],
};

export const LOAN_PERF_PIE = [
  { name:'On-Time',  value:78.3, color:'#10B981' },
  { name:'Late',     value:18.2, color:'#F59E0B' },
  { name:'Defaulted',value:3.5,  color:'#EF4444' },
];

export const AI_HISTORY = [
  { run_id:'AI-2026-0008', run_at:'2026-04-19T14:30:00', run_by_name:'Priya S.',  transactions_scanned:512, anomalies_found:3, loans_scored:23, dormant_accounts:1 },
  { run_id:'AI-2026-0007', run_at:'2026-04-18T09:15:00', run_by_name:'Arjun M.', transactions_scanned:508, anomalies_found:1, loans_scored:23, dormant_accounts:1 },
  { run_id:'AI-2026-0006', run_at:'2026-04-17T16:00:00', run_by_name:'Priya S.',  transactions_scanned:503, anomalies_found:2, loans_scored:22, dormant_accounts:2 },
  { run_id:'AI-2026-0005', run_at:'2026-04-14T11:30:00', run_by_name:'Arjun M.', transactions_scanned:498, anomalies_found:0, loans_scored:22, dormant_accounts:2 },
  { run_id:'AI-2026-0004', run_at:'2026-04-12T09:00:00', run_by_name:'John D.',  transactions_scanned:489, anomalies_found:1, loans_scored:21, dormant_accounts:1 },
];

export const AUDIT_LOGS = [
  { id:142, action:'delete', table_name:'transactions', record_id:'TXN-2026-0031', performed_by_name:'Arjun Menon',   performed_at:'2026-04-18T16:45:00', ip_address:'192.168.1.5' },
  { id:141, action:'create', table_name:'loans',        record_id:'LN-2026-0012',  performed_by_name:'Priya Sharma',  performed_at:'2026-04-19T09:30:00', ip_address:'192.168.1.8' },
  { id:140, action:'update', table_name:'transactions', record_id:'TXN-2026-0144', performed_by_name:'John David',    performed_at:'2026-04-19T08:50:00', ip_address:'192.168.1.12' },
  { id:139, action:'login',  table_name:'login_logs',   record_id:'USR-2026-0002', performed_by_name:'Priya Sharma',  performed_at:'2026-04-19T08:45:00', ip_address:'192.168.1.8' },
  { id:138, action:'export', table_name:'transactions', record_id:'export',        performed_by_name:'Arjun Menon',   performed_at:'2026-04-18T17:00:00', ip_address:'192.168.1.5' },
  { id:137, action:'create', table_name:'transactions', record_id:'TXN-2026-0145', performed_by_name:'Priya Sharma',  performed_at:'2026-04-19T09:15:00', ip_address:'192.168.1.8' },
  { id:136, action:'update', table_name:'loans',        record_id:'LN-2026-0003',  performed_by_name:'Arjun Menon',   performed_at:'2026-04-18T14:00:00', ip_address:'192.168.1.5' },
  { id:135, action:'create', table_name:'deposits',     record_id:'DEP-2026-0012', performed_by_name:'John David',    performed_at:'2026-04-17T11:00:00', ip_address:'192.168.1.12' },
  { id:134, action:'delete', table_name:'transactions', record_id:'TXN-2026-0099', performed_by_name:'Arjun Menon',   performed_at:'2026-04-16T15:30:00', ip_address:'192.168.1.5' },
  { id:133, action:'login',  table_name:'login_logs',   record_id:'USR-2026-0003', performed_by_name:'John David',    performed_at:'2026-04-16T09:00:00', ip_address:'192.168.1.12' },
];
