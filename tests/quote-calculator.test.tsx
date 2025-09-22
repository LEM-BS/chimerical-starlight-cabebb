import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import QuoteCalculator from '../src/components/QuoteCalculator';

describe('QuoteCalculator extension handling', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(<QuoteCalculator />);
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test('applies extended complexity when extension status is yes without details', async () => {
    const extensionSelect = container.querySelector<HTMLSelectElement>('#extension-status');
    expect(extensionSelect).not.toBeNull();

    const initialDisclaimer = container.querySelector<HTMLParagraphElement>(
      '.lem-quote-calculator__disclaimer',
    );
    expect(initialDisclaimer?.textContent).toContain('standard construction');

    await act(async () => {
      extensionSelect!.value = 'yes';
      extensionSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const updatedDisclaimer = container.querySelector<HTMLParagraphElement>(
      '.lem-quote-calculator__disclaimer',
    );
    expect(updatedDisclaimer?.textContent).toContain('extended or converted');
  });

  test('prevents submission when extension is yes without details', async () => {
    const nameInput = container.querySelector<HTMLInputElement>('#contact-name');
    const emailInput = container.querySelector<HTMLInputElement>('#contact-email');
    const extensionSelect = container.querySelector<HTMLSelectElement>('#extension-status');
    const form = container.querySelector<HTMLFormElement>('form');

    expect(nameInput && emailInput && extensionSelect && form).not.toBeNull();

    await act(async () => {
      nameInput!.value = 'Test User';
      nameInput!.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput!.value = 'test@example.com';
      emailInput!.dispatchEvent(new Event('input', { bubbles: true }));
      extensionSelect!.value = 'yes';
      extensionSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const originalFetch = globalThis.fetch;
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) } as unknown as Response);
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    try {
      await act(async () => {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form!.dispatchEvent(submitEvent);
      });

      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

