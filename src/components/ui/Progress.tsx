import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  animated?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    showValue = false,
    size = 'md',
    variant = 'default',
    animated = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
    
    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };
    
    const variants = {
      default: 'bg-primary-600',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
    };
    
    return (
      <div className={cn('relative w-full overflow-hidden', className)} ref={ref} {...props}>
        <div className={cn('w-full overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700', sizes[size])}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              variants[variant],
              animated && 'animate-pulse'
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
        {showValue && (
          <span className="block text-xs font-medium text-gray-700 mt-1 dark:text-gray-300">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export default Progress;