import { describe, expect, it } from 'vitest';
import { createAllowedOrigins, localDevelopmentLanOrigins } from '../src/origin-policy.js';

describe('client origin policy', () => {
  it('allows only the known local client origins during development', () => {
    const origins = createAllowedOrigins('development', undefined, []);

    expect([...origins]).toEqual([
      'http://localhost:4173',
      'http://localhost:5173',
      'http://127.0.0.1:4173',
      'http://127.0.0.1:5173',
    ]);
    expect(origins.has('http://localhost:4174')).toBe(false);
    expect(origins.has('https://example.invalid')).toBe(false);
  });

  it('allows only private LAN addresses on the local client ports', () => {
    const lanOrigins = localDevelopmentLanOrigins([
      '10.176.93.116',
      '172.16.0.2',
      '192.168.1.25',
      '8.8.8.8',
      '192.168.1.999',
    ]);
    const origins = createAllowedOrigins('development', undefined, lanOrigins);

    expect(origins.has('http://10.176.93.116:5173')).toBe(true);
    expect(origins.has('http://10.176.93.116:4173')).toBe(true);
    expect(origins.has('http://192.168.1.25:4173')).toBe(true);
    expect(origins.has('http://8.8.8.8:5173')).toBe(false);
    expect(origins.has('http://192.168.1.999:5173')).toBe(false);
    expect(origins.has('http://10.176.93.116:4174')).toBe(false);
  });

  it('allows only the explicitly configured client origin in production', () => {
    expect([...createAllowedOrigins('production', 'https://hms.example.edu')])
      .toEqual(['https://hms.example.edu']);
  });

  it('allows a specifically configured LAN client origin in development', () => {
    const origin = 'http://10.176.93.116:5173';
    const origins = createAllowedOrigins('development', origin);

    expect(origins.has(origin)).toBe(true);
    expect(origins.has('http://10.176.93.117:5173')).toBe(false);
  });

  it('requires an explicit client origin in production', () => {
    expect(() => createAllowedOrigins('production', undefined))
      .toThrow('CLIENT_ORIGIN must be set to the public client origin in production.');
  });
});
