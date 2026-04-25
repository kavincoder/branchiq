import { describe, it, expect } from 'vitest';
import { fmtINR, fmtINRCompact, fmtDate, txnLabel, txnClass, riskLabel, riskClass } from './format.js';

// ── fmtINR ────────────────────────────────────────────────────────────────────
describe('fmtINR', () => {
  it('formats zero', () => {
    expect(fmtINR(0)).toBe('₹0');
  });
  it('returns dash for null', () => {
    expect(fmtINR(null)).toBe('—');
  });
  it('formats positive number', () => {
    expect(fmtINR(50000)).toContain('₹');
    expect(fmtINR(50000)).toContain('50');
  });
});

// ── fmtINRCompact ─────────────────────────────────────────────────────────────
describe('fmtINRCompact', () => {
  it('formats crores correctly', () => {
    expect(fmtINRCompact(10000000)).toBe('₹1.00Cr');
    expect(fmtINRCompact(25000000)).toBe('₹2.50Cr');
  });
  it('formats lakhs correctly', () => {
    expect(fmtINRCompact(100000)).toBe('₹1.00L');
    expect(fmtINRCompact(500000)).toBe('₹5.00L');
  });
  it('formats thousands correctly', () => {
    expect(fmtINRCompact(5000)).toBe('₹5.0K');
  });
  it('returns ₹0 for falsy', () => {
    expect(fmtINRCompact(0)).toBe('₹0');
    expect(fmtINRCompact(null)).toBe('₹0');
  });
});

// ── fmtDate ───────────────────────────────────────────────────────────────────
describe('fmtDate', () => {
  it('returns dash for null', () => {
    expect(fmtDate(null)).toBe('—');
  });
  it('formats ISO date string', () => {
    const result = fmtDate('2026-04-19T09:00:00');
    expect(result).toContain('Apr');
    expect(result).toContain('2026');
  });
});

// ── txnLabel / txnClass ───────────────────────────────────────────────────────
describe('txnLabel', () => {
  it('maps deposit correctly', () => expect(txnLabel('deposit')).toBe('Deposit'));
  it('maps withdrawal correctly', () => expect(txnLabel('withdrawal')).toBe('Withdrawal'));
  it('maps loan_repayment correctly', () => expect(txnLabel('loan_repayment')).toBe('Loan Repayment'));
  it('maps transfer correctly', () => expect(txnLabel('transfer')).toBe('Transfer'));
  it('returns unknown type as-is', () => expect(txnLabel('other')).toBe('other'));
});

describe('txnClass', () => {
  it('returns deposit class', () => expect(txnClass('deposit')).toBe('deposit'));
  it('returns repay class for loan_repayment', () => expect(txnClass('loan_repayment')).toBe('repay'));
});

// ── riskLabel / riskClass ─────────────────────────────────────────────────────
describe('riskLabel', () => {
  it('low risk for score <= 30', () => expect(riskLabel(15)).toBe('Low Risk'));
  it('medium risk for score 31-60', () => expect(riskLabel(45)).toBe('Medium Risk'));
  it('high risk for score > 60', () => expect(riskLabel(75)).toBe('High Risk'));
  it('boundary: 30 is low', () => expect(riskLabel(30)).toBe('Low Risk'));
  it('boundary: 60 is medium', () => expect(riskLabel(60)).toBe('Medium Risk'));
  it('boundary: 61 is high', () => expect(riskLabel(61)).toBe('High Risk'));
});

describe('riskClass', () => {
  it('returns b-green for low', () => expect(riskClass(10)).toBe('b-green'));
  it('returns b-amber for medium', () => expect(riskClass(50)).toBe('b-amber'));
  it('returns b-red for high', () => expect(riskClass(80)).toBe('b-red'));
});
