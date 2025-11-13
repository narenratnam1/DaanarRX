import { Timestamp } from 'firebase/firestore';

/**
 * Core database entity types
 */

// Temperature storage type
export type TempType = 'room' | 'fridge';

// Unit status type
export type UnitStatus = 'in_stock' | 'partial' | 'dispensed' | 'expired' | 'discarded' | 'quarantined';

// Transaction type
export type TransactionType = 'check_in' | 'check_out' | 'adjust' | 'move' | 'remove';

// View navigation type
export type ViewType = 
  | 'home' 
  | 'check-in' 
  | 'check-out' 
  | 'scan' 
  | 'inventory' 
  | 'reports' 
  | 'admin'
  | 'label-display';

/**
 * Database entity interfaces
 */

export interface Location {
  id: string;
  name: string;
  temp_type: TempType;
  is_active: boolean;
  created_at?: Timestamp;
}

export interface Lot {
  id: string;
  date_received: string;
  source_donor: string;
  notes: string;
  received_by_user_id: string;
  created_at: Timestamp;
}

export interface Unit {
  id: string;
  daana_id: string;
  lot_id: string;
  med_generic: string;
  med_brand: string;
  strength: string;
  form: string;
  ndc: string;
  qty_total: number;
  exp_date: string;
  location_id: string;
  location_name: string;
  status: UnitStatus;
  qr_code_value: string; // JSON string with unit data
  qr_code_image?: string; // Optional: URL or base64 image of QR code
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Transaction {
  id: string;
  daana_id: string;
  type: TransactionType;
  qty?: number;
  by_user_id: string;
  patient_ref?: string;
  reason_note?: string;
  timestamp: Timestamp;
}

export interface NDCFormulary {
  id: string;
  ndc: string;
  med_generic: string;
  med_brand: string;
  strength: string;
  form: string;
  last_updated: Timestamp;
}

/**
 * API and computed types
 */

export interface NDCLookupResult {
  genericName: string;
  brandName: string;
  strength: string;
  form: string;
}

export interface StatusStats {
  inStock: number;
  expiringSoon: number;
  checkedOutToday: number;
}

/**
 * QR Code data structure
 */
export interface QRCodeData {
  u: string; // daana_id
  l: string; // lot_id (truncated)
  g: string; // med_generic
  s: string; // strength
  f: string; // form
  x: string; // exp_date
  loc: string; // location_name
}

/**
 * Search result types
 */
export interface SearchResult {
  id?: string;
  med_generic: string;
  med_brand: string;
  strength: string;
  form: string;
  ndc?: string;
  rxcui?: string;
  source: 'local' | 'rxnorm';
}

// Re-export types from other type files
export type {
  // API types
  OpenFDAResult,
  OpenFDAResponse,
  RxNormDrug,
  RxNormSearchResponse,
  APIResponse,
  NDCLookupResponse,
  UnitLookupResponse,
} from './api.types';

export type {
  // UI types
  ButtonVariant,
  IconButtonVariant,
  BaseModalProps,
  ModalProps,
  ConfirmModalProps,
  NavigationProps,
  FormFieldProps,
  DateInputProps,
  BarcodeScannerProps,
  ScanLookupCardProps,
  SortOrder,
  SortField,
  TableColumn,
  TableProps,
  StatusType,
  StatusBadgeProps,
  LoadingState,
} from './ui.types';

export type {
  // Theme types
  ButtonStyleConfig,
  IconButtonStyleConfig,
  DisabledButtonStyle,
  ButtonStyles,
  IconButtonStyles,
  CustomButtonProps,
  ColorToken,
  SizeToken,
  SpaceToken,
  Breakpoint,
  ResponsiveProp,
} from './theme.types';

