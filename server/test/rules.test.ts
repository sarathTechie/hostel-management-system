import {describe,it,expect} from 'vitest';import {feeBalance,feeStatus,validLeaveRange} from '../src/rules.js';
describe('fee rules',()=>{
 it('derives remaining balance from all partial payments',()=>expect(feeBalance(1000,[250,300])).toBe(450));
 it('rounds balances to cents',()=>expect(feeBalance(100,[10.1,9.8])).toBe(80.1));
 it('keeps an unpaid fee due during the seven-day grace period',()=>expect(feeStatus(1,new Date('2026-01-01'),new Date('2026-01-07'))).toBe('DUE'));
 it('marks an unpaid fee overdue after the default seven-day grace period',()=>expect(feeStatus(1,new Date('2026-01-01'),new Date('2026-01-08'))).toBe('OVERDUE'));
 it('supports a configured grace period',()=>expect(feeStatus(1,new Date('2026-01-01'),new Date('2026-01-04'),0,5)).toBe('DUE'));
 it('rejects invalid grace-period configuration',()=>expect(()=>feeStatus(1,new Date('2026-01-01'),new Date('2026-01-04'),0,-1)).toThrow(RangeError));
 it('marks a settled due paid',()=>expect(feeStatus(0,new Date('2026-01-01'),new Date('2026-01-08'))).toBe('PAID'));
 it('distinguishes a partially paid current due',()=>expect(feeStatus(50,new Date('2027-01-01'),new Date('2026-01-02'),50)).toBe('PARTIALLY_PAID'));
});
describe('leave date validation',()=>{it('accepts a valid range',()=>expect(validLeaveRange(new Date('2026-02-01'),new Date('2026-02-02'))).toBe(true));it('rejects equal, reversed and invalid dates',()=>{expect(validLeaveRange(new Date('2026-02-01'),new Date('2026-02-01'))).toBe(false);expect(validLeaveRange(new Date('2026-02-02'),new Date('2026-02-01'))).toBe(false);expect(validLeaveRange(new Date('no date'),new Date())).toBe(false)})});
