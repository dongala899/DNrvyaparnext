export class PosCartError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PosCartError';
  }
}