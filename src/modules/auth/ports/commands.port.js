import { AuthService } from '../application/service.js';

export function registerCommands(commandBus, service) {
  commandBus.handle('auth:login', async (payload) => {
    try {
      const result = await service.login(payload.username, payload.password);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('auth:logout', async (payload) => {
    try {
      await service.logout(payload.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('auth:validateSession', async (payload) => {
    try {
      const result = await service.validateSession(payload.token);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('auth:changePassword', async (payload) => {
    try {
      const result = await service.changePassword(payload.username, payload.currentPassword, payload.newPassword);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export function unregisterCommands() {
}