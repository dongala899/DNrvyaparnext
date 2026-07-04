export class ItemNotFoundError extends Error {
  constructor(id) {
    super(`Item not found: ${id}`);
    this.name = 'ItemNotFoundError';
  }
}

export class DuplicateSKUError extends Error {
  constructor(sku) {
    super(`Item with SKU "${sku}" already exists`);
    this.name = 'DuplicateSKUError';
  }
}