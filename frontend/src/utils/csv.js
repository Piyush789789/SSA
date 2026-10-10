/**
 * CSV export that opens correctly in Excel (UTF-8 with BOM, so Hindi names show properly) and Google Sheets.
 * `columns`: [{ label: 'Name', value: (row) => row.name }].
 */
export const toCsv = (rows, columns) => {
  const escape = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    // Cells starting with = + - @ would run as formulas in Excel; prefix them so they stay plain text.
    const safe = /^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text) ? `'${text}` : text;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = [columns.map((c) => escape(c.label)).join(',')];
  rows.forEach((row) => lines.push(columns.map((c) => escape(c.value(row))).join(',')));
  return lines.join('\r\n');
};

export const downloadCsv = (fileName, rows, columns) => {
  const blob = new Blob(['﻿', toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** "students-2026-10-10.csv" */
export const datedFileName = (base) => `${base}-${new Date().toISOString().slice(0, 10)}.csv`;
