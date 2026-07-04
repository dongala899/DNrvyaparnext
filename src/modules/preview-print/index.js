import manifest from './module.json' with { type: 'json' };
import { PreviewPrintService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _service = null;

export default {
  manifest,
  async init(core, shell) {
    if (_initialized) return this;
    _service = new PreviewPrintService({ storage: core.storage, commandBus: shell.commandBus, eventBus: shell.eventBus, logger: core.logger, sharedState: shell.sharedState, ipcAdapter: typeof window !== 'undefined' ? window.api : undefined });
    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    _initialized = true;
    core.logger.info('[preview-print] Module initialized');
    return this;
  },
  async teardown() { if (_initialized) _initialized = false; },
  get service() { return _service; },
};