import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { QuestionBreakdown, QuestionBreakdownRow } from './QuestionBreakdown';

const QUESTIONS = [
  { label: 'Q1', maxMarks: 5 },
  { label: 'Q2', maxMarks: 5 },
  { label: 'Q3', maxMarks: 10 },
  { label: 'Q4', maxMarks: 5 },
];
const SUBJECT = {
  subject: 'Mathematics',
  maxMarks: 25,
  obtainedMarks: 13,
  absent: false,
  questions: QUESTIONS,
  questionMarks: [5, 1, 7, null],
};

const inTable = (ui) => (
  <table>
    <tbody>{ui}</tbody>
  </table>
);

describe('QuestionBreakdown', () => {
  it('shows a chip per question with tones for full, weak and not attempted', () => {
    render(<QuestionBreakdown subject={SUBJECT} />);
    const items = within(screen.getByRole('list', { name: 'Question-wise marks' })).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('Q15/5');
    expect(items[0]).toHaveAttribute('data-tone', 'full');
    expect(items[1]).toHaveTextContent('1/5');
    expect(items[1]).toHaveAttribute('data-tone', 'weak');
    expect(items[2]).toHaveAttribute('data-tone', 'ok');
    expect(items[3]).toHaveTextContent('Not attempted');
    expect(items[3]).toHaveAttribute('data-tone', 'none');
    expect(screen.getByText('1 with full marks · 1 below 40%')).toBeInTheDocument();
  });

  it('says Absent when the student was absent', () => {
    render(<QuestionBreakdown subject={{ ...SUBJECT, absent: true, questionMarks: null }} />);
    expect(screen.getByText('Absent for this paper.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('explains when only the total was entered', () => {
    render(<QuestionBreakdown subject={{ ...SUBJECT, questionMarks: null }} />);
    expect(screen.getByText(/Only the total was entered/)).toBeInTheDocument();
  });

  it('renders nothing for a paper without questions', () => {
    const { container } = render(inTable(<QuestionBreakdownRow subject={{ ...SUBJECT, questions: [] }} colSpan={6} />));
    expect(container.querySelector('tr')).toBeNull();
  });

  it('expands and collapses from the results table, in Hindi too', async () => {
    renderWithProviders(inTable(<QuestionBreakdownRow subject={SUBJECT} colSpan={6} />), { lang: 'hi' });
    const toggle = screen.getByRole('button', { name: /प्रश्नवार अंक/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('हल नहीं किया')).toBeInTheDocument();
    await userEvent.click(toggle);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
