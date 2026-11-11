import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PageHead } from './PageHead';

describe('PageHead', () => {
  beforeEach(() => {
    document.title = 'Default Title';
    const existingMeta = document.querySelector('meta[name="description"]');
    if (existingMeta?.parentNode) {
      existingMeta.parentNode.removeChild(existingMeta);
    }
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical?.parentNode) {
      existingCanonical.parentNode.removeChild(existingCanonical);
    }
  });

  it('updates document title with Civix suffix', () => {
    const { unmount } = render(<PageHead title="Catálogo de Empresas" />);

    expect(document.title).toBe('Catálogo de Empresas | Civix');

    unmount();
    expect(document.title).toBe('Default Title');
  });

  it('updates meta description and restores on unmount', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Initial description');
    document.head.appendChild(meta);

    const { unmount } = render(
      <PageHead title="Catálogo" description="Descrição customizada para catálogo." />,
    );

    expect(
      document.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe('Descrição customizada para catálogo.');

    unmount();
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe('Initial description');
  });

  it('updates canonical link tag and cleans up created elements', () => {
    const { unmount } = render(
      <PageHead title="Termos" canonicalPath="/termos-de-uso" />,
    );

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://civix.com.br/termos-de-uso',
    );

    unmount();
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });
});
