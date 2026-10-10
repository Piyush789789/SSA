import { describe, expect, it } from 'vitest';
import { CLASS_OPTIONS, GENDERS, SOURCES, STATUSES, emptyEnquiry, enquiryBody, enquiryToForm, validateEnquiry } from './enquiryUtils';

const t = (key) => key;
const valid = () => ({ ...emptyEnquiry(), studentName: 'Asha', classSought: '5', parentName: 'Ramesh', phone: '98765 12345' });

describe('validateEnquiry', () => {
  it('accepts a minimal valid form', () => {
    expect(validateEnquiry(valid(), t)).toBe('');
  });

  it.each([
    ['studentName', '   ', 'admissions.errStudent'],
    ['classSought', '', 'admissions.errClass'],
    ['parentName', ' ', 'admissions.errParent'],
    ['phone', '', 'admissions.errPhone'],
    ['phone', '12345', 'admissions.errPhone'],
    ['phone', '98765abcde', 'admissions.errPhone'],
    ['email', 'not-an-email', 'admissions.errEmail'],
    ['email', 'a@b', 'admissions.errEmail'],
  ])('%s = %j -> %s', (field, value, error) => {
    expect(validateEnquiry({ ...valid(), [field]: value }, t)).toBe(error);
  });

  it.each(['+91 98765 12345', '(0522) 123-4567', '  9876512345  '])('accepts phone %s', (phone) => {
    expect(validateEnquiry({ ...valid(), phone }, t)).toBe('');
  });

  it('accepts a valid email, with spaces around it', () => {
    expect(validateEnquiry({ ...valid(), email: '  a.b@school.in ' }, t)).toBe('');
  });
});

describe('enquiryBody / enquiryToForm', () => {
  it('trims and turns blanks into null', () => {
    const body = enquiryBody({ ...valid(), studentName: ' Asha ', email: ' ', address: ' Lucknow ', notes: '' }, { status: 'NEW' });
    expect(body).toEqual({
      studentName: 'Asha',
      dateOfBirth: null,
      gender: null,
      classSought: '5',
      parentName: 'Ramesh',
      phone: '98765 12345',
      email: null,
      address: 'Lucknow',
      previousSchool: null,
      notes: null,
      status: 'NEW',
    });
  });

  it('round-trips a server enquiry with missing fields', () => {
    const form = enquiryToForm({ studentName: 'A', phone: '1', source: null });
    expect(form).toEqual({ ...emptyEnquiry(), studentName: 'A', phone: '1', source: '' });
    expect(Object.keys(form).sort()).toEqual(Object.keys(emptyEnquiry()).sort());
  });

  it('option lists', () => {
    expect(CLASS_OPTIONS).toContain('Nursery');
    expect(CLASS_OPTIONS.every((c) => c.length <= 20)).toBe(true);
    expect(GENDERS).toHaveLength(3);
    expect(SOURCES).toContain(emptyEnquiry().source);
    expect(STATUSES[0]).toBe('NEW');
  });
});
