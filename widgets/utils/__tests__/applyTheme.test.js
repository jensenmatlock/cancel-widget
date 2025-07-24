import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyTheme } from '../applyTheme.js';

function getStyle(name) {
  return document.documentElement.style.getPropertyValue(name);
}

describe('applyTheme', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.documentElement.style.cssText = '';
  });

  it('loads font and sets variables', () => {
    applyTheme({
      theme_config: {
        font: 'Roboto',
        title_font_color: '#111',
        body_font_color: '#222',
      },
    });

    const link = document.head.querySelector('link');
    expect(link).toBeTruthy();
    link.onload();

    expect(getStyle('--font-family')).toContain('Roboto');
    expect(getStyle('--title-font-color')).toBe('#111');
    expect(getStyle('--body-font-color')).toBe('#222');
  });

  it('falls back to sans-serif when font load times out', () => {
    vi.useFakeTimers();
    applyTheme({ theme_config: { font: 'Foo' } });
    vi.advanceTimersByTime(2500);
    expect(getStyle('--font-family')).toBe('sans-serif');
    vi.useRealTimers();
  });
});
