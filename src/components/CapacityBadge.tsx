import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CapacityBadgeProps {
  current: number;
  max: number;
  /** Show as fraction (e.g., "50/100") or percentage (e.g., "50%") */
  variant?: 'fraction' | 'percentage';
  /** Custom color - if not provided, color is determined automatically */
  color?: string;
}

/**
 * CapacityBadge - Displays capacity with color-coded status
 * 
 * Colors automatically based on usage:
 * - Green: < 70% full
 * - Yellow: 70-89% full  
 * - Orange: 90-99% full
 * - Red: 100% full
 * 
 * @example
 * <CapacityBadge current={50} max={100} /> // Shows: 50/100 (green)
 * <CapacityBadge current={85} max={100} variant="percentage" /> // Shows: 85% (yellow)
 */
export function CapacityBadge({ 
  current, 
  max, 
  variant = 'fraction',
  color 
}: CapacityBadgeProps) {
  // Calculate percentage for color determination
  const percentage = max > 0 ? (current / max) * 100 : 0;
  
  // Determine color based on capacity usage if not provided
  const badgeColor = color || (() => {
    if (percentage >= 100) return 'red';
    if (percentage >= 90) return 'orange';
    if (percentage >= 70) return 'yellow';
    return 'green';
  })();

  // Format display text
  const displayText = variant === 'percentage' 
    ? `${Math.round(percentage)}%`
    : `${current}/${max}`;

  return (
    <Badge 
      variant="default"
      className={cn(
        badgeColor === 'green' && 'bg-green-500 hover:bg-green-600',
        badgeColor === 'yellow' && 'bg-yellow-500 hover:bg-yellow-600',
        badgeColor === 'orange' && 'bg-orange-500 hover:bg-orange-600',
        badgeColor === 'red' && 'bg-red-500 hover:bg-red-600'
      )}
    >
      {displayText}
    </Badge>
  );
}
