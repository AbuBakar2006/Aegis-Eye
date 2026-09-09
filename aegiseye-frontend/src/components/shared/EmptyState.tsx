import { FileSearch } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'No data',
  message = 'Nothing to display here yet.',
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
        {icon ?? <FileSearch className="w-6 h-6 text-gray-500" />}
      </div>
      <div>
        <p className="text-white font-medium">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>
    </div>
  );
}
