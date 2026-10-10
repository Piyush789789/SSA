import { test, expect } from '@playwright/test';
import { API, apiLogin, monitor, resetDemoData, settle, signIn } from './helpers';

/** Fees: the office collects a payment and sees the receipt; a parent reports a deposit and the office approves it. */

test.beforeAll(async ({ request }) => {
  await resetDemoData(request);
});

const get = async (request, who, path) => {
  const token = await apiLogin(request, who);
  const res = await request.get(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  expect(res.ok(), `GET ${path}`).toBeTruthy();
  return (await res.json()).data;
};

test('admin collects a payment and sees the receipt', async ({ page, request }) => {
  const problems = monitor(page);
  const before = await get(request, 'admin', '/fees/students/STU-2026-0824/summary');
  const due = before.dues.find((d) => d.pending > 0);
  expect(due, 'Yash has an unpaid due').toBeTruthy();

  await signIn(page, request, 'admin');
  await page.goto('/fees');
  await settle(page);
  await page.getByRole('button', { name: 'Collect Fee' }).click();
  await page.getByPlaceholder(/Search by name, roll no., student ID/).fill('STU-2026-0824');
  await page.getByRole('button', { name: /Yash Verma/ }).click();
  await settle(page);
  const row = page.locator('tr', { hasText: due.title }).first();
  await row.getByRole('button', { name: 'Collect' }).click();

  const modal = page.locator('div.fixed', { hasText: `Collect — ${due.title}` });
  const amountInput = modal.locator('input[type="number"]');
  await expect(amountInput).toHaveValue(String(due.pending));
  // More than the balance is refused.
  await amountInput.fill(String(due.pending + 1));
  // The browser blocks the submit (max = balance), so nothing is recorded.
  await modal.getByRole('button', { name: 'Confirm & Record' }).click();
  expect(await amountInput.evaluate((el) => el.validity.rangeOverflow)).toBe(true);
  await expect(modal).toBeVisible();
  const part = Math.min(500, due.pending);
  await amountInput.fill(String(part));
  await modal.locator('select').selectOption({ index: 0 });
  await modal.getByPlaceholder(/Cheque no./).fill('SYSTEST-CASH-1');
  await modal.getByRole('button', { name: 'Confirm & Record' }).click();

  // Receipt.
  const receipt = page.locator('#printable-receipt');
  await expect(receipt).toBeVisible();
  await expect(receipt).toContainText('Fee Payment Receipt');
  await expect(receipt).toContainText('Yash Verma');
  const receiptNo = (await receipt.locator('strong.font-mono').first().innerText()).trim();
  expect(receiptNo).toMatch(/\S+/);
  await expect(page.getByText(`Payment recorded — receipt ${receiptNo}.`)).toBeVisible();

  // API: the due went down and the payment is listed.
  const after = await get(request, 'admin', '/fees/students/STU-2026-0824/summary');
  expect(after.dues.find((d) => d.id === due.id).pending).toBe(due.pending - part);
  const payments = await get(request, 'admin', '/fees/payments?studentId=STU-2026-0824');
  expect(payments.some((p) => p.receiptNo === receiptNo && p.amount === part)).toBe(true);

  // Close the receipt: the table shows the new balance without a reload.
  await page.keyboard.press('Escape');
  const close = page.locator('div.fixed button.absolute').first();
  if (await receipt.isVisible()) await close.click();
  await expect(receipt).toBeHidden();
  await expect(page.locator('tr', { hasText: due.title }).first()).toContainText(
    new Intl.NumberFormat('en-IN').format(due.pending - part),
  );
  expect(problems).toEqual([]);
});

test('parent submits a fee deposit and the office approves it', async ({ page, request, browser }) => {
  const parentProblems = monitor(page);
  await signIn(page, request, 'parent');
  await page.goto('/parent/fees');
  await settle(page);
  // Pick Ananya.
  await page.locator('select', { has: page.locator('option', { hasText: 'Ananya' }) }).first().selectOption('STU-2026-0512');
  await settle(page);
  await page.getByRole('button', { name: 'Deposit fee' }).click();
  const form = page.locator('form', { hasText: 'Deposit Fee' });
  const feeSelect = form.getByLabel('Fee');
  const dueId = await feeSelect.inputValue();
  const summaryBefore = await get(request, 'admin', '/fees/students/STU-2026-0512/summary');
  const due = summaryBefore.dues.find((d) => d.id === dueId);
  const amount = Math.min(700, due.pending);
  await form.getByLabel(/Amount/).fill(String(amount));
  await form.getByLabel('Reference / Transaction No.').fill('UPI-SYSTEST-777');
  await form.getByLabel('Note (optional)').fill('Paid by GPay');
  await form.getByRole('button', { name: 'Submit for verification' }).click();
  await expect(page.getByText(/Deposit submitted\. The school office will verify it/)).toBeVisible();
  await expect(page.getByText('UPI-SYSTEST-777').first()).toBeVisible();

  const pending = await get(request, 'admin', '/fees/deposits?status=PENDING');
  const deposit = pending.find((d) => d.referenceNo === 'UPI-SYSTEST-777');
  expect(deposit).toMatchObject({ studentId: 'STU-2026-0512', amount, status: 'PENDING' });

  // Admin approves it.
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  const adminProblems = monitor(admin);
  await signIn(admin, request, 'admin');
  await admin.goto('/fees');
  await settle(admin);
  await admin.getByRole('button', { name: 'Deposits to Verify' }).click();
  await settle(admin);
  const row = admin.locator('tr', { hasText: 'UPI-SYSTEST-777' });
  await expect(row).toContainText('Ananya');
  await row.getByRole('button', { name: 'Approve' }).click();
  await expect(admin.getByText('Approve this deposit?')).toBeVisible();
  await admin.getByRole('button', { name: 'Approve', exact: true }).last().click();
  await expect(admin.getByText('Deposit approved and payment recorded.')).toBeVisible();
  await expect(admin.locator('tr', { hasText: 'UPI-SYSTEST-777' })).toHaveCount(0);
  await adminContext.close();

  const all = await get(request, 'admin', '/fees/deposits?studentId=STU-2026-0512');
  expect(all.find((d) => d.id === deposit.id).status).toBe('APPROVED');
  const summaryAfter = await get(request, 'admin', '/fees/students/STU-2026-0512/summary');
  expect(summaryAfter.dues.find((d) => d.id === dueId).pending).toBe(due.pending - amount);

  // Parent sees it approved after a reload.
  await page.reload();
  await settle(page);
  await expect(page.getByText('APPROVED').first()).toBeVisible();
  expect(parentProblems).toEqual([]);
  expect(adminProblems).toEqual([]);
});

test('admin adds a fee head; every student of the class is billed', async ({ page, request }) => {
  const problems = monitor(page);
  await signIn(page, request, 'admin');
  await page.goto('/fees');
  await settle(page);
  await page.getByRole('button', { name: 'Fee Structure' }).click();
  await settle(page);
  await page.getByRole('button', { name: 'Add Fee Head' }).first().click();
  const modal = page.locator('form', { has: page.locator('input[name="title"]') });
  await modal.locator('input[name="title"]').fill('Systest Science Fair Fee');
  await modal.locator('input[name="amount"]').fill('750');
  await modal.locator('input[type="date"]').fill('2026-12-15');
  await modal.getByRole('button', { name: '6-A', exact: true }).click();
  await modal.getByRole('button', { name: 'Add Fee Head' }).click();
  await expect(modal).toBeHidden();
  await expect(page.locator('tr', { hasText: 'Systest Science Fair Fee' })).toBeVisible();

  const heads = await get(request, 'admin', '/fees/heads');
  const head = heads.find((h) => h.title === 'Systest Science Fair Fee');
  expect(head).toMatchObject({ amount: 750, classNames: ['6-A'] });
  const students = await get(request, 'admin', '/classes/6-A/students');
  const summary = await get(request, 'admin', `/fees/students/${students[0].id}/summary`);
  expect(summary.dues.find((d) => d.feeHeadId === head.id)).toMatchObject({ amount: 750, pending: 750 });
  expect(problems).toEqual([]);
});
