'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * A centralized listener that catches Firestore permission errors
 * and surfaces them to the UI/Developer via toasts or specialized overlays.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, this helps identify exactly which rule failed.
      // In production, you might want to log this to a service.
      console.error('🔥 [AGNI-DRISHTI] Security Rule Violation:', {
        path: error.context.path,
        operation: error.context.operation,
        data: error.context.requestResourceData,
      });

      toast({
        variant: 'destructive',
        title: 'Tactical Grid: Access Denied',
        description: `Failed to ${error.context.operation} on ${error.context.path}. Verify credentials.`,
      });

      // Rethrow to trigger the Next.js error boundary/overlay in dev
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}