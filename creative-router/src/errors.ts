import type { ErrorResponse } from './types.js';

export const NO_TEMPLATES_FOUND = 'NO_TEMPLATES_FOUND';
export const PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE';
export const BRAND_PROFILE_INVALID = 'BRAND_PROFILE_INVALID';

export function noTemplatesFound(details?: Record<string, unknown>): ErrorResponse {
  return {
    errorCode: NO_TEMPLATES_FOUND,
    message: 'No eligible templates for requested placements/constraints.',
    details,
  };
}

export function providerUnavailable(provider: string, details?: Record<string, unknown>): ErrorResponse {
  return {
    errorCode: PROVIDER_UNAVAILABLE,
    message: `Provider unavailable: ${provider}. Retry later or check configuration.`,
    details,
  };
}

export function brandProfileInvalid(missingFields: string[], details?: Record<string, unknown>): ErrorResponse {
  return {
    errorCode: BRAND_PROFILE_INVALID,
    message: `Invalid or incomplete brand profile. Missing: ${missingFields.join(', ')}`,
    details: { missingFields, ...details },
  };
}
