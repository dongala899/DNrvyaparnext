import { describe, it, expect } from 'vitest';
import { SettingSchema } from '../../../src/modules/settings/domain/entities.js';

describe('Settings Domain Entities', () => {
  it('should validate a setting', () => {
    const setting = SettingSchema.parse({
      key: 'currency',
      value: 'INR',
      dataType: 'string',
    });
    expect(setting.key).toBe('currency');
    expect(setting.value).toBe('INR');
  });

  it('should accept different data types', () => {
    const stringSetting = SettingSchema.parse({ key: 'a', value: 'test', dataType: 'string' });
    const numberSetting = SettingSchema.parse({ key: 'b', value: '100', dataType: 'number' });
    const boolSetting = SettingSchema.parse({ key: 'c', value: 'true', dataType: 'boolean' });

    expect(stringSetting.dataType).toBe('string');
    expect(numberSetting.dataType).toBe('number');
    expect(boolSetting.dataType).toBe('boolean');
  });
});