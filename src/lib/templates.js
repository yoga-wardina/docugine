import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_UNIT,
  newId,
  newSignatureTemplate,
  defaultLayout,
  importDocument,
} from './document';
import offerLetter from '../config/templates/offer-letter.json';

function baseDoc(elements) {
  return {
    pages: [
      {
        page: { width: PAGE_WIDTH, height: PAGE_HEIGHT, unit: PAGE_UNIT, layout: defaultLayout() },
        elements,
      },
    ],
  };
}

function txt(content, x, y, width, height, style = {}) {
  return {
    id: newId(),
    type: 'text',
    x,
    y,
    width,
    height,
    content,
    style: {
      fontSize: 11,
      color: '#111827',
      textAlign: 'left',
      fontFamily: 'Arial, sans-serif',
      ...style,
    },
  };
}

function box(x, y, width, height, style = {}) {
  return {
    id: newId(),
    type: 'rect',
    x,
    y,
    width,
    height,
    content: '',
    style: {
      backgroundColor: 'transparent',
      borderColor: '#9ca3af',
      borderWidth: 1,
      borderStyle: 'solid',
      ...style,
    },
  };
}

export function invoiceTemplate() {
  return baseDoc([
    txt('Invoice {{invoiceNumber}}', 20, 20, 170, 18, {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
    }),
    txt('Date: {{date}}', 20, 44, 170, 10, {
      fontSize: 12,
      color: '#374151',
      textAlign: 'right',
    }),
    txt('Bill to:\n{{customerName}}\n{{customerAddress}}', 20, 62, 85, 35, {
      whiteSpace: 'pre-wrap',
    }),
    box(20, 110, 170, 80, { backgroundColor: '#f3f4f6' }),
    txt('Total: {{total}}', 130, 200, 60, 12, {
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'right',
    }),
  ]);
}

export function contractTemplate() {
  const elements = [
    txt('SERVICE AGREEMENT', 20, 20, 170, 18, {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
    }),
    txt(
      'This Agreement is entered into as of {{date}}, by and between {{companyName}} ("Company") and {{clientName}} ("Client").',
      20,
      46,
      170,
      22,
      { fontSize: 10 }
    ),
    txt('Scope of Work\n{{scopeOfWork}}', 20, 74, 170, 50, {
      fontSize: 10,
      whiteSpace: 'pre-wrap',
    }),
    txt('Payment Terms\n{{paymentTerms}}', 20, 130, 170, 45, {
      fontSize: 10,
      whiteSpace: 'pre-wrap',
    }),
    txt(
      'Both parties agree to be bound by the terms set forth in this Agreement.',
      20,
      182,
      170,
      12,
      { fontSize: 10, color: '#374151' }
    ),
    txt('Company Representative', 20, 205, 70, 8, {
      fontSize: 10,
      color: '#6b7280',
    }),
    txt('Client Representative', 120, 205, 70, 8, {
      fontSize: 10,
      color: '#6b7280',
    }),
    ...newSignatureTemplate(20, 215),
    ...newSignatureTemplate(120, 215),
  ];
  return baseDoc(elements);
}

export function approvalTemplate() {
  return baseDoc([
    txt('APPROVAL REQUEST', 20, 20, 170, 18, {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
    }),
    txt('Requested by: {{requesterName}}', 20, 46, 170, 10, { fontSize: 11 }),
    txt('Department: {{department}}', 20, 58, 170, 10, { fontSize: 11 }),
    txt('Date: {{date}}', 20, 70, 170, 10, {
      fontSize: 11,
      textAlign: 'right',
    }),
    txt('Amount: {{amount}}', 20, 88, 170, 14, {
      fontSize: 16,
      fontWeight: 'bold',
    }),
    txt('Purpose / Description\n{{purpose}}', 20, 108, 170, 60, {
      fontSize: 10,
      whiteSpace: 'pre-wrap',
    }),
    txt('Status: {{status}}', 20, 176, 170, 12, {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#8C2BEE',
    }),
    txt('Approver: {{approverName}}', 20, 194, 170, 10, { fontSize: 11 }),
    txt('Approver Notes\n{{approverNotes}}', 20, 210, 170, 35, {
      fontSize: 10,
      whiteSpace: 'pre-wrap',
      color: '#374151',
    }),
    ...newSignatureTemplate(130, 250),
  ]);
}

export function memoTemplate() {
  return baseDoc([
    txt('INTERNAL MEMORANDUM', 20, 20, 170, 18, {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
    }),
    txt('TO: {{to}}', 20, 46, 170, 10, { fontSize: 11 }),
    txt('FROM: {{from}}', 20, 58, 170, 10, { fontSize: 11 }),
    txt('DATE: {{date}}', 20, 70, 170, 10, { fontSize: 11 }),
    txt('SUBJECT: {{subject}}', 20, 84, 170, 12, {
      fontSize: 12,
      fontWeight: 'bold',
    }),
    box(20, 102, 170, 100, { borderColor: '#d1d5db' }),
    txt('{{body}}', 22, 104, 166, 96, {
      fontSize: 10,
      whiteSpace: 'pre-wrap',
    }),
    ...newSignatureTemplate(20, 220),
  ]);
}

export const TEMPLATES = {
  invoice: { label: 'Invoice', factory: invoiceTemplate },
  contract: { label: 'Contract', factory: contractTemplate },
  approval: { label: 'Approval Request', factory: approvalTemplate },
  memo: { label: 'Memo', factory: memoTemplate },
};

function labelFromFilename(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function makeJsonTemplate(imported) {
  return () => importDocument(JSON.stringify(imported));
}

// To add a new built-in template, drop a JSON file in src/config/templates/
// (matching the Document shape: { pages: [...] }) and add one line below.
TEMPLATES['offer-letter'] = {
  label: labelFromFilename('offer-letter'),
  factory: makeJsonTemplate(offerLetter),
};
