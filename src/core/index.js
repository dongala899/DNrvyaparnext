import { createStorageAdapter } from './storage/storage.port.js';
import { createLoggerAdapter } from './logger/logger.port.js';
import { createCompanyContextAdapter } from './company-context/company-context.port.js';
import { createPermissionService } from './permissions/permission.service.js';
import { createNumberingService } from './numbering/numbering.service.js';
import { createTaxService } from './tax/tax.service.js';

let _sharedState = null;

export function initializeCore(sharedState) {
  _sharedState = sharedState;
}

export const core = {
  get storage() {
    return createStorageAdapter('');
  },
  logger: createLoggerAdapter('core'),

  get companyContext() {
    if (!_sharedState) return null;
    return createCompanyContextAdapter(_sharedState);
  },

  get permissions() {
    if (!_sharedState) return null;
    return createPermissionService(_sharedState);
  },

  get numbering() {
    if (!_sharedState) return null;
    return createNumberingService(_sharedState);
  },

  get tax() {
    if (!_sharedState) return null;
    return createTaxService(_sharedState);
  },
};
