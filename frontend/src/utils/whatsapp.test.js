import { afterEach, describe, expect, it, vi } from 'vitest';
import { MESSAGE_TEMPLATES, familyContacts, fillMessage, normalizePhone, openWhatsApp, whatsappLink } from './whatsapp';

describe('normalizePhone', () => {
  it.each([
    ['9876512345', '919876512345'],
    ['98765 12345', '919876512345'],
    ['98765-12345', '919876512345'],
    ['(98765) 12345', '919876512345'],
    ['+91 98765 12345', '919876512345'],
    ['+91-98765-12345', '919876512345'],
    ['+919876512345', '919876512345'],
    ['919876512345', '919876512345'],
    ['91 9876512345', '919876512345'],
    ['098765 12345', '919876512345'],
    ['09876512345', '919876512345'],
    ['0091 98765 12345', '919876512345'],
    ['00919876512345', '919876512345'],
    ['+91 098765 12345', '919876512345'],
    ['+91-0-9876512345', '919876512345'],
    [9876512345, '919876512345'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it('keeps foreign numbers with a country code', () => {
    expect(normalizePhone('+44 20 7946 0958')).toBe('442079460958');
    expect(normalizePhone('+1 (415) 555-2671')).toBe('14155552671');
  });

  it.each([null, undefined, '', '12345', 'abc', '98765', '+91', '1234567890123456'])('rejects %s', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe('whatsappLink / openWhatsApp', () => {
  afterEach(() => vi.restoreAllMocks());

  it('builds a wa.me link with an encoded message', () => {
    expect(whatsappLink('98765 12345', 'Hello & welcome\nLine 2 #1 ?')).toBe(
      'https://wa.me/919876512345?text=Hello%20%26%20welcome%0ALine%202%20%231%20%3F',
    );
  });

  it('encodes Hindi text', () => {
    expect(whatsappLink('9876512345', 'नमस्ते')).toBe(`https://wa.me/919876512345?text=${encodeURIComponent('नमस्ते')}`);
  });

  it('handles a missing message and a bad number', () => {
    expect(whatsappLink('9876512345')).toBe('https://wa.me/919876512345?text=');
    expect(whatsappLink('123', 'hi')).toBeNull();
  });

  it('opens a new window only for usable numbers', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    expect(openWhatsApp('+91 98765 12345', 'Hi')).toBe(true);
    expect(open).toHaveBeenCalledWith('https://wa.me/919876512345?text=Hi', '_blank', 'noopener,noreferrer');
    expect(openWhatsApp('', 'Hi')).toBe(false);
    expect(open).toHaveBeenCalledTimes(1);
  });
});

describe('familyContacts', () => {
  const student = {
    id: 'STU-1',
    name: 'Asha',
    guardian: { name: 'Ramesh', relation: 'Father', phone: '+91 98765 12345' },
  };

  it('lists the guardian and linked parents, skipping duplicates by normalized number', () => {
    const parents = [
      { name: 'Ramesh K', relation: 'Father', phone: '09876512345', childIds: ['STU-1'] },
      { name: 'Sita', relation: 'Mother', phone: '9876500000', childIds: ['STU-1', 'STU-2'] },
      { name: 'Other', phone: '9000000000', childIds: ['STU-2'] },
      { name: 'No kids', phone: '9111111111' },
    ];
    expect(familyContacts(student, parents)).toEqual([
      { name: 'Ramesh', relation: 'Father', phone: '+91 98765 12345' },
      { name: 'Sita', relation: 'Mother', phone: '9876500000' },
    ]);
  });

  it('uses default names and relations and skips unusable numbers', () => {
    const s = { id: 'S', guardian: { phone: '9876512345' } };
    const parents = [{ phone: 'n/a', childIds: ['S'] }, { phone: '9876500001', childIds: ['S'] }];
    expect(familyContacts(s, parents)).toEqual([
      { name: 'Parent', relation: 'Guardian', phone: '9876512345' },
      { name: 'Parent', relation: 'Parent', phone: '9876500001' },
    ]);
  });

  it('copes with no student, no guardian and no parents', () => {
    expect(familyContacts(null)).toEqual([]);
    expect(familyContacts({ id: 'X' })).toEqual([]);
    expect(familyContacts({ id: 'X', guardian: { phone: '' } }, undefined)).toEqual([]);
  });
});

describe('fillMessage', () => {
  const student = { name: 'Asha Verma', className: '5-B', rollNumber: 0 };

  it('fills every placeholder, including roll number 0', () => {
    expect(
      fillMessage('{name} {class} {roll} {school} {date}', { student, schoolName: 'SSA', date: '10/10/2026' }),
    ).toBe('Asha Verma 5-B 0 SSA 10/10/2026');
  });

  it('fills repeated placeholders and leaves unknown ones', () => {
    expect(fillMessage('{name}/{name} {unknown} {Name}', { student })).toBe('Asha Verma/Asha Verma {unknown} {Name}');
  });

  it('keeps placeholders for missing student fields and defaults the school', () => {
    expect(fillMessage('{name} {class} {roll} — {school}', { student: {} })).toBe('{name} {class} {roll} — School Office');
  });

  it("defaults the date to today's date", () => {
    expect(fillMessage('{date}', {})).toBe(new Date().toLocaleDateString('en-IN'));
  });

  it('handles empty text', () => {
    expect(fillMessage(null, {})).toBe('');
    expect(fillMessage(undefined, {})).toBe('');
  });

  it('is not confused by $ patterns in names', () => {
    expect(fillMessage('Hi {name}', { student: { name: "$& $1 $'" } })).toBe("Hi $& $1 $'");
  });

  it('every template exists in English and Hindi with the same placeholders', () => {
    MESSAGE_TEMPLATES.forEach((tpl) => {
      expect(tpl.label.en && tpl.label.hi).toBeTruthy();
      const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort();
      expect(placeholders(tpl.text.hi)).toEqual(placeholders(tpl.text.en));
    });
    expect(new Set(MESSAGE_TEMPLATES.map((t) => t.id)).size).toBe(MESSAGE_TEMPLATES.length);
  });
});
