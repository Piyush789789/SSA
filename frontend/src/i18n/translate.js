import { createContext, useContext } from 'react';
import common from './dict/common';
import nav from './dict/nav';
import campus from './dict/campus';
import pages from './dict/pages';
import library from './dict/library';
import ptm from './dict/ptm';
import gallery from './dict/gallery';
import whatsapp from './dict/whatsapp';

/**
 * A small homemade i18n. Each module in ./dict exports `{ en: {key: text}, hi: {key: text} }`; they are merged
 * here. `t('nav.attendance')` looks the key up in the current language, then English, then returns the key.
 * `tx('Attendance')` translates by the English text itself (handy for labels passed around as strings, e.g. page
 * titles), and returns the text unchanged when no Hindi entry exists. Data from the server is never translated.
 */
const MODULES = [common, nav, campus, pages, library, ptm, gallery, whatsapp];

export const LANGUAGES = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'hi', label: 'हिन्दी', short: 'हिं' },
];

export const DICTIONARIES = MODULES.reduce(
  (all, mod) => ({ en: { ...all.en, ...mod.en }, hi: { ...all.hi, ...mod.hi } }),
  { en: {}, hi: {} },
);

// English text -> key, so tx('Save') finds 'common.save'. The first key with a given text wins.
const KEY_BY_ENGLISH = Object.entries(DICTIONARIES.en).reduce((index, [key, text]) => {
  if (!(text in index)) index[text] = key;
  return index;
}, {});

const interpolate = (text, vars) =>
  vars ? String(text).replace(/\{(\w+)\}/g, (match, name) => (vars[name] != null ? String(vars[name]) : match)) : text;

/** Translation of `key` in `lang`, falling back to English, then `fallback`, then the key itself. */
export const translate = (lang, key, vars, fallback) => {
  const text = DICTIONARIES[lang]?.[key] ?? DICTIONARIES.en[key] ?? fallback ?? key;
  return interpolate(text, vars);
};

/** Hindi (or other) version of an English text that is in the dictionaries; otherwise the text as given. */
export const translateText = (lang, text, vars) => {
  if (text == null || typeof text !== 'string') return text;
  if (lang === 'en') return interpolate(text, vars);
  const key = KEY_BY_ENGLISH[text];
  return interpolate((key && DICTIONARIES[lang]?.[key]) || text, vars);
};

export const LANG_STORAGE_KEY = 'ssa_language';

export const I18nContext = createContext(null);

const ENGLISH = {
  lang: 'en',
  setLang: () => {},
  t: (key, vars, fallback) => translate('en', key, vars, fallback),
  tx: (text, vars) => translateText('en', text, vars),
};

/** `{ lang, setLang, t, tx }`. Outside the provider it answers in English. */
export const useI18n = () => useContext(I18nContext) ?? ENGLISH;
