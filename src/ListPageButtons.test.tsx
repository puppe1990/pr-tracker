import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ListPageButtons } from './ListPageButtons';

describe('ListPageButtons', () => {
  it('renders first and last page actions', () => {
    const html = renderToString(
      <ListPageButtons currentPage={2} totalPages={5} onPageChange={() => {}} />
    );

    expect(html).toContain('Primeira');
    expect(html).toContain('Última');
    expect(html).toContain('Anterior');
    expect(html).toContain('Próxima');
  });

  it('disables first and previous on page 1', () => {
    const html = renderToString(
      <ListPageButtons currentPage={1} totalPages={5} onPageChange={() => {}} />
    );

    expect(html).toMatch(/disabled[^>]*>Primeira/);
    expect(html).toMatch(/disabled[^>]*>Anterior/);
  });

  it('disables next and last on the last page', () => {
    const html = renderToString(
      <ListPageButtons currentPage={5} totalPages={5} onPageChange={() => {}} />
    );

    expect(html).toMatch(/disabled[^>]*>Próxima/);
    expect(html).toMatch(/disabled[^>]*>Última/);
  });

  it('disables last when total pages is unknown', () => {
    const html = renderToString(
      <ListPageButtons currentPage={2} totalPages={null} onPageChange={() => {}} />
    );

    expect(html).toMatch(/disabled[^>]*>Última/);
  });
});
