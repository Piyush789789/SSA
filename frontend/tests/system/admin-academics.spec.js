import { test, expect } from '@playwright/test';
import { API, apiLogin, monitor, resetDemoData, settle, signIn } from './helpers';

/** Admin: exam + schedule + seating + admit cards, holiday calendar, leave approval, substitution, staff attendance. */

test.beforeAll(async ({ request }) => {
  await resetDemoData(request);
});

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const api = async (request, method, path, data) => {
  const token = await apiLogin(request, 'admin');
  const res = await request[method](`${API}${path}`, { headers: { Authorization: `Bearer ${token}` }, data });
  expect(res.ok(), `${method} ${path}: ${res.status()}`).toBeTruthy();
  return (await res.json()).data;
};

test('create an exam with a schedule, arrange seating and open admit cards', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/exams');
  await settle(page);
  await page.getByRole('button', { name: 'Create Exam' }).first().click();
  const modal = page.locator('div.fixed', { hasText: 'Exam Name *' });
  await modal.getByPlaceholder('e.g. Mid-Term Examination 2026').fill('Systest Unit Test');
  await modal.locator('select').first().selectOption({ index: 0 });
  const start = new Date();
  start.setDate(start.getDate() + 20);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  await modal.locator('input[type="date"]').nth(0).fill(iso(start));
  await modal.locator('input[type="date"]').nth(1).fill(iso(end));
  await modal.getByRole('button', { name: 'Class 5-B' }).click();
  await modal.getByRole('button', { name: 'Class 6-A' }).click();
  await modal.getByRole('button', { name: 'Create Exam' }).click();
  await expect(page.getByText('New examination created.')).toBeVisible();

  const exams = await api(request, 'get', '/exams');
  const exam = exams.find((e) => e.name === 'Systest Unit Test');
  expect(exam).toBeTruthy();
  expect(exam.classes.sort()).toEqual(['5-B', '6-A']);

  // Exam page: add a paper.
  await page.goto(`/admin/exams/${exam.id}`);
  await settle(page);
  await expect(page.getByRole('heading', { name: 'Systest Unit Test' })).toBeVisible();
  await page.getByRole('button', { name: 'Add Subject / Schedule' }).first().click();
  const sched = page.locator('div.fixed', { hasText: 'Maximum Marks *' });
  await sched.locator('select').nth(0).selectOption('5-B');
  const subject = await sched.locator('select').nth(1).inputValue();
  await sched.locator('input[type="number"]').nth(0).fill('50');
  await sched.locator('input[type="number"]').nth(1).fill('17');
  await sched.getByRole('button', { name: 'Save Schedule' }).click();
  await expect(sched).toBeHidden();
  await expect(page.locator('tr', { hasText: subject }).first()).toBeVisible();
  const schedules = (await api(request, 'get', `/exams/${exam.id}`)).schedules ?? (await api(request, 'get', `/exams/${exam.id}/schedules`));
  expect(schedules.some((s) => s.subject === subject && s.className === '5-B' && s.maxMarks === 50)).toBe(true);

  // Seating plan.
  await page.getByRole('button', { name: 'Arrange seats' }).click();
  await expect(page.getByText('Give every room a name and a capacity of at least 1.')).toBeVisible();
  await page.getByPlaceholder('Room (e.g. Hall A)').first().fill('Hall A');
  await page.getByPlaceholder('Seats').first().fill('200');
  await page.getByRole('button', { name: 'Arrange seats' }).click();
  await expect(page.getByText(/students seated in 1 room\./)).toBeVisible();
  const seating = await api(request, 'get', `/exams/${exam.id}/seating`);
  expect(seating.rooms).toHaveLength(1);
  expect(seating.rooms[0].seats.length).toBeGreaterThan(0);
  const classesSeated = new Set(seating.rooms[0].seats.map((s) => s.className));
  expect([...classesSeated].sort()).toEqual(['5-B', '6-A']);

  // Room-wise list.
  await page.getByRole('link', { name: 'Print room-wise list' }).click();
  await expect(page).toHaveURL(new RegExp(`/exam-seating/${exam.id}$`));
  await settle(page);
  await expect(page.getByText('Seating plan — Hall A')).toBeVisible();
  await expect(page.locator('.seating-room tbody tr')).toHaveCount(seating.rooms[0].seats.length);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.no-print').first()).toBeHidden();
  await expect(page.locator('.seating-room').first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.goBack();
  await settle(page);

  // Admit cards for 5-B show the room and the paper.
  await page.getByRole('link', { name: 'Class 5-B' }).click();
  await expect(page).toHaveURL(new RegExp(`/admit-cards/${exam.id}\\?className=5-B`));
  await settle(page);
  const cards = page.locator('.admit-card');
  const in5B = seating.rooms[0].seats.filter((s) => s.className === '5-B').length;
  await expect(cards).toHaveCount(in5B);
  await expect(cards.first()).toContainText('Hall A');
  await expect(cards.first()).toContainText(subject);
  const rohit = cards.filter({ hasText: 'Rohit Verma' });
  await expect(rohit).toHaveCount(1);
  const rohitSeat = seating.rooms[0].seats.find((s) => s.studentId === 'STU-2026-0503').seatNumber;
  await expect(rohit).toContainText(String(rohitSeat));
  expect(problems).toEqual([]);
});

test('add a holiday on the calendar', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/calendar');
  await settle(page);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const day = new Date();
  day.setDate(day.getDate() + 2); // not on the demo staff leave day (today + 6)
  const end = new Date(day);
  end.setDate(end.getDate() + 1);
  await dialog.getByLabel('Title').fill('Systest Founders Day');
  await dialog.getByLabel('From').fill(iso(day));
  await dialog.getByLabel('To (optional)').fill(iso(end));
  await dialog.getByLabel('Description (optional)').fill('School closed');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  // Shown in the month list (navigate if the date is next month).
  if (day.getMonth() !== new Date().getMonth()) await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.locator('li', { hasText: 'Systest Founders Day' })).toContainText('School closed');

  const check = await api(request, 'get', `/calendar/check?date=${iso(end)}`);
  expect(check.holiday).toBe(true);
  expect(problems).toEqual([]);
});

test('approve a staff leave, then assign a substitute for that day', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/leaves');
  await settle(page);
  const item = page.locator('li', { hasText: 'Medical appointment' });
  await expect(item).toContainText('Anjali Singh');
  await item.getByPlaceholder('Note (optional)').fill('Get well soon');
  await item.getByRole('button', { name: 'Approve' }).click();
  await expect(page.locator('li', { hasText: 'Medical appointment' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Approved', exact: true }).click();
  await settle(page);
  const approved = page.locator('li', { hasText: 'Medical appointment' });
  await expect(approved).toContainText('Get well soon');
  const leave = (await api(request, 'get', '/leaves?type=STAFF')).find((l) => l.reason === 'Medical appointment');
  expect(leave.status).toBe('APPROVED');

  // Substitutions on the leave day.
  await page.goto('/admin/substitutions');
  await settle(page);
  await page.getByLabel('Date').fill(leave.fromDate);
  await settle(page);
  const rows = page.locator('tbody tr', { hasText: 'Anjali Singh' });
  await expect(rows.first()).toBeVisible();
  const total = await rows.count();
  const first = rows.first();
  const className = (await first.locator('td').nth(1).locator('div').first().innerText()).replace('Class ', '').trim();
  await first.getByRole('button', { name: 'Assign best' }).click();
  await expect(page.getByText(/ will cover /)).toBeVisible();
  await expect(page.getByText(`1 of ${total} periods covered`)).toBeVisible();
  const needs = await api(request, 'get', `/substitutions/needs?date=${leave.fromDate}`);
  const covered = needs.filter((n) => n.substitution);
  expect(covered).toHaveLength(1);
  expect(covered[0].className).toBe(className);

  // Remove it again.
  await page.locator('tbody tr', { has: page.getByRole('button', { name: 'Remove' }) }).getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('Substitute removed.')).toBeVisible();
  await expect(page.getByText(`0 of ${total} periods covered`)).toBeVisible();
  expect(problems).toEqual([]);
});

test('save staff attendance', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/staff-attendance');
  await settle(page);
  const d = new Date();
  while (d.getDay() === 0) d.setDate(d.getDate() - 1);
  await page.getByLabel('Date').fill(iso(d));
  await settle(page);
  const rows = page.locator('tbody tr');
  await expect(rows.first()).toBeVisible();
  const teacherId = (await rows.nth(1).locator('td').first().locator('div').nth(1).innerText()).split('·')[0].trim();
  await rows.nth(1).getByRole('button', { name: 'Absent' }).click();
  await expect(rows.nth(1).locator('input[type="time"]').first()).toBeDisabled();
  await rows.nth(0).getByRole('button', { name: 'Half day' }).click();
  await rows.nth(0).locator('input[type="time"]').nth(0).fill('08:05');
  await rows.nth(0).locator('input[type="time"]').nth(1).fill('11:30');
  const firstId = (await rows.nth(0).locator('td').first().locator('div').nth(1).innerText()).split('·')[0].trim();
  await page.getByRole('button', { name: 'Save attendance' }).click();
  await expect(page.getByText('Staff attendance saved.')).toBeVisible();
  await expect(page.getByText('not saved yet')).toHaveCount(0);

  const sheet = await api(request, 'get', `/staff-attendance?date=${iso(d)}`);
  expect(sheet.find((r) => r.teacherId === teacherId).record.status).toBe('ABSENT');
  const half = sheet.find((r) => r.teacherId === firstId).record;
  expect(half.status).toBe('HALF_DAY');
  expect(half.checkIn).toMatch(/^08:05/);
  expect(half.checkOut).toMatch(/^11:30/);

  // Reload keeps the saved marks.
  await page.reload();
  await settle(page);
  await page.getByLabel('Date').fill(iso(d));
  await settle(page);
  await expect(rows.nth(1).getByRole('button', { name: 'Absent' })).toHaveClass(/bg-rose-50/);
  expect(problems).toEqual([]);
});

test('publish exam results; the student then sees them on the report card', async ({ page, request, browser }) => {
  const problems = monitor(page);
  // Before: the student's report card has no PT2 marks.
  const studentToken = await apiLogin(request, 'student');
  await signIn(page, request, 'admin');
  await page.goto('/admin/exams');
  await settle(page);
  await page.getByLabel('Tabs').getByRole('button', { name: 'Results' }).click();
  await page.locator('main select').first().selectOption('EXM-2026-PT2');
  await settle(page);
  await expect(page.getByText('Results are not yet visible to students & parents')).toBeVisible();
  await page.getByRole('button', { name: 'Publish Exam Results' }).click();
  await expect(page.getByText('Results published to students and parents.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unpublish Results' })).toBeVisible();
  const exam = (await api(request, 'get', '/exams')).find((e) => e.id === 'EXM-2026-PT2');
  expect(exam.resultsStatus).toBe('Published');

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  const studentProblems = monitor(student);
  await student.addInitScript((t) => localStorage.setItem('ssa_auth_token', t), studentToken);
  await student.goto('/student/report-card');
  await settle(student);
  await expect(student.locator('.print-sheet')).toContainText('Class Assessment Test 2');
  await studentContext.close();
  expect(problems).toEqual([]);
  expect(studentProblems).toEqual([]);
});
