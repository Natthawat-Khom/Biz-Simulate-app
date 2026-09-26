import * as XLSX from 'xlsx';
import { generateStudentPin } from './roomCodeGenerator';

/**
 * Normalizes column header keys to find matching fields.
 */
function normalizeHeader(header) {
  if (!header) return '';
  return String(header).toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
}

/**
 * Identifies if a key matches student ID column patterns.
 */
function isStdIdColumn(header) {
  const norm = normalizeHeader(header);
  return norm.includes('stdid') || norm.includes('studentid') || norm.includes('id') || norm.includes('รหัส');
}

/**
 * Identifies if a key matches fullname column patterns.
 */
function isFullnameColumn(header) {
  const norm = normalizeHeader(header);
  return norm.includes('fullname') || norm.includes('name') || norm.includes('ชื่อ') || norm.includes('studentname');
}

/**
 * Parses HTML table string directly from HTML-formatted .xls files.
 */
function parseHtmlTable(htmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const tables = doc.querySelectorAll('table');
  
  if (tables.length === 0) return [];

  const rows = [];
  tables.forEach((table) => {
    const trs = table.querySelectorAll('tr');
    let headers = [];

    trs.forEach((tr, rowIndex) => {
      const cells = tr.querySelectorAll('th, td');
      const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());

      if (rowIndex === 0 || headers.length === 0) {
        // Check if this row looks like a header row
        const hasHeaderKeyword = cellTexts.some(txt => isStdIdColumn(txt) || isFullnameColumn(txt));
        if (hasHeaderKeyword) {
          headers = cellTexts;
          return;
        }
      }

      if (cellTexts.length > 0) {
        const rowObj = {};
        cellTexts.forEach((txt, colIdx) => {
          const key = headers[colIdx] || `col_${colIdx}`;
          rowObj[key] = txt;
        });
        rows.push(rowObj);
      }
    });
  });

  return rows;
}

/**
 * Main Excel & HTML parser function for university student files.
 * @param {File} file 
 * @returns {Promise<Array<{std_id: string, fullname: string, pin: string}>>}
 */
export async function parseStudentExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        let rawRows = [];

        // Try reading as array buffer via SheetJS
        try {
          const workbook = XLSX.read(buffer, { type: 'array', raw: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        } catch (xlsxErr) {
          console.warn("SheetJS array parsing failed, attempting text/HTML parsing fallback:", xlsxErr);
        }

        // If sheet_to_json yielded no rows or text contains HTML tags, try parsing as HTML text
        const textDecoder = new TextDecoder('utf-8');
        const fileText = textDecoder.decode(buffer);

        if (rawRows.length === 0 || fileText.includes('<table') || fileText.includes('<tr')) {
          const htmlRows = parseHtmlTable(fileText);
          if (htmlRows.length > 0) {
            rawRows = htmlRows;
          }
        }

        if (rawRows.length === 0) {
          throw new Error("No data found in file. Please ensure the file contains columns for student ID and Full Name.");
        }

        // Identify column names for std_id and fullname dynamically
        const sampleRow = rawRows[0] || {};
        const keys = Object.keys(sampleRow);

        let stdIdKey = keys.find(isStdIdColumn) || keys[0];
        let fullnameKey = keys.find(isFullnameColumn) || keys[1] || keys[0];

        // Format and clean parsed student entries
        const parsedStudents = [];
        const seenIds = new Set();

        rawRows.forEach((row, idx) => {
          const rawStdId = String(row[stdIdKey] || '').trim();
          const rawName = String(row[fullnameKey] || '').trim();

          // Skip headers or empty rows
          if (!rawStdId || isStdIdColumn(rawStdId)) return;
          if (seenIds.has(rawStdId)) return;

          seenIds.add(rawStdId);

          parsedStudents.push({
            std_id: rawStdId,
            fullname: rawName || `Student ${idx + 1}`,
            pin: generateStudentPin(rawStdId),
            role: 'student',
            groupId: null,
            isLeader: false,
            personalBalance: 0,
            miningTaps: 0
          });
        });

        if (parsedStudents.length === 0) {
          throw new Error("Could not detect valid student records with std_id and fullname.");
        }

        resolve(parsedStudents);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(new Error("Failed to read file: " + err.message));
    reader.readAsArrayBuffer(file);
  });
}
