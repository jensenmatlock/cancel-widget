import { createHeadline, createButton, createSubheadline, createSelect } from '../domHelpers.js';
import { describe, it, expect } from 'vitest';

describe('domHelpers', () => {
  it('createHeadline returns h2 with text', () => {
    const el = createHeadline('Hello');
    expect(el.tagName).toBe('H2');
    expect(el.textContent).toBe('Hello');
  });

  it('createSubheadline returns p with text', () => {
    const el = createSubheadline('Sub');
    expect(el.tagName).toBe('P');
    expect(el.textContent).toBe('Sub');
  });

  it('createButton assigns label and className', () => {
    const btn = createButton('Go', 'primary', () => {});
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.textContent).toBe('Go');
    expect(btn.className).toBe('primary');
  });

  it('createSelect builds options from values', () => {
    const select = createSelect([1, 2]);
    expect(select.tagName).toBe('SELECT');
    expect(select.children.length).toBe(2);
    expect(select.children[0].value).toBe('1');
    expect(select.children[0].textContent).toBe('1 month');
    expect(select.children[1].textContent).toBe('2 months');
  });

  it('createSelect handles option objects', () => {
    const select = createSelect([
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ]);
    expect(select.children[0].value).toBe('a');
    expect(select.children[0].textContent).toBe('Alpha');
    expect(select.children[1].value).toBe('b');
    expect(select.children[1].textContent).toBe('Beta');
  });
});
