import { createUserAccount } from '../domain/entities.js';
import { UserNotFoundError, DuplicateUsernameError, CannotDeactivateSelfError } from '../domain/errors.js';

export class UserService {
  constructor({ storage, commandBus, eventBus, logger, sharedState, ipcAdapter }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.ipc = ipcAdapter || (typeof window !== 'undefined' ? window.api : {});
    this.store = {
      items: [],
      setItems: (items) => { this.store.items = items; },
    };
  }

  async create(data, currentUser) {
    this.logger.info('Creating user', data.username);

    const existing = await this.storage.runQuery({
      table: 'auth_users',
      where: { username: data.username },
      limit: 1,
    });

    if (existing?.data?.[0]) {
      throw new DuplicateUsernameError(data.username);
    }

    const hashResult = await this.ipc.auth.hashPassword({
      password: data.password || 'defaultPassword123',
    });

    if (!hashResult?.success) {
      throw new Error('Failed to hash password');
    }

    const passwordHash = hashResult.hash;

    const user = createUserAccount({
      ...data,
      id: crypto.randomUUID(),
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({
      type: 'insert',
      table: 'auth_users',
      values: {
        id: user.id,
        username: user.username,
        password_hash: passwordHash,
        full_name: user.fullName,
        email: user.email || null,
        phone: user.phone || null,
        role_id: user.roleId,
        is_active: user.isActive ? 1 : 0,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      },
    });

    this.eventBus.emit('user:created', { userId: user.id });
    return { success: true, data: user };
  }

  async update(id, data, currentUser) {
    this.logger.info('Updating user', id);

    const existing = await this.findById(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }

    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };

    await this.storage.runQuery({
      type: 'update',
      table: 'auth_users',
      where: { id },
      values: {
        full_name: updated.fullName,
        email: updated.email || null,
        phone: updated.phone || null,
        role_id: updated.roleId,
        is_active: updated.isActive ? 1 : 0,
        updated_at: updated.updatedAt,
      },
    });

    this.eventBus.emit('user:updated', { userId: id });
    return { success: true, data: updated };
  }

  async findById(id) {
    const result = await this.storage.runQuery({
      table: 'auth_users',
      where: { id },
      limit: 1,
    });
    return result?.data?.[0] || null;
  }

  async getList() {
    const result = await this.storage.runQuery({
      table: 'auth_users',
      orderBy: ['full_name'],
    });
    return { success: true, data: result?.data || [] };
  }

  async deactivate(id, currentUser) {
    if (id === currentUser?.id) {
      throw new CannotDeactivateSelfError();
    }

    await this.storage.runQuery({
      type: 'update',
      table: 'auth_users',
      where: { id },
      values: { is_active: 0, updated_at: new Date().toISOString() },
    });

    this.eventBus.emit('user:deactivated', { userId: id });
    return { success: true };
  }

  async activate(id) {
    await this.storage.runQuery({
      type: 'update',
      table: 'auth_users',
      where: { id },
      values: { is_active: 1, updated_at: new Date().toISOString() },
    });
    return { success: true };
  }
}
