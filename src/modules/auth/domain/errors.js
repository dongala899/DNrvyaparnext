export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid username or password');
    this.code = 'AUTH_INVALID_CREDENTIALS';
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Session has expired');
    this.code = 'AUTH_SESSION_EXPIRED';
  }
}

export class UserInactiveError extends Error {
  constructor() {
    super('User account is inactive');
    this.code = 'AUTH_USER_INACTIVE';
  }
}