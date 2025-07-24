import { describe, it, expect, vi, beforeEach } from 'vitest';

global.fetch = vi.fn();

import { postResponse } from '../postResponse.js';

describe('postResponse', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it('returns true on successful POST', async () => {
    fetch.mockResolvedValue({ ok: true });
    const data = { a: 1 };
    const res = await postResponse(data);
    expect(fetch).toHaveBeenCalledWith('https://api.retainiq.com/response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    expect(res).toBe(true);
  });

  it('handles errors and returns false', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    const res = await postResponse({});
    expect(res).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
