import { useEffect } from 'react';
import { integrityService } from '../services/integrity';

/**
 * Hook to automatically initiate Play Integrity checks on app launch.
 * It uses the IntegrityService which conditionally bypasses the checks
 * on non-Play Store installations (like F-Droid).
 */
export function useIntegrityCheck() {
  useEffect(() => {
    let isMounted = true;

    const runCheck = async () => {
      if (!isMounted) return;
      await integrityService.verifyIntegrityConditionally();
    };

    runCheck();

    return () => {
      isMounted = false;
    };
  }, []);
}
