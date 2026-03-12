import { type ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-1">{title}</h3>
        {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
