import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { API, apiLogin, monitor, resetDemoData, settle, signIn } from './helpers';

/**
 * Importing a school's own spreadsheet (fixtures/students-school-format.csv): its own Student IDs, Class and Section
 * in separate columns, City/State/PIN, "Relationship". Then a new student signs in with the login it created.
 */
const csv = readFileSync(new URL('./fixtures/students-school-format.csv', import.meta.url));

test.beforeAll(async ({ request }) => {
  await resetDemoData(request);
});

async function api(request, path) {
  const token = await apiLogin(request, 'admin');
  const res = await request.get(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok() ? (await res.json()).data : null;
}

test('a school-format CSV with own IDs and separate Section imports, and the new student can sign in', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/import-students');
  await settle(page);

  await page.locator('input[type="file"]').setInputFiles({ name: 'students-school-format.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByRole('button', { name: 'Check file' }).click();
  await expect(page.getByText('Check result')).toBeVisible();
  // The only rows refused are roll numbers the demo students already use in those classes.
  const summary = await page.getByText(/rows are ready to import/).innerText();
  const ready = Number(summary.match(/(\d+) of 50 rows are ready/)[1]);
  expect(ready).toBeGreaterThanOrEqual(45);
  for (const row of await page.locator('tr', { hasText: 'ERROR' }).all()) {
    await expect(row).toContainText(/already used/);
  }
  expect(await api(request, '/students/SSA2026003')).toBeNull(); // nothing saved by the check

  await page.getByRole('button', { name: `Import ${ready} students` }).click();
  // Each new login gets a securely hashed password, so ~100 logins take a while.
  await expect(page.getByText(`${ready} students admitted`)).toBeVisible({ timeout: 180_000 });

  const vivaan = await api(request, '/students/SSA2026003');
  expect(vivaan.className).toBe('2-A');
  expect(vivaan.address).toBe('103, Shanti Nagar, Chandausi, Uttar Pradesh, 202412');
  expect(vivaan.guardian).toMatchObject({ name: 'Amit Gupta', relation: 'Guardian', phone: '9000000003' });

  // The logins table shows each new login once; the student signs in with theirs.
  const row = page.locator('tr', { hasText: 'Vivaan Gupta' }).first();
  await expect(row).toContainText('ssa2026003');
  const password = (await row.locator('td').nth(2).innerText()).trim();
  const login = await request.post(`${API}/auth/login`, { data: { email: 'SSA2026003', password, role: 'STUDENT' } });
  expect(login.ok()).toBe(true);
  expect(problems).toEqual([]);
});
