import {describe,expect,it} from 'vitest';
import {DEVELOPMENT_SESSION_SECRET,isStrongSessionSecret} from '../src/session-secret.js';

describe('production session secret validation',()=>{
 it('accepts high-entropy secrets suitable for production',()=>{
  expect(isStrongSessionSecret('0123456789abcdef'.repeat(4))).toBe(true);
 });

 it.each([
  undefined,
  '',
  'short-secret',
  'a'.repeat(64),
  DEVELOPMENT_SESSION_SECRET,
 ])('rejects missing or weak secrets: %s',(secret)=>{
  expect(isStrongSessionSecret(secret)).toBe(false);
 });
});
