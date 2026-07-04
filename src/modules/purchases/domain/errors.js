export class PurchaseNotFoundError extends Error {
  constructor(id) {
    super(`Purchase not found: ${id}`);
    this.name = 'PurchaseNotFoundError';
  }
}

export class InvalidPurchaseStateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidPurchaseStateError';
  }
}