import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Mail, MapPin, Phone, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { ErrorMessage, LoadingMessage } from '@/components/common/AsyncState';
import { HealthPanel } from '@/components/health/HealthPanel';
import { GovernmentRecords, StudentPhoto } from '@/components/students/GovernmentRecords';
import { formatDate } from '@/utils';
import { formatRate } from '@/components/attendance/attendanceMath';
import { useI18n } from '@/i18n/translate';
import { WhatsAppButton } from '@/components/whatsapp/WhatsAppComposer';

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-slate-900">{value || '—'}</p>
  </div>
);

/** /teacher/students/:studentId — a student of my classes: overview and the Health tab. */
export const TeacherStudentPage = () => {
  const { t } = useI18n();
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('overview');

  const studentState = useApi(`/students/${encodeURIComponent(studentId)}`);
  const student = studentState.data;
  const classInfo = useApi(student ? `/classes/${encodeURIComponent(student.className)}` : null);
  const stats = useApi(student ? `/attendance/students/${encodeURIComponent(student.id)}/stats` : null);
  const isClassTeacher = Boolean(classInfo.data && classInfo.data.classTeacherId === currentUser?.teacherId);
  const guardian = student?.guardian ?? {};

  const TABS = [
    { id: 'overview', label: t('teacherStudent.overview') },
    { id: 'health', label: t('nav.health') },
  ];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/teacher/dashboard'))}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" /> {t('common.back')}
      </button>

      {studentState.error && !student ? (
        <ErrorMessage error={studentState.error} onRetry={studentState.reload} />
      ) : !student ? (
        <LoadingMessage text={t('teacherStudent.loading')} />
      ) : (
        <>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex items-center gap-5">
            <StudentPhoto student={student} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
              <p className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" /> {student.id}
                </span>
                <span className="font-medium text-slate-700">
                  {t('common.class')} {student.className}
                </span>
                <span>Roll {student.rollNumber ?? '—'}</span>
              </p>
            </div>
            <div className="ml-auto">
              <WhatsAppButton student={student} />
            </div>
          </div>

          <div className="border-b border-slate-200">
            <nav className="flex space-x-6" aria-label="Tabs">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                    tab === item.id
                      ? 'border-[#FF6B2C] text-[#FF6B2C]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <Info label={t('teacherStudent.dob')} value={formatDate(student.dateOfBirth)} />
                    <Info label={t('teacherStudent.gender')} value={student.gender} />
                    <Info label={t('health.bloodGroup')} value={student.bloodGroup} />
                    <Info label={t('teacherStudent.classTeacher')} value={classInfo.data?.classTeacherName} />
                    <Info label={t('teacherStudent.attendance')} value={stats.data ? formatRate(stats.data.rate) : null} />
                    <Info label={t('teacherStudent.admission')} value={formatDate(student.admissionDate)} />
                  </div>
                </div>
                <GovernmentRecords student={student} />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-3 h-fit">
                <h3 className="text-lg font-semibold text-slate-900">{t('teacherStudent.guardian')}</h3>
                <p className="text-sm font-medium text-slate-900">
                  {guardian.name || '—'} <span className="text-xs text-slate-500">{guardian.relation}</span>
                </p>
                {guardian.phone && (
                  <a href={`tel:${guardian.phone}`} className="flex items-center gap-2 text-sm text-[#FF6B2C] font-semibold">
                    <Phone className="w-4 h-4" /> {guardian.phone}
                  </a>
                )}
                {guardian.email && (
                  <p className="flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" /> {guardian.email}
                  </p>
                )}
                {student.address && (
                  <p className="flex gap-2 text-sm text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {student.address}
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === 'health' && (
            <HealthPanel studentId={student.id} studentName={student.name} mode="staff" canEditRecord={isClassTeacher} />
          )}
        </>
      )}
    </div>
  );
};

export default TeacherStudentPage;
