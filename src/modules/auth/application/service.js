import { createUser } from '../domain/entities.js';
import { InvalidCredentialsError } from '../domain/errors.js';

export class AuthService {
  constructor({ storage, commandBus, eventBus, logger, sharedState, ipcAdapter }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.ipc = ipcAdapter || (typeof window !== 'undefined' ? window.api : {});
  }

  async login(username, password) {
    this.logger.info('Login attempt', username);

    const result = await this.storage.runQuery({
      table: 'auth_users',
      where: { username },
      limit: 1,
    });

    const userRecord = result?.data?.[0];
    if (!userRecord) {
      this.logger.warn('Login failed: user not found', username);
      throw new InvalidCredentialsError();
    }

    if (!userRecord.is_active) {
      this.logger.warn('Login failed: user inactive', username);
      const { UserInactiveError } = await import('../domain/errors.js');
      throw new UserInactiveError();
    }

    const hashResult = await this.ipc.auth.verifyPassword({
      hash: userRecord.password_hash,
      password,
    });

    if (!hashResult?.success || !hashResult?.valid) {
      this.logger.warn('Login failed: wrong password', username);
      throw new InvalidCredentialsError();
    }

    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await this.storage.runQuery({
      type: 'insert',
      table: 'auth_sessions',
      values: {
        id: crypto.randomUUID(),
        user_id: userRecord.id,
        token,
        expires_at: expiresAt,
      },
    });

    const user = createUser({
      id: userRecord.id,
      username: userRecord.username,
      fullName: userRecord.full_name,
      email: userRecord.email,
      phone: userRecord.phone,
      roleId: userRecord.role_id,
      isActive: userRecord.is_active === 1,
    });

    localStorage.setItem('auth_token', token);
    this.sharedState.getState().setCurrentUser(user);

    this.eventBus.emit('auth:loggedIn', { user });
    this.logger.info('Login successful', username);

    return { success: true, user, token };
  }

  async logout(token) {
    this.logger.info('Logout');

    if (token) {
      const sessions = await this.storage.runQuery({
        table: 'auth_sessions',
        where: { token },
        limit: 1,
      });

      if (sessions?.data?.[0]) {
        await this.storage.runQuery({
          type: 'delete',
          table: 'auth_sessions',
          where: { id: sessions.data[0].id },
        });
      }
    }

    localStorage.removeItem('auth_token');
    const currentUser = this.sharedState.getState().currentUser;
    this.sharedState.getState().clearAuth();

    this.eventBus.emit('auth:loggedOut', { user: currentUser });
  }

  async validateSession(token) {
    if (!token) {
      return { success: false };
    }

    const sessions = await this.storage.runQuery({
      table: 'auth_sessions',
      where: { token },
      limit: 1,
    });

    const session = sessions?.data?.[0];
    if (!session) {
      return { success: false };
    }

    if (new Date(session.expires_at) < new Date()) {
      await this.storage.runQuery({
        type: 'delete',
        table: 'auth_sessions',
        where: { id: session.id },
      });
      this.eventBus.emit('auth:sessionExpired', { userId: session.user_id });
      return { success: false };
    }

    const users = await this.storage.runQuery({
      table: 'auth_users',
      where: { id: session.user_id },
      limit: 1,
    });

    const userRecord = users?.data?.[0];
    if (!userRecord || !userRecord.is_active) {
      return { success: false };
    }

    const user = createUser({
      id: userRecord.id,
      username: userRecord.username,
      fullName: userRecord.full_name,
      email: userRecord.email,
      phone: userRecord.phone,
      roleId: userRecord.role_id,
      isActive: userRecord.is_active === 1,
    });

    return { success: true, user };
  }

  async changePassword(username, currentPassword, newPassword) {
    this.logger.info('Password change attempt', username);
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }
    const result = await this.storage.runQuery({ table: 'auth_users', where: { username }, limit: 1 });
    const user = result?.data?.[0];
    if (!user) throw new Error('User not found');
    const verifyResult = await this.ipc.auth.verifyPassword({ hash: user.password_hash, password: currentPassword });
    if (!verifyResult?.valid) throw new Error('Current password is incorrect');
    const hashResult = await this.ipc.auth.hashPassword({ password: newPassword });
    if (!hashResult?.success) throw new Error('Failed to hash new password');
    await this.storage.runQuery({ type: 'update', table: 'auth_users', where: { id: user.id }, values: { password_hash: hashResult.hash, updated_at: new Date().toISOString() } });
    this.logger.info('Password changed', username);
    return { success: true };
  }

  generateToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
}