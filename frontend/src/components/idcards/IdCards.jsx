import React, { useState } from 'react';
import { GraduationCap, IdCard as IdCardIcon, Users } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { PrintButton } from '@/components/common/PrintButton';
import { ProtectedImage } from '@/components/common/ProtectedImage';
import { PhotoUpload } from '@/components/students/PhotoUpload';
import { formatDate, initialsOf } from '@/utils';
import { useI18n } from '@/i18n/translate';

const CARDS_PER_PAGE = 8;

const chunk = (list, size) => {
  const pages = [];
  for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
  return pages;
};

const Photo = ({ card }) => {
  const fallback = (
    <div className="id-card-photo bg-slate-100 text-slate-400 flex items-center justify-center text-sm font-black">
      {initialsOf(card.name)}
    </div>
  );
  return card.photoFileId ? (
    <ProtectedImage fileId={card.photoFileId} alt={card.name} className="id-card-photo" fallback={fallback} />
  ) : (
    fallback
  );
};

const Row = ({ label, value }) => (
  <p className="leading-tight truncate">
    <span className="text-slate-500">{label}: </span>
    <span className="font-bold text-slate-900">{value || '—'}</span>
  </p>
);

/** Front of a CR80 card (85.6 × 54 mm): school, photo, name, class/roll, DOB, blood group, validity, signature. */
export const IdCardFront = ({ card, school, validTill, academicYear }) => {
  const isTeacher = card.role === 'Teacher';
  return (
    <div className="id-card bg-white border border-slate-300 flex flex-col text-[7.5px]">
      <div className="bg-[#FF6B2C] text-white px-2 py-1 flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
          <GraduationCap className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-[8.5px] uppercase leading-tight truncate">{school?.schoolName || 'School'}</p>
          <p className="text-[6.5px] leading-tight truncate opacity-90">{school?.address || ''}</p>
        </div>
        <span className="text-[6.5px] font-bold bg-white/20 rounded px-1 py-0.5 shrink-0">
          {isTeacher ? 'STAFF' : 'STUDENT'} {academicYear || ''}
        </span>
      </div>
      <div className="flex-1 flex gap-2 px-2 pt-1.5">
        <Photo card={card} />
        <div className="min-w-0 flex-1 space-y-[2px]">
          <p className="text-[10px] font-black text-slate-900 leading-tight truncate uppercase">{card.name}</p>
          <p className="text-[6.5px] text-slate-500 leading-tight">ID: {card.id}</p>
          {isTeacher ? (
            <Row label="Subjects" value={card.className} />
          ) : (
            <>
              <Row label="Class" value={`${card.className ?? '—'}${card.rollNumber != null ? `  ·  Roll ${card.rollNumber}` : ''}`} />
              <Row label="DOB" value={card.dateOfBirth ? formatDate(card.dateOfBirth) : null} />
            </>
          )}
          <Row label="Blood group" value={card.bloodGroup} />
          {isTeacher && <Row label="Phone" value={card.phone} />}
        </div>
      </div>
      <div className="flex items-end justify-between px-2 pb-1">
        <p className="text-[6.5px] font-bold text-rose-700">Valid till: {validTill ? formatDate(validTill) : '—'}</p>
        <div className="text-center">
          <div className="w-16 border-t border-slate-500" />
          <p className="text-[6px] text-slate-600">Principal{school?.principalName ? ` (${school.principalName})` : ''}</p>
        </div>
      </div>
    </div>
  );
};

/** Back of the card: guardian, phone, address, bus route, and where to return a lost card. */
export const IdCardBack = ({ card, school }) => {
  const isTeacher = card.role === 'Teacher';
  return (
    <div className="id-card bg-white border border-slate-300 flex flex-col text-[7.5px] p-2 gap-1">
      {!isTeacher && <Row label="Guardian" value={card.guardianName} />}
      <Row label={isTeacher ? 'Phone' : 'Guardian phone'} value={card.phone} />
      {!isTeacher && (
        <p className="leading-tight">
          <span className="text-slate-500">Address: </span>
          <span className="font-bold text-slate-900 line-clamp-2">{card.address || '—'}</span>
        </p>
      )}
      {!isTeacher && (
        <Row
          label="School bus"
          value={card.transportRoute ? `${card.transportRoute}${card.transportStop ? ` — ${card.transportStop}` : ''}` : 'Not using school transport'}
        />
      )}
      <div className="mt-auto border-t border-dashed border-slate-300 pt-1 text-center text-[6.5px] text-slate-600 leading-tight">
        <p>If found, please return to:</p>
        <p className="font-bold text-slate-800 uppercase">{school?.schoolName || 'School'}</p>
        <p className="truncate">{[school?.address, school?.phone && `Ph. ${school.phone}`].filter(Boolean).join(' · ')}</p>
      </div>
    </div>
  );
};

/**
 * Printable sheet: 8 CR80 cards per A4 page. Each page of fronts is followed by a page of backs with the two
 * columns swapped, so the backs line up when printing double-sided (flip on the long edge).
 */
export const IdCardSheet = ({ data }) => {
  const pages = chunk(data.cards ?? [], CARDS_PER_PAGE);
  return (
    <div className="print-sheet space-y-6">
      {pages.map((cards, pageIndex) => {
        const backs = [];
        for (let i = 0; i < cards.length; i += 2) {
          backs.push(cards[i + 1] ?? null, cards[i]);
        }
        return (
          <React.Fragment key={pageIndex}>
            <div className="id-card-page">
              {cards.map((card) => (
                <IdCardFront
                  key={card.id}
                  card={card}
                  school={data.school}
                  validTill={data.validTill}
                  academicYear={data.academicYear}
                />
              ))}
            </div>
            <div className="id-card-page">
              {backs.map((card, i) =>
                card ? <IdCardBack key={`${card.id}-back`} card={card} school={data.school} /> : <div key={`blank-${i}`} className="id-card id-card-blank" />,
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * ID cards page body (admin and teachers): choose a class (or all teachers), upload / change each student's
 * photo (POST /files, then PUT /students/{id}/photo), preview the cards and print them.
 */
export const IdCardsManager = ({ classes, allowTeachers = false }) => {
  const { t } = useI18n();
  const [choice, setChoice] = useState(classes[0] ?? (allowTeachers ? 'TEACHERS' : ''));
  const teachers = choice === 'TEACHERS';
  const path = choice ? withQuery('/id-cards', teachers ? { teachers: 'true' } : { className: choice }) : null;
  const cards = useApi(path);
  const [message, setMessage] = useState('');

  const savePhoto = async (card, fileId) => {
    await http.put(`/students/${encodeURIComponent(card.id)}/photo`, { fileId });
    cards.setData((data) => ({
      ...data,
      cards: data.cards.map((c) => (c.id === card.id ? { ...c, photoFileId: fileId } : c)),
    }));
    setMessage(t('idcards.photoSaved', { name: card.name }));
  };

  if (!classes.length && !allowTeachers) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <EmptyMessage text={t('idcards.noClasses')} />
      </div>
    );
  }

  const list = cards.data?.cards ?? [];
  const missing = list.filter((c) => c.role !== 'Teacher' && !c.photoFileId).length;

  return (
    <div className="space-y-6">
      <div className="no-print bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold text-slate-500">{t('idcards.cardsFor')}</label>
          <select
            value={choice}
            onChange={(e) => {
              setChoice(e.target.value);
              setMessage('');
            }}
            className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
          >
            {classes.map((c) => (
              <option key={c} value={c}>
                {t('common.class')} {c}
              </option>
            ))}
            {allowTeachers && <option value="TEACHERS">{t('idcards.allTeachers')}</option>}
          </select>
          {cards.data && (
            <span className="text-xs font-semibold text-slate-500">
              {t('idcards.count', { n: list.length, pages: Math.ceil(list.length / CARDS_PER_PAGE) })}
            </span>
          )}
        </div>
        <PrintButton label={t('idcards.print')} disabled={!list.length} />
      </div>

      <AsyncState state={cards} loadingText={t('idcards.loading')}>
        {(data) =>
          !data?.cards?.length ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <EmptyMessage text={t('idcards.none')} />
            </div>
          ) : (
            <>
              {!teachers && (
                <div className="no-print bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#FF6B2C]" /> {t('idcards.photos')}
                    </h2>
                    <span className={`text-xs font-bold ${missing ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {missing ? t('idcards.missing', { n: missing }) : t('idcards.allPhotos')}
                    </span>
                  </div>
                  {message && <p className="text-xs font-semibold text-emerald-700">{message}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {data.cards.map((card) => (
                      <div key={card.id} className="flex flex-col items-center text-center gap-1">
                        <PhotoUpload
                          compact
                          fileId={card.photoFileId}
                          name={card.name}
                          size="w-16 h-20"
                          onUploaded={(id) => savePhoto(card, id)}
                        />
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">{card.name}</p>
                        <p className="text-[10px] text-slate-400">Roll {card.rollNumber ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">{t('idcards.photoHint')}</p>
                </div>
              )}

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-6 overflow-x-auto">
                <h2 className="no-print text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <IdCardIcon className="w-5 h-5 text-[#FF6B2C]" /> {t('idcards.preview')}
                </h2>
                <p className="no-print text-[11px] text-slate-400 mb-4">{t('idcards.printHint')}</p>
                <IdCardSheet data={data} />
              </div>
            </>
          )
        }
      </AsyncState>
    </div>
  );
};

export default IdCardsManager;
