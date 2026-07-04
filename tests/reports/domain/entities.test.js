import { describe, it, expect } from 'vitest';
import { ReportFilterSchema, createReportFilter } from '../../../src/modules/reports/domain/entities.js';

describe('Reports Domain Entities', () => {
  describe('ReportFilterSchema', () => {
    it('should validate a valid filter', () => {
      const filter = createReportFilter({ dateFrom: new Date().toISOString(), dateTo: new Date().toISOString() });
      expect(filter.dateFrom).toBeDefined();
      expect(filter.dateTo).toBeDefined();
    });
  });
});