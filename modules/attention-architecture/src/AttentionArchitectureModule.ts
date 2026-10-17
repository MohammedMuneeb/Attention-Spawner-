import { NativeModule, requireNativeModule } from 'expo';

declare class AttentionArchitectureModule extends NativeModule<{}> {
  setBlockedApps(apps: string[]): void;
  getBlockedApps(): string[];
  getInstalledApps(): { id: string; name: string }[];
  hasUsageStatsPermission(): boolean;
  openUsageStatsSettings(): void;
  hasOverlayPermission(): boolean;
  openOverlaySettings(): void;
  startForegroundService(): void;
  stopForegroundService(): void;
  getInterceptIntent(): { isIntercept: boolean; blockedApp: string | null };
  allowAndLaunchApp(packageName: string, minutes: number): boolean;
  goToHomeScreen(): boolean;
}

export default requireNativeModule<AttentionArchitectureModule>('AttentionArchitecture');
