import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Send, SkipForward } from 'lucide-react';
import { AsyncState } from '@/components/common/AsyncState';
import { fieldClass, textAreaClass } from '@/components/common/Modal';
import { TemplatePicker } from '@/components/whatsapp/WhatsAppComposer';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/translate';
import { MESSAGE_TEMPLATES, familyContacts, fillMessage, openWhatsApp } from '@/utils/whatsapp';

/**
 * WhatsApp a whole class: one message with {name}/{class}/{roll} filled in per student. WhatsApp's free links open
 * one chat at a time, so each row has its own Send button and "Send to next" walks down the list.
 */
export const WhatsAppClassView = ({ classes }) => {
  const { t, lang } = useI18n();
  const { currentUser } = useAuth();
  const [className, setClassName] = useState('');
  const [messageLang, setMessageLang] = useState(lang === 'hi' ? 'hi' : 'en');
  const [templateId, setTemplateId] = useState('update');
  const [text, setText] = useState(MESSAGE_TEMPLATES[0].text[lang === 'hi' ? 'hi' : 'en']);
  const [sent, setSent] = useState({});
  const [skipped, setSkipped] = useState({});

  useEffect(() => {
    if (!className && classes.length) setClassName(classes[0]);
  }, [classes, className]);
  useEffect(() => {
    setSent({});
    setSkipped({});
  }, [className]);

  const settings = useApi('/settings');
  const students = useApi(className ? `/classes/${encodeURIComponent(className)}/students` : null);
  const parents = useApi(currentUser?.role === 'admin' ? '/parents' : null);

  const rows = useMemo(
    () =>
      (students.data || []).map((s) => ({
        student: s,
        contact: familyContacts(s, parents.data || [])[0] || null,
      })),
    [students.data, parents.data],
  );

  const pick = (tpl) => {
    setTemplateId(tpl.id);
    setText(tpl.text[messageLang]);
  };
  const changeLang = (newLang) => {
    setMessageLang(newLang);
    const tpl = MESSAGE_TEMPLATES.find((x) => x.id === templateId);
    if (tpl) setText(tpl.text[newLang]);
  };

  const messageFor = (student) => fillMessage(text, { student, schoolName: settings.data?.schoolName });
  const send = (row) => {
    if (row.contact && openWhatsApp(row.contact.phone, messageFor(row.student))) {
      setSent((s) => ({ ...s, [row.student.id]: true }));
    }
  };
  const next = rows.find((r) => r.contact && !sent[r.student.id] && !skipped[r.student.id]);
  const sentCount = Object.keys(sent).length;
  const reachable = rows.filter((r) => r.contact).length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4 h-fit">
        <div>
          <label className="text-xs font-bold text-slate-500" htmlFor="wa-class">
            {t('wa.class')}
          </label>
          <select id="wa-class" value={className} onChange={(e) => setClassName(e.target.value)} className={`${fieldClass} mt-1`}>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <TemplatePicker templateId={templateId} messageLang={messageLang} onPick={pick} onLang={changeLang} />
        <div>
          <label className="text-xs font-bold text-slate-500" htmlFor="wa-class-message">
            {t('wa.message')}
          </label>
          <textarea
            id="wa-class-message"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`${textAreaClass} mt-1`}
          />
          <p className="text-[11px] text-slate-400 mt-1">{t('wa.placeholdersHint')}</p>
        </div>
        {rows[0] && (
          <div className="rounded-2xl bg-[#E7FFDB] border border-emerald-100 p-3 text-xs text-slate-800 whitespace-pre-wrap">
            <p className="text-[10px] font-bold text-emerald-700 mb-1">{t('wa.previewFor', { name: rows[0].student.name })}</p>
            {messageFor(rows[0].student)}
          </div>
        )}
        <p className="text-[11px] text-slate-400">{t('wa.howItWorksClass')}</p>
      </div>

      <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-900">
            {t('wa.progress', { sent: sentCount, total: reachable })}
          </p>
          <button
            type="button"
            disabled={!next || !text.trim()}
            onClick={() => next && send(next)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5A] px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            {next ? t('wa.sendNext', { name: next.student.name }) : t('wa.allDone')}
          </button>
        </div>

        <AsyncState state={students}>
          {(list) => !list?.length ? (
            <p className="py-10 text-center text-sm text-slate-400">{t('wa.noStudents')}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {rows.map((row) => {
                const { student, contact } = row;
                const done = sent[student.id];
                return (
                  <div key={student.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                        {student.rollNumber != null && <span className="text-xs text-slate-400">#{student.rollNumber}</span>}
                        {student.name}
                        {done && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </p>
                      <p className={`text-xs ${contact ? 'text-slate-500' : 'text-rose-500'}`}>
                        {contact ? `${contact.name} · ${contact.phone}` : t('wa.noPhoneShort')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {contact && !done && !skipped[student.id] && (
                        <button
                          type="button"
                          title={t('wa.skip')}
                          onClick={() => setSkipped((s) => ({ ...s, [student.id]: true }))}
                          className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!contact || !text.trim()}
                        onClick={() => send(row)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          done ? 'bg-emerald-50 text-emerald-700' : 'bg-[#25D366] text-white hover:bg-[#1EBE5A]'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        {done ? t('wa.openAgain') : t('wa.send')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AsyncState>
      </div>
    </div>
  );
};
