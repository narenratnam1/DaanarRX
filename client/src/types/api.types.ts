/**
 * API-related type definitions
 */

// OpenFDA API Response Types
export interface OpenFDAResult {
  openfda?: {
    generic_name?: string[];
    brand_name?: string[];
    dosage_form?: string[];
    route?: string[];
    substance_name?: string[];
  };
}

export interface OpenFDAResponse {
  results?: OpenFDAResult[];
}

// RxNorm API Types
export interface RxNormDrug {
  rxcui: string;
  genericName: string;
  brandName: string;
  strength: string;
  form: string;
  ndc?: string;
}

export interface RxNormSearchResponse {
  success: boolean;
  data?: RxNormDrug[];
  message?: string;
}

// Internal API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface NDCLookupResponse extends APIResponse<NDCLookupResult> {}

export interface NDCLookupResult {
  genericName: string;
  brandName: string;
  strength: string;
  form: string;
}

// Unit Lookup Response
export interface UnitLookupResponse extends APIResponse {
  daanaId?: string;
}

