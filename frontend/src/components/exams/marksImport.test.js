import { describe, expect, it } from 'vitest';
import {
  buildTemplateRows,
  headerKey,
  isAbsentValue,
  mapColumns,
  mapSheetToImportRows,
  mergeImportResult,
  parseCsv,
  templateFileName,
} from './marksImport';

const Q = [
  { label: 'Q1', maxMarks: 5 },
  { label: 'Q2', maxMarks: 5 },
  { label: 'Q3', maxMarks: 10 },
];

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, commas, CRLF and a BOM', () => {
    const text = '﻿Student ID,Name,Q1\r\nSTU-1,"Rao, Asha",4\r\nSTU-2,"Say ""hi""",\r\n';
    expect(parseCsv(text)).toEqual([
      ['Student ID', 'Name', 'Q1'],
      ['STU-1', 'Rao, Asha', '4'],
      ['STU-2', 'Say "hi"', ''],
    ]);
  });

  it('keeps a last line without newline and newlines inside quotes', () => {
    expect(parseCsv('a,b\n"x\ny",2')).toEqual([
      ['a', 'b'],
      ['x\ny', '2'],
    ]);
  });
});

describe('column mapping', () => {
  it('normalises headers', () => {
    expect(headerKey('Roll No.')).toBe('rollno');
    expect(headerKey(' Student ID ')).toBe('studentid');
    expect(headerKey('Q 1')).toBe('q1');
  });

  it('finds id, roll, question, total and absent columns case-insensitively', () => {
    expect(mapColumns(['admission no', 'ROLL', 'Name', 'q2', 'Q1', 'q3', 'Marks', 'absent'], Q)).toEqual({
      id: 0,
      roll: 1,
      total: 6,
      absent: 7,
      questions: [4, 3, 5],
    });
    expect(mapColumns(['ID', 'Roll Number', 'Total'], []).id).toBe(0);
    expect(mapColumns(['Name', 'Total'], []).id).toBe(-1);
  });

  it('recognises absent values', () => {
    for (const v of ['Y', 'yes', 'AB', 'a', 'TRUE', true]) expect(isAbsentValue(v)).toBe(true);
    for (const v of ['', 'N', 'no', null, false, 0]) expect(isAbsentValue(v)).toBe(false);
  });
});

describe('mapSheetToImportRows', () => {
  it('maps question columns: blank = null, numeric strings and numbers, row numbers 1-based', () => {
    const sheet = [
      ['Student ID', 'Roll No', 'Name', 'Q1', 'Q2', 'Q3', 'Absent'],
      ['STU-1', 1, 'Asha', 4, '', '7.5', ''],
      ['', 2, 'Bina', '5', 5, 10, null],
      [null, null, null, null, null, null, null], // blank row skipped
      ['STU-3', 3, 'Chetan', '', '', '', 'Y'],
      ['STU-4', 4, 'Dev', 'AB', '', '', ''],
    ];
    const result = mapSheetToImportRows(sheet, Q);
    expect(result.error).toBeUndefined();
    expect(result.localErrors).toEqual([]);
    expect(result.rows).toEqual([
      { row: 2, studentId: 'STU-1', rollNumber: 1, absent: false, questionMarks: [4, null, 7.5] },
      { row: 3, rollNumber: 2, absent: false, questionMarks: [5, 5, 10] },
      { row: 5, studentId: 'STU-3', rollNumber: 3, absent: true },
      { row: 6, studentId: 'STU-4', rollNumber: 4, absent: true },
    ]);
  });

  it('uses Total when the paper has no questions, or when a row has no question cells', () => {
    const noQ = mapSheetToImportRows([['Roll', 'Marks'], ['7', '33'], ['8', 'ab']], []);
    expect(noQ.rows).toEqual([
      { row: 2, rollNumber: 7, absent: false, total: 33 },
      { row: 3, rollNumber: 8, absent: true },
    ]);

    const mixed = mapSheetToImportRows(
      [
        ['ID', 'Q1', 'Q2', 'Q3', 'Total'],
        ['S1', '', '', '', 12],
        ['S2', 1, 2, 3, 99], // questions win over Total
      ],
      Q,
    );
    expect(mixed.rows).toEqual([
      { row: 2, studentId: 'S1', absent: false, total: 12 },
      { row: 3, studentId: 'S2', absent: false, questionMarks: [1, 2, 3] },
    ]);
  });

  it('sends a row with no marks so the server can report it', () => {
    expect(mapSheetToImportRows([['ID', 'Total'], ['S1', '']], []).rows).toEqual([{ row: 2, studentId: 'S1', absent: false }]);
  });

  it('skips title rows above the header and ignores extra columns', () => {
    const result = mapSheetToImportRows(
      [['Class 5-B Maths'], [], ['Name', 'Section', 'Student ID', 'Total', 'Remarks'], ['Asha', 'B', 'S1', 20, 'good']],
      [],
    );
    expect(result.rows).toEqual([{ row: 4, studentId: 'S1', absent: false, total: 20 }]);
  });

  it('flags text in a mark cell and a bad roll number in the browser', () => {
    const result = mapSheetToImportRows(
      [
        ['Roll', 'Q1', 'Q2', 'Q3'],
        [1, 'four', '', ''],
        ['x', 1, 1, 1],
        [3, 1, 1, 1],
      ],
      Q,
    );
    expect(result.rows).toEqual([{ row: 4, rollNumber: 3, absent: false, questionMarks: [1, 1, 1] }]);
    expect(result.localErrors).toEqual([
      { row: 2, key: 'marks.importNotNumber', vars: { column: 'Q1', value: 'four' } },
      { row: 3, key: 'marks.importBadRoll', vars: { value: 'x' } },
    ]);
  });

  it('rejects files without an id/roll column, with some question columns missing, or without marks', () => {
    expect(mapSheetToImportRows([['Name', 'Total'], ['Asha', 3]], []).error.key).toBe('marks.importNoIdColumn');
    expect(mapSheetToImportRows([['ID', 'Q1', 'Q3'], ['S1', 1, 2]], Q).error).toEqual({
      key: 'marks.importMissingQuestions',
      vars: { labels: 'Q2' },
    });
    expect(mapSheetToImportRows([['ID', 'Name'], ['S1', 'A']], Q).error.key).toBe('marks.importNoMarkColumnsQ');
    expect(mapSheetToImportRows([['ID', 'Q1']], []).error.key).toBe('marks.importNoMarkColumns');
  });
});

describe('template and results', () => {
  const sheet = {
    schedule: { className: '5-B', subject: 'Mathematics', questions: Q },
    rows: [
      { studentId: 'S1', rollNumber: 1, studentName: 'Asha' },
      { studentId: 'S2', rollNumber: 2, studentName: 'Bina' },
    ],
  };

  it('builds a template with the roster and one column per question', () => {
    expect(buildTemplateRows(sheet)).toEqual([
      ['Student ID', 'Roll No', 'Name', 'Q1', 'Q2', 'Q3', 'Absent'],
      ['S1', 1, 'Asha', null, null, null, null],
      ['S2', 2, 'Bina', null, null, null, null],
    ]);
    expect(buildTemplateRows({ ...sheet, schedule: { questions: [] } })[0]).toEqual(['Student ID', 'Roll No', 'Name', 'Total', 'Absent']);
    expect(templateFileName(sheet.schedule)).toBe('marks-5-B-Mathematics.xlsx');
  });

  it('the template reads back through the mapping', () => {
    const filled = buildTemplateRows(sheet);
    filled[1][3] = 4;
    filled[2][6] = 'Y';
    expect(mapSheetToImportRows(filled, Q).rows).toEqual([
      { row: 2, studentId: 'S1', rollNumber: 1, absent: false, questionMarks: [4, null, null] },
      { row: 3, studentId: 'S2', rollNumber: 2, absent: true },
    ]);
  });

  it('merges local errors into the server answer, sorted by row', () => {
    const server = {
      dryRun: true,
      total: 2,
      valid: 1,
      saved: 0,
      failed: 1,
      rows: [
        { row: 4, studentId: 'S2', studentName: 'Bina', status: 'ERROR', message: 'Duplicate', total: null },
        { row: 2, studentId: 'S1', studentName: 'Asha', status: 'OK', message: null, total: 9 },
      ],
    };
    const merged = mergeImportResult(server, [{ row: 3, key: 'k', vars: {} }], () => 'Bad cell');
    expect(merged).toMatchObject({ dryRun: true, total: 3, valid: 1, failed: 2 });
    expect(merged.rows.map((r) => [r.row, r.status, r.message])).toEqual([
      [2, 'OK', null],
      [3, 'ERROR', 'Bad cell'],
      [4, 'ERROR', 'Duplicate'],
    ]);
  });
});
