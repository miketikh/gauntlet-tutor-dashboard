'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Algorithm dashboard error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We encountered an error while loading the Algorithm Refinement Dashboard. This could be due to:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Database connection issues</li>
            <li>Missing or corrupted algorithm data</li>
            <li>Service function errors</li>
          </ul>

          {error.message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900 mb-1">Error Details:</p>
              <p className="text-sm text-red-700 font-mono">{error.message}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard" className="gap-2">
                <Home className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-4">
            If this error persists, please contact your system administrator.
            {error.digest && <> Error ID: {error.digest}</>}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
