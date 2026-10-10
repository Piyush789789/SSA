import { test, expect } from '@playwright/test';
import { API, apiLogin, monitor, resetDemoData, settle, signIn } from './helpers';

/** Admin: add and edit a student, publish a notice (seen by a student), mark class attendance. */

test.beforeAll(async ({ request }) => {
  await resetDemoData(request);
});

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('add a student with government fields, then edit and see it on the profile', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/students/add');
  await settle(page);

  // Submitting an empty form shows the validation messages.
  await page.getByRole('button', { name: 'Create Student' }).click();
  await expect(page.getByText('Full Name is required.')).toBeVisible();

  const form = page.locator('form');
  await form.locator('input[name="fullName"]').fill('Kavya Systest');
  await form.locator('input[name="dob"]').fill('2015-04-12');
  await form.locator('select[name="gender"]').selectOption('Female');
  await form.locator('select[name="bloodGroup"]').selectOption('B+');
  await form.locator('select[name="grade"]').selectOption('5');
  await form.locator('select[name="section"]').selectOption('B');
  await form.locator('input[name="parentName"]').fill('Suresh Systest');
  await form.locator('select[name="relationship"]').selectOption('Father');
  await form.locator('input[name="parentPhone"]').fill('98765 43210');
  await form.locator('input[name="parentEmail"]').fill('suresh.systest@example.com');
  await form.locator('[name="address"]').fill('12 Station Road');
  await form.locator('input[name="city"]').fill('Meerut');
  await form.locator('select[name="state"]').selectOption('Uttar Pradesh');
  await form.locator('input[name="pinCode"]').fill('250001');
  // Government records.
  await form.locator('input[name="penNumber"]').fill('PEN998877');
  await form.locator('input[name="apaarId"]').fill('1234 5678 9012'); // non-digits are dropped
  await expect(form.locator('input[name="apaarId"]')).toHaveValue('123456789012');
  await form.locator('select[name="socialCategory"]').selectOption({ index: 2 });
  const category = await form.locator('select[name="socialCategory"]').inputValue();
  await form.locator('input[name="fatherName"]').fill('Suresh Kumar');
  await form.locator('input[name="motherName"]').fill('Rekha Devi');
  await form.getByRole('checkbox').check();

  await page.getByRole('button', { name: 'Create Student' }).click();
  await expect(page).toHaveURL(/\/admin\/students\/STU-[\d-]+$/);
  const id = page.url().split('/').pop();
  await settle(page);
  await expect(page.getByText('Kavya Systest').first()).toBeVisible();
  const gov = page.locator('div', { has: page.getByRole('heading', { name: 'Government records' }) }).last();
  await expect(gov).toContainText('PEN998877');
  await expect(gov).toContainText('123456789012');
  await expect(gov).toContainText(category);
  await expect(gov).toContainText('Suresh Kumar');
  await expect(gov).toContainText('Rekha Devi');
  await expect(gov).toContainText('Yes');

  // API agrees.
  const token = await apiLogin(request, 'admin');
  const headers = { Authorization: `Bearer ${token}` };
  let student = (await (await request.get(`${API}/students/${id}`, { headers })).json()).data;
  expect(student).toMatchObject({ name: 'Kavya Systest', className: '5-B', penNumber: 'PEN998877', apaarId: '123456789012', rte: true });
  expect(student.address).toContain('Meerut, Uttar Pradesh - 250001');

  // Edit: change the name, mother's name and blood group.
  await page.getByRole('button', { name: /Edit Student/ }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/students/add\\?edit=${id}`));
  await settle(page);
  await expect(form.locator('input[name="fullName"]')).toHaveValue('Kavya Systest');
  await expect(form.locator('input[name="penNumber"]')).toHaveValue('PEN998877');
  await form.locator('input[name="fullName"]').fill('Kavya Systest Sharma');
  await form.locator('input[name="motherName"]').fill('Rekha Sharma');
  await form.locator('select[name="bloodGroup"]').selectOption('O+');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/students/${id}$`));
  await settle(page);
  await expect(page.getByText('Kavya Systest Sharma').first()).toBeVisible();
  await expect(gov).toContainText('Rekha Sharma');
  await expect(gov).toContainText('PEN998877'); // kept
  student = (await (await request.get(`${API}/students/${id}`, { headers })).json()).data;
  expect(student).toMatchObject({ name: 'Kavya Systest Sharma', motherName: 'Rekha Sharma', bloodGroup: 'O+', penNumber: 'PEN998877' });
  // The address was not duplicated by the edit.
  expect(student.address.match(/Meerut/g)).toHaveLength(1);

  // The new student is listed on the Students page and in class 5-B.
  await page.goto('/admin/students?q=Kavya');
  await settle(page);
  await expect(page.getByText('Kavya Systest Sharma').first()).toBeVisible();
  expect(problems).toEqual([]);
});

test('a notice published by the admin is seen by a student', async ({ page, request, browser }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/notices');
  await settle(page);
  await page.getByRole('button', { name: 'New Notice' }).click();
  await page.getByRole('button', { name: 'Publish Notice' }).click();
  await expect(page.getByText('Title is required.')).toBeVisible();
  await page.locator('input[name="title"]').fill('Systest sports day');
  await page.locator('textarea[name="description"]').fill('Sports day is on Friday. Wear the house T-shirt.');
  await page.locator('select[name="priority"]').selectOption('high');
  await page.locator('select[name="audience"]').selectOption('STUDENTS');
  await page.getByRole('button', { name: 'Publish Notice' }).click();
  await expect(page.getByText('Notice published successfully.')).toBeVisible();
  await expect(page.getByText('Systest sports day')).toBeVisible();

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  const studentProblems = monitor(studentPage);
  await signIn(studentPage, request, 'student');
  await studentPage.goto('/student/notices');
  await settle(studentPage);
  await expect(studentPage.getByText('Systest sports day')).toBeVisible();
  await expect(studentPage.getByText('Sports day is on Friday.', { exact: false })).toBeVisible();
  await studentContext.close();

  // A staff-only notice is not shown to students.
  const token = await apiLogin(request, 'student');
  const list = (await (await request.get(`${API}/notices`, { headers: { Authorization: `Bearer ${token}` } })).json()).data;
  expect(list.some((n) => n.title === 'Systest sports day')).toBe(true);
  expect(problems).toEqual([]);
  expect(studentProblems).toEqual([]);
});

test('admin marks class attendance', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/attendance');
  await settle(page);
  await page.getByRole('button', { name: 'Mark Attendance' }).click();
  const modal = page.locator('div.fixed', { hasText: 'Mark Class Attendance' });
  await modal.locator('select').selectOption('6-A');
  // Use a recent weekday (Saturday/Sunday may be closed days).
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await modal.locator('input[type="date"]').fill(date);
  await settle(page);
  const rows = modal.locator('div.p-3.rounded-2xl');
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  expect(count).toBeGreaterThan(1);
  const firstId = (await rows.nth(0).locator('p').innerText()).split('•')[1].trim();
  const secondId = (await rows.nth(1).locator('p').innerText()).split('•')[1].trim();
  await rows.nth(0).getByRole('button', { name: 'absent' }).click();
  await rows.nth(1).getByRole('button', { name: 'late' }).click();
  await modal.getByRole('button', { name: 'Save Attendance' }).click();
  await expect(page.getByText(/Attendance saved for Class 6-A/)).toBeVisible();
  await expect(modal).toBeHidden();

  const token = await apiLogin(request, 'admin');
  const recs = (await (await request.get(`${API}/attendance?className=6-A&date=${date}`, { headers: { Authorization: `Bearer ${token}` } })).json()).data;
  expect(recs).toHaveLength(count);
  expect(recs.find((r) => r.studentId === firstId).status).toBe('absent');
  expect(recs.find((r) => r.studentId === secondId).status).toBe('late');

  // Re-opening shows the saved marks.
  await page.getByRole('button', { name: 'Mark Attendance' }).click();
  await modal.locator('select').selectOption('6-A');
  await modal.locator('input[type="date"]').fill(date);
  await expect(modal.getByText('Already marked')).toBeVisible();
  await expect(rows.nth(0).getByRole('button', { name: 'absent' })).toHaveClass(/bg-rose-500/);
  // A future date cannot be picked (max = today).
  await expect(modal.locator('input[type="date"]')).toHaveAttribute('max', today());
  expect(problems).toEqual([]);
});

test('edit and delete a notice; a staff-only notice is hidden from students', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/admin/notices');
  await settle(page);
  await page.getByRole('button', { name: 'New Notice' }).click();
  await page.locator('input[name="title"]').fill('Systest staff meeting');
  await page.locator('textarea[name="description"]').fill('Staff room at 3 PM.');
  await page.locator('select[name="audience"]').selectOption('STAFF');
  await page.getByRole('button', { name: 'Publish Notice' }).click();
  await expect(page.getByText('Notice published successfully.')).toBeVisible();

  const card = page.locator('div', { has: page.getByRole('heading', { name: 'Systest staff meeting' }) }).filter({ has: page.getByLabel('Edit notice') }).last();
  await card.getByLabel('Edit notice').click();
  await expect(page.locator('input[name="title"]')).toHaveValue('Systest staff meeting');
  await expect(page.locator('select[name="audience"]')).toHaveValue('STAFF');
  await page.locator('input[name="title"]').fill('Systest staff meeting (moved)');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Notice updated successfully.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Systest staff meeting (moved)' })).toBeVisible();

  const studentToken = await apiLogin(request, 'student');
  const forStudent = (await (await request.get(`${API}/notices`, { headers: { Authorization: `Bearer ${studentToken}` } })).json()).data;
  expect(forStudent.some((n) => n.title.startsWith('Systest staff meeting'))).toBe(false);
  const teacherToken = await apiLogin(request, 'teacher');
  const forTeacher = (await (await request.get(`${API}/notices`, { headers: { Authorization: `Bearer ${teacherToken}` } })).json()).data;
  expect(forTeacher.some((n) => n.title === 'Systest staff meeting (moved)')).toBe(true);

  const moved = page.locator('div', { has: page.getByRole('heading', { name: 'Systest staff meeting (moved)' }) }).filter({ has: page.getByLabel('Delete notice') }).last();
  await moved.getByLabel('Delete notice').click();
  await page.getByRole('button', { name: /^Delete/ }).last().click();
  await expect(page.getByText('Notice deleted successfully.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Systest staff meeting (moved)' })).toHaveCount(0);
  expect(problems).toEqual([]);
});
