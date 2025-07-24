import { describe, it, expect, vi } from 'vitest';
import { getCopy } from '../getCopy.js';

describe('getCopy', () => {
  it('retrieves nested keys', () => {
    const config = {
      copy: {
        success: {
          plan_switch: { headline: 'Switched!' }
        }
      }
    };
    const result = getCopy('success.plan_switch.headline', config);
    expect(result).toBe('Switched!');
  });

  it('returns missing copy message and logs error when path invalid', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const config = { copy: { section: {} } };
    const result = getCopy('section.missing.key', config);
    expect(result).toBe('[missing-copy:section.missing.key]');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
