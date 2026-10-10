import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { API, apiLogin, monitor, resetDemoData, settle, signIn } from './helpers';

/** Admin office work: CSV import, admissions pipeline, transport, library, WhatsApp, settings, certificates. */

test.beforeAll(async ({ request }) => {
  await resetDemoData(request);
});

const api = async (request, path) => {
  const token = await apiLogin(request, 'admin');
  const res = await request.get(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  expect(res.ok(), `GET ${path}: ${res.status()}`).toBeTruthy();
  return (await res.json()).data;
};

test('import students from CSV: check, then import', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/import-students');
  await settle(page);
  const csv = [
    'name,class,roll,gender,date of birth,blood group,email,address,admission date,guardian name,guardian relation,guardian phone,guardian email',
    'Imported One,6-A,,Male,2014-02-03,A+,,Meerut,2026-04-01,Papa One,Father,9811100001,papa.one@example.com',
    'Imported Two,6-A,,Female,2014-05-06,,,Meerut,2026-04-01,Mummy Two,Mother,9811100002,',
    ',6-A,,,,,,,,,,,',
    'Bad Class,99-Z,,,,,,,,Someone,Father,9811100003,',
  ].join('\n');
  await page.locator('input[type="file"]').setInputFiles({ name: 'students.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(page.getByText('students.csv')).toBeVisible();
  await page.getByRole('button', { name: 'Check file' }).click();
  await expect(page.getByText('Check result')).toBeVisible();
  await expect(page.getByText(/2 of 4 rows are ready to import, 2 have errors/)).toBeVisible();
  // Nothing saved yet.
  expect((await api(request, '/students?q=Imported')).length).toBe(0);
  await expect(page.locator('tr', { hasText: 'Bad Class' })).toContainText('ERROR');

  await page.getByRole('button', { name: 'Import 2 students' }).click();
  await expect(page.getByText('2 students admitted')).toBeVisible();
  await expect(page.getByText('2 rows were skipped because of errors.')).toBeVisible();
  await expect(page.getByText(/New logins \(\d+\)/)).toBeVisible();
  const created = await api(request, '/students?q=Imported');
  expect(created.map((s) => s.name).sort()).toEqual(['Imported One', 'Imported Two']);
  expect(created.every((s) => s.className === '6-A')).toBe(true);
  expect(problems).toEqual([]);
});

test('admissions: add an enquiry, change its status, admit it', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/admissions');
  await settle(page);
  await page.getByRole('button', { name: 'Add enquiry' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/Student name/).fill('Ishaan Systest');
  await dialog.getByLabel(/Class sought/).selectOption('6');
  await dialog.getByLabel(/Parent \/ guardian name/).fill('Vikram Systest');
  await dialog.locator('input[type="tel"]').fill('12');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog.getByText('Enter a valid phone number (7–20 digits).')).toBeVisible();
  await dialog.locator('input[type="tel"]').fill('98111 22233');
  await dialog.getByLabel(/^Email/).fill('vikram.systest@example.com');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  const row = page.locator('li', { hasText: 'Ishaan Systest' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('New');

  // Change status to Visited with a follow-up date.
  await row.getByRole('button', { name: 'Change status' }).click();
  const statusDialog = page.getByRole('dialog');
  await statusDialog.getByRole('button', { name: 'Visited', exact: true }).click();
  await statusDialog.locator('input[type="date"]').fill('2026-12-01');
  await statusDialog.locator('textarea').fill('Came with father; liked the labs.');
  await statusDialog.getByRole('button', { name: 'Save' }).click();
  await expect(statusDialog).toBeHidden();
  // It left the "New" tab; find it under All.
  await page.getByRole('button', { name: /^All/ }).first().click();
  await settle(page);
  const row2 = page.locator('li', { hasText: 'Ishaan Systest' });
  await expect(row2).toContainText('Visited');
  let enquiry = (await api(request, '/enquiries?q=Ishaan')).find((e) => e.studentName === 'Ishaan Systest');
  expect(enquiry).toMatchObject({ status: 'VISITED', followUpDate: '2026-12-01' });

  // Admit into 6-A.
  await row2.getByRole('button', { name: 'Admit' }).click();
  const admit = page.getByRole('dialog');
  await admit.locator('select').first().selectOption('6-A');
  await admit.locator('form').getByRole('button', { name: 'Admit' }).click();
  await expect(admit.getByText('Student admitted')).toBeVisible();
  const studentId = (await admit.locator('strong').first().innerText()).trim();
  expect(studentId).toMatch(/^STU-/);
  await admit.getByRole('button', { name: 'Close' }).last().click();
  enquiry = (await api(request, '/enquiries?q=Ishaan')).find((e) => e.studentName === 'Ishaan Systest');
  expect(enquiry).toMatchObject({ status: 'ADMITTED', admittedStudentId: studentId });
  const student = await api(request, `/students/${studentId}`);
  expect(student).toMatchObject({ name: 'Ishaan Systest', className: '6-A' });
  await expect(page.locator('li', { hasText: 'Ishaan Systest' })).toContainText(studentId);
  expect(problems).toEqual([]);
});

test('transport: assign a student to a bus stop', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/transport');
  await settle(page);
  await page.getByRole('button', { name: 'Assign student' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('Search student by name or ID…').fill('Yash');
  await dialog.getByRole('button', { name: /Yash Verma/ }).click();
  await dialog.locator('select').first().selectOption('RT-001');
  await dialog.locator('select').nth(1).selectOption('Civil Lines Chowk');
  await dialog.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(dialog).toBeHidden();
  const routes = await api(request, '/transport/routes');
  const rider = routes.flatMap((r) => r.riders).find((r) => r.id === 'STU-2026-0824');
  expect(rider).toMatchObject({ routeId: 'RT-001', stopName: 'Civil Lines Chowk' });
  await expect(page.getByText('Yash Verma').first()).toBeVisible();
  expect(problems).toEqual([]);
});

test('library: issue a book and take it back', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/library');
  await settle(page);
  await page.getByRole('button', { name: 'Issue', exact: true }).first().click();
  await page.locator('select').first().selectOption('BK-007');
  await page.getByPlaceholder('Search student by name or ID…').fill('STU-2026-0503');
  await page.getByRole('button', { name: /Rohit Verma/ }).click();
  await page.locator('form').getByRole('button', { name: 'Issue', exact: true }).click();
  await expect(page.getByText(/“A Brief History of Time” issued to Rohit Verma/)).toBeVisible();
  let books = await api(request, '/library/books');
  expect(books.find((b) => b.id === 'BK-007').available).toBe(1);

  await page.getByRole('button', { name: 'Loans' }).click();
  await settle(page);
  const loan = page.locator('li, tr', { hasText: 'A Brief History of Time' }).filter({ hasText: 'Rohit Verma' }).first();
  await expect(loan).toBeVisible();
  await loan.getByRole('button', { name: 'Return' }).click();
  await expect(page.getByText(/A Brief History of Time/).first()).toBeVisible();
  await expect(page.locator('li, tr', { hasText: 'A Brief History of Time' }).filter({ hasText: 'Rohit Verma' })).toHaveCount(0);
  books = await api(request, '/library/books');
  expect(books.find((b) => b.id === 'BK-007').available).toBe(2);
  expect(problems).toEqual([]);
});

test('WhatsApp class messages open wa.me with the filled-in text', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.addInitScript(() => {
    window.__opened = [];
    window.open = (url) => {
      window.__opened.push(url);
      return {};
    };
  });
  await page.goto('/admin/whatsapp');
  await settle(page);
  await page.locator('#wa-class').selectOption('5-B');
  await settle(page);
  await page.locator('#wa-class-message').fill('Dear parent of {name} ({class}), PTM on Saturday.');
  const rohitRow = page.locator('div.py-3', { hasText: 'Rohit Verma' });
  await rohitRow.getByRole('button', { name: 'Send' }).click();
  const opened = await page.evaluate(() => window.__opened);
  expect(opened).toHaveLength(1);
  const url = new URL(opened[0]);
  expect(url.host).toBe('wa.me');
  expect(url.pathname).toMatch(/^\/91\d{10}$/);
  expect(url.searchParams.get('text')).toBe('Dear parent of Rohit Verma (5-B), PTM on Saturday.');
  await expect(rohitRow.getByRole('button', { name: 'Open again' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('school settings save', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/settings');
  await settle(page);
  await page.getByLabel(/Principal's name/).fill('Dr. Systest Principal');
  await page.getByLabel(/^Board/).fill('CBSE');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Settings saved.')).toBeVisible();
  const settings = await api(request, '/settings');
  expect(settings).toMatchObject({ principalName: 'Dr. Systest Principal', board: 'CBSE' });
  await page.reload();
  await settle(page);
  await expect(page.getByLabel(/Principal's name/)).toHaveValue('Dr. Systest Principal');
  expect(problems).toEqual([]);
});

test('issue a bonafide certificate and print it', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/students/STU-2026-0503');
  await settle(page);
  await page.getByLabel('Tabs').getByRole('button', { name: 'Certificates' }).click();
  await page.getByRole('button', { name: 'Issue Bonafide' }).click();
  const form = page.locator('form', { hasText: 'Issue Bonafide' });
  await form.getByPlaceholder('e.g. Bank account opening').fill('Passport application');
  await form.getByRole('button', { name: 'Issue certificate' }).click();
  await expect(page.getByText(/Bonafide.* issued\./)).toBeVisible();
  const certs = await api(request, '/students/STU-2026-0503/certificates');
  const cert = certs.find((c) => c.type === 'BONAFIDE' && c.reason === 'Passport application');
  expect(cert).toBeTruthy();

  await page.getByRole('link', { name: 'Print now' }).click();
  await expect(page).toHaveURL(new RegExp(`/certificate/${cert.id}$`));
  await settle(page);
  const sheet = page.locator('.print-sheet');
  await expect(sheet).toContainText('Rohit Verma');
  await expect(sheet).toContainText('bonafide student');
  await expect(sheet).toContainText('Passport application');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.no-print').first()).toBeHidden();
  await expect(sheet).toBeVisible();
  await page.emulateMedia({ media: 'screen' });

  // Listed on the Certificates page.
  await page.goto('/admin/certificates');
  await settle(page);
  await page.getByRole('button', { name: 'Bonafide', exact: true }).click();
  await expect(page.getByText(cert.id)).toBeVisible();
  expect(problems).toEqual([]);
});
