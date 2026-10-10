import { test, expect } from '@playwright/test';
import { monitor, rawKeys, resetDemoData, settle, signIn } from './helpers';

/**
 * Opens every page of every portal as that portal's user and checks that it loads without crashes, console
 * errors, failed API calls, the error box, or untranslated keys. Runs in English and in Hindi.
 */
const PAGES = {
  admin: [
    '/admin/dashboard', '/admin/students', '/admin/students/add', '/admin/students/STU-2026-0503',
    '/admin/classes', '/admin/classes/5-B', '/admin/teachers', '/admin/attendance',
    '/admin/attendance/student/STU-2026-0503', '/fees', '/admin/timetable', '/admin/notices',
    '/admin/roles-permissions', '/admin/accounts', '/admin/exams', '/admin/exams/EXM-2026-MID', '/admin/settings',
    '/admin/promotion', '/admin/backups', '/admin/audit', '/admin/certificates', '/admin/calendar', '/admin/leaves',
    '/admin/staff-attendance', '/admin/substitutions', '/admin/import-students', '/admin/admissions',
    '/admin/transport', '/admin/library', '/admin/id-cards', '/admin/ptm', '/admin/gallery', '/admin/at-risk',
    '/admin/whatsapp', '/report-card/STU-2026-0503', '/admit-cards/EXM-2026-MID?className=5-B',
    '/exam-seating/EXM-2026-MID',
  ],
  teacher: [
    'dashboard', 'attendance', 'homework', 'exams', 'exams/SCH-001/marks', 'timetable', 'notices',
    'communication', 'ai-assistant', 'study-materials', 'report-cards', 'my-attendance', 'leave', 'calendar',
    'profile', 'id-cards', 'ptm', 'gallery', 'library', 'at-risk', 'whatsapp', 'students/STU-2026-0503',
  ].map((p) => `/teacher/${p}`),
  student: [
    'dashboard', 'attendance', 'fees', 'homework', 'exams', 'notices', 'communication', 'report-card', 'progress',
    'ai-assistant', 'study-materials', 'profile', 'leave', 'calendar', 'bus', 'library', 'gallery', 'health',
  ].map((p) => `/student/${p}`),
  parent: [
    'dashboard', 'attendance', 'results', 'report-card', 'fees', 'notices', 'communication', 'profile', 'leave',
    'homework', 'calendar', 'ptm', 'bus', 'library', 'gallery', 'health',
  ].map((p) => `/parent/${p}`),
};

test.beforeAll(async ({ request }) => {
  await resetDemoData(request);
});

for (const lang of ['en', 'hi']) {
  for (const [who, paths] of Object.entries(PAGES)) {
    test(`${who} pages load cleanly (${lang})`, async ({ page, request }) => {
      await signIn(page, request, who, lang);
      const report = [];
      for (const path of paths) {
        const problems = monitor(page);
        await page.goto(path);
        await settle(page);
        const url = new URL(page.url());
        if (url.pathname === '/login' || url.pathname === '/') {
          problems.push({ kind: 'redirected', detail: `ended on ${url.pathname}` });
        }
        const errorBox = await page.getByText(/Something went wrong|Could not load|Request failed|Access denied/i).count();
        if (errorBox) problems.push({ kind: 'error shown', detail: (await page.getByText(/Something went wrong|Could not load|Request failed|Access denied/i).first().innerText()).slice(0, 200) });
        for (const key of await rawKeys(page)) problems.push({ kind: 'raw i18n key', detail: key });
        if (problems.length) report.push({ path, problems });
        page.removeAllListeners('pageerror');
        page.removeAllListeners('console');
        page.removeAllListeners('response');
        page.removeAllListeners('requestfailed');
      }
      if (report.length) console.log(JSON.stringify({ who, lang, report }, null, 2));
      expect(report, `pages with problems for ${who} (${lang})`).toEqual([]);
    });
  }
}
