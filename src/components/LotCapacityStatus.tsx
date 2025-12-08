import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, AlertTriangle, X } from 'lucide-react';

interface LotCapacityStatusProps {
  currentCapacity: number;
  maxCapacity: number;
  addingQuantity: number;
}

interface CapacityStatus {
  isValid: boolean;
  message: string;
  variant: 'default' | 'destructive';
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
        variant: 'default',
        color: 'blue',
        icon: <Check className="h-4 w-4" />,
      };
    }

    // Would exceed capacity
    if (newTotal > maxCapacity) {
      return {
        isValid: false,
        message: `Would exceed capacity! Max: ${maxCapacity}, Current: ${currentCapacity}, Available: ${available}`,
        variant: 'destructive',
        color: 'red',
        icon: <X className="h-4 w-4" />,
      };
    }

    // Exactly at capacity
    if (newTotal === maxCapacity) {
      return {
        isValid: true,
        message: `Will fill lot to capacity (${newTotal}/${maxCapacity})`,
        variant: 'default',
        color: 'orange',
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    }

    // Calculate percentage
    const percentUsed = Math.round((newTotal / maxCapacity) * 100);
    
    // Determine color based on percentage
    const color = percentUsed >= 90 ? 'orange'
      : percentUsed >= 80 ? 'yellow'
      : 'green';

    const icon = percentUsed >= 80 
      ? <AlertTriangle className="h-4 w-4" />
      : <Check className="h-4 w-4" />;

    return {
      isValid: true,
      message: `After adding: ${newTotal}/${maxCapacity} units (${percentUsed}% full)`,
      variant: 'default',
      color,
      icon,
    };
  };

  const status = getCapacityStatus();

  return (
    <Alert variant={status.variant}>
      {status.icon}
      <AlertDescription>
        {status.message}
      </AlertDescription>
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
