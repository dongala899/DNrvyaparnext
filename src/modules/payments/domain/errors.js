export class PaymentNotFoundError extends Error {
  constructor(id) {
    super(`Payment not found: ${id}`);
    this.name = 'PaymentNotFoundError';
  }
}

export class OverpaymentError extends Error {
  constructor(amount, paid) {
    super(`Payment amount ${amount} exceeds due amount ${paid}`);
    this.name = 'OverpaymentError';
  }
}

export class InvalidPaymentStatusError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidPaymentStatusError';
  }
}