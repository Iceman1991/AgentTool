import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ children, color, className, size = 'md' }: BadgeProps) {
  const style = color
    ? { backgroundColor: color + '33', color, borderColor: color + '66' }
    : undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs',
        !color && 'bg-gray-700 text-gray-300 border-gray-600',
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}
