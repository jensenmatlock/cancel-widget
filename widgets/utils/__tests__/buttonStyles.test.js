import { describe, it, expect } from 'vitest';
import { getButtonClass } from '../buttonStyles.js';

describe('getButtonClass', () => {
  it('builds classes for outline pill secondary', () => {
    const config = { theme_config: { button_style: 'outline', button_corners: 'pill' } };
    expect(getButtonClass('secondary', config)).toBe('cta-secondary outline pill-btn');
  });

  it('defaults to fill rounded primary', () => {
    expect(getButtonClass('primary', {})).toBe('cta-primary  rounded-btn');
  });
});
