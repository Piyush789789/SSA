import React from 'react';
import { FormField, fieldClass, textAreaClass } from '@/components/common/Modal';
import { todayIso } from '@/utils';
import { useI18n } from '@/i18n/translate';
import { CLASS_OPTIONS, GENDERS, SOURCES } from './enquiryUtils';

/** The enquiry fields. `withSource` adds the source select (office entries). */
export const EnquiryFields = ({ form, setForm, withSource = false }) => {
  const { t } = useI18n();
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label={t('admissions.studentName')} required>
        <input value={form.studentName} onChange={set('studentName')} maxLength={100} className={fieldClass} autoComplete="off" />
      </FormField>
      <FormField label={t('admissions.classSought')} required>
        <select value={form.classSought} onChange={set('classSought')} className={`${fieldClass} cursor-pointer`}>
          <option value="">{t('admissions.chooseClass')}</option>
          {[...new Set([...CLASS_OPTIONS, form.classSought].filter(Boolean))].map((c) => (
            <option key={c} value={c}>
              {/^\d+$/.test(c) ? `${t('common.class')} ${c}` : c}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('admissions.dob')}>
        <input type="date" max={todayIso()} value={form.dateOfBirth} onChange={set('dateOfBirth')} className={fieldClass} />
      </FormField>
      <FormField label={t('admissions.gender')}>
        <select value={form.gender} onChange={set('gender')} className={`${fieldClass} cursor-pointer`}>
          <option value="">—</option>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('admissions.parentName')} required>
        <input value={form.parentName} onChange={set('parentName')} maxLength={100} className={fieldClass} />
      </FormField>
      <FormField label={t('admissions.phone')} required>
        <input type="tel" value={form.phone} onChange={set('phone')} maxLength={20} placeholder="98765 43210" className={fieldClass} />
      </FormField>
      <FormField label={t('admissions.email')}>
        <input type="email" value={form.email} onChange={set('email')} className={fieldClass} />
      </FormField>
      <FormField label={t('admissions.previousSchool')}>
        <input value={form.previousSchool} onChange={set('previousSchool')} maxLength={100} className={fieldClass} />
      </FormField>
      <FormField label={t('admissions.address')} className="sm:col-span-2">
        <textarea rows={2} value={form.address} onChange={set('address')} maxLength={300} className={textAreaClass} />
      </FormField>
      {withSource && (
        <FormField label={t('admissions.source')}>
          <select value={form.source} onChange={set('source')} className={`${fieldClass} cursor-pointer`}>
            {[...new Set([...SOURCES, form.source].filter(Boolean))].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormField>
      )}
      <FormField label={t('admissions.notes')} className={withSource ? '' : 'sm:col-span-2'}>
        <textarea rows={2} value={form.notes} onChange={set('notes')} maxLength={2000} className={textAreaClass} />
      </FormField>
    </div>
  );
};
