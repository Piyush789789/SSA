import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { DICTIONARIES, LANGUAGES, translate, translateText, useI18n } from './translate';
import common from './dict/common';
import nav from './dict/nav';
import campus from './dict/campus';
import pages from './dict/pages';
import library from './dict/library';
import ptm from './dict/ptm';
import gallery from './dict/gallery';
import whatsapp from './dict/whatsapp';

const MODULES = { common, nav, campus, pages, library, ptm, gallery, whatsapp };
const placeholders = (text) => (String(text).match(/\{\w+\}/g) || []).sort();

describe('dictionaries', () => {
  it.each(Object.entries(MODULES))('%s has the same keys in en and hi', (_name, mod) => {
    const en = Object.keys(mod.en).sort();
    const hi = Object.keys(mod.hi).sort();
    expect(hi.filter((k) => !(k in mod.en))).toEqual([]); // Hindi keys with no English
    expect(en.filter((k) => !(k in mod.hi))).toEqual([]); // missing Hindi
  });

  it.each(Object.entries(MODULES))('%s: Hindi uses the same {placeholders} as English', (_name, mod) => {
    const mismatched = Object.keys(mod.en).filter(
      (k) => k in mod.hi && placeholders(mod.en[k]).join() !== placeholders(mod.hi[k]).join(),
    );
    expect(mismatched).toEqual([]);
  });

  it.each(Object.entries(MODULES))('%s: no empty translations', (_name, mod) => {
    const empty = [...Object.entries(mod.en), ...Object.entries(mod.hi)].filter(
      ([, v]) => typeof v !== 'string' || !v.trim(),
    );
    expect(empty).toEqual([]);
  });

  it('no key is defined by two modules (later modules would silently overwrite earlier ones)', () => {
    const owner = {};
    const clashes = [];
    Object.entries(MODULES).forEach(([name, mod]) => {
      Object.keys(mod.en).forEach((key) => {
        if (owner[key]) clashes.push(`${key} (${owner[key]} & ${name})`);
        owner[key] = name;
      });
    });
    expect(clashes).toEqual([]);
  });

  it('merged dictionaries have the same size in both languages', () => {
    expect(Object.keys(DICTIONARIES.hi).length).toBe(Object.keys(DICTIONARIES.en).length);
    expect(LANGUAGES.map((l) => l.id)).toEqual(['en', 'hi']);
  });
});

describe('translate', () => {
  const someKey = Object.keys(DICTIONARIES.en)[0];

  it('looks the key up in the language', () => {
    expect(translate('hi', someKey)).toBe(DICTIONARIES.hi[someKey]);
    expect(translate('en', someKey)).toBe(DICTIONARIES.en[someKey]);
  });

  it('falls back to English, then the fallback, then the key', () => {
    expect(translate('fr', someKey)).toBe(DICTIONARIES.en[someKey]);
    expect(translate('hi', 'no.such.key', undefined, 'Fallback')).toBe('Fallback');
    expect(translate('hi', 'no.such.key')).toBe('no.such.key');
  });

  it('interpolates variables, including 0 and empty strings', () => {
    expect(translate('en', 'x', { count: 3 }, '{count} pending')).toBe('3 pending');
    expect(translate('en', 'x', { count: 0 }, '{count} pending')).toBe('0 pending');
    expect(translate('en', 'x', { name: '' }, 'Hi {name}!')).toBe('Hi !');
    expect(translate('en', 'x', { other: 1 }, '{count} pending')).toBe('{count} pending');
    expect(translate('en', 'x', { count: null }, '{count} pending')).toBe('{count} pending');
    expect(translate('en', 'x', { a: 'A', b: 'B' }, '{a}{b}{a}')).toBe('ABA');
  });

  it('interpolates real dictionary entries', () => {
    expect(translate('en', 'wa.badNumber', { phone: '123' })).toContain('123');
    expect(translate('hi', 'wa.badNumber', { phone: '123' })).toContain('123');
  });
});

describe('translateText (tx)', () => {
  it('translates English text that is in the dictionary', () => {
    const [key, english] = Object.entries(DICTIONARIES.en).find(([k, v]) => DICTIONARIES.hi[k] !== v && !/\{/.test(v));
    expect(translateText('hi', english)).toBe(DICTIONARIES.hi[key]);
    expect(translateText('en', english)).toBe(english);
  });

  it('returns unknown text unchanged and interpolates it', () => {
    expect(translateText('hi', 'Some server text')).toBe('Some server text');
    expect(translateText('hi', '{count} rows', { count: 0 })).toBe('0 rows');
    expect(translateText('en', '{count} rows', { count: 2 })).toBe('2 rows');
  });

  it('passes non-strings through', () => {
    expect(translateText('hi', null)).toBeNull();
    expect(translateText('hi', undefined)).toBeUndefined();
    expect(translateText('hi', 42)).toBe(42);
  });
});

describe('useI18n outside the provider', () => {
  it('answers in English', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.lang).toBe('en');
    expect(result.current.t('no.key', { n: 0 }, 'n={n}')).toBe('n=0');
    expect(result.current.tx('Hello')).toBe('Hello');
    expect(() => result.current.setLang('hi')).not.toThrow();
  });
});
