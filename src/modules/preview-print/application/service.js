import { createPreviewState, createPrintQueueItem } from '../domain/entities.js';

export class PreviewPrintService {
  constructor({ storage, commandBus, eventBus, logger, sharedState, ipcAdapter }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.ipc = ipcAdapter || (typeof window !== 'undefined' ? window.api : {});
    this.state = createPreviewState({});
    this.printQueue = [];
  }

  getPreviewState() { return this.state; }

  async openPreview(html, title = 'Preview') {
    this.state = createPreviewState({ isOpen: true, title, html });
    this.eventBus.emit('preview:opened', { title });
    return { success: true, data: this.state };
  }

  async closePreview() {
    this.state = createPreviewState({});
    this.eventBus.emit('preview:closed');
    return { success: true };
  }

  async exportDocument({ type, data }) {
    if (!data) throw new Error('No document data provided');
    const docData = {
      type: type || 'invoice',
      docNumber: data.invoiceNumber || data.quotationNumber || data.poNumber || 'N/A',
      date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
      companyName: data.companyName || '',
      companyAddress: data.companyAddress || '',
      companyGSTIN: data.companyGSTIN || '',
      companyPhone: data.companyPhone || '',
      companyLogo: data.companyLogo || '',
      bankName: data.bankName || '',
      bankAccount: data.bankAccount || '',
      bankIFSC: data.bankIFSC || '',
      partyName: data.customerName || data.vendorName || data.partyName || '',
      partyAddress: data.partyAddress || '',
      partyGSTIN: data.partyGSTIN || '',
      shippingAddress: data.shippingAddress || '',
      poNumber: data.poNumber || '',
      poDate: data.poDate || '',
      roundOff: data.roundOff || false,
      notes: data.notes || '',
      terms: data.terms || '',
      items: (data.lines || data.items || []).map(line => ({
        name: line.itemName || line.name || line.description || '',
        hsn: line.hsn || line.hsnCode || '',
        quantity: line.quantity || 0,
        rate: line.rate || 0,
        discount: line.discount || 0,
        taxRate: line.gstRate || line.taxRate || 0,
      })),
    };
    const title = `${docData.type}_${docData.docNumber}`;
    const result = await this.ipc.print.savePdf({ title, docData });
    this.eventBus.emit('print:savedPdf', { filePath: result.filePath });
    return result;
  }

  async sendToPrinter(settings = {}) {
    if (!this.state.html) {
      throw new Error('No preview content to print');
    }
    const result = await this.ipc.print.send({ html: this.state.html, ...settings });
    this.eventBus.emit('print:sent', { success: result.success });
    return result;
  }

  async getPrintQueue() {
    return { success: true, data: [...this.printQueue] };
  }
}