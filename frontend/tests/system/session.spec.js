import { test, expect } from '@playwright/test';
import { API, ACCOUNTS, apiLogin, monitor, resetDemoData, settle } from './helpers';

/** Login, logout, forced password change and a limited staff login, all driven through the UI. */

test.beforeAll(async ({ request }) => {
  await resetDemoData(request);
});

const ROLE_LABEL = { admin: 'Admin', teacher: 'Teacher', student: 'Student', parent: 'Parent' };

async function uiLogin(page, roleLabel, login, password) {
  await page.goto('/login');
  await page.getByRole('button', { name: roleLabel, exact: true }).click();
  await expect(page.getByText(`Signing in as ${roleLabel}`)).toBeVisible();
  await page.getByPlaceholder(/Email, or student ID/).fill(login);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: `Sign In as ${roleLabel}` }).click();
}

for (const who of ['admin', 'teacher', 'student', 'parent']) {
  test(`${who} signs in through the form and signs out`, async ({ page, request }) => {
    const problems = monitor(page);
    await uiLogin(page, ROLE_LABEL[who], ACCOUNTS[who].email, ACCOUNTS[who].password);
    await expect(page).toHaveURL(new RegExp(`/${who}/dashboard$`));
    await settle(page);
    const token = await page.evaluate(() => localStorage.getItem('ssa_auth_token'));
    expect(token).toBeTruthy();

    // Reload keeps the session.
    await page.reload();
    await settle(page);
    await expect(page).toHaveURL(new RegExp(`/${who}/dashboard$`));

    // Sign out from the header's user menu.
    if (who === 'admin') {
      await page.locator('header button[aria-haspopup="menu"]').click();
      await page.getByRole('menuitem', { name: /Log out/i }).click();
    } else {
      // Teacher/student/parent: the sign-out icon at the bottom of the sidebar.
      await page.locator('aside').getByTitle('Logout').click();
    }
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('ssa_auth_token'))).toBeNull();
    // The session is ended on the server too: the old token no longer works.
    await expect
      .poll(async () => (await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })).status())
      .toBe(401);
    // Protected pages send a signed-out visitor back to the login page.
    await page.goto(`/${who}/dashboard`);
    await expect(page).toHaveURL(/\/login$/);
    expect(problems).toEqual([]);
  });
}

test('wrong password shows an error and stays on the login page', async ({ page }) => {
  await uiLogin(page, 'Teacher', 'teacher@ssa.edu', 'wrong-password-1');
  await expect(page.locator('.bg-red-50')).toBeVisible();
  await expect(page.locator('.bg-red-50')).toContainText(/invalid|incorrect|wrong/i);
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('ssa_auth_token'))).toBeNull();
});

test('a student login used with the Teacher role is refused', async ({ page }) => {
  await uiLogin(page, 'Teacher', 'student@ssa.edu', 'student123');
  await expect(page.locator('.bg-red-50')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('forced password change after an admin reset', async ({ page, request }) => {
  const problems = monitor(page);
  // Admin resets the teacher's password from the Logins page.
  const adminToken = await apiLogin(request, 'admin');
  await page.addInitScript((t) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('ssa_auth_token', t);
      sessionStorage.setItem('seeded', '1');
    }
  }, adminToken);
  await page.goto('/admin/accounts');
  await settle(page);
  await page.locator('main').getByRole('button', { name: /^Teachers/ }).click();
  await page.getByPlaceholder('Search name, ID or login').fill('teacher@ssa.edu');
  const row = page.locator('tr', { hasText: 'teacher@ssa.edu' });
  await row.getByRole('button', { name: 'Reset password' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Password reset')).toBeVisible();
  const temp = (await dialog.locator('strong.tracking-wider').innerText()).trim();
  expect(temp.length).toBeGreaterThan(5);
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(row.getByText('Temporary password')).toBeVisible();

  // Sign out and sign in as the teacher with the temporary password.
  await page.locator('header button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: /Log out/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await uiLogin(page, 'Teacher', 'teacher@ssa.edu', temp);
  await expect(page.getByText('Set your own password')).toBeVisible();

  // A weak or mismatched password is refused in the form.
  await page.getByLabel('Current password').fill(temp);
  await page.getByLabel('New password', { exact: true }).fill('short');
  await page.getByLabel('Repeat new password').fill('short');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
  await page.getByLabel('New password', { exact: true }).fill('newpass123');
  await page.getByLabel('Repeat new password').fill('newpass124');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByText('The two new passwords do not match.')).toBeVisible();

  await page.getByLabel('Repeat new password').fill('newpass123');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByText('Set your own password')).toBeHidden();
  await expect(page).toHaveURL(/\/teacher\/dashboard$/);
  await settle(page);

  // The new password works on the API, the old one does not.
  const ok = await request.post(`${API}/auth/login`, { data: { email: 'teacher@ssa.edu', password: 'newpass123', role: 'TEACHER' } });
  expect(ok.status()).toBe(200);
  expect((await ok.json()).user.mustChangePassword).toBe(false);
  const old = await request.post(`${API}/auth/login`, { data: ACCOUNTS.teacher });
  expect(old.status()).toBeGreaterThanOrEqual(400);
  expect(problems).toEqual([]);

  // Put the demo password back for the other tests.
  await resetDemoData(request);
});

test('limited staff login with only FEES', async ({ page, request }) => {
  const problems = monitor(page);
  const adminToken = await apiLogin(request, 'admin');
  await page.addInitScript((t) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('ssa_auth_token', t);
      sessionStorage.setItem('seeded', '1');
    }
  }, adminToken);
  await page.goto('/admin/accounts');
  await settle(page);
  await page.locator('main').getByRole('button', { name: /^Staff logins/ }).click();
  await page.getByRole('button', { name: 'Add staff login' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Full name').fill('Meena Accountant');
  await dialog.getByLabel(/Login \(email or a user name\)/).fill('accounts@ssa.edu');
  await dialog.getByLabel(/Title/).fill('Accountant');
  await dialog.getByLabel('Fees & payments').check();
  await expect(dialog.getByText(/change only the ticked modules/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Create login' }).click();
  await expect(page.getByRole('dialog').getByText('Login created')).toBeVisible();
  const temp = (await page.getByRole('dialog').locator('strong.tracking-wider').innerText()).trim();
  await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();
  const row = page.locator('tr', { hasText: 'Meena Accountant' });
  await expect(row).toContainText('Accountant');
  await expect(row).toContainText('Fees & payments');
  await expect(row).toContainText('Temporary password');

  // API: the account exists with only FEES.
  const list = await (await request.get(`${API}/accounts`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  const acct = list.data.find((a) => a.loginId === 'accounts@ssa.edu');
  expect(acct.permissions).toEqual(['FEES']);

  // Sign out, sign in as the new staff member and set a password.
  await page.locator('header button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: /Log out/i }).click();
  await uiLogin(page, 'Admin', 'accounts@ssa.edu', temp);
  await expect(page.getByText('Set your own password')).toBeVisible();
  await page.getByLabel('Current password').fill(temp);
  await page.getByLabel('New password', { exact: true }).fill('fees2026ok');
  await page.getByLabel('Repeat new password').fill('fees2026ok');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await settle(page);

  const sidebar = page.locator('aside');
  await expect(sidebar.getByText('Accountant')).toBeVisible();
  await expect(sidebar.getByRole('button', { name: 'Fees' })).toBeVisible();
  for (const hidden of ['Logins & Parents', 'Year-end Promotion', 'Audit Log', 'Backups', 'School Settings']) {
    await expect(sidebar.getByRole('button', { name: hidden })).toHaveCount(0);
  }
  // Forbidden pages redirect to the dashboard.
  for (const path of ['/admin/settings', '/admin/accounts', '/admin/backups', '/admin/audit', '/admin/promotion']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  }
  await settle(page);
  // The Fees page opens.
  await page.goto('/fees');
  await settle(page);
  await expect(page).toHaveURL(/\/fees$/);

  // API: the staff login may read fees but may not change settings.
  const staffLogin = await request.post(`${API}/auth/login`, { data: { email: 'accounts@ssa.edu', password: 'fees2026ok', role: 'ADMIN' } });
  expect(staffLogin.status()).toBe(200);
  const staffToken = (await staffLogin.json()).token;
  const notice = await request.post(`${API}/notices`, {
    headers: { Authorization: `Bearer ${staffToken}` },
    data: { title: 'x', content: 'y', category: 'General', audience: 'ALL' },
  });
  expect(notice.status()).toBe(403);
  expect(problems).toEqual([]);
});

test('teacher changes the password from the header menu', async ({ page, request }) => {
  const problems = monitor(page);
  await uiLogin(page, 'Teacher', ACCOUNTS.teacher.email, ACCOUNTS.teacher.password);
  await expect(page).toHaveURL(/\/teacher\/dashboard$/);
  await settle(page);
  await page.getByRole('button', { name: 'Teacher Profile Menu' }).click();
  await page.getByRole('button', { name: 'Change password' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Current password').fill(ACCOUNTS.teacher.password);
  await dialog.getByLabel('New password', { exact: true }).fill('teacher2026new');
  await dialog.getByLabel('Repeat new password').fill('teacher2026new');
  await dialog.getByRole('button', { name: 'Change password' }).click();
  await expect(dialog).toBeHidden();
  const ok = await request.post(`${API}/auth/login`, { data: { email: 'teacher@ssa.edu', password: 'teacher2026new', role: 'TEACHER' } });
  expect(ok.status()).toBe(200);
  expect(problems).toEqual([]);
  await resetDemoData(request);
});
