import { createItem, getCompanyId } from '../domain/entities.js';
import { ItemNotFoundError, DuplicateSKUError } from '../domain/errors.js';

export class ItemService {
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
    this.logger.info('Creating item', data.name);

    if (data.sku) {
      const existing = await this.storage.runQuery({
        table: 'items',
        where: { sku: data.sku, company_id: this.companyId() },
        limit: 1,
      });
      if (existing?.data?.[0]) {
        throw new DuplicateSKUError(data.sku);
      }
    }

    const item = createItem({
      ...data,
      id: crypto.randomUUID(),
      companyId: this.companyId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({
      type: 'insert',
      table: 'items',
      values: {
        id: item.id,
        company_id: item.companyId,
        name: item.name,
        sku: item.sku || null,
        hsn_code: item.hsnCode || null,
        unit: item.unit,
        purchase_price: item.purchasePrice,
        selling_price: item.sellingPrice,
        tax_rate: item.taxRate,
        opening_stock: item.openingStock,
        low_stock_alert: item.lowStockAlert,
        is_active: item.isActive ? 1 : 0,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      },
    });

    this.eventBus.emit('item:created', { item });
    return { success: true, data: item };
  }

  async update(id, data) {
    this.logger.info('Updating item', id);

    const existing = await this.findById(id);
    if (!existing) {
      throw new ItemNotFoundError(id);
    }

    if (data.sku && data.sku !== existing.sku) {
      const dup = await this.storage.runQuery({
        table: 'items',
        where: { sku: data.sku, company_id: this.companyId() },
        limit: 1,
      });
      if (dup?.data?.[0]) {
        throw new DuplicateSKUError(data.sku);
      }
    }

    const item = createItem({
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({
      type: 'update',
      table: 'items',
      where: { id },
      values: {
        name: item.name,
        sku: item.sku || null,
        hsn_code: item.hsnCode || null,
        unit: item.unit,
        purchase_price: item.purchasePrice,
        selling_price: item.sellingPrice,
        tax_rate: item.taxRate,
        opening_stock: item.openingStock,
        low_stock_alert: item.lowStockAlert,
        is_active: item.isActive ? 1 : 0,
        updated_at: item.updatedAt,
      },
    });

    this.eventBus.emit('item:updated', { item });
    return { success: true, data: item };
  }

  async delete(id) {
    this.logger.info('Deleting item', id);

    const existing = await this.findById(id);
    if (!existing) {
      throw new ItemNotFoundError(id);
    }

    await this.storage.runQuery({
      type: 'delete',
      table: 'items',
      where: { id, company_id: this.companyId() },
    });

    this.eventBus.emit('item:deleted', { id });
    return { success: true };
  }

  async findById(id) {
    const result = await this.storage.runQuery({
      table: 'items',
      where: { id, company_id: this.companyId() },
      limit: 1,
    });

    const row = result?.data?.[0];
    if (!row) return null;

    return createItem({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      sku: row.sku || '',
      hsnCode: row.hsn_code || '',
      unit: row.unit || 'PCS',
      purchasePrice: row.purchase_price || 0,
      sellingPrice: row.selling_price || 0,
      taxRate: row.tax_rate || 0,
      openingStock: row.opening_stock || 0,
      lowStockAlert: row.low_stock_alert || 0,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async getList(params = {}) {
    const { search, isActive, limit = 50, offset = 0 } = params;
    const cid = this.companyId();

    let sql = 'SELECT * FROM items';
    const whereValues = [];
    const whereClauses = [];

    if (cid) whereClauses.push('company_id = ?'), whereValues.push(cid);
    if (search) whereClauses.push('(name LIKE ? OR sku LIKE ? OR hsn_code LIKE ?)'), whereValues.push(`%${search}%`, `%${search}%`, `%${search}%`);
    if (isActive !== undefined) whereClauses.push('is_active = ?'), whereValues.push(isActive ? 1 : 0);

    if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');
    sql += ' ORDER BY name LIMIT ? OFFSET ?';
    whereValues.push(limit, offset);

    const rows = await this.storage.runQuery({
      type: 'custom',
      table: 'items',
      sql,
      values: whereValues,
    });

    const items = (rows?.data || []).map(row => createItem({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      sku: row.sku || '',
      hsnCode: row.hsn_code || '',
      unit: row.unit || 'PCS',
      purchasePrice: row.purchase_price || 0,
      sellingPrice: row.selling_price || 0,
      taxRate: row.tax_rate || 0,
      openingStock: row.opening_stock || 0,
      lowStockAlert: row.low_stock_alert || 0,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { success: true, data: items };
  }
}
