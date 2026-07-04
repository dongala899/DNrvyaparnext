import manifest from './module.json' with { type: 'json' };
import { LicenseService } from './application/service.js';
import { registerCommands, unregisterCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _core = null;
let _shell = null;
let _service = null;

export default {
  manifest,

  async init(core, shell) {
    if (_initialized) return this;
    _core = core;
    _shell = shell;

    _service = new LicenseService({
      storage: core.storage,
      commandBus: shell.commandBus,
      eventBus: shell.eventBus,
      logger: core.logger,
      sharedState: shell.sharedState,
      ipcAdapter: typeof window !== 'undefined' ? window.api : undefined,
    });

    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service, shell.sharedState);

    const licenseInfo = await _service.getStatus();
    if (licenseInfo.success) {
      shell.sharedState.getState().setLicensed(licenseInfo.data.valid);
      shell.sharedState.getState().setLicenseInfo(licenseInfo.data);
    }

    _initialized = true;
    core.logger.info('[license] Module initialized');
    return this;
  },

  async teardown() {
    if (!_initialized) return;
    unregisterCommands();
    _initialized = false;
  },

  get service() { return _service; },
};