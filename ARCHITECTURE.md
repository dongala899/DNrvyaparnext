# DNR Vyapar Next — Architecture Document

## Overview
Electron modular monolith for Indian business management (GST-compliant accounting/inventory).

## Tech Layer
- **Main Process**: Node.js, `better-sqlite3`, `bcryptjs`
- **Renderer**: React 18, Vite, Zustand, React Router
- **Bridge**: Context-isolated preload, ipcRenderer only
- **Build**: Electron 28, electron-builder

## Security Model
```
Renderer (unprivileged)
  └─► window.api.*  (preload-exposed IPC only)
       └─► ipcRenderer.invoke → ipcMain.handle
            └─► Main Process (privileged)
                 ├─ SQLite (table-whitelisted)
                 ├─ bcrypt (password hashing)
                 └─ fs/dialog/window APIs
```
- Renderer NEVER touches Node.js, `ipcRenderer` directly, or `require()`
- All SQL validated against `TABLE_WHITELIST` in main process

## Module Architecture (Ports & Adapters)
Each module under `src/modules/<name>/`:

```
module.json          Manifest: name, deps, channels, routes, menu
index.js             Lifecycle: init(core, shell), teardown()
domain/
  entities.js        Zod schemas + factory functions
  errors.js          Domain error classes
application/
  service.js         Business logic, storage calls, event emission
ports/
  commands.port.js   Command bus handler registration
  events.port.js     Event bus subscription registration
ui/
  *.jsx              React pages (zero business logic)
```

## Cross-Module Communication
```
Mutations:  UI → commandBus.invoke('module:action') → handler → storage → event bus
Facts:      Service → eventBus.emit('entity:changed') → subscribers
```

## Core Services (src/core/)
| Service | Adapter pattern | Notes |
|---------|----------------|-------|
| `storage` | IPC → main process SQLite | Table-whitelisted |
| `logger` | Console wrapper | Namespace-prefixed |
| `companyContext` | Read from sharedState | Lazy-init |
| `permissions` | Read from sharedState | Role-based |
| `numbering` | Stub | Sequences |
| `tax` | Stub | GST rates |

## Shell Services (src/core/)
| Service | Pattern | Notes |
|---------|--------|-------|
| `commandBus` | In-memory map | `handle()` / `invoke()` |
| `eventBus` | In-memory pub/sub | `on()` / `emit()` |
| `router` | React Router wrapper | `register()` / `buildRouter()` |
| `sharedState` | Zustand store | Auth, company, license |
| `registry` | Dynamic import | Discovers `module.json` |
| `lifecycle` | Topological sort | Loads modules by dependency order |

## Data Flow (Read)
```
UI → commandBus.invoke('entity:getList')
   → command handler
   → storage.runQuery({ table, where })
   → window.api.storage.runQuery(...)
   → ipcMain.handle('storage:query')
   → sqliteAdapter.runQuery(...)
   → SQLite SELECT
   → rows → entities (Zod parse)
   → UI
```

## Data Flow (Write)
```
UI form submit → commandBus.invoke('entity:create', payload)
   → command handler
   → domain entity creation (Zod parse)
   → storage.runQuery({ type: 'insert', table, values })
   → window.api.storage.runQuery(...)
   → ipcMain.handle('storage:query')
   → sqliteAdapter.runQuery(...)
   → SQLite INSERT
   → eventBus.emit('entity:created')
   → UI updates

Password Flow (Special Case):
UI → commandBus.invoke('auth:login', { username, password })
   → authService.login()
   → storage.runQuery (find user by username)
   → window.api.auth.verifyPassword({ hash, password })
   → ipcMain.handle('auth:verifyPassword')
   → bcrypt.compare(password, hash)
   → { valid: true/false }
```

## Module Loading Order (Phase 0-2)
```
auth → license → companies → customers → user-management → settings
```
Determined by topological sort of `dependencies` in `module.json`.

## Migration System
- SQL files in `/migrations` numbered `001_*.sql` through `004_*.sql`
- `migrations` table tracks applied files
- Runs on every startup (skips already-applied)

## IPC Channel Registry
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `storage:query` | R→M | CRUD queries |
| `storage:migrate` | R→M | Run migration |
| `auth:hashPassword` | R→M | bcrypt hash |
| `auth:verifyPassword` | R→M | bcrypt compare |
| `license:validate` | R→M | License check |
| `license:getInfo` | R→M | License info |
| `license:activate` | R→M | License activation |
| `dialog:openFile` | R→M | File picker |
| `dialog:saveFile` | R→M | Save dialog |
| `dialog:messageBox` | R→M | Alert/confirm |
| `window:minimize` | R→M | Window control |
| `window:maximize` | R→M | Window control |
| `window:close` | R→M | Window control |

R = Renderer, M = Main

## State Management
- **Module-local**: Each service has a simple `{ items, setItems }` store
- **Shared**: Zustand store (`sharedState`) for currentUser, currentCompany, licenseInfo
- **No Redux** — Zustand for shared, plain objects for module-local

## Testing
- Vitest, Node environment
- Tests in `tests/<module>/` mirroring `src/modules/<module>/`
- Domain: Zod schema validation
- Application: Service instantiation with mocked dependencies
- **70 tests passing** (auth: 8, license: 3, companies: 6, customers: 7, items: 8, vendors: 4, quotations: 8, invoices: 7, customer-pos: 5, payments: 3, vendor-po: 3, purchases: 3, preview-print: 6, backup-restore: 7)

## File Tree (Current)
```
electron/
  main.js              Entry, DB init, IPC handlers
  preload.js           Secure API exposure only
  adapters/
    sqlite-adapter.js  SQLite with table whitelist
    migration-runner.js Ordered SQL execution

src/
  bootstrap.js         Init sequence
  main.jsx             React entry
  core/                Core services (adapters)
  shell/               Shell services (bus, router, registry)
  shared/components/   Shared UI (LoginPage, CompanySelectPage, AppLayout)
  modules/
    auth/              Login, sessions, password hashing
    license/           License validation
    companies/         Company CRUD
    customers/         Customer CRUD (Phase 2A)
    items/             Item/Product catalog (Phase 2B)
    vendors/           Vendor/Supplier management (Phase 2B)
    quotations/        Sales Quotations (Phase 3A)
    invoices/          Sales Invoices (Phase 3B)
    customer-pos/      Customer Orders (Phase 3C)
    payments/          Payment Records (Phase 3D)
    vendor-po/         Purchase Orders (Phase 4A)
    purchases/         Purchase Bills (Phase 4B)
    preview-print/     HTML Preview & Print (Phase 5B)
    reports/           Reports (Phase 5A)
    user-management/   Roles, permissions
    settings/          App preferences

migrations/
  001_auth_schema.sql
  002_companies_schema.sql
  003_app_settings_schema.sql
  004_customers_schema.sql
  005_items_schema.sql
  006_vendors_schema.sql
  007_quotations_schema.sql
  008_invoices_schema.sql
  009_payments_schema.sql
  010_vendor_po_schema.sql
  011_purchases_schema.sql
  012_vendor_payments.sql
```
```
