export class VendorNotFoundError extends Error {
  constructor(id) {
    super(`Vendor not found: ${id}`);
    this.name = 'VendorNotFoundError';
  }
}