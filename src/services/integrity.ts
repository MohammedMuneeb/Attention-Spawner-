import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Service to handle Play Integrity verification conditionally.
 * This ensures that builds targeting F-Droid or those that are sideloaded
 * do not execute Play Integrity checks, avoiding crashes or warnings.
 */
export const integrityService = {
  /**
   * Initializes Play Integrity Check based on the installer and environment.
   */
  async verifyIntegrityConditionally() {
    if (Platform.OS !== 'android') {
      console.log('[IntegrityService] Not on Android, skipping Play Integrity check.');
      return;
    }

    try {
      // You can also use environment variables, e.g., process.env.EXPO_PUBLIC_DISTRIBUTION_TARGET
      const isFDroidTarget = process.env.EXPO_PUBLIC_DISTRIBUTION_TARGET === 'fdroid';
      
      if (isFDroidTarget) {
        console.log('[IntegrityService] Environment flag EXPO_PUBLIC_DISTRIBUTION_TARGET=fdroid detected. Skipping Play Integrity check.');
        return;
      }

      // Check if native module is present in the current runtime (prevents crash in Expo Go)
      const hasNativeModule = !!requireOptionalNativeModule('ExpoApplication');
      if (!hasNativeModule) {
        console.log('[IntegrityService] ExpoApplication native module not available in current runtime (e.g., Expo Go). Skipping check.');
        return;
      }

      // Safely import Application module
      const Application = await import('expo-application');

      // Dynamically detect installer package
      let installerPackage = 'unknown';
      try {
        if (Application && typeof Application.getInstallReferrerAsync === 'function') {
          installerPackage = (await Application.getInstallReferrerAsync()) || 'unknown';
        }
      } catch (e) {
        console.warn('[IntegrityService] Could not retrieve install referrer:', e);
      }

      console.log(`[IntegrityService] Installer package: ${installerPackage}`);

      const isPlayStoreInstaller = installerPackage.includes('com.android.vending');
      
      // Additional failsafe checks for F-Droid or ADB installations
      const isFDroidInstaller = installerPackage.includes('org.fdroid.fdroid');
      const isAdbInstaller = installerPackage === 'unknown'; // Often null or empty when sideloaded via ADB

      if (isPlayStoreInstaller) {
        console.log('[IntegrityService] Play Store installer detected. Proceeding with Play Integrity checks.');
        await this.runPlayIntegrityChecks();
      } else if (isFDroidInstaller) {
        console.log('[IntegrityService] F-Droid installer detected. Skipping Play Integrity checks.');
      } else {
        console.log('[IntegrityService] Unknown or manual installer detected. Assuming non-Play distribution. Skipping Play Integrity checks.');
      }
      
    } catch (error) {
      console.error('[IntegrityService] Error during conditional integrity check:', error);
    }
  },

  /**
   * Internal function to execute actual Play Integrity requests.
   * This should only be called if we are confident the app is distributed via Google Play.
   */
  async runPlayIntegrityChecks() {
    // TODO: Implement actual Play Integrity API call here
    // Example: using react-native-google-play-integrity
    // const nonce = await fetchNonceFromServer();
    // const token = await PlayIntegrity.requestIntegrityToken(nonce);
    // await sendTokenToServerForVerification(token);
    
    console.log('[IntegrityService] Executing mock Play Integrity checks...');
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('[IntegrityService] Play Integrity checks completed successfully.');
  }
};
