import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { API, apiLogin, monitor, resetDemoData, settle, signIn } from './helpers';

/** Teacher (Anjali Singh, 5-B and 6-A): attendance, marks, homework review, leave, PTM slots, sick room, check-in. */

test.beforeAll(async ({ request }) => {
  await resetDemoData(request);
});

// 1x1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const lastSchoolDay = () => {
  const d = new Date();
  while (d.getDay() === 0) d.setDate(d.getDate() - 1);
  return iso(d);
};
const call = async (request, who, method, path, data) => {
  const token = await apiLogin(request, who);
  const res = await request[method](`${API}${path}`, { headers: { Authorization: `Bearer ${token}` }, data });
  return { status: res.status(), body: await res.json().catch(() => null) };
};

test('teacher marks attendance for a class', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'teacher');
  await page.goto('/teacher/attendance');
  await settle(page);
  const date = lastSchoolDay();
  await page.locator('select').first().selectOption('5-B');
  await page.locator('input[type="date"]').fill(date);
  await settle(page);
  await expect(page.getByRole('button', { name: 'Save Attendance' })).toBeDisabled();
  await page.getByRole('button', { name: 'Mark All Present' }).click();
  const rohit = page.locator('tr', { hasText: 'STU-2026-0503' });
  await rohit.getByRole('button', { name: 'Absent' }).click();
  const kabir = page.locator('tr', { hasText: 'STU-2026-0502' });
  await kabir.getByRole('button', { name: 'Late' }).click();
  await expect(page.getByText('You have unsaved changes.')).toBeVisible();
  await page.getByRole('button', { name: 'Save Attendance' }).click();
  await expect(page.getByText(/Attendance for Class 5-B on .* saved\./)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Attendance' })).toBeDisabled();
  await expect(rohit).toContainText('Absent');

  const { body } = await call(request, 'admin', 'get', `/attendance?className=5-B&date=${date}`);
  const byId = Object.fromEntries(body.data.map((r) => [r.studentId, r.status]));
  expect(byId['STU-2026-0503']).toBe('absent');
  expect(byId['STU-2026-0502']).toBe('late');
  expect(byId['STU-2026-0501']).toBe('present');
  expect(problems).toEqual([]);
});

test('teacher enters marks and submits them', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'teacher');
  await page.goto('/teacher/exams');
  await settle(page);
  await page.goto('/teacher/exams/SCH-008/marks');
  await settle(page);
  const rows = page.locator('tbody tr');
  await expect(rows.first()).toBeVisible();
  const first = rows.nth(0);
  const second = rows.nth(1);
  const firstId = (await first.locator('td').nth(1).locator('span').nth(1).innerText()).trim();
  const secondId = (await second.locator('td').nth(1).locator('span').nth(1).innerText()).trim();
  // Too many marks is flagged and blocks saving.
  await first.locator('input[type="number"]').fill('51');
  await expect(first.getByText('Marks cannot exceed maximum marks (50)')).toBeVisible();
  await page.getByRole('button', { name: 'Save Draft' }).click();
  await expect(page.getByText('Please fix the highlighted marks before saving.')).toBeVisible();
  await first.locator('input[type="number"]').fill('42.5');
  await expect(first).toContainText('Unsaved');
  await second.getByLabel('Mark Absent').check();
  await expect(second.locator('input[type="number"]')).toBeDisabled();
  await page.getByRole('button', { name: 'Submit Marks' }).first().click();
  await expect(page.getByText(/Marks submitted for Class 5-B Mathematics\./)).toBeVisible();
  await expect(first).toContainText('Submitted');

  const { body } = await call(request, 'teacher', 'get', '/exam-schedules/SCH-008/marks');
  const r1 = body.data.rows.find((r) => r.studentId === firstId);
  const r2 = body.data.rows.find((r) => r.studentId === secondId);
  expect(r1).toMatchObject({ obtainedMarks: 42.5, absent: false, status: 'Submitted' });
  expect(r2).toMatchObject({ absent: true, status: 'Submitted' });
  // Reload shows the saved values.
  await page.reload();
  await settle(page);
  await expect(first.locator('input[type="number"]')).toHaveValue('42.5');
  expect(problems).toEqual([]);
});

test('teacher assigns homework, a student submits a photo, the teacher checks it', async ({ page, request, browser }) => {
  const problems = monitor(page);
  await signIn(page, request, 'teacher');
  await page.goto('/teacher/homework');
  await settle(page);
  await page.getByRole('button', { name: 'Assign Homework' }).click();
  const modal = page.locator('form', { hasText: 'Assign Homework' }).last();
  await modal.getByPlaceholder('e.g. Chapter 4 Fractions Practice').fill('Systest fractions worksheet');
  await modal.locator('select').nth(0).selectOption('5-B');
  const due = new Date();
  due.setDate(due.getDate() + 3);
  await modal.locator('input[type="date"]').fill(iso(due));
  await modal.getByPlaceholder('Provide homework instructions or topic summary...').fill('Solve questions 1 to 10.');
  await modal.getByRole('button', { name: 'Assign Homework' }).click();
  await expect(page.getByText('New homework assigned successfully.')).toBeVisible();
  const row = page.locator('tr', { hasText: 'Systest fractions worksheet' });
  await expect(row).toBeVisible();
  await expect(row.getByRole('button', { name: /Submissions \(0\/\d+\)/ })).toBeVisible();
  const hw = (await call(request, 'teacher', 'get', '/homework')).body.data.find((h) => h.title === 'Systest fractions worksheet');
  expect(hw).toMatchObject({ className: '5-B', dueDate: iso(due) });

  // Student (Rohit, 5-B) hands in a photo.
  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  const studentProblems = monitor(student);
  await signIn(student, request, 'student');
  await student.goto('/student/homework');
  await settle(student);
  const card = student.locator('div', { hasText: 'Systest fractions worksheet' }).filter({ has: student.getByRole('button', { name: 'Submit' }) }).last();
  await card.getByRole('button', { name: 'Submit', exact: true }).click();
  const dialog = student.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Submit' }).click();
  await expect(dialog.getByText('Write an answer or add at least one photo.')).toBeVisible();
  await dialog.locator('textarea').fill('Done, photo attached.');
  await dialog.locator('input[type="file"]').setInputFiles({ name: 'answer.png', mimeType: 'image/png', buffer: PNG });
  await expect(dialog.locator('img')).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Submit' }).click();
  await expect(dialog).toBeHidden();
  await expect(card.getByText('Submitted', { exact: true })).toBeVisible();
  const sub = (await call(request, 'teacher', 'get', `/homework/${hw.id}/submissions`)).body.data.find((r) => r.studentId === 'STU-2026-0503');
  expect(sub.submission).toMatchObject({ status: 'SUBMITTED', text: 'Done, photo attached.' });
  expect(sub.submission.fileIds).toHaveLength(1);

  // Teacher reviews it.
  await page.reload();
  await settle(page);
  await row.getByRole('button', { name: /Submissions \(1\/\d+\)/ }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('button', { name: 'To check' }).click();
  const item = sheet.locator('li', { hasText: 'Rohit Verma' });
  await expect(item).toContainText('Done, photo attached.');
  await expect(item.locator('img')).toBeVisible();
  await item.getByPlaceholder('Grade (e.g. A)').fill('A');
  await item.getByPlaceholder('Feedback for the student (optional)').fill('Neat work');
  await item.getByRole('button', { name: 'Mark checked' }).click();
  await expect(sheet.getByText('Nobody here.')).toBeVisible(); // nothing left to check
  await sheet.getByRole('button', { name: 'Checked' }).click();
  await expect(sheet.locator('li', { hasText: 'Rohit Verma' })).toContainText('Checked (A)');
  const reviewed = (await call(request, 'teacher', 'get', `/homework/${hw.id}/submissions`)).body.data.find((r) => r.studentId === 'STU-2026-0503');
  expect(reviewed.submission).toMatchObject({ status: 'REVIEWED', grade: 'A', feedback: 'Neat work' });

  // The student sees the feedback.
  await student.reload();
  await settle(student);
  await expect(student.getByText('Neat work')).toBeVisible();
  await expect(student.getByText('Checked (A)').first()).toBeVisible();
  await studentContext.close();
  expect(problems).toEqual([]);
  expect(studentProblems).toEqual([]);
});

test('teacher approves a student leave request', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'teacher');
  await page.goto('/teacher/leave');
  await settle(page);
  const item = page.locator('li', { hasText: "Cousin's wedding in Jaipur" });
  await expect(item).toContainText('Ananya Verma');
  await item.getByRole('button', { name: 'Approve' }).click();
  await expect(item.getByText('Approved', { exact: true })).toBeVisible();
  const leave = (await call(request, 'teacher', 'get', '/leaves?type=STUDENT')).body.data.find((l) => l.reason === "Cousin's wedding in Jaipur");
  expect(leave.status).toBe('APPROVED');
  expect(problems).toEqual([]);
});

test('teacher creates PTM slots', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'teacher');
  await page.goto('/teacher/ptm');
  await settle(page);
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const form = page.locator('form', { hasText: 'Create slots' });
  await form.getByLabel(/Meeting title/).fill('Systest PTM');
  await form.locator('input[type="date"]').fill(iso(d));
  await form.getByLabel(/^From/).fill('10:00');
  await form.getByLabel(/^To/).fill('11:00');
  await form.getByLabel(/Slot length/).selectOption('15');
  await form.getByLabel(/Location/).fill('Room 12');
  await form.getByRole('button', { name: 'Create slots' }).click();
  await expect(form.getByText(/4/)).toBeVisible();
  const slots = (await call(request, 'teacher', 'get', `/ptm/slots?from=${iso(d)}`)).body.data.filter((s) => s.title === 'Systest PTM');
  expect(slots).toHaveLength(4);
  expect(slots.every((s) => s.location === 'Room 12' && s.date === iso(d))).toBe(true);
  await expect(page.getByText(`0/4 Booked`)).toBeVisible();
  await expect(page.getByText('Room 12').first()).toBeVisible();
  expect(problems).toEqual([]);
});

test('teacher records a sick-room visit', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'teacher');
  await page.goto('/teacher/students/STU-2026-0503');
  await settle(page);
  await page.getByLabel('Tabs').getByRole('button', { name: 'Health' }).click();
  await settle(page);
  await page.getByRole('button', { name: 'Record sick-room visit' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('e.g. Headache, fever 100°F').fill('Stomach ache after lunch');
  await dialog.getByPlaceholder('e.g. Rested in sick room, given water').fill('Rested 30 minutes');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Stomach ache after lunch')).toBeVisible();
  const visits = (await call(request, 'teacher', 'get', '/health-records/STU-2026-0503/visits')).body.data;
  expect(visits.find((v) => v.complaint === 'Stomach ache after lunch')).toMatchObject({ actionTaken: 'Rested 30 minutes', sentHome: true });
  expect(problems).toEqual([]);
});

test('teacher checks in and out', async ({ page, request }) => {
  const problems = monitor(page);
  const holiday = (await call(request, 'teacher', 'get', `/calendar/check?date=${iso(new Date())}`)).body.data.holiday;
  test.skip(holiday, 'today is a holiday: no check-in');
  await signIn(page, request, 'teacher');
  await page.goto('/teacher/my-attendance');
  await settle(page);
  const card = page.locator('div.rounded-3xl', { has: page.getByRole('heading', { name: 'My Attendance Today' }) });
  await card.getByRole('button', { name: 'Check in' }).click();
  await expect(card.getByRole('button', { name: 'Check out' })).toBeVisible();
  await expect(card.getByText('Present')).toBeVisible();
  const recs = (await call(request, 'teacher', 'get', `/staff-attendance/records?from=${iso(new Date())}&to=${iso(new Date())}`)).body.data;
  expect(recs[0].checkIn).toBeTruthy();
  await card.getByRole('button', { name: 'Check out' }).click();
  await expect(card.getByText('Done for today.')).toBeVisible();
  expect(problems).toEqual([]);
});

test('a holiday today blocks attendance', async ({ page, request }) => {
  const problems = monitor(page);
  const today = iso(new Date());
  const added = await call(request, 'admin', 'post', '/calendar', { title: 'Systest Holiday', type: 'HOLIDAY', startDate: today, endDate: null, description: null });
  expect(added.status).toBeLessThan(300);
  await signIn(page, request, 'teacher');
  await page.goto('/teacher/attendance');
  await settle(page);
  await expect(page.getByText('Holiday — no attendance')).toBeVisible();
  await expect(page.getByText(/Systest Holiday/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Attendance' })).toHaveCount(0);
  // The server refuses too.
  const refused = await call(request, 'teacher', 'put', '/attendance', {
    className: '5-B',
    date: today,
    entries: [{ studentId: 'STU-2026-0503', status: 'present' }],
  });
  expect(refused.status).toBeGreaterThanOrEqual(400);
  expect(problems).toEqual([]);
});

test('a paper of another subject opens read-only for the teacher', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'teacher');
  await page.goto('/teacher/exams/SCH-010/marks'); // 6-A Hindi: Anjali teaches Mathematics and Science
  await settle(page);
  await expect(page.getByText(/only the Hindi teacher of Class 6-A can change them/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit Marks' }).first()).toBeDisabled();
  await expect(page.locator('tbody input[type="number"]').first()).toBeDisabled();
  expect(problems).toEqual([]);
});
