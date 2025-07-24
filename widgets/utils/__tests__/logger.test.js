import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../supabaseClient.js', () => {
  const insertMock = vi.fn();
  const fromMock = vi.fn(() => ({ insert: insertMock }));
  return { supabase: { from: fromMock }, __mocks: { insertMock, fromMock } };
});

import { supabase, __mocks } from '../../supabaseClient.js';
import { logEvent } from '../logger.js';

const { insertMock, fromMock } = __mocks;

describe('logEvent', () => {
  beforeEach(() => {
    insertMock.mockReset();
    fromMock.mockClear();
  });

  it('logs event to Supabase', async () => {
    insertMock.mockResolvedValue({ data: 'ok' });

    await logEvent({ accountId: 'a', step: 's', reasonKey: 'r', config: {} });

    expect(fromMock).toHaveBeenCalledWith('event_logs');
    expect(insertMock).toHaveBeenCalled();
  });

  it('handles insert errors gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    insertMock.mockRejectedValue(new Error('fail'));

    await logEvent({ accountId: 'a', step: 's', reasonKey: 'r', config: {} });

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('skips logging in preview mode', async () => {
    await logEvent({ accountId: 'a', step: 's', reasonKey: 'r', config: { preview: true } });
    expect(fromMock).not.toHaveBeenCalled();
  });
});
