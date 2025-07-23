import { createHeadline, createButton } from '../domHelpers.js';
import { describe, it, expect } from 'vitest';

describe('domHelpers', () => {
  it('createHeadline returns h2 with text', () => {
    const el = createHeadline('Hello');
    expect(el.tagName).toBe('H2');
    expect(el.textContent).toBe('Hello');
  });

  it('createButton assigns label and className', () => {
    const btn = createButton('Go', 'primary', () => {});
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.textContent).toBe('Go');
    expect(btn.className).toBe('primary');
  });
});
