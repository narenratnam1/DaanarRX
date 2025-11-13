/**
 * UI Component-related type definitions
 */

import { ViewType } from './index';

// Button variant types
export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'success' | 'warning' | 'ghost';
export type IconButtonVariant = 'primary' | 'destructive' | 'warning';

// Modal types
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export interface ModalProps extends BaseModalProps {
  children: React.ReactNode;
}

export interface ConfirmModalProps extends BaseModalProps {
  onConfirm: () => void;
  message?: string;
  children?: React.ReactNode;
  confirmText?: string;
  confirmColor?: 'red' | 'blue' | 'green';
}

// Navigation types
export interface NavigationProps {
  onNavigate: (view: ViewType) => void;
}

// Form field types
export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  size?: 2 | 3 | 4 | 5;
  min?: string;
  max?: string;
}

// Scanner types
export interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export interface ScanLookupCardProps {
  onScan: (barcode: string) => void;
  onManualLookup?: (value: string) => void;
  placeholder?: string;
  label?: string;
  scannerTitle?: string;
  showManualLookup?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

// Table types
export type SortOrder = 'asc' | 'desc';
export type SortField = 'name' | 'date' | 'quantity' | 'expiration';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number | string;
  minWidth?: number;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn[];
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

// Status badge types
export type StatusType = 'in_stock' | 'partial' | 'dispensed' | 'expired' | 'discarded' | 'quarantined';

export interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  message?: string;
}

