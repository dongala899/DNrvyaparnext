const { contextBridge, ipcRenderer } = require('electron');

const CHANNELS = {
  storage: {
    runQuery: 'storage:query',
    runMigration: 'storage:migrate',
    backup: {
      create: 'storage:backupCreate',
      restore: 'storage:backupRestore',
      export: { json: 'storage:exportJson' },
      import: { json: 'storage:importJson' },
      migration: { runOldApp: 'storage:migrationRun' },
    },
  },
  dialog: {
    openFile: 'dialog:openFile',
    saveFile: 'dialog:saveFile',
    showMessageBox: 'dialog:messageBox',
  },
  print: {
    savePdf: 'print:savePdf',
    send: 'print:send',
    getPrinters: 'print:getPrinters',
  },
  license: {
    validateKey: 'license:validate',
    getInfo: 'license:getInfo',
    activate: 'license:activate',
  },
  auth: {
    hashPassword: 'auth:hashPassword',
    verifyPassword: 'auth:verifyPassword',
  },
  window: {
    minimize: 'window:minimize',
    maximize: 'window:maximize',
    close: 'window:close',
    openChild: 'window:openChild',
  },
};

function buildApi() {
  const api = {};

  function buildNamespace(namespaceObj, apiObj) {
    for (const [methodName, channel] of Object.entries(namespaceObj)) {
      if (typeof channel === 'string') {
        apiObj[methodName] = (payload) => ipcRenderer.invoke(channel, payload);
      } else {
        apiObj[methodName] = {};
        buildNamespace(channel, apiObj[methodName]);
      }
    }
  }

  for (const [namespace, methods] of Object.entries(CHANNELS)) {
    buildNamespace(methods, api);
  }

  return api;
}

const api = buildApi();

contextBridge.exposeInMainWorld('api', api);