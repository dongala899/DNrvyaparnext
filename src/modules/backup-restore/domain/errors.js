export class BackupError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BackupError';
  }
}

export class RestoreError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RestoreError';
  }
}

export class MigrationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MigrationError';
  }
}