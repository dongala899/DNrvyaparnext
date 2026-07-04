import { createLicenseInfo } from '../domain/entities.js';
import { InvalidLicenseError } from '../domain/errors.js';

export class LicenseService {
  constructor({ storage, commandBus, eventBus, logger, sharedState, ipcAdapter }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.ipc = ipcAdapter || (typeof window !== 'undefined' ? window.api : {});
  }

  async getStatus() {
    this.logger.info('Checking license status');

    const result = await this.ipc.license.getInfo();

    if (!result.success) {
      return { success: false, data: { status: 'unlicensed', valid: false } };
    }

    return { success: true, data: result.data };
  }

  async activate(key) {
    this.logger.info('Activating license');

    if (!key || key.trim().length === 0) {
      throw new InvalidLicenseError('License key is empty');
    }

    const result = await this.ipc.license.validate({ key });

    if (!result.success || !result.data?.valid) {
      this.eventBus.emit('license:validation:failed', { key });
      throw new InvalidLicenseError();
    }

    const licenseInfo = createLicenseInfo({
      status: 'licensed',
      licenseKey: key,
      activatedAt: new Date().toISOString(),
      expiresAt: result.data.expiresAt,
    });

    await this.storage.runQuery({
      type: 'upsert',
      table: 'app_settings',
      where: { key: 'license_info' },
      values: {
        key: 'license_info',
        value: JSON.stringify(licenseInfo),
        data_type: 'json',
        updated_at: new Date().toISOString(),
      },
    });

    this.sharedState.getState().setLicensed(true);
    this.sharedState.getState().setLicenseInfo(licenseInfo);

    this.eventBus.emit('license:activated', { licenseInfo });

    return { success: true, data: licenseInfo };
  }
}
