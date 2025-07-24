import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCustomer } from '../validateCustomer.js';

global.fetch = vi.fn();

describe('validateCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { hostname: 'example.com' },
      writable: true,
    });
  });

  it('returns parsed response on success', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ valid: true, tier: 'pro', credentials: { a: 1 } }),
    });
    const res = await validateCustomer('acct');
    expect(fetch).toHaveBeenCalled();
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.domain).toBe('example.com');
    expect(res).toEqual({ valid: true, tier: 'pro', credentials: { a: 1 } });
  });

  it('handles failure gracefully', async () => {
    fetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    const res = await validateCustomer('acct');
    expect(res.valid).toBe(false);
  });
});
