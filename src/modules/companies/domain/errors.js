export class CompanyNotFoundError extends Error {
  constructor(id) {
    super(`Company not found: ${id}`);
    this.code = 'COMPANY_NOT_FOUND';
  }
}

export class DuplicateGSTINError extends Error {
  constructor(gstin) {
    super(`Company with GSTIN ${gstin} already exists`);
    this.code = 'COMPANY_DUPLICATE_GSTIN';
  }
}