/**
 * Advanced Inventory Filtering Types
 * Strongly typed interfaces with no type casting
 */

import { DrugData, LocationData } from './graphql';

// Enum types matching GraphQL schema exactly
export type ExpirationWindow =
  | 'EXPIRED'
  | 'EXPIRING_7_DAYS'
  | 'EXPIRING_30_DAYS'
  | 'EXPIRING_60_DAYS'
  | 'EXPIRING_90_DAYS'
  | 'ALL';

export type SortOrder = 'ASC' | 'DESC';

export type UnitSortField =
  | 'EXPIRY_DATE'
  | 'MEDICATION_NAME'
  | 'QUANTITY'
  | 'CREATED_DATE'
  | 'STRENGTH';

// Filter input type matching GraphQL InventoryFilters input
export interface InventoryFiltersInput {
  expiryDateFrom?: string; // ISO date string
  expiryDateTo?: string; // ISO date string
  locationIds?: string[];
  minStrength?: number;
  maxStrength?: number;
  strengthUnit?: string;
  expirationWindow?: ExpirationWindow;
  medicationName?: string;
  genericName?: string;
  ndcId?: string;
  sortBy?: UnitSortField;
  sortOrder?: SortOrder;
}

// Client-side filter state (uses Date objects for easier manipulation)
export interface InventoryFiltersState {
  expiryDateFrom?: Date;
  expiryDateTo?: Date;
  locationIds?: string[];
  minStrength?: number;
  maxStrength?: number;
  strengthUnit?: string;
  expirationWindow?: ExpirationWindow;
  medicationName?: string;
  genericName?: string;
  ndcId?: string;
  sortBy?: UnitSortField;
  sortOrder?: SortOrder;
}

// Lot data with location included
export interface LotWithLocation {
  lotId: string;
  source: string;
  note?: string | null;
  dateCreated: string;
  locationId: string;
  clinicId: string;
  maxCapacity?: number | null;
  currentCapacity?: number | null;
  availableCapacity?: number | null;
  location?: LocationData;
}

// User info for units
export interface UserInfo {
  userId: string;
  username: string;
  email: string;
}

// Complete unit data with all nested types
export interface UnitWithDetails {
  unitId: string;
  totalQuantity: number;
  availableQuantity: number;
  expiryDate: string; // ISO date string from server
  optionalNotes?: string | null;
  manufacturerLotNumber?: string | null;
  dateCreated: string;
  drug: DrugData;
  lot: LotWithLocation;
  user?: UserInfo;
}

// Paginated units response
export interface PaginatedUnitsResponse {
  units: UnitWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}

// Medication expiring summary
export interface MedicationExpiring {
  drugId: string;
  medicationName: string;
  genericName: string;
  strength: number;
  strengthUnit: string;
  ndcId: string;
  totalUnits: number;
  totalQuantity: number;
  expiryDate: string; // ISO date string
  daysUntilExpiry: number;
  units: UnitWithDetails[];
}

// Expiry report summary statistics
export interface ExpiryReportSummary {
  expired: number;
  expiring7Days: number;
  expiring30Days: number;
  expiring60Days: number;
  expiring90Days: number;
  total: number;
}

// Complete expiry report
export interface ExpiryReport {
  summary: ExpiryReportSummary;
  medications: MedicationExpiring[];
}

// GraphQL query response types
export interface GetUnitsAdvancedResponse {
  getUnitsAdvanced: PaginatedUnitsResponse;
}

export interface GetMedicationsExpiringResponse {
  getMedicationsExpiring: MedicationExpiring[];
}

export interface GetExpiryReportResponse {
  getExpiryReport: ExpiryReport;
}

export interface GetInventoryByLocationResponse {
  getInventoryByLocation: UnitWithDetails[];
}

// Helper function to convert Date to ISO date string (YYYY-MM-DD)
export function dateToISOString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper function to convert filter state to GraphQL input
export function filtersStateToInput(state: InventoryFiltersState): InventoryFiltersInput {
  const input: InventoryFiltersInput = {};

  if (state.expiryDateFrom) {
    input.expiryDateFrom = dateToISOString(state.expiryDateFrom);
  }
  if (state.expiryDateTo) {
    input.expiryDateTo = dateToISOString(state.expiryDateTo);
  }
  if (state.locationIds && state.locationIds.length > 0) {
    input.locationIds = state.locationIds;
  }
  if (state.minStrength !== undefined) {
    input.minStrength = state.minStrength;
  }
  if (state.maxStrength !== undefined) {
    input.maxStrength = state.maxStrength;
  }
  if (state.strengthUnit) {
    input.strengthUnit = state.strengthUnit;
  }
  if (state.expirationWindow) {
    input.expirationWindow = state.expirationWindow;
  }
  if (state.medicationName) {
    input.medicationName = state.medicationName;
  }
  if (state.genericName) {
    input.genericName = state.genericName;
  }
  if (state.ndcId) {
    input.ndcId = state.ndcId;
  }
  if (state.sortBy) {
    input.sortBy = state.sortBy;
  }
  if (state.sortOrder) {
    input.sortOrder = state.sortOrder;
  }

  return input;
}

// Expiration window metadata for UI
export interface ExpirationWindowOption {
  value: ExpirationWindow;
  label: string;
  description: string;
}

export const EXPIRATION_WINDOWS: readonly ExpirationWindowOption[] = [
  { value: 'ALL', label: 'All', description: 'Show all inventory' },
  { value: 'EXPIRED', label: 'Expired', description: 'Already expired' },
  { value: 'EXPIRING_7_DAYS', label: '7 Days', description: 'Expiring within 7 days' },
  { value: 'EXPIRING_30_DAYS', label: '30 Days', description: 'Expiring within 30 days' },
  { value: 'EXPIRING_60_DAYS', label: '60 Days', description: 'Expiring within 60 days' },
  { value: 'EXPIRING_90_DAYS', label: '90 Days', description: 'Expiring within 90 days' },
] as const;

// Sort field options for UI
export interface SortFieldOption {
  value: UnitSortField;
  label: string;
}

export const SORT_FIELDS: readonly SortFieldOption[] = [
  { value: 'EXPIRY_DATE', label: 'Expiry Date' },
  { value: 'MEDICATION_NAME', label: 'Medication Name' },
  { value: 'QUANTITY', label: 'Quantity' },
  { value: 'CREATED_DATE', label: 'Date Added' },
  { value: 'STRENGTH', label: 'Strength' },
] as const;
