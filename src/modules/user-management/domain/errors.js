export class UserNotFoundError extends Error {
  constructor(id) {
    super(`User not found: ${id}`);
    this.code = 'USER_NOT_FOUND';
  }
}

export class DuplicateUsernameError extends Error {
  constructor(username) {
    super(`Username "${username}" already exists`);
    this.code = 'USER_DUPLICATE_USERNAME';
  }
}

export class CannotDeactivateSelfError extends Error {
  constructor() {
    super('Cannot deactivate your own account');
    this.code = 'USER_CANNOT_DEACTIVATE_SELF';
  }
}