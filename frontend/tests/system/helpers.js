/** Shared helpers for the system tests: API login, signed-in pages, and a page-health monitor. */
import process from 'node:process';

export const API = process.env.SYSTEST_API_URL || 'http://localhost:8090/api';

export const ACCOUNTS = {
  admin: { email: 'admin@ssa.edu', password: 'admin123', role: 'ADMIN' },
  teacher: { email: 'teacher@ssa.edu', password: 'teacher123', role: 'TEACHER' },
  student: { email: 'student@ssa.edu', password: 'student123', role: 'STUDENT' },
  parent: { email: 'parent@ssa.edu', password: 'parent123', role: 'PARENT' },
};

export async function apiLogin(request, who) {
  const res = await request.post(`${API}/auth/login`, { data: ACCOUNTS[who] });
  if (!res.ok()) throw new Error(`login ${who} failed: ${res.status()}`);
  return (await res.json()).token;
}

export async function resetDemoData(request) {
  const token = await apiLogin(request, 'admin');
  const res = await request.post(`${API}/admin/demo-data/reset`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok()) throw new Error(`reset failed: ${res.status()}`);
}

/** Opens the site already signed in (token in localStorage, as the login form leaves it). */
export async function signIn(page, request, who, lang = 'en') {
  const token = await apiLogin(request, who);
  await page.addInitScript(
    ([t, l]) => {
      window.localStorage.setItem('ssa_auth_token', t);
      window.localStorage.setItem('ssa_language', l);
    },
    [token, lang],
  );
  return token;
}

/**
 * Watches a page for problems: uncaught errors, console errors, failed API calls (4xx/5xx) and requests that
 * never completed. `allow` lets a test accept expected statuses for some URLs.
 */
export function monitor(page) {
  const problems = [];
  page.on('pageerror', (err) => problems.push({ kind: 'page error', detail: err.message }));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // The browser logs every failed request as a console error too; those are reported as API failures below.
    if (/Failed to load resource/.test(text)) return;
    problems.push({ kind: 'console error', detail: text.slice(0, 300) });
  });
  page.on('response', (res) => {
    const url = res.url();
    if (!url.startsWith(API) || res.status() < 400) return;
    problems.push({ kind: `API ${res.status()}`, detail: `${res.request().method()} ${url.replace(API, '')}` });
  });
  page.on('requestfailed', (req) => {
    if (!req.url().startsWith(API)) return;
    const reason = req.failure()?.errorText || '';
    if (/ERR_ABORTED/.test(reason)) return; // navigation away cancels in-flight requests
    problems.push({ kind: 'request failed', detail: `${req.method()} ${req.url().replace(API, '')} ${reason}` });
  });
  return problems;
}

/** Waits until the page has finished loading data (no spinner, network quiet). */
export async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForFunction(() => !document.querySelector('.animate-spin'), null, { timeout: 15_000 }).catch(() => {});
}

/** Visible text that looks like an untranslated i18n key, e.g. "dash.welcomeToday" or "nav.atRisk". */
export async function rawKeys(page) {
  const text = await page.locator('body').innerText();
  const matches = text.match(/\b(?:common|nav|dash|pages|wa|ptm|library|gallery|campus|enquiry|atRisk|transport|health|idCards|teacherStudent|admissions|fees|leave)\.[a-zA-Z][a-zA-Z0-9]+\b/g) || [];
  return [...new Set(matches)];
}
