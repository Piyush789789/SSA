import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { API, apiLogin, monitor, resetDemoData, settle, signIn } from './helpers';

/** Student and parent portals: homework, leave, report card, bus, library, health, child switch, PTM booking. */

test.beforeAll(async ({ request }) => {
  await resetDemoData(request);
});

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const call = async (request, who, method, path, data) => {
  const token = await apiLogin(request, who);
  const res = await request[method](`${API}${path}`, { headers: { Authorization: `Bearer ${token}` }, data });
  return { status: res.status(), body: await res.json().catch(() => null) };
};

test.describe('student', () => {
  test('submits homework with a photo', async ({ page, request }) => {
    const problems = monitor(page);
    const due = new Date();
    due.setDate(due.getDate() + 2);
    const created = await call(request, 'teacher', 'post', '/homework', {
      title: 'Systest drawing task',
      description: 'Draw a plant cell',
      subject: 'Science',
      className: '5-B',
      dueDate: iso(due),
      instructions: '',
      attachments: [],
    });
    expect(created.status).toBeLessThan(300);
    const hwId = created.body.data.id;

    await signIn(page, request, 'student');
    await page.goto('/student/homework');
    await settle(page);
    const card = page.locator('div', { hasText: 'Systest drawing task' }).filter({ has: page.getByRole('button', { name: 'Submit', exact: true }) }).last();
    await card.getByRole('button', { name: 'Submit', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'cell.png', mimeType: 'image/png', buffer: PNG });
    await expect(dialog.locator('img')).toHaveCount(1);
    await dialog.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(card.getByText('Submitted', { exact: true })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Submit again' })).toBeVisible();

    const sheet = await call(request, 'teacher', 'get', `/homework/${hwId}/submissions`);
    const row = sheet.body.data.find((r) => r.studentId === 'STU-2026-0503');
    expect(row.submission.fileIds).toHaveLength(1);
    // The uploaded photo can be downloaded by the teacher.
    const teacherToken = await apiLogin(request, 'teacher');
    const file = await request.get(`${API}/files/${row.submission.fileIds[0]}`, { headers: { Authorization: `Bearer ${teacherToken}` } });
    expect(file.status()).toBe(200);
    expect(file.headers()['content-type']).toContain('image/png');
    expect(problems).toEqual([]);
  });

  test('applies for leave', async ({ page, request }) => {
    const problems = monitor(page);
    await signIn(page, request, 'student');
    await page.goto('/student/leave');
    await settle(page);
    const from = new Date();
    from.setDate(from.getDate() + 10);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    await page.getByLabel('From').fill(iso(from));
    await page.getByLabel('To', { exact: true }).fill(iso(to));
    await page.getByPlaceholder('e.g. Fever, family function…').fill('Systest family trip');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByText('Leave application sent.')).toBeVisible();
    const item = page.locator('li', { hasText: 'Systest family trip' });
    await expect(item).toContainText('Pending');
    const leaves = (await call(request, 'teacher', 'get', '/leaves?type=STUDENT')).body.data;
    expect(leaves.find((l) => l.reason === 'Systest family trip')).toMatchObject({
      personId: 'STU-2026-0503',
      fromDate: iso(from),
      toDate: iso(to),
      status: 'PENDING',
    });
    // The student can withdraw it.
    page.once('dialog', (d) => d.accept());
    await item.getByRole('button', { name: 'Withdraw' }).click();
    await expect(page.locator('li', { hasText: 'Systest family trip' })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('views the report card and prints only the sheet', async ({ page, request }) => {
    const problems = monitor(page);
    await signIn(page, request, 'student');
    await page.goto('/student/report-card');
    await settle(page);
    const sheet = page.locator('.print-sheet');
    await expect(sheet).toContainText('Rohit Verma');
    await expect(sheet).toContainText('Mathematics');
    await expect(sheet).toContainText('Unit Test 1');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('aside').first()).toBeHidden();
    await expect(page.locator('header').first()).toBeHidden();
    await expect(sheet).toBeVisible();
    await page.emulateMedia({ media: 'screen' });
    expect(problems).toEqual([]);
  });

  test('sees the bus, library loans and health record', async ({ page, request }) => {
    const problems = monitor(page);
    await signIn(page, request, 'student');
    await page.goto('/student/bus');
    await settle(page);
    await expect(page.getByText('Route 1 - Civil Lines')).toBeVisible();
    await expect(page.getByText('Collectorate').first()).toBeVisible();
    await expect(page.getByText('Ramesh Kumar').first()).toBeVisible();

    await page.goto('/student/library');
    await settle(page);
    await expect(page.getByText('Malgudi Days').first()).toBeVisible();
    await expect(page.getByText(/overdue/i).first()).toBeVisible();

    await page.goto('/student/health');
    await settle(page);
    await expect(page.getByRole('heading', { name: 'Health record' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Record sick-room visit' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Edit/ })).toHaveCount(0);
    expect(problems).toEqual([]);
  });
});

test.describe('parent', () => {
  test('switches child; pages follow the selected child', async ({ page, request }) => {
    const problems = monitor(page);
    await signIn(page, request, 'parent');
    await page.goto('/parent/dashboard');
    await settle(page);
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Yash Verma/ }).click();
    await settle(page);
    await page.goto('/parent/bus');
    await settle(page);
    await expect(page.getByText(/Yash Verma/).first()).toBeVisible();
    await page.goto('/parent/fees');
    await settle(page);
    await expect(page.getByText(/for Yash Verma \(Class 8-A\)/)).toBeVisible();
    // The choice survives a reload.
    await page.reload();
    await settle(page);
    await expect(page.getByText(/for Yash Verma \(Class 8-A\)/)).toBeVisible();
    // Switch back from the header menu.
    await page.getByRole('button', { name: 'Parent Profile Menu' }).click();
    await page.getByRole('button', { name: /Ananya Verma \(Class 5-B\)/ }).click();
    await expect(page.getByText(/for Ananya Verma \(Class 5-B\)/)).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('applies for leave for a child', async ({ page, request }) => {
    const problems = monitor(page);
    await signIn(page, request, 'parent');
    await page.goto('/parent/leave');
    await settle(page);
    await page.locator('aside').getByRole('button', { name: /Yash Verma/ }).click();
    await expect(page.getByText(/For Yash Verma \(Class 8-A\)/)).toBeVisible();
    const day = new Date();
    day.setDate(day.getDate() + 12);
    await page.getByLabel('From').fill(iso(day));
    await page.getByLabel('To', { exact: true }).fill(iso(day));
    await page.getByPlaceholder('e.g. Fever, family function…').fill('Systest dentist visit');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByText('Leave application sent.')).toBeVisible();
    await expect(page.locator('li', { hasText: 'Systest dentist visit' })).toBeVisible();
    const leaves = (await call(request, 'admin', 'get', '/leaves?type=STUDENT')).body.data;
    expect(leaves.find((l) => l.reason === 'Systest dentist visit')).toMatchObject({ personId: 'STU-2026-0824', status: 'PENDING' });
    // Switching to Ananya hides Yash's application.
    await page.locator('aside').getByRole('button', { name: /Ananya Verma/ }).click();
    await expect(page.locator('li', { hasText: 'Systest dentist visit' })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('books a PTM slot; the admin overview shows the booking', async ({ page, request, browser }) => {
    const problems = monitor(page);
    const d = new Date();
    d.setDate(d.getDate() + 8);
    const created = await call(request, 'teacher', 'post', '/ptm/slots', {
      title: 'Systest PTM',
      date: iso(d),
      from: '09:00',
      to: '09:30',
      minutes: 15,
      location: 'Room 5',
    });
    expect(created.status).toBeLessThan(300);

    await signIn(page, request, 'parent');
    await page.goto('/parent/ptm');
    await settle(page);
    await page.getByRole('button', { name: '9:00 AM' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('select').selectOption('STU-2026-0512');
    await dialog.locator('textarea').fill('About maths homework');
    await dialog.getByRole('button', { name: 'Book', exact: true }).click();
    await expect(dialog).toBeHidden();
    const booking = page.locator('div.p-4', { hasText: 'Systest PTM' }).first();
    await expect(booking).toContainText('Ananya Verma');
    await expect(booking).toContainText('About maths homework');
    const slots = (await call(request, 'admin', 'get', `/ptm/slots?from=${iso(d)}`)).body.data;
    const bookedSlot = slots.find((s) => s.studentId === 'STU-2026-0512');
    expect(bookedSlot).toMatchObject({ title: 'Systest PTM', startTime: expect.stringMatching(/^09:00/) });
    // Only the 9:15 slot is still free.
    await expect(page.getByRole('button', { name: '9:00 AM' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '9:15 AM' })).toBeVisible();

    // Admin overview.
    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();
    const adminProblems = monitor(admin);
    await signIn(admin, request, 'admin');
    await admin.goto('/admin/ptm');
    await settle(admin);
    const group = admin.locator('div.p-4', { hasText: 'Systest PTM' }).first();
    await expect(group).toContainText('Anjali Singh');
    await expect(group).toContainText('1/2 Booked');
    await expect(group).toContainText('Ananya Verma (5-B)');
    await adminContext.close();
    expect(problems).toEqual([]);
    expect(adminProblems).toEqual([]);
  });

  test('views results and the report card', async ({ page, request }) => {
    const problems = monitor(page);
    await signIn(page, request, 'parent');
    await page.goto('/parent/results');
    await settle(page);
    await page.locator('aside').getByRole('button', { name: /Ananya Verma/ }).click();
    await settle(page);
    await expect(page.getByText('Unit Test 1').first()).toBeVisible();
    await expect(page.getByText('Mathematics').first()).toBeVisible();
    const results = (await call(request, 'parent', 'get', '/results/students/STU-2026-0512')).body.data;
    expect(results).toBeTruthy();

    await page.goto('/parent/report-card');
    await settle(page);
    const sheet = page.locator('.print-sheet');
    await expect(sheet).toContainText('Ananya Verma');
    await expect(sheet).toContainText('Mathematics');
    // Switch child with the page's own picker.
    await page.locator('main select').first().selectOption('STU-2026-0824');
    await settle(page);
    await expect(sheet).toContainText('Yash Verma');
    expect(problems).toEqual([]);
  });
});

test('public admission enquiry form (no login)', async ({ page, request }) => {
  const problems = monitor(page);
  await page.goto('/login');
  await page.getByRole('link', { name: /enquiry|Enquire|Apply/i }).first().click();
  await expect(page).not.toHaveURL(/\/login$/);
  await settle(page);
  const form = page.locator('form');
  await form.getByLabel(/Student name/).fill('Public Systest Child');
  await form.getByLabel(/Class sought/).selectOption('3');
  await form.getByLabel(/Parent \/ guardian name/).fill('Public Systest Parent');
  await form.locator('input[type="tel"]').fill('98700 11122');
  await form.getByRole('button', { name: /Send|Submit/ }).click();
  await expect(page.getByText(/thank|received/i).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ssa_auth_token'))).toBeNull();
  const list = (await call(request, 'admin', 'get', '/enquiries?q=Public%20Systest')).body.data;
  expect(list.find((e) => e.studentName === 'Public Systest Child')).toMatchObject({ classSought: '3', status: 'NEW' });
  expect(problems).toEqual([]);
});

test('language switch to Hindi and back persists across a reload', async ({ page, request }) => {
  const problems = monitor(page);
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'हिन्दी' })).toBeVisible();
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await page.reload();
  await expect(page.getByRole('button', { name: 'हिन्दी' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('ssa_language'))).toBe('hi');

  // Signed in, the portal is in Hindi too.
  const token = await apiLogin(request, 'teacher');
  await page.evaluate((t) => localStorage.setItem('ssa_auth_token', t), token);
  await page.goto('/teacher/dashboard');
  await settle(page);
  await expect(page.locator('aside').getByRole('button', { name: 'उपस्थिति', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('aside').getByRole('button', { name: 'Attendance', exact: true })).toBeVisible();
  await page.reload();
  await settle(page);
  await expect(page.locator('aside').getByRole('button', { name: 'Attendance', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ssa_language'))).toBe('en');
  expect(problems).toEqual([]);
});

test('parent messages the class teacher; a teacher message to the class reaches the parent', async ({ page, request, browser }) => {
  const problems = monitor(page);
  await signIn(page, request, 'parent');
  await page.goto('/parent/communication');
  await settle(page);
  await page.locator('aside').getByRole('button', { name: /Ananya Verma/ }).click();
  await settle(page);
  await page.getByRole('button', { name: 'Send Query to Teacher' }).click();
  const form = page.locator('form', { has: page.getByPlaceholder('Type your question or request here...') });
  const value = await form.locator('select option', { hasText: 'Anjali Singh' }).getAttribute('value');
  await form.locator('select').selectOption(value);
  await form.getByPlaceholder(/Leave application/).fill('Systest maths doubt');
  await form.getByPlaceholder('Type your question or request here...').fill('Please share extra practice sheets.');
  await form.getByRole('button', { name: 'Send Message' }).click();
  await expect(page.getByText('Your message has been sent to Anjali Singh.')).toBeVisible();
  await expect(page.getByText(/Systest maths doubt/).first()).toBeVisible();

  // The teacher sees it and writes to the whole class.
  const teacherContext = await browser.newContext();
  const teacher = await teacherContext.newPage();
  const teacherProblems = monitor(teacher);
  await signIn(teacher, request, 'teacher');
  await teacher.goto('/teacher/communication');
  await settle(teacher);
  await expect(teacher.getByText(/Systest maths doubt/).first()).toBeVisible();
  await expect(teacher.getByText(/\[Ananya Verma, 5-B\]/).first()).toBeVisible();
  await teacher.locator('main select').first().selectOption('5-B');
  await teacher.getByPlaceholder('e.g. Science Fair Project Submission Reminder').fill('Systest class 5-B note');
  await teacher.getByPlaceholder('Type your message...').fill('Practice sheets are on the study materials page.');
  await teacher.getByRole('button', { name: /Send/ }).last().click();
  await expect(teacher.getByText('Systest class 5-B note').first()).toBeVisible();
  await teacherContext.close();

  await page.reload();
  await settle(page);
  await expect(page.getByText('Systest class 5-B note').first()).toBeVisible();
  expect(problems).toEqual([]);
  expect(teacherProblems).toEqual([]);
});

test('a decided leave notifies the parent; the bell opens the leave page', async ({ page, request }) => {
  const problems = monitor(page);
  const leaves = (await call(request, 'teacher', 'get', '/leaves?type=STUDENT&status=PENDING')).body.data;
  const pending = leaves.find((l) => l.personId === 'STU-2026-0512');
  expect(pending, 'demo data has a pending leave for Ananya').toBeTruthy();
  const decided = await call(request, 'teacher', 'post', `/leaves/${pending.id}/decision`, { approve: true });
  expect(decided.status).toBeLessThan(300);

  await signIn(page, request, 'parent');
  await page.goto('/parent/dashboard');
  await settle(page);
  const bell = page.getByRole('button', { name: /Notifications \(\d+ unread\)/ });
  await expect(bell).toBeVisible();
  const before = Number((await bell.getAttribute('aria-label')).match(/\d+/)[0]);
  await bell.click();
  const panel = page.getByRole('dialog', { name: 'Notifications' });
  const item = panel.getByRole('button', { name: /leave/i }).first();
  await expect(item).toBeVisible();
  await item.click();
  await expect(page).toHaveURL(/\/parent\/leave$/);
  await expect(page.getByRole('button', { name: `Notifications (${before - 1} unread)` }).or(page.getByRole('button', { name: 'Notifications', exact: true }))).toBeVisible();
  expect(problems).toEqual([]);
});
