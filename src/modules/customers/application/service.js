import { createCustomer, getCompanyId } from '../domain/entities.js';
import { CustomerNotFoundError } from '../domain/errors.js';

export class CustomerService {
  constructor({ storage, commandBus, eventBus, logger, sharedState }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.store = {
      items: [],
      setItems: (items) => { this.store.items = items; },
    };
  }

  companyId() {
    return getCompanyId(this.sharedState);
  }

  async create(data) {
    this.logger.info('Creating customer', data.name);

    const customer = createCustomer({
      ...data,
      id: crypto.randomUUID(),
      companyId: this.companyId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({
      type: 'insert',
      table: 'customers',
      values: {
        id: customer.id,
        company_id: customer.companyId,
        name: customer.name,
        email: customer.email || null,
        phone: customer.phone || null,
        address_line1: customer.address?.line1 || null,
        address_line2: customer.address?.line2 || null,
        city: customer.address?.city || null,
        state: customer.address?.state || null,
        pincode: customer.address?.pincode || null,
        country: customer.address?.country || 'India',
        credit_limit: customer.creditLimit,
        credit_days: customer.creditDays,
        opening_balance: customer.openingBalance,
        is_active: customer.isActive ? 1 : 0,
        created_at: customer.createdAt,
        updated_at: customer.updatedAt,
      },
    });

    this.eventBus.emit('customer:created', { customer });
    return { success: true, data: customer };
  }

  async update(id, data) {
    this.logger.info('Updating customer', id);

    const existing = await this.findById(id);
    if (!existing) {
      throw new CustomerNotFoundError(id);
    }

    const customer = createCustomer({
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({
      type: 'update',
      table: 'customers',
      where: { id, company_id: this.companyId() },
      values: {
        name: customer.name,
        email: customer.email || null,
        phone: customer.phone || null,
        address_line1: customer.address?.line1 || null,
        address_line2: customer.address?.line2 || null,
        city: customer.address?.city || null,
        state: customer.address?.state || null,
        pincode: customer.address?.pincode || null,
        country: customer.address?.country || 'India',
        credit_limit: customer.creditLimit,
        credit_days: customer.creditDays,
        opening_balance: customer.openingBalance,
        is_active: customer.isActive ? 1 : 0,
        updated_at: customer.updatedAt,
      },
    });

    this.eventBus.emit('customer:updated', { customer });
    return { success: true, data: customer };
  }

  async delete(id) {
    this.logger.info('Deleting customer', id);

    const existing = await this.findById(id);
    if (!existing) {
      throw new CustomerNotFoundError(id);
    }

    await this.storage.runQuery({
      type: 'delete',
      table: 'customers',
      where: { id, company_id: this.companyId() },
    });

    this.eventBus.emit('customer:deleted', { id });
    return { success: true };
  }

  async findById(id) {
    const result = await this.storage.runQuery({
      table: 'customers',
      where: { id, company_id: this.companyId() },
      limit: 1,
    });

    const row = result?.data?.[0];
    if (!row) return null;

    return createCustomer({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      address: {
        line1: row.address_line1 || undefined,
        line2: row.address_line2 || undefined,
        city: row.city || undefined,
        state: row.state || undefined,
        pincode: row.pincode || undefined,
        country: row.country || 'India',
      },
      creditLimit: row.credit_limit || 0,
      creditDays: row.credit_days || 0,
      openingBalance: row.opening_balance || 0,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async getList(params = {}) {
    const { search, isActive, limit = 50, offset = 0 } = params;
    const cid = this.companyId();

    let sql = 'SELECT * FROM customers';
    const whereValues = [];
    const whereClauses = [];

    if (cid) whereClauses.push('company_id = ?'), whereValues.push(cid);
    if (search) whereClauses.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)'), whereValues.push(`%${search}%`, `%${search}%`, `%${search}%`);
    if (isActive !== undefined) whereClauses.push('is_active = ?'), whereValues.push(isActive ? 1 : 0);

    if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');
    sql += ' ORDER BY name LIMIT ? OFFSET ?';
    whereValues.push(limit, offset);

    const stmt = this.storage.getDb?.();
    const rows = await this.storage.runQuery({
      type: 'custom',
      table: 'customers',
      sql,
      values: whereValues,
    });

    const customers = (rows?.data || []).map(row => createCustomer({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      address: {
        line1: row.address_line1 || undefined,
        line2: row.address_line2 || undefined,
        city: row.city || undefined,
        state: row.state || undefined,
        pincode: row.pincode || undefined,
        country: row.country || 'India',
      },
      creditLimit: row.credit_limit || 0,
      creditDays: row.credit_days || 0,
      openingBalance: row.opening_balance || 0,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { success: true, data: customers };
  }
}
