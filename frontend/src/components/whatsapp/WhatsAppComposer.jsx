import React, { useMemo, useState } from 'react';
import { MessageCircle, Send, Phone } from 'lucide-react';
import { Modal, textAreaClass } from '@/components/common/Modal';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/translate';
import { MESSAGE_TEMPLATES, familyContacts, fillMessage, openWhatsApp } from '@/utils/whatsapp';

/** Template chips and the English / हिन्दी message-language switch, shared by the single and class composers. */
export const TemplatePicker = ({ templateId, messageLang, onPick, onLang }) => {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-500">{t('wa.templates')}</span>
        <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold">
          {[
            ['en', 'English'],
            ['hi', 'हिन्दी'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onLang(id)}
              className={`px-3 py-1.5 cursor-pointer ${messageLang === id ? 'bg-[#25D366] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {MESSAGE_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onPick(tpl)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-colors ${
              templateId === tpl.id
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tpl.label[messageLang]}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * "Send WhatsApp" dialog for one student: pick a ready-made message (English or Hindi), edit it, and open WhatsApp
 * with it for the guardian or a linked parent. Free: it uses WhatsApp's click-to-chat link, the sender presses Send.
 */
export const WhatsAppComposer = ({ student, onClose }) => {
  const { t, lang } = useI18n();
  const { currentUser } = useAuth();
  const settings = useApi('/settings');
  // Linked parent records are only readable by admins; teachers use the guardian on the student record.
  const parents = useApi(currentUser?.role === 'admin' ? '/parents' : null);
  const [messageLang, setMessageLang] = useState(lang === 'hi' ? 'hi' : 'en');
  const [templateId, setTemplateId] = useState('update');
  const [text, setText] = useState(MESSAGE_TEMPLATES[0].text[lang === 'hi' ? 'hi' : 'en']);
  const [sentTo, setSentTo] = useState([]);
  const [error, setError] = useState('');

  const contacts = useMemo(() => familyContacts(student, parents.data || []), [student, parents.data]);
  const message = fillMessage(text, { student, schoolName: settings.data?.schoolName });

  const pick = (tpl, newLang = messageLang) => {
    setTemplateId(tpl.id);
    setText(tpl.text[newLang]);
  };
  const changeLang = (newLang) => {
    setMessageLang(newLang);
    const tpl = MESSAGE_TEMPLATES.find((x) => x.id === templateId);
    if (tpl) setText(tpl.text[newLang]);
  };

  const send = (contact) => {
    setError('');
    if (!message.trim()) {
      setError(t('wa.emptyMessage'));
      return;
    }
    if (openWhatsApp(contact.phone, message)) {
      setSentTo((list) => (list.includes(contact.phone) ? list : [...list, contact.phone]));
    } else {
      setError(t('wa.badNumber', { phone: contact.phone }));
    }
  };

  return (
    <Modal
      title={t('wa.sendTitle', { name: student.name })}
      subtitle={t('wa.sendSubtitle', { className: student.className })}
      icon={MessageCircle}
      onClose={onClose}
      size="lg"
    >
      <TemplatePicker templateId={templateId} messageLang={messageLang} onPick={pick} onLang={changeLang} />

      <div>
        <label className="text-xs font-bold text-slate-500" htmlFor="wa-message">
          {t('wa.message')}
        </label>
        <textarea
          id="wa-message"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${textAreaClass} mt-1`}
        />
        <p className="text-[11px] text-slate-400 mt-1">{t('wa.placeholdersHint')}</p>
      </div>

      <div className="rounded-2xl bg-[#E7FFDB] border border-emerald-100 p-3 text-xs text-slate-800 whitespace-pre-wrap">
        {message}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500">{t('wa.sendTo')}</p>
        {contacts.length === 0 ? (
          <p className="text-xs text-rose-600">{t('wa.noPhone')}</p>
        ) : (
          contacts.map((c) => (
            <div key={c.phone} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {c.name} <span className="text-xs font-medium text-slate-400">({c.relation})</span>
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {c.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => send(c)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5A] px-4 py-2 text-xs font-bold text-white cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                {sentTo.includes(c.phone) ? t('wa.openAgain') : t('wa.openWhatsApp')}
              </button>
            </div>
          ))
        )}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
      <p className="text-[11px] text-slate-400">{t('wa.howItWorks')}</p>
    </Modal>
  );
};

/** Green "WhatsApp" button that opens the composer for a student. */
export const WhatsAppButton = ({ student }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
      >
        <MessageCircle className="w-4 h-4" /> {t('wa.button')}
      </button>
      {open && <WhatsAppComposer student={student} onClose={() => setOpen(false)} />}
    </>
  );
};
