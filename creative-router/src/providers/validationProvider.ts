import type { CreativeVariant } from '../models.js';

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

export interface ValidationProvider {
  readonly id: string;

  validateVariants(variants: CreativeVariant[]): Promise<ValidationResult>;
}

/**
 * Mock implementation that always reports variants as valid.
 */
export class MockValidationProvider implements ValidationProvider {
  readonly id = 'mock-validation';

  async validateVariants(variants: CreativeVariant[]): Promise<ValidationResult> {
    return {
      valid: true,
      issues: [],
    };
  }
}

