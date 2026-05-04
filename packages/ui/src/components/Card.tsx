import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-[var(--tl-border)] bg-white p-4', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';
