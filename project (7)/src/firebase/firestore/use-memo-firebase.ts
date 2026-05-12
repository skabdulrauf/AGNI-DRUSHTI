
'use client';

import { useMemo } from 'react';

/**
 * A utility hook to stabilize Firestore references and queries.
 * Prevents infinite loops in useCollection and useDoc hooks.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
