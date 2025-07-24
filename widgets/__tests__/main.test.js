import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../configLoader.js', () => ({
  loadConfig: vi.fn(() => Promise.resolve({}))
}));
vi.mock('../utils/configHelpers.js', () => ({
  getUserContext: vi.fn(() => Promise.resolve({}))
}));
vi.mock('../injectedStyles.js', () => ({
  widgetStyles: ''
}));
vi.mock('../utils/validateCustomer.js', () => ({
  validateCustomer: vi.fn(() => Promise.resolve({ valid: true }))
}));
vi.mock('../cancel/index.js', () => ({
  loadCancelFlow: vi.fn()
}));
vi.mock('../banner/index.js', () => ({
  loadBannerWidget: vi.fn()
}));

import { loadCancelFlow } from '../cancel/index.js';
import { loadBannerWidget } from '../banner/index.js';

let getAccountId, isPreviewMode, getWidgetToRender;

async function importMain() {
  const mod = await import('../main.js');
  ({ getAccountId, isPreviewMode, getWidgetToRender } = mod);
}

describe('main helpers', () => {
  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: new URL('https://example.com/'),
      writable: true,
    });
    delete window.__widget_account_id;
    await importMain();
  });

  it('reads account id from script attribute', () => {
    const script = document.createElement('script');
    script.dataset.accountId = '123';
    document.body.appendChild(script);
    expect(getAccountId()).toBe('123');
  });

  it('reads account id from global variable', () => {
    window.__widget_account_id = '456';
    expect(getAccountId()).toBe('456');
  });

  it('reads account id from URL parameter', () => {
    Object.defineProperty(window, 'location', {
      value: new URL('https://example.com/?account_id=789'),
      writable: true,
    });
    expect(getAccountId()).toBe('789');
  });

  it('isPreviewMode reads previewMode param', () => {
    Object.defineProperty(window, 'location', {
      value: new URL('https://example.com/?previewMode=true'),
      writable: true,
    });
    expect(isPreviewMode()).toBe(true);
  });

  it('getWidgetToRender defaults to cancel', () => {
    expect(getWidgetToRender()).toBe('cancel');
  });

  it('getWidgetToRender reads widget param', () => {
    Object.defineProperty(window, 'location', {
      value: new URL('https://example.com/?widget=banner'),
      writable: true,
    });
    expect(getWidgetToRender()).toBe('banner');
  });
});

describe('DOMContentLoaded triggers widget load', () => {
  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      value: new URL('https://example.com/?account_id=1'),
      writable: true,
    });
    await importMain();
    vi.clearAllMocks();
  });

  it('loads cancel widget by default', async () => {
    window.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(setImmediate);
    expect(loadCancelFlow).toHaveBeenCalled();
    expect(loadBannerWidget).not.toHaveBeenCalled();
  });

  it('loads banner widget when widget param is banner', async () => {
    Object.defineProperty(window, 'location', {
      value: new URL('https://example.com/?account_id=1&widget=banner'),
      writable: true,
    });
    await importMain();
    window.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(setImmediate);
    expect(loadBannerWidget).toHaveBeenCalled();
    expect(loadCancelFlow).not.toHaveBeenCalled();
  });
});
