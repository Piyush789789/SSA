import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { I18nContext, LANG_STORAGE_KEY, translate, translateText } from './translate';

const readSavedLanguage = () => {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
};

/** Holds the chosen language (English / हिन्दी), saved in this browser. */
export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(readSavedLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    const value = next === 'hi' ? 'hi' : 'en';
    setLangState(value);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, value);
    } catch {
      // Private mode or blocked storage: the choice lasts for this visit only.
    }
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key, vars, fallback) => translate(lang, key, vars, fallback),
      tx: (text, vars) => translateText(lang, text, vars),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export default I18nProvider;
