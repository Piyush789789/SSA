import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@/i18n/I18nProvider';
import { LANG_STORAGE_KEY } from '@/i18n/translate';
import { apiState } from '@/test/render';
import { AsyncState, EmptyMessage, ErrorMessage, LoadingMessage } from './AsyncState';

describe('AsyncState', () => {
  it('shows the loading message', () => {
    render(<AsyncState state={apiState({ loading: true })}>{() => 'done'}</AsyncState>);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('done')).not.toBeInTheDocument();
  });

  it('shows a custom loading text', () => {
    render(<AsyncState state={apiState({ loading: true })} loadingText="Loading students…" />);
    expect(screen.getByText('Loading students…')).toBeInTheDocument();
  });

  it('shows the error with a retry button that reloads', async () => {
    const reload = vi.fn();
    render(<AsyncState state={apiState({ error: new Error('Server down'), reload })}>{() => 'done'}</AsyncState>);
    expect(screen.getByText('Server down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('keeps showing stale data when a reload fails', () => {
    render(
      <AsyncState state={apiState({ data: [1, 2], error: new Error('Server down') })}>
        {(list) => `items: ${list.length}`}
      </AsyncState>,
    );
    expect(screen.getByText('items: 2')).toBeInTheDocument();
  });

  it('passes the data to a render function, or renders plain children', () => {
    const { rerender } = render(<AsyncState state={apiState({ data: { n: 3 } })}>{(d) => `n=${d.n}`}</AsyncState>);
    expect(screen.getByText('n=3')).toBeInTheDocument();
    rerender(
      <AsyncState state={apiState({ data: {} })}>
        <p>plain</p>
      </AsyncState>,
    );
    expect(screen.getByText('plain')).toBeInTheDocument();
  });

  it('waits for every state in an array and retries all of them', async () => {
    const r1 = vi.fn();
    const r2 = vi.fn();
    const { rerender } = render(
      <AsyncState state={[apiState({ data: 1 }), apiState({ loading: true })]}>{([a, b]) => `${a}+${b}`}</AsyncState>,
    );
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    rerender(<AsyncState state={[apiState({ data: 1 }), apiState({ data: 2 })]}>{([a, b]) => `${a}+${b}`}</AsyncState>);
    expect(screen.getByText('1+2')).toBeInTheDocument();

    rerender(
      <AsyncState state={[apiState({ data: 1, reload: r1 }), apiState({ error: new Error('Boom'), reload: r2 })]}>
        {() => 'x'}
      </AsyncState>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(r1).toHaveBeenCalled();
    expect(r2).toHaveBeenCalled();
  });

  it('an error wins over loading', () => {
    render(<AsyncState state={[apiState({ loading: true }), apiState({ error: new Error('Nope') })]} />);
    expect(screen.getByText('Nope')).toBeInTheDocument();
  });

  it('translates the loading text and retry label in Hindi', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'hi');
    render(
      <I18nProvider>
        <LoadingMessage />
        <ErrorMessage error={new Error('x')} onRetry={() => {}} />
      </I18nProvider>,
    );
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('ErrorMessage without retry, and with no error message', () => {
    render(<ErrorMessage error={null} />);
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('EmptyMessage shows its text', () => {
    render(<EmptyMessage text="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
