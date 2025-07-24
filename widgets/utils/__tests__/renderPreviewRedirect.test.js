import { describe, it, expect, beforeEach } from 'vitest';
import { renderPreviewRedirect } from '../renderHelpers.js';

describe('renderPreviewRedirect', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="widget-container"></div>';
  });

  it('renders URL preview message', () => {
    renderPreviewRedirect('https://foo.com');
    const text = document.querySelector('#widget-container').textContent;
    expect(text).toMatch('https://foo.com');
  });

  it('renders payment gateway preview message', () => {
    renderPreviewRedirect(null, 'Payment Gateway', 'stripe', 'pause');
    const html = document.querySelector('#widget-container').innerHTML;
    expect(html).toMatch('Stripe');
    expect(html).toMatch('pause');
  });
});
