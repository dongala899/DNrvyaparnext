export class CustomerOrderNotFoundError extends Error {
  constructor(id) {
    super(`Customer order not found: ${id}`);
    this.name = 'CustomerOrderNotFoundError';
  }
}

export class CustomerOrderConversionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CustomerOrderConversionError';
  }
}
