import { createSetting } from '../domain/entities.js';
import { SettingNotFoundError, InvalidSettingValueError } from '../domain/errors.js';

export class SettingsService {
  constructor({ storage, commandBus, eventBus, logger }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.store = {
      settings: {},
      setSettings: (settings) => { this.store.settings = settings; },
    };
  }

  async get(key) {
    const result = await this.storage.runQuery({
      table: 'app_settings',
      where: { key },
      limit: 1,
    });

    const setting = result?.data?.[0];
    if (!setting) {
      throw new SettingNotFoundError(key);
    }

    return { success: true, data: this.parseValue(setting) };
  }

  async set(key, value, dataType = 'string') {
    this.validateValue(value, dataType);

    const existing = await this.storage.runQuery({
      table: 'app_settings',
      where: { key },
      limit: 1,
    });

    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (existing?.data?.[0]) {
      await this.storage.runQuery({
        type: 'upsert',
        table: 'app_settings',
        where: { key },
        values: { key, value: stringValue, data_type: dataType, updated_at: new Date().toISOString() },
      });
    } else {
      await this.storage.runQuery({
        type: 'insert',
        table: 'app_settings',
        values: { key, value: stringValue, data_type: dataType, updated_at: new Date().toISOString() },
      });
    }

    this.eventBus.emit('settings:changed', { key, value });
    return { success: true };
  }

  async getAll() {
    const result = await this.storage.runQuery({
      table: 'app_settings',
    });

    const settings = {};
    for (const row of result?.data || []) {
      settings[row.key] = this.parseValue(row).value;
    }

    return { success: true, data: settings };
  }

  async reset() {
    await this.storage.runQuery({
      type: 'delete',
      table: 'app_settings',
    });

    this.eventBus.emit('settings:changed', { reset: true });
    return { success: true };
  }

  parseValue(setting) {
    let value = setting.value;

    switch (setting.data_type) {
      case 'number':
        value = parseFloat(value);
        break;
      case 'boolean':
        value = value === 'true';
        break;
      case 'json':
        try {
          value = JSON.parse(value);
        } catch {
          value = null;
        }
        break;
    }

    return createSetting({
      key: setting.key,
      value,
      dataType: setting.data_type,
      updatedAt: setting.updated_at,
    });
  }

  validateValue(value, dataType) {
    switch (dataType) {
      case 'number':
        if (isNaN(Number(value))) {
          throw new InvalidSettingValueError('value', 'number');
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new InvalidSettingValueError('value', 'boolean');
        }
        break;
      case 'json':
        if (typeof value !== 'object') {
          throw new InvalidSettingValueError('value', 'object');
        }
        break;
    }
  }
}