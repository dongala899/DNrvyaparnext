const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function drawHeader(doc, docData, type) {
  const pageWidth = doc.page.width;
  const margin = doc.page.mappings ? 50 : 50;

  doc.rect(0, 0, pageWidth, 90).fill('#1a365d');
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(docData.companyName || 'Company Name', 50, 20);
  doc.fontSize(9).font('Helvetica').text(docData.companyAddress || '', 50, 45, { width: 250 });
  doc.text('GSTIN: ' + (docData.companyGSTIN || 'N/A'), 50, 65);
  doc.text('Phone: ' + (docData.companyPhone || 'N/A'), 50, 78);

  const titleText = type === 'invoice' ? 'TAX INVOICE' : type === 'quotation' ? 'QUOTATION' : 'PURCHASE ORDER';
  doc.fontSize(16).font('Helvetica-Bold').text(titleText, 320, 30, { width: 200, align: 'right' });
  doc.fontSize(9).font('Helvetica').text(type === 'invoice' ? 'Invoice No: ' : type === 'quotation' ? 'Quotation No: ' : 'PO No: ', 320, 55, { width: 200, align: 'right' });
  doc.text(docData.docNumber || 'N/A', 320, 68, { width: 200, align: 'right' });
  doc.text('Date: ' + (docData.date || new Date().toLocaleDateString('en-IN')), 320, 81, { width: 200, align: 'right' });

  doc.fillColor('#000000');
}

function drawPartySection(doc, docData, y, type) {
  doc.rect(50, y, 495, 2).fill('#1a365d');
  doc.fillColor('#000000');

  const partyLabel = type === 'purchase_order' ? 'Supplier' : 'Bill To';
  doc.fontSize(10).font('Helvetica-Bold').text(partyLabel, 50, y + 12);
  doc.font('Helvetica').fontSize(9);
  doc.text(docData.partyName || '', 50, y + 28, { width: 230 });
  doc.text(docData.partyAddress || '', 50, y + 41, { width: 230 });
  doc.text('GSTIN: ' + (docData.partyGSTIN || 'N/A'), 50, y + 59);

  if (docData.shippingAddress) {
    doc.font('Helvetica-Bold').fontSize(10).text('Ship To', 320, y + 12);
    doc.font('Helvetica').fontSize(9).text(docData.shippingAddress, 320, y + 28, { width: 225 });
  }

  if (docData.poNumber) {
    doc.font('Helvetica').fontSize(9).text('PO No: ' + docData.poNumber, 320, y + 60);
  }
  if (docData.poDate) {
    doc.text('PO Date: ' + docData.poDate, 320, y + 73);
  }

  doc.fillColor('#000000');
  return y + 90;
}

function drawItemsTable(doc, items, y) {
  const tableLeft = 50;
  const tableWidth = 495;
  const colWidths = [30, 160, 55, 50, 50, 55, 45, 50];
  const headers = ['#', 'Item', 'HSN', 'Qty', 'Rate', 'Tax%', 'Disc', 'Amount'];
  const colPositions = [tableLeft];
  for (let i = 0; i < colWidths.length - 1; i++) {
    colPositions.push(colPositions[i] + colWidths[i]);
  }

  doc.rect(tableLeft, y, tableWidth, 22).fill('#1a365d');
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  headers.forEach((h, i) => {
    doc.text(h, colPositions[i] + 3, y + 6, { width: colWidths[i] - 6 });
  });
  doc.fillColor('#000000');

  let rowY = y + 22;
  let alternate = false;

  (items || []).forEach((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discount = Number(item.discount || 0);
    const taxRate = Number(item.taxRate || item.gstRate || 0);
    const taxableValue = qty * rate - discount;
    const taxAmount = taxableValue * taxRate / 100;
    const total = taxableValue + taxAmount;

    if (alternate) {
      doc.rect(tableLeft, rowY, tableWidth, 20).fill('#f7fafc');
      doc.fillColor('#000000');
    }
    alternate = !alternate;

    doc.fontSize(7).font('Helvetica');
    const rowData = [
      String(idx + 1),
      item.name || item.description || '',
      item.hsn || '-',
      String(qty),
      formatCurrency(rate).replace('₹', ''),
      taxRate + '%',
      discount > 0 ? formatCurrency(discount).replace('₹', '') : '-',
      formatCurrency(total).replace('₹', '')
    ];
    rowData.forEach((val, i) => {
      const align = i === 0 || i === 1 ? 'left' : 'right';
      const xOffset = i === 0 || i === 1 ? 3 : -3;
      doc.text(val, colPositions[i] + xOffset, rowY + 5, { width: colWidths[i] - 6, align });
    });

    rowY += 20;
  });

  doc.rect(tableLeft, rowY, tableWidth, 1).fill('#e2e8f0');
  doc.fillColor('#000000');
  return rowY + 10;
}

function drawTotals(doc, docData, y) {
  const rightCol = 350;
  const lineH = 16;
  let currentY = y + 10;

  doc.fontSize(9).font('Helvetica');
  const totalTaxable = (docData.items || []).reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discount = Number(item.discount || 0);
    return sum + (qty * rate - discount);
  }, 0);
  const totalTax = (docData.items || []).reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discount = Number(item.discount || 0);
    const taxRate = Number(item.taxRate || item.gstRate || 0);
    return sum + (qty * rate - discount) * taxRate / 100;
  }, 0);
  const grandTotal = totalTaxable + totalTax;
  const roundOff = docData.roundOff ? Number(1 - (grandTotal - Math.round(grandTotal))) : 0;
  const finalTotal = grandTotal + roundOff;

  const lines = [
    ['Subtotal:', formatCurrency(totalTaxable)],
    ['CGST:', formatCurrency(totalTax / 2)],
    ['SGST:', formatCurrency(totalTax / 2)],
  ];
  if (roundOff) {
    lines.push(['Round Off:', formatCurrency(roundOff)]);
  }
  lines.push(['Grand Total:', formatCurrency(finalTotal)]);

  lines.forEach(([label, value], idx) => {
    if (idx === lines.length - 1) {
      doc.rect(300, currentY - 4, 245, lineH + 2).fill('#1a365d');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
      doc.text(label, 305, currentY - 1, { width: 120 });
      doc.text(value, 430, currentY - 1, { width: 110, align: 'right' });
      doc.fillColor('#000000');
    } else {
      doc.font('Helvetica').fontSize(9);
      doc.text(label, 350, currentY, { width: 100 });
      doc.text(value, 430, currentY, { width: 110, align: 'right' });
    }
    currentY += lineH;
  });

  doc.font('Helvetica').fontSize(8);
  doc.text('Amount in words: ' + numberToWords(Math.round(finalTotal)), 50, currentY + 5, { width: 250 });

  return currentY + 30;
}

function drawFooter(doc, docData) {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 100;

  doc.rect(50, footerY, 495, 0.5).fill('#1a365d');

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Terms & Conditions:', 50, footerY + 10);
  doc.font('Helvetica').fontSize(8);
  doc.text('1. Goods once sold will not be taken back.', 50, footerY + 25);
  doc.text('2. Interest @18% p.a. will be charged on overdue payments.', 50, footerY + 37);
  doc.text('3. Subject to local jurisdiction.', 50, footerY + 49);

  if (docData.bankName) {
    doc.font('Helvetica-Bold').fontSize(9).text('Bank Details:', 300, footerY + 10);
    doc.font('Helvetica').fontSize(8);
    doc.text('Bank: ' + docData.bankName, 300, footerY + 25);
    doc.text('A/C: ' + (docData.bankAccount || ''), 300, footerY + 37);
    doc.text('IFSC: ' + (docData.bankIFSC || ''), 300, footerY + 49);
  }

  doc.fontSize(9).font('Helvetica');
  doc.text('Authorized Signature', 400, footerY + 75, { width: 140, align: 'right' });
}

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }
  return convert(num) + ' Rupees Only';
}

async function generatePdf(docData, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const type = docData.type || 'invoice';
    drawHeader(doc, docData, type);
    let yPos = 110;
    yPos = drawPartySection(doc, docData, yPos, type);
    yPos = drawItemsTable(doc, docData.items, yPos);
    yPos = drawTotals(doc, docData, yPos);
    drawFooter(doc, docData);

    doc.end();
    stream.on('finish', () => resolve({ success: true, filePath: outputPath }));
    stream.on('error', reject);
  });
}

module.exports = { generatePdf };