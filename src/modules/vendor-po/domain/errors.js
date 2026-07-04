export class PoNotFoundError extends Error {
  constructor(id) {
    super(`PO not found: ${id}`);
    this.name = 'PoNotFoundError';
  }
}

export class GrnNotFoundError extends Error {
  constructor(id) {
    super(`GRN not found: ${id}`);
    this.name = 'GrnNotFoundError';
  }
}

export class InsufficientQuantityError extends Error {
  constructor(itemId, ordered, received) {
    super(`Cannot receive more than ordered for item ${itemId}. Ordered: ${ordered}, Already received: ${received}`);
    this.name = 'InsufficientQuantityError';
  }
}