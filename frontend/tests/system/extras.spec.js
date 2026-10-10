import { test, expect } from '@playwright/test';
import { API, apiLogin, monitor, resetDemoData, settle, signIn } from './helpers';

/** Forgot password, Excel export, and clearing a student's government record fields. */
test.beforeAll(async ({ request }) => {
  await resetDemoData(request);
});

test('forgot password sends a request to the admins', async ({ page, request }) => {
  const problems = monitor(page);
  await page.goto('/login');
  await page.getByPlaceholder(/Email, or student ID/).fill('student@ssa.edu');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.locator('#forgot-login')).toHaveValue('student@ssa.edu');
  await page.getByRole('button', { name: 'Ask the school office' }).click();
  await expect(page.getByText(/school office has been asked to reset your password/)).toBeVisible();

  const token = await apiLogin(request, 'admin');
  const res = await request.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
  const titles = (await res.json()).data.map((n) => n.title);
  expect(titles).toContain('Password reset requested');
  expect(problems).toEqual([]);
});

test('students list exports to a CSV file', async ({ page, request }) => {
  await signIn(page, request, 'admin');
  const problems = monitor(page);
  await page.goto('/admin/students');
  await settle(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export to Excel' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^students-\d{4}-\d{2}-\d{2}\.csv$/);
  const text = (await (await file.createReadStream()).toArray()).join('');
  expect(text.charCodeAt(0)).toBe(0xfeff); // BOM so Excel reads Hindi/UTF-8 correctly
  expect(text).toContain('Student ID,Name,Class');
  expect(text).toContain('Rohit Verma');
  expect(problems).toEqual([]);
});

test('a wrong PEN can be removed by emptying the field', async ({ page, request }) => {
  const token = await signIn(page, request, 'admin');
  const headers = { Authorization: `Bearer ${token}` };
  const student = (await (await request.get(`${API}/students/STU-2026-0503`, { headers })).json()).data;
  await request.put(`${API}/students/STU-2026-0503`, { headers, data: { ...student, penNumber: 'WRONG-PEN' } });

  const problems = monitor(page);
  await page.goto('/admin/students/add?edit=STU-2026-0503');
  await settle(page);
  const pen = page.locator('input[name="penNumber"]');
  await expect(pen).toHaveValue('WRONG-PEN');
  await pen.fill('');
  await page.getByRole('button', { name: /Save|Update/ }).last().click();
  await expect.poll(async () =>
    (await (await request.get(`${API}/students/STU-2026-0503`, { headers })).json()).data.penNumber ?? null,
  ).toBeNull();
  expect(problems).toEqual([]);
});
