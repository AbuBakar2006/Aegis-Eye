import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className={cn('relative', sizes[size])}>
        <div className={cn('absolute inset-0 rounded-full border-2 border-white/10', sizes[size])} />
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin',
            sizes[size]
          )}
        />
      </div>
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" label="Loading…" />
    </div>
  );
}
