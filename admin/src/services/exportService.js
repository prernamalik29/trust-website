import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, WidthType, AlignmentType, TextRun, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const TRUST_NAME = 'Olympian Anuj International Trust';
const TRUST_ADDRESS = 'Vill. Badheri, Distt. Muzaffarnagar-251307 (U.P.), India';
const TRUST_EMAIL = 'olympiananujinternationaltrust@gmail.com';
const TRUST_PHONE = '+91 9811260140';
const BRAND_COLOR_YELLOW = [249, 176, 0]; // #f9b000
const BRAND_COLOR_DARK = [30, 30, 30];

function formatTimestamp(ts) {
  if (!ts) return 'N/A';
  if (ts.toDate) return ts.toDate().toLocaleString('en-IN');
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString('en-IN');
  return new Date(ts).toLocaleString('en-IN');
}

/** Flatten a row object for export — converts timestamps and booleans */
function flattenRow(row, columnKeys) {
  return columnKeys.map((key) => {
    const val = row[key];
    if (val === null || val === undefined) return '';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object' && (val.seconds || val.toDate)) return formatTimestamp(val);
    return String(val);
  });
}

/**
 * Export data to a PDF file with OAIT letterhead.
 * @param {string} title - Document title e.g. "Contact Submissions"
 * @param {Array<{key: string, label: string}>} columns - Column definitions
 * @param {Array<Object>} rows - Data rows
 */
export function exportToPDF(title, columns, rows) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ---- Header band ----
  doc.setFillColor(...BRAND_COLOR_YELLOW);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Trust name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(TRUST_NAME, pageWidth / 2, 10, { align: 'center' });

  // Sub-info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`${TRUST_ADDRESS} | ${TRUST_EMAIL} | ${TRUST_PHONE}`, pageWidth / 2, 16, { align: 'center' });

  // Document title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_COLOR_DARK);
  doc.text(title, pageWidth / 2, 23, { align: 'center' });

  // Export timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const exportedAt = `Exported on: ${new Date().toLocaleString('en-IN')}  |  Total Records: ${rows.length}`;
  doc.text(exportedAt, pageWidth - 10, 32, { align: 'right' });

  // ---- Table ----
  const head = [columns.map((c) => c.label)];
  const body = rows.map((row) => flattenRow(row, columns.map((c) => c.key)));

  autoTable(doc, {
    startY: 35,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_COLOR_YELLOW,
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [253, 249, 235] },
    styles: { cellPadding: 2.5, overflow: 'linebreak' },
    margin: { left: 10, right: 10 },
  });

  // ---- Footer on each page ----
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${TRUST_NAME} — Confidential | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }

  doc.save(`OAIT_${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}

/**
 * Export data to a Word (.docx) file with OAIT letterhead.
 * @param {string} title - Document title
 * @param {Array<{key: string, label: string}>} columns - Column definitions
 * @param {Array<Object>} rows - Data rows
 */
export async function exportToWord(title, columns, rows) {
  const colWidths = columns.map(() => Math.floor(9000 / columns.length));

  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: columns.map(
      (col) =>
        new TableCell({
          shading: { fill: 'F9B000', color: 'F9B000' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '1E1E1E' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E1E1E' },
            left: { style: BorderStyle.SINGLE, size: 6, color: '1E1E1E' },
            right: { style: BorderStyle.SINGLE, size: 6, color: '1E1E1E' },
          },
          width: { size: colWidths[0], type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: col.label, bold: true, size: 18, color: '1E1E1E' })],
            }),
          ],
        })
    ),
  });

  // Data rows
  const dataRows = rows.map((row, rowIndex) =>
    new TableRow({
      children: columns.map((col) => {
        const val = flattenRow(row, [col.key])[0];
        return new TableCell({
          shading: { fill: rowIndex % 2 === 0 ? 'FFFFFF' : 'FDF9EB', color: rowIndex % 2 === 0 ? 'FFFFFF' : 'FDF9EB' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
            left: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
            right: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
          },
          width: { size: colWidths[0], type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: val, size: 16 })],
            }),
          ],
        });
      }),
    })
  );

  const docFile = new Document({
    sections: [
      {
        children: [
          // Trust name heading
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: TRUST_NAME,
                bold: true,
                size: 36,
                color: '1E1E1E',
              }),
            ],
          }),
          // Address
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: TRUST_ADDRESS, size: 18, color: '555555' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `${TRUST_EMAIL} | ${TRUST_PHONE}`, size: 18, color: '555555' }),
            ],
          }),
          // Spacer
          new Paragraph({ children: [] }),
          // Title
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: title, bold: true, size: 28, color: 'F9B000' }),
            ],
          }),
          // Export info
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Exported on: ${new Date().toLocaleString('en-IN')}  |  Total Records: ${rows.length}`,
                size: 16,
                color: '888888',
                italics: true,
              }),
            ],
          }),
          new Paragraph({ children: [] }),
          // Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(docFile);
  saveAs(blob, `OAIT_${title.replace(/\s+/g, '_')}_${Date.now()}.docx`);
}
