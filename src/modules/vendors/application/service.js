import { createVendor } from '../domain/entities.js';
import { VendorNotFoundError } from '../domain/errors.js';

export class VendorService {
  constructor({ storage, commandBus, eventBus, logger, sharedState }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.store = { items: [], setItems: (items) => { this.store.items = items; } };
  }

  async create(data) {
    this.logger.info('Creating vendor', data.name);
    const vendor = createVendor({ ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await this.storage.runQuery({ type: 'insert', table: 'vendors', values: {
      id: vendor.id, name: vendor.name, email: vendor.email || null, phone: vendor.phone || null,
      gstin: vendor.gstin || null, pan: vendor.pan || null,
      address_line1: vendor.addressLine1 || null, address_line2: vendor.addressLine2 || null,
      city: vendor.city || null, state: vendor.state || null, pincode: vendor.pincode || null,
      country: vendor.country || 'India', payment_terms: vendor.paymentTerms || null,
      opening_balance: vendor.openingBalance, is_active: vendor.isActive ? 1 : 0,
      created_at: vendor.createdAt, updated_at: vendor.updatedAt,
    }});
    this.eventBus.emit('vendor:created', { vendor });
    return { success: true, data: vendor };
  }

  async update(id, data) {
    this.logger.info('Updating vendor', id);
    const existing = await this.findById(id);
    if (!existing) throw new VendorNotFoundError(id);
    const vendor = createVendor({ ...existing, ...data, id, updatedAt: new Date().toISOString() });
    await this.storage.runQuery({ type: 'update', table: 'vendors', where: { id }, values: {
      name: vendor.name, email: vendor.email || null, phone: vendor.phone || null,
      gstin: vendor.gstin || null, pan: vendor.pan || null,
      address_line1: vendor.addressLine1 || null, address_line2: vendor.addressLine2 || null,
      city: vendor.city || null, state: vendor.state || null, pincode: vendor.pincode || null,
      country: vendor.country || 'India', payment_terms: vendor.paymentTerms || null,
      opening_balance: vendor.openingBalance, is_active: vendor.isActive ? 1 : 0, updated_at: vendor.updatedAt,
    }});
    this.eventBus.emit('vendor:updated', { vendor });
    return { success: true, data: vendor };
  }

  async delete(id) {
    this.logger.info('Deleting vendor', id);
    const existing = await this.findById(id);
    if (!existing) throw new VendorNotFoundError(id);
    await this.storage.runQuery({ type: 'delete', table: 'vendors', where: { id } });
    this.eventBus.emit('vendor:deleted', { id });
    return { success: true };
  }

  async findById(id) {
    const result = await this.storage.runQuery({ table: 'vendors', where: { id }, limit: 1 });
    const row = result?.data?.[0];
    if (!row) return null;
    return createVendor({ id: row.id, name: row.name, email: row.email || '', phone: row.phone || '',
      gstin: row.gstin || '', pan: row.pan || '',
      addressLine1: row.address_line1 || '', addressLine2: row.address_line2 || '',
      city: row.city || '', state: row.state || '', pincode: row.pincode || '',
      country: row.country || 'India', paymentTerms: row.payment_terms || '',
      openingBalance: row.opening_balance || 0, isActive: row.is_active === 1,
      createdAt: row.created_at, updatedAt: row.updated_at });
  }

  async getList(params = {}) {
    const { search, isActive, limit = 50, offset = 0 } = params;
    let sql = 'SELECT * FROM vendors WHERE 1=1';
    const whereValues = [];
    if (search) { sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR gstin LIKE ?)'; whereValues.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
    if (isActive !== undefined) { sql += ' AND is_active = ?'; whereValues.push(isActive ? 1 : 0); }
    sql += ' ORDER BY name LIMIT ? OFFSET ?'; whereValues.push(limit, offset);
    const rows = await this.storage.runQuery({ type: 'custom', table: 'vendors', sql, values: whereValues });
    return { success: true, data: (rows?.data || []).map(row => createVendor({ id: row.id, name: row.name, email: row.email || '', phone: row.phone || '',
      gstin: row.gstin || '', pan: row.pan || '',
      addressLine1: row.address_line1 || '', addressLine2: row.address_line2 || '',
      city: row.city || '', state: row.state || '', pincode: row.pincode || '',
      country: row.country || 'India', paymentTerms: row.payment_terms || '',
      openingBalance: row.opening_balance || 0, isActive: row.is_active === 1,
      createdAt: row.created_at, updatedAt: row.updated_at })) };
  }
}