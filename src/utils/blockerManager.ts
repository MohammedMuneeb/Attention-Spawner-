import AttentionArchitectureModule from '../../modules/attention-architecture';

export interface BlockerConfig {
  masterApps: string[];
  activeApps: string[];
  snoozes: Map<string, number>;
}

/**
 * Reads the blocked apps list, handles snooze expirations,
 * and synchronizes with the native SharedPreferences.
 */
export function getBlockedConfig(): BlockerConfig {
  let allEntries: string[] = [];
  try {
    allEntries = AttentionArchitectureModule.getBlockedApps() || [];
  } catch (e) {
    console.log('Error reading blocked apps:', e);
    return { masterApps: [], activeApps: [], snoozes: new Map() };
  }

  const now = Date.now();
  const masterSet = new Set<string>();
  const snoozes = new Map<string, number>();

  for (const entry of allEntries) {
    if (entry.startsWith('__master__:')) {
      masterSet.add(entry.replace('__master__:', ''));
    } else if (entry.startsWith('__snooze__:')) {
      const parts = entry.split(':');
      if (parts.length >= 3) {
        const pkg = parts[1];
        const expiry = parseInt(parts[2], 10);
        if (!isNaN(expiry) && expiry > now) {
          snoozes.set(pkg, expiry);
        }
      }
    } else {
      // Legacy entry (plain package name saved before __master__ format)
      masterSet.add(entry);
    }
  }

  const activeApps: string[] = [];
  const encodedList: string[] = [];

  for (const pkg of masterSet) {
    encodedList.push(`__master__:${pkg}`);
    const expiry = snoozes.get(pkg);
    if (!expiry || now >= expiry) {
      // Currently actively blocked
      activeApps.push(pkg);
      encodedList.push(pkg);
    } else {
      // Snoozed: do NOT include raw pkg, so background service won't block it
      encodedList.push(`__snooze__:${pkg}:${expiry}`);
    }
  }

  // Update SharedPreferences if any expired snooze was cleaned up or migrated
  try {
    AttentionArchitectureModule.setBlockedApps(encodedList);
  } catch (e) {
    console.log('Error synchronizing blocked apps:', e);
  }

  return {
    masterApps: Array.from(masterSet),
    activeApps,
    snoozes,
  };
}

/**
 * Toggles an app on or off in the master block list.
 */
export function setAppBlocked(pkg: string, isBlocked: boolean): BlockerConfig {
  const { masterApps, snoozes } = getBlockedConfig();
  let updatedMaster = [...masterApps];

  if (isBlocked) {
    if (!updatedMaster.includes(pkg)) {
      updatedMaster.push(pkg);
    }
  } else {
    updatedMaster = updatedMaster.filter((id) => id !== pkg);
    snoozes.delete(pkg);
  }

  const now = Date.now();
  const encodedList: string[] = [];
  const activeApps: string[] = [];

  for (const id of updatedMaster) {
    encodedList.push(`__master__:${id}`);
    const expiry = snoozes.get(id);
    if (!expiry || now >= expiry) {
      activeApps.push(id);
      encodedList.push(id);
    } else {
      encodedList.push(`__snooze__:${id}:${expiry}`);
    }
  }

  try {
    AttentionArchitectureModule.setBlockedApps(encodedList);
  } catch (e) {
    console.log('Error updating blocked apps:', e);
  }

  return {
    masterApps: updatedMaster,
    activeApps,
    snoozes,
  };
}

/**
 * Snoozes a blocked app for a given number of minutes.
 * Immediately removes it from the active blocking list so the background
 * service stops intercepting it.
 */
export function snoozeApp(pkg: string, minutes: number = 5): void {
  const { masterApps, snoozes } = getBlockedConfig();
  const expiry = Date.now() + minutes * 60 * 1000;
  snoozes.set(pkg, expiry);

  const encodedList: string[] = [];

  for (const id of masterApps) {
    encodedList.push(`__master__:${id}`);
    const exp = snoozes.get(id);
    if (exp && exp > Date.now()) {
      encodedList.push(`__snooze__:${id}:${exp}`);
      // Crucial: raw id is NOT pushed, so service will NOT intercept it!
    } else {
      encodedList.push(id);
    }
  }

  try {
    AttentionArchitectureModule.setBlockedApps(encodedList);
  } catch (e) {
    console.log('Error setting snoozed apps:', e);
  }

  // Call native allowAndLaunchApp if available in the binary
  if (typeof (AttentionArchitectureModule as any).allowAndLaunchApp === 'function') {
    try {
      (AttentionArchitectureModule as any).allowAndLaunchApp(pkg, minutes);
    } catch (e) {
      console.log('Native allowAndLaunchApp error:', e);
    }
  }

  // Schedule JS timer to re-block when snooze expires
  setTimeout(() => {
    getBlockedConfig();
  }, minutes * 60 * 1000);
}
