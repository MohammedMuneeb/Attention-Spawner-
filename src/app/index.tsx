import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AttentionArchitectureModule from '../../modules/attention-architecture';

export default function HomeScreen() {
  const [hasUsagePermission, setHasUsagePermission] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    checkPermissions();
    loadBlockedApps();
    loadInstalledApps();

    // Polling permission status every 2 seconds
    const interval = setInterval(checkPermissions, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkPermissions = () => {
    try {
      const usage = AttentionArchitectureModule.hasUsageStatsPermission();
      const overlay = AttentionArchitectureModule.hasOverlayPermission();
      setHasUsagePermission(usage);
      setHasOverlayPermission(overlay);

      if (usage) {
        // Automatically start the background blocker service if Usage Stats is granted
        AttentionArchitectureModule.startForegroundService();
      }
    } catch (e) {
      console.log('Could not check permissions', e);
    }
  };

  const loadBlockedApps = () => {
    try {
      const apps = AttentionArchitectureModule.getBlockedApps();
      setBlockedApps(apps);
    } catch (e) {
      console.log('Could not load apps', e);
    }
  };

  const loadInstalledApps = () => {
    try {
      const apps = AttentionArchitectureModule.getInstalledApps();
      setInstalledApps(apps);
    } catch (e) {
      console.log('Could not load installed apps', e);
    }
  };

  const toggleApp = (appId: string, value: boolean) => {
    let newApps = [...blockedApps];
    if (value) {
      newApps.push(appId);
    } else {
      newApps = newApps.filter((id) => id !== appId);
    }
    setBlockedApps(newApps);
    AttentionArchitectureModule.setBlockedApps(newApps);
  };

  const isFullyConfigured = hasUsagePermission && hasOverlayPermission;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="leaf" size={40} color="#4ade80" />
        <Text style={styles.title}>Attention Architecture</Text>
        <Text style={styles.subtitle}>Mindful intention, not mindless restriction.</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Core Service</Text>
          <View style={[styles.statusBadge, { backgroundColor: isFullyConfigured ? '#4ade8020' : '#ef444420' }]}>
            <Text style={[styles.statusBadgeText, { color: isFullyConfigured ? '#4ade80' : '#ef4444' }]}>
              {isFullyConfigured ? 'ACTIVE' : 'ACTION REQUIRED'}
            </Text>
          </View>
        </View>
        <Text style={styles.statusDescription}>
          Usage Access and Overlay permissions are required to monitor and intercept blocked apps without breaking banking applications.
        </Text>

        {!hasUsagePermission && (
          <Pressable
            style={styles.actionButton}
            onPress={() => AttentionArchitectureModule.openUsageStatsSettings()}
          >
            <Text style={styles.actionButtonText}>Grant Usage Access Permission</Text>
          </Pressable>
        )}

        {!hasOverlayPermission && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: '#8b5cf6', marginTop: 10 }]}
            onPress={() => AttentionArchitectureModule.openOverlaySettings()}
          >
            <Text style={styles.actionButtonText}>Grant Display Over Apps Permission</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionTitle}>Mindful Interception List</Text>

      <ScrollView style={styles.listContainer}>
        {installedApps.map((app) => (
          <View key={app.id} style={styles.appRow}>
            <View style={styles.appRowLeft}>
              <Ionicons name="apps-outline" size={24} color="#e0e0e0" />
              <Text style={styles.appName}>{app.name}</Text>
            </View>
            <Switch
              value={blockedApps.includes(app.id)}
              onValueChange={(val) => toggleApp(app.id, val)}
              trackColor={{ false: '#374151', true: '#4ade80' }}
              thumbColor={'#fff'}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusDescription: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  listContainer: {
    flex: 1,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  appRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    color: '#f1f5f9',
    fontSize: 16,
    marginLeft: 15,
  },
});
