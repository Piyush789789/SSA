/**
 * Pure helpers for the marks Excel/CSV upload: a small CSV parser, the column mapping from a spreadsheet to the
 * rows of POST /exam-schedules/{id}/marks/import, and the template sheet. Reading/writing .xlsx itself is done by
 * read-excel-file / write-excel-file in MarksImportPanel; these functions only see arrays of rows of cells.
 */

const NONE = [];

/** Parses CSV text (RFC 4180: quotes, "" escapes, CRLF/LF, a leading BOM) into rows of string cells. */
export const parseCsv = (text) => {
  const src = String(text ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
};

/** Header text reduced to lowercase letters and digits: "Roll No." → "rollno", "Q 1" → "q1". */
export const headerKey = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const ID_HEADERS = ['studentid', 'id', 'admissionno', 'admissionnumber'];
const ROLL_HEADERS = ['roll', 'rollno', 'rollnumber'];
const TOTAL_HEADERS = ['total', 'marks'];
const ABSENT_HEADERS = ['absent'];
const ABSENT_WORDS = ['y', 'yes', 'ab', 'a', 'true'];

const isBlank = (v) => v == null || (typeof v === 'string' && v.trim() === '');

/** True for an Absent cell such as Y / Yes / AB / A / true (or an Excel TRUE). */
export const isAbsentValue = (v) =>
  v === true || (typeof v === 'string' && ABSENT_WORDS.includes(v.trim().toLowerCase()));

/** A mark cell that says "AB" means absent. */
const isAbMark = (v) => typeof v === 'string' && v.trim().toLowerCase() === 'ab';

/** A mark cell as a number, null when blank, or NaN when it is not a number. */
const markOf = (v) => {
  if (isBlank(v)) return null;
  if (typeof v === 'number') return v;
  const text = String(v).trim();
  return /^\d+(\.\d+)?$|^\.\d+$/.test(text) ? Number(text) : NaN;
};

/**
 * Finds the columns in a header row. Question columns are matched to the paper's labels exactly (ignoring case,
 * spaces and punctuation); other columns such as Name are ignored.
 * Returns `{ id, roll, total, absent, questions: [index|-1 per question] }` (column indexes, -1 when missing).
 */
export const mapColumns = (headerRow = NONE, questions = NONE) => {
  const keys = headerRow.map(headerKey);
  const find = (names) => keys.findIndex((k) => names.includes(k));
  const questionIdx = questions.map((q) => keys.indexOf(headerKey(q.label)));
  const taken = new Set(questionIdx.filter((i) => i >= 0));
  const findFree = (names) => keys.findIndex((k, i) => names.includes(k) && !taken.has(i));
  return {
    id: findFree(ID_HEADERS),
    roll: findFree(ROLL_HEADERS),
    total: findFree(TOTAL_HEADERS),
    absent: find(ABSENT_HEADERS),
    questions: questionIdx,
  };
};

/**
 * Turns spreadsheet rows (arrays of cells; the first row with a Student ID or Roll column is the header) into
 * the import request rows.
 *
 * Returns `{ error }` when the file cannot be used at all (i18n key + vars), otherwise
 * `{ rows, localErrors, columns }` where `rows` go to the server and `localErrors` (`[{row, message, key, vars}]`)
 * are rows the browser already knows are wrong (e.g. text in a mark cell), so they are not sent.
 *
 * Mapping per row: `row` = spreadsheet row number (1-based); `studentId` from Student ID / ID / Admission No;
 * `rollNumber` from Roll / Roll No; `absent` from the Absent column (Y / Yes / AB / A / true) or any mark cell "AB";
 * `questionMarks` from the question columns (blank = null = not attempted) when at least one has a mark;
 * otherwise `total` from the Total / Marks column. Completely blank rows are skipped.
 */
export const mapSheetToImportRows = (sheetRows = NONE, questions = NONE) => {
  const headerAt = sheetRows.slice(0, 20).findIndex((r) => {
    const cols = mapColumns(r ?? NONE, questions);
    return cols.id >= 0 || cols.roll >= 0;
  });
  if (headerAt < 0) return { error: { key: 'marks.importNoIdColumn', vars: {} } };

  const columns = mapColumns(sheetRows[headerAt], questions);
  const foundQ = columns.questions.filter((i) => i >= 0).length;
  if (questions.length > 0 && foundQ > 0 && foundQ < questions.length) {
    const missing = questions.filter((_, i) => columns.questions[i] < 0).map((q) => q.label);
    return { error: { key: 'marks.importMissingQuestions', vars: { labels: missing.join(', ') } } };
  }
  const useQuestions = questions.length > 0 && foundQ === questions.length;
  if (!useQuestions && columns.total < 0) {
    return {
      error: {
        key: questions.length > 0 ? 'marks.importNoMarkColumnsQ' : 'marks.importNoMarkColumns',
        vars: { labels: questions.map((q) => q.label).join(', ') },
      },
    };
  }

  const rows = [];
  const localErrors = [];
  for (let r = headerAt + 1; r < sheetRows.length; r += 1) {
    const cells = sheetRows[r] ?? NONE;
    if (cells.every(isBlank)) continue;
    const rowNumber = r + 1;
    const cell = (i) => (i >= 0 ? cells[i] : null);

    const out = { row: rowNumber, absent: false };
    const id = cell(columns.id);
    if (!isBlank(id)) out.studentId = String(id).trim();
    const roll = cell(columns.roll);
    if (!isBlank(roll)) {
      const n = markOf(roll);
      if (Number.isInteger(n)) out.rollNumber = n;
      else if (out.studentId == null) {
        localErrors.push({ row: rowNumber, key: 'marks.importBadRoll', vars: { value: String(roll) } });
        continue;
      }
    }

    const qCells = useQuestions ? columns.questions.map((i) => cell(i)) : [];
    const totalCell = cell(columns.total);
    out.absent = isAbsentValue(cell(columns.absent)) || qCells.some(isAbMark) || isAbMark(totalCell);
    if (out.absent) {
      rows.push(out);
      continue;
    }

    let bad = null;
    const qValues = qCells.map((v, i) => {
      const n = markOf(v);
      if (Number.isNaN(n) && !bad) bad = { key: 'marks.importNotNumber', vars: { column: questions[i].label, value: String(v) } };
      return n;
    });
    if (!bad && qValues.some((v) => v != null)) {
      out.questionMarks = qValues;
    } else if (!bad && !isBlank(totalCell)) {
      const n = markOf(totalCell);
      if (Number.isNaN(n)) bad = { key: 'marks.importNotNumber', vars: { column: 'Total', value: String(totalCell) } };
      else out.total = n;
    }
    if (bad) {
      localErrors.push({ row: rowNumber, ...bad });
      continue;
    }
    rows.push(out);
  }
  return { rows, localErrors, columns, useQuestions };
};

/**
 * Template sheet for a marks sheet (`{schedule, rows}` from GET …/marks): Student ID, Roll No, Name, one column
 * per question (or Total), Absent — one row per student of the class, marks left blank.
 */
export const buildTemplateRows = (sheet) => {
  const questions = sheet?.schedule?.questions ?? NONE;
  const markHeaders = questions.length > 0 ? questions.map((q) => q.label) : ['Total'];
  const header = ['Student ID', 'Roll No', 'Name', ...markHeaders, 'Absent'];
  const body = (sheet?.rows ?? NONE).map((r) => [r.studentId, r.rollNumber ?? null, r.studentName, ...markHeaders.map(() => null), null]);
  return [header, ...body];
};

/** File name for the template, e.g. "marks-5-B-Mathematics.xlsx". */
export const templateFileName = (schedule) =>
  `marks-${[schedule?.className, schedule?.subject].filter(Boolean).join('-').replace(/[^\w-]+/g, '_') || 'sheet'}.xlsx`;

/**
 * Combines the server's import answer with the rows rejected in the browser, sorted by spreadsheet row:
 * `{ total, valid, saved, failed, rows: [{row, studentId, studentName, status, message, total}] }`.
 * `formatLocal(err)` turns a local error into a message.
 */
export const mergeImportResult = (server, localErrors = NONE, formatLocal = (e) => e.key) => {
  const local = localErrors.map((e) => ({ row: e.row, studentId: null, studentName: null, status: 'ERROR', message: formatLocal(e), total: null }));
  const rows = [...(server?.rows ?? NONE), ...local].sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
  return {
    dryRun: server?.dryRun,
    total: (server?.total ?? 0) + local.length,
    valid: server?.valid ?? 0,
    saved: server?.saved ?? 0,
    failed: (server?.failed ?? 0) + local.length,
    rows,
  };
};
