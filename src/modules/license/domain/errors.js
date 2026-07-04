export class InvalidLicenseError extends Error {
  constructor(message = 'Invalid license key') {
    super(message);
    this.code = 'LICENSE_INVALID';
  }
}

export class LicenseExpiredError extends Error {
  constructor() {
    super('License has expired');
    this.code = 'LICENSE_EXPIRED';
  }
}

export class MachineMismatchError extends Error {
  constructor() {
    super('License key is not valid for this machine');
    this.code = 'LICENSE_MACHINE_MISMATCH';
  }
}