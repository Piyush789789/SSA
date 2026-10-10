import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider } from '@/i18n/I18nProvider';
import { LANG_STORAGE_KEY } from '@/i18n/translate';

/** Shows the current path, so tests can assert on navigation. */
export const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

/**
 * Renders `ui` inside the app's I18nProvider and a MemoryRouter at `route`. With `path`, the element is mounted
 * on that route pattern (for useParams); every other path renders the location probe.
 */
export function renderWithProviders(ui, { route = '/', path, lang, state } = {}) {
  if (lang) localStorage.setItem(LANG_STORAGE_KEY, lang);
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[state ? { pathname: route, state } : route]}>
        <Routes>
          <Route path={path ?? route} element={ui} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
}

/** A useApi()-shaped state for AsyncState tests. */
export const apiState = (overrides = {}) => ({ data: null, error: null, loading: false, reload: () => {}, ...overrides });
