import { Alert, Text } from '@mantine/core';
import { IconInfoCircle, IconAlertTriangle, IconAlertCircle } from '@tabler/icons-react';
import { CapacityBadge } from './CapacityBadge';

interface LotCapacityAlertProps {
  currentCapacity: number;
  maxCapacity: number;
  /** Optional: Show available capacity */
  showAvailable?: boolean;
  /** Optional: Variant for different contexts */
  variant?: 'info' | 'warning' | 'error';
}

/**
 * LotCapacityAlert - Displays lot capacity information in an alert box
 * 
 * Shows current capacity with color-coded badge and optional available capacity
 * Automatically determines alert color and icon based on capacity usage
 * 
 * @example
 * <LotCapacityAlert currentCapacity={50} maxCapacity={100} showAvailable />
 * // Shows: "Lot Capacity: 50/100 units (50 available)"
 */
export function LotCapacityAlert({ 
  currentCapacity, 
  maxCapacity,
  showAvailable = true,
  variant
}: LotCapacityAlertProps) {
  const availableCapacity = maxCapacity - currentCapacity;
  const percentage = maxCapacity > 0 ? (currentCapacity / maxCapacity) * 100 : 0;
  
  // Determine alert color and icon based on capacity usage if variant not provided
  const alertColor = variant === 'error' ? 'red' 
    : variant === 'warning' ? 'yellow'
    : variant === 'info' ? 'blue'
    : percentage >= 100 ? 'red'
    : percentage >= 90 ? 'orange'
    : 'blue';

  const Icon = alertColor === 'red' ? IconAlertCircle
    : alertColor === 'orange' || alertColor === 'yellow' ? IconAlertTriangle
    : IconInfoCircle;

  return (
    <Alert 
      color={alertColor} 
      variant="light"
      icon={<Icon size={16} />}
    >
      <Text size="sm">
        <strong>Lot Capacity:</strong>{' '}
        <CapacityBadge 
          current={currentCapacity} 
          max={maxCapacity}
        />{' '}
        units
        {showAvailable && availableCapacity !== null && (
          <> ({availableCapacity} available)</>
        )}
      </Text>
      {percentage >= 100 && (
        <Text size="sm" c="red" mt="xs">
          ⚠️ This lot is at full capacity. Please select a different lot.
        </Text>
      )}
    </Alert>
  );
}

