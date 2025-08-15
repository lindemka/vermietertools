import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  showRetry?: boolean;
}

export function Error({
  title = 'Ein Fehler ist aufgetreten',
  message = 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
  onRetry,
  className,
  showRetry = true,
}: ErrorProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-6', className)}>
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
        {message}
      </p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Erneut versuchen
        </Button>
      )}
    </div>
  );
}

export function ErrorPage({ title, message, onRetry }: ErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Error title={title} message={message} onRetry={onRetry} />
    </div>
  );
}

export function ErrorCard({ title, message, onRetry }: ErrorProps) {
  return (
    <div className="p-6">
      <Error title={title} message={message} onRetry={onRetry} />
    </div>
  );
}
