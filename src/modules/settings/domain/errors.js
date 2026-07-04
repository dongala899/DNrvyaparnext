export class SettingNotFoundError extends Error {
  constructor(key) {
    super(`Setting not found: ${key}`);
    this.code = 'SETTING_NOT_FOUND';
  }
}

export class InvalidSettingValueError extends Error {
  constructor(key, expectedType) {
    super(`Invalid value for setting "${key}": expected ${expectedType}`);
    this.code = 'SETTING_INVALID_VALUE';
  }
}