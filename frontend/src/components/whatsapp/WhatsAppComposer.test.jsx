import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@/i18n/I18nProvider';
import { LANG_STORAGE_KEY } from '@/i18n/translate';
import { MESSAGE_TEMPLATES } from '@/utils/whatsapp';

vi.mock('@/api/http', () => ({ http: { get: vi.fn(), post: vi.fn() } }));
const auth = { current: { currentUser: { role: 'admin' } } };
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth.current }));

const { http } = await import('@/api/http');
const { WhatsAppComposer, WhatsAppButton } = await import('./WhatsAppComposer');

const student = {
  id: 'STU-1',
  name: 'Asha Verma',
  className: '5-B',
  rollNumber: 7,
  guardian: { name: 'Ramesh Verma', relation: 'Father', phone: '+91 98765 12345' },
};

const PARENTS = [
  { id: 'P1', name: 'Sita Verma', relation: 'Mother', phone: '98765 00000', childIds: ['STU-1'] },
  { id: 'P2', name: 'Ramesh again', phone: '09876512345', childIds: ['STU-1'] },
];

const renderComposer = (props = {}, lang) => {
  if (lang) localStorage.setItem(LANG_STORAGE_KEY, lang);
  const onClose = vi.fn();
  render(
    <I18nProvider>
      <WhatsAppComposer student={student} onClose={onClose} {...props} />
    </I18nProvider>,
  );
  return { onClose };
};

const expectedText = (id, lang) =>
  MESSAGE_TEMPLATES.find((t) => t.id === id)
    .text[lang].replace(/\{name\}/g, 'Asha Verma')
    .replace(/\{class\}/g, '5-B')
    .replace(/\{school\}/g, 'SSA Academy')
    .replace(/\{date\}/g, new Date().toLocaleDateString('en-IN'));

const lastOpenedText = (open) => {
  const url = new URL(open.mock.calls.at(-1)[0]);
  return { number: url.pathname.slice(1), text: url.searchParams.get('text'), host: url.host };
};

describe('WhatsAppComposer', () => {
  let open;
  beforeEach(() => {
    auth.current = { currentUser: { role: 'admin' } };
    vi.mocked(http.get).mockReset().mockImplementation(async (path) => {
      if (path === '/settings') return { schoolName: 'SSA Academy' };
      if (path === '/parents') return PARENTS;
      throw new Error(path);
    });
    open = vi.spyOn(window, 'open').mockImplementation(() => null);
  });
  afterEach(() => open.mockRestore());

  it('lists the guardian and linked parents once each', async () => {
    renderComposer();
    expect(await screen.findByText('Sita Verma')).toBeInTheDocument();
    expect(screen.getByText('Ramesh Verma')).toBeInTheDocument();
    expect(screen.queryByText('Ramesh again')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Open WhatsApp' })).toHaveLength(2);
  });

  it('teachers do not load parent records', async () => {
    auth.current = { currentUser: { role: 'teacher' } };
    renderComposer();
    await waitFor(() => expect(http.get).toHaveBeenCalledWith('/settings'));
    expect(http.get).not.toHaveBeenCalledWith('/parents');
    expect(screen.getAllByRole('button', { name: 'Open WhatsApp' })).toHaveLength(1);
  });

  it('opens wa.me with the filled-in message for the guardian', async () => {
    const user = userEvent.setup();
    renderComposer();
    await screen.findByText(/SSA Academy/);
    await user.click(screen.getAllByRole('button', { name: 'Open WhatsApp' })[0]);
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/wa\.me\/919876512345\?text=/), '_blank', 'noopener,noreferrer');
    expect(lastOpenedText(open).text).toBe(expectedText('update', 'en'));
    expect(screen.getByRole('button', { name: 'Open again' })).toBeInTheDocument();
  });

  it('switches template and message language', async () => {
    const user = userEvent.setup();
    renderComposer();
    await screen.findByText(/SSA Academy/);
    await user.click(screen.getByRole('button', { name: 'Fee reminder' }));
    expect(screen.getByLabelText('Message')).toHaveValue(MESSAGE_TEMPLATES.find((t) => t.id === 'fees').text.en);

    await user.click(screen.getByRole('button', { name: 'हिन्दी' }));
    expect(screen.getByLabelText('Message')).toHaveValue(MESSAGE_TEMPLATES.find((t) => t.id === 'fees').text.hi);
    // Template chips now show Hindi labels.
    expect(screen.getByRole('button', { name: 'शुल्क अनुस्मारक' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'आज अनुपस्थित' }));
    await user.click(screen.getAllByRole('button', { name: 'Open WhatsApp' })[1]);
    const sent = lastOpenedText(open);
    expect(sent.number).toBe('919876500000');
    expect(sent.text).toBe(expectedText('absent', 'hi'));
  });

  it('starts with Hindi templates when the app is in Hindi', async () => {
    renderComposer({}, 'hi');
    await waitFor(() => expect(http.get).toHaveBeenCalledWith('/settings'));
    expect(screen.getByLabelText('संदेश')).toHaveValue(MESSAGE_TEMPLATES[0].text.hi);
  });

  it('uses the edited message and refuses an empty one', async () => {
    const user = userEvent.setup();
    renderComposer();
    await screen.findByText(/SSA Academy/);
    const box = screen.getByLabelText('Message');
    await user.clear(box);
    await user.click(screen.getAllByRole('button', { name: 'Open WhatsApp' })[0]);
    expect(screen.getByText('Write a message first.')).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();

    await user.type(box, 'Hi {{name}, roll {{roll}');
    await user.click(screen.getAllByRole('button', { name: 'Open WhatsApp' })[0]);
    expect(lastOpenedText(open).text).toBe('Hi Asha Verma, roll 7');
  });

  it('explains when the family has no phone number', async () => {
    auth.current = { currentUser: { role: 'teacher' } };
    render(
      <I18nProvider>
        <WhatsAppComposer student={{ ...student, guardian: { name: 'X', phone: '' } }} onClose={() => {}} />
      </I18nProvider>,
    );
    expect(await screen.findByText(/No phone number is saved/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open WhatsApp' })).not.toBeInTheDocument();
  });

  it('closes with the close button and Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderComposer();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('WhatsAppButton opens and closes the composer', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <WhatsAppButton student={student} />
      </I18nProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'WhatsApp' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
