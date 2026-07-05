async function invokeRemote(channel, payload) {
  const res = await fetch('/api/ipc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, payload: payload || {} }),
  });
  return res.json();
}

function localHandler(channel, payload) {
  switch (channel) {
    case 'dialog:openFile':
    case 'dialog:saveFile':
      return { success: false, canceled: true, error: 'File dialogs are not available in the browser preview.' };
    case 'dialog:messageBox':
      if (typeof window !== 'undefined') window.alert(payload?.message || '');
      return { success: true, data: { buttonIndex: 0 } };
    case 'window:minimize':
    case 'window:maximize':
    case 'window:close':
    case 'window:openChild':
      return { success: false, error: 'Window controls are not available in the browser preview.' };
    default:
      return { success: false, error: `Unknown channel: ${channel}` };
  }
}

export function createBrowserApi() {
  return {
    storage: {
      runQuery: (payload) => invokeRemote('storage:query', payload),
      runMigration: (payload) => invokeRemote('storage:migrate', payload),
      readFile: (payload) => invokeRemote('storage:readFile', payload),
      backup: {
        create: (payload) => invokeRemote('storage:backupCreate', payload),
        restore: (payload) => invokeRemote('storage:backupRestore', payload),
        export: { json: (payload) => invokeRemote('storage:exportJson', payload) },
        import: { json: (payload) => invokeRemote('storage:importJson', payload) },
        migration: { runOldApp: (payload) => invokeRemote('storage:migrationRun', payload) },
        runMigration: (payload) => invokeRemote('backup:runMigration', payload),
      },
    },
    dialog: {
      openFile: (payload) => Promise.resolve(localHandler('dialog:openFile', payload)),
      saveFile: (payload) => Promise.resolve(localHandler('dialog:saveFile', payload)),
      showMessageBox: (payload) => Promise.resolve(localHandler('dialog:messageBox', payload)),
    },
    print: {
      savePdf: (payload) => invokeRemote('print:savePdf', payload).then((result) => {
        if (result?.success && result?.data) {
          try {
            const binary = typeof atob === 'function' ? atob(result.data) : Buffer.from(result.data, 'base64').toString('binary');
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes.buffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.fileName || 'document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (error) {
            console.error('[BrowserApi] PDF download failed:', error);
          }
        }
        return result;
      }),
      send: (payload) => invokeRemote('print:send', payload),
      getPrinters: (payload) => invokeRemote('print:getPrinters', payload),
    },
    license: {
      validateKey: (payload) => invokeRemote('license:validate', payload),
      getInfo: (payload) => invokeRemote('license:getInfo', payload),
      activate: (payload) => invokeRemote('license:activate', payload),
    },
    data: {
      exportCsv: (payload) => invokeRemote('data:exportCsv', payload),
      importCsv: (payload) => invokeRemote('data:importCsv', payload),
    },
    branding: {
      saveImage: (payload) => invokeRemote('branding:saveImage', payload),
      deleteImage: (payload) => invokeRemote('branding:deleteImage', payload),
    },
    auth: {
      hashPassword: (payload) => invokeRemote('auth:hashPassword', payload),
      verifyPassword: (payload) => invokeRemote('auth:verifyPassword', payload),
    },
    window: {
      minimize: (payload) => Promise.resolve(localHandler('window:minimize', payload)),
      maximize: (payload) => Promise.resolve(localHandler('window:maximize', payload)),
      close: (payload) => Promise.resolve(localHandler('window:close', payload)),
      openChild: (payload) => Promise.resolve(localHandler('window:openChild', payload)),
    },
  };
}

export function installBrowserApiShim() {
  if (typeof window === 'undefined') return;
  if (window.api) return;
  window.api = createBrowserApi();
}
