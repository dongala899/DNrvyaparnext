import { createCompany } from '../domain/entities.js';
import { CompanyNotFoundError, DuplicateGSTINError } from '../domain/errors.js';

export class CompanyService {
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

  async create(data, user) {
    this.logger.info('Creating company', data.name);

    if (data.gstin) {
      const existing = await this.storage.runQuery({
        table: 'companies',
        where: { gstin: data.gstin },
        limit: 1,
      });

      if (existing?.data?.[0]) {
        throw new DuplicateGSTINError(data.gstin);
      }
    }

    const company = createCompany({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({
      type: 'insert',
      table: 'companies',
      values: {
        id: company.id,
        name: company.name,
        legal_name: company.legalName || null,
        gstin: company.gstin || null,
        pan: company.pan || null,
        address_line1: company.addressLine1 || null,
        address_line2: company.addressLine2 || null,
        city: company.city || null,
        state: company.state || null,
        state_code: company.stateCode || null,
        pincode: company.pincode || null,
        phone: company.phone || null,
        email: company.email || null,
        is_active: company.isActive ? 1 : 0,
        created_at: company.createdAt,
        updated_at: company.updatedAt,
      },
    });

    this.eventBus.emit('company:created', { company });
    return { success: true, data: company };
  }

  async update(id, data, user) {
    this.logger.info('Updating company', id);

    const existing = await this.findById(id);
    if (!existing) {
      throw new CompanyNotFoundError(id);
    }

    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };

    await this.storage.runQuery({
      type: 'update',
      table: 'companies',
      where: { id },
      values: {
        name: updated.name,
        legal_name: updated.legalName || null,
        gstin: updated.gstin || null,
        pan: updated.pan || null,
        address_line1: updated.addressLine1 || null,
        address_line2: updated.addressLine2 || null,
        city: updated.city || null,
        state: updated.state || null,
        state_code: updated.stateCode || null,
        pincode: updated.pincode || null,
        phone: updated.phone || null,
        email: updated.email || null,
        is_active: updated.isActive ? 1 : 0,
        updated_at: updated.updatedAt,
      },
    });

    this.eventBus.emit('company:updated', { company: updated });

    const currentCompany = this.sharedState.getState().currentCompany;
    if (currentCompany?.id === id) {
      this.sharedState.getState().setCurrentCompany(updated);
      this.eventBus.emit('company:changed', { company: updated });
    }

    return { success: true, data: updated };
  }

  async findById(id) {
    const result = await this.storage.runQuery({
      table: 'companies',
      where: { id },
      limit: 1,
    });
    return result?.data?.[0] || null;
  }

  async getList() {
    const result = await this.storage.runQuery({
      table: 'companies',
      orderBy: ['name'],
    });
    return { success: true, data: result?.data || [] };
  }

  async setCurrent(companyId) {
    const company = await this.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundError(companyId);
    }

    this.sharedState.getState().setCurrentCompany(company);
    this.eventBus.emit('company:changed', { company });
    return { success: true, data: company };
  }

  getCurrent() {
    return this.sharedState.getState().currentCompany;
  }
}