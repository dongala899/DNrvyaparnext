import { describe, it, expect } from 'vitest';
import { PreviewStateSchema, createPreviewState } from '../../../src/modules/preview-print/domain/entities.js';

describe('Preview-Print Domain Entities', () => {
  describe('PreviewStateSchema', () => {
    it('should validate preview state', () => {
      const state = createPreviewState({ isOpen: true, title: 'Test', html: '<p>content</p>' });
      expect(state.isOpen).toBe(true);
      expect(state.title).toBe('Test');
    });

    it('should default isOpen to false', () => {
      const state = createPreviewState({});
      expect(state.isOpen).toBe(false);
    });
  });
});