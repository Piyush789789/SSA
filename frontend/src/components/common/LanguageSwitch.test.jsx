import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@/i18n/I18nProvider';
import { LANG_STORAGE_KEY, useI18n } from '@/i18n/translate';
import { LanguageSwitch } from './LanguageSwitch';

const Sample = () => {
  const { t, lang } = useI18n();
  return (
    <p data-testid="sample" data-lang={lang}>
      {t('common.tryAgain')}
    </p>
  );
};

const renderSwitch = () =>
  render(
    <I18nProvider>
      <LanguageSwitch />
      <Sample />
    </I18nProvider>,
  );

describe('LanguageSwitch', () => {
  it('starts in English and marks it pressed', () => {
    renderSwitch();
    expect(screen.getByRole('button', { name: /English/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /हिन्दी/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('sample')).toHaveTextContent('Try again');
    expect(document.documentElement.lang).toBe('en');
  });

  it('switches to Hindi, translates and saves the choice', async () => {
    renderSwitch();
    await userEvent.click(screen.getByRole('button', { name: /हिन्दी/ }));
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('hi');
    expect(screen.getByTestId('sample')).toHaveAttribute('data-lang', 'hi');
    expect(screen.getByTestId('sample')).not.toHaveTextContent('Try again');
    expect(screen.getByRole('button', { name: /हिन्दी/ })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.lang).toBe('hi');

    await userEvent.click(screen.getByRole('button', { name: /English/ }));
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');
    expect(screen.getByTestId('sample')).toHaveTextContent('Try again');
  });

  it('restores the saved language on the next visit', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'hi');
    renderSwitch();
    expect(screen.getByTestId('sample')).toHaveAttribute('data-lang', 'hi');
  });

  it('ignores an unknown saved language', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'fr');
    renderSwitch();
    expect(screen.getByTestId('sample')).toHaveAttribute('data-lang', 'en');
  });

  it('still switches when storage is blocked', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderSwitch();
    await userEvent.click(screen.getByRole('button', { name: /हिन्दी/ }));
    expect(screen.getByTestId('sample')).toHaveAttribute('data-lang', 'hi');
    spy.mockRestore();
  });
});
