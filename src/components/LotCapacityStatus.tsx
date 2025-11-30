import { Alert, Text } from '@mantine/core';
import { IconCheck, IconAlertTriangle, IconX } from '@tabler/icons-react';

interface LotCapacityStatusProps {
  currentCapacity: number;
  maxCapacity: number;
  addingQuantity: number;
}

interface CapacityStatus {
  isValid: boolean;
  message: string;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'blue';
  icon: React.ReactNode;
}

/**
 * LotCapacityStatus - Shows real-time validation status when adding units to a lot
 * 
 * Displays what will happen after adding the specified quantity:
 * - Green: < 80% full after adding
 * - Yellow: 80-89% full after adding
 * - Orange: 90-99% full after adding  
 * - Red: Would exceed capacity (invalid)
 * 
 * @example
 * <LotCapacityStatus 
 *   currentCapacity={50} 
 *   maxCapacity={100} 
 *   addingQuantity={40}
 * />
 * // Shows: "✓ After adding: 90/100 units (90% full)"
 */
export function LotCapacityStatus({
  currentCapacity,
  maxCapacity,
  addingQuantity,
}: LotCapacityStatusProps) {
  const getCapacityStatus = (): CapacityStatus => {
    const newTotal = currentCapacity + addingQuantity;
    const available = maxCapacity - currentCapacity;

    // No quantity entered yet
    if (addingQuantity === 0) {
      return {
        isValid: true,
        message: `${currentCapacity}/${maxCapacity} units used (${available} available)`,
        color: 'blue',
        icon: <IconCheck size={16} />,
      };
    }

    // Would exceed capacity
    if (newTotal > maxCapacity) {
      return {
        isValid: false,
        message: `Would exceed capacity! Max: ${maxCapacity}, Current: ${currentCapacity}, Available: ${available}`,
        color: 'red',
        icon: <IconX size={16} />,
      };
    }

    // Exactly at capacity
    if (newTotal === maxCapacity) {
      return {
        isValid: true,
        message: `Will fill lot to capacity (${newTotal}/${maxCapacity})`,
        color: 'orange',
        icon: <IconAlertTriangle size={16} />,
      };
    }

    // Calculate percentage
    const percentUsed = Math.round((newTotal / maxCapacity) * 100);
    
    // Determine color based on percentage
    const color = percentUsed >= 90 ? 'orange'
      : percentUsed >= 80 ? 'yellow'
      : 'green';

    const icon = percentUsed >= 80 
      ? <IconAlertTriangle size={16} />
      : <IconCheck size={16} />;

    return {
      isValid: true,
      message: `After adding: ${newTotal}/${maxCapacity} units (${percentUsed}% full)`,
      color,
      icon,
    };
  };

  const status = getCapacityStatus();

  return (
    <Alert 
      color={status.color} 
      variant="light"
      icon={status.icon}
    >
      {status.message}
    </Alert>
  );
}

/**
 * Hook to get capacity validation status
 * Can be used for form validation
 */
export function useCapacityValidation(
  currentCapacity: number,
  maxCapacity: number,
  addingQuantity: number
): boolean {
  const newTotal = currentCapacity + addingQuantity;
  return addingQuantity > 0 && newTotal <= maxCapacity;
}

