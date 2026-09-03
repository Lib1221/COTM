'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <div className="hazard-stripe mx-auto w-24 rounded-sm" />
      <h1 className="text-2xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground">
        {error.message || 'An unexpected error occurred on this page.'}
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          Ref {error.digest}
        </p>
      )}
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
