export function createNumberingService(sharedState) {
  return {
    async next(docType, companyId) {
      const prefix = docType === 'invoice' ? 'INV-' : docType === 'quotation' ? 'QT-' : docType.toUpperCase() + '-';
      const number = Math.floor(Math.random() * 10000) + 1;
      return `${prefix}${String(number).padStart(4, '0')}`;
    },

    async peek(docType, companyId) {
      const prefix = docType === 'invoice' ? 'INV-' : docType === 'quotation' ? 'QT-' : docType.toUpperCase() + '-';
      const number = Math.floor(Math.random() * 10000) + 1;
      return `${prefix}${String(number).padStart(4, '0')}`;
    },
  };
}