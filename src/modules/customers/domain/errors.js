export class CustomerNotFoundError extends Error {
  constructor(id) {
    super(`Customer not found: ${id}`);
    this.name = 'CustomerNotFoundError';
  }
}

export class DuplicateCustomerError extends Error {
  constructor(field) {
    super(`Customer with this ${field} already exists`);
    this.name = 'DuplicateCustomerError';
  }
}