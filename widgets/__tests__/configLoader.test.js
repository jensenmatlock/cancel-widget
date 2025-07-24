import { describe, it, expect, vi, beforeEach } from 'vitest';

var mocks;
vi.mock('../supabaseClient.js', () => {
  const single = vi.fn();
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  mocks = { from, select, eq, single };
  return { supabase: { from } };
});

import { loadConfig } from '../configLoader.js';

describe('loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('returns parsed config on success', async () => {
    const config = { foo: 'bar' };
    mocks.single.mockResolvedValue({ data: { config_json: config }, error: null });
    const result = await loadConfig('acct');
    expect(mocks.from).toHaveBeenCalledWith('configs');
    expect(mocks.select).toHaveBeenCalledWith('config_json');
    expect(mocks.eq).toHaveBeenCalledWith('account_id', 'acct');
    expect(result).toEqual(config);
  });

  it('shows fail message on error', async () => {
    mocks.single.mockRejectedValue(new Error('fail'));
    const result = await loadConfig('acct');
    expect(result).toBeNull();
    expect(document.body.textContent).toMatch("We couldn't load your cancellation flow right now");
  });
});
