import manifest from './module.json' with { type: 'json' };
import { ReportsService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _service = null;

async function registerRoutes(router) {
  const ReportListPage = (await import('./ui/ReportListPage.jsx')).default;
  const LedgerReportPage = (await import('./ui/LedgerReportPage.jsx')).default;
  const ProfitLossReportPage = (await import('./ui/ProfitLossReportPage.jsx')).default;
  const StockReportPage = (await import('./ui/StockReportPage.jsx')).default;
  const DaybookReportPage = (await import('./ui/DaybookReportPage.jsx')).default;
  const BalanceSheetReportPage = (await import('./ui/BalanceSheetReportPage.jsx')).default;
  router.register([
    { path: '/reports', element: ReportListPage, handle: { title: 'Reports' } },
    { path: '/reports/ledger', element: LedgerReportPage, handle: { title: 'Ledger' } },
    { path: '/reports/profit-loss', element: ProfitLossReportPage, handle: { title: 'Profit & Loss' } },
    { path: '/reports/stock', element: StockReportPage, handle: { title: 'Stock' } },
    { path: '/reports/daybook', element: DaybookReportPage, handle: { title: 'Daybook' } },
    { path: '/reports/balance-sheet', element: BalanceSheetReportPage, handle: { title: 'Balance Sheet' } },
  ]);
}

export default {
  manifest,
  async init(core, shell) {
    if (_initialized) return this;
    _service = new ReportsService({ storage: core.storage, commandBus: shell.commandBus, eventBus: shell.eventBus, logger: core.logger, sharedState: shell.sharedState });
    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);
    _initialized = true;
    core.logger.info('[reports] Module initialized');
    return this;
  },
  async teardown() { if (_initialized) _initialized = false; },
  get service() { return _service; },
};