import { Timestamp } from 'firebase/firestore';

export interface Location {
  id: string;
  name: string;
  temp_type: 'room' | 'fridge';
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
  status: 'in_stock' | 'partial' | 'dispensed' | 'expired' | 'discarded' | 'quarantined';
  qr_code_value: string; // JSON string with unit data
  qr_code_image?: string; // Optional: URL or base64 image of QR code
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Transaction {
  id: string;
  daana_id: string;
  type: 'check_in' | 'check_out' | 'adjust' | 'move';
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

export type ViewType = 
  | 'home' 
  | 'check-in' 
  | 'check-out' 
  | 'scan' 
  | 'inventory' 
  | 'reports' 
  | 'admin'
  | 'label-display';

