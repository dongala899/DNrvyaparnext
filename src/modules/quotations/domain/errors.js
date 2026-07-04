export class QuotationNotFoundError extends Error {
  constructor(id) {
    super(`Quotation not found: ${id}`);
    this.name = 'QuotationNotFoundError';
  }
}

export class InvalidQuotationStateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidQuotationStateError';
  }
}