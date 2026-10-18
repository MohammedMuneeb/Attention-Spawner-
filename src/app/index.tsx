import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AttentionArchitectureModule from '../../modules/attention-architecture';
import { getBlockedConfig, setAppBlocked } from '../utils/blockerManager';

export default function HomeScreen() {
  const [hasUsagePermission, setHasUsagePermission] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
      const config = getBlockedConfig();
      setBlockedApps(config.masterApps);
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
    const config = setAppBlocked(appId, value);
    setBlockedApps(config.masterApps);
  };

  const isFullyConfigured = hasUsagePermission && hasOverlayPermission;

  const filteredApps = installedApps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // GATE: Do not let user access the app list or configuration until both permissions are granted

  if (!isFullyConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.gateContentContainer}>
          <View style={styles.gateHeader}>
            <View style={styles.gateIconCircle}>
              <Ionicons name="shield-checkmark" size={44} color="#4ade80" />
            </View>
            <Text style={styles.gateTitle}>Permissions Required</Text>
            <Text style={styles.gateSubtitle}>
              To mindfully protect your focus without violating your privacy, Attention Architecture needs two Android permissions to function:
            </Text>
          </View>

          {/* Card 1: Usage Access */}
          <View style={[styles.permCard, hasUsagePermission && styles.permCardGranted]}>
            <View style={styles.permCardTop}>
              <View style={styles.permCardHeaderLeft}>
                <Ionicons
                  name={hasUsagePermission ? 'checkmark-circle' : 'analytics-outline'}
                  size={24}
                  color={hasUsagePermission ? '#4ade80' : '#3b82f6'}
                />
                <Text style={styles.permCardTitle}>1. Usage Access</Text>
              </View>
              <View style={[styles.permBadge, hasUsagePermission ? styles.permBadgeGranted : styles.permBadgePending]}>
                <Text style={[styles.permBadgeText, hasUsagePermission ? styles.permBadgeTextGranted : styles.permBadgeTextPending]}>
                  {hasUsagePermission ? 'GRANTED' : 'REQUIRED'}
                </Text>
              </View>
            </View>
            <Text style={styles.permCardDesc}>
              Allows detection of when a distracting app is brought to foreground so Mindful Pause can intervene.
            </Text>
            {!hasUsagePermission && (
              <Pressable
                style={styles.permActionButton}
                onPress={() => AttentionArchitectureModule.openUsageStatsSettings()}
              >
                <Text style={styles.permActionButtonText}>Grant Usage Access</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
              </Pressable>
            )}
          </View>

          {/* Card 2: Display Over Other Apps */}
          <View style={[styles.permCard, hasOverlayPermission && styles.permCardGranted]}>
            <View style={styles.permCardTop}>
              <View style={styles.permCardHeaderLeft}>
                <Ionicons
                  name={hasOverlayPermission ? 'checkmark-circle' : 'layers-outline'}
                  size={24}
                  color={hasOverlayPermission ? '#4ade80' : '#8b5cf6'}
                />
                <Text style={styles.permCardTitle}>2. Display Over Other Apps</Text>
              </View>
              <View style={[styles.permBadge, hasOverlayPermission ? styles.permBadgeGranted : styles.permBadgePending]}>
                <Text style={[styles.permBadgeText, hasOverlayPermission ? styles.permBadgeTextGranted : styles.permBadgeTextPending]}>
                  {hasOverlayPermission ? 'GRANTED' : 'REQUIRED'}
                </Text>
              </View>
            </View>
            <Text style={styles.permCardDesc}>
              Allows the Mindful Pause screen to appear over chosen apps before mindless scrolling starts.
            </Text>
            {!hasOverlayPermission && (
              <Pressable
                style={[styles.permActionButton, { backgroundColor: '#8b5cf6' }]}
                onPress={() => AttentionArchitectureModule.openOverlaySettings()}
              >
                <Text style={styles.permActionButtonText}>Grant Display Over Apps</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
              </Pressable>
            )}
          </View>

          <View style={styles.gateFooter}>
            <Ionicons name="lock-closed-outline" size={16} color="#64748b" />
            <Text style={styles.gateFooterText}>
              Your data stays 100% on your device. We never inspect personal content, messages, or screen activity.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
          <View style={[styles.statusBadge, { backgroundColor: '#4ade8020' }]}>
            <Text style={[styles.statusBadgeText, { color: '#4ade80' }]}>
              ACTIVE
            </Text>
          </View>
        </View>
        <Text style={styles.statusDescription}>
          Protection is active. Selected apps below will prompt a mindful pause before opening.
        </Text>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Mindful Interception List</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.listContainer} keyboardShouldPersistTaps="handled">
        {filteredApps.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={32} color="#64748b" />
            <Text style={styles.emptyText}>No apps found matching "{searchQuery}"</Text>
          </View>
        ) : (
          filteredApps.map((app) => (
            <View key={app.id} style={styles.appRow}>
              <View style={styles.appRowLeft}>
                <Ionicons name="apps-outline" size={24} color="#e0e0e0" />
                <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
              </View>
              <Switch
                value={blockedApps.includes(app.id)}
                onValueChange={(val) => toggleApp(app.id, val)}
                trackColor={{ false: '#374151', true: '#4ade80' }}
                thumbColor={'#fff'}
              />
            </View>
          ))
        )}
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
    marginBottom: 24,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  badgeContainer: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 15,
    paddingVertical: 0,
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
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
    flex: 1,
    marginRight: 12,
  },
  appName: {
    color: '#f1f5f9',
    fontSize: 16,
    marginLeft: 15,
    flexShrink: 1,
  },
  gateContentContainer: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  gateHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gateIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#4ade8015',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4ade8030',
  },
  gateTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 10,
    textAlign: 'center',
  },
  gateSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  permCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  permCardGranted: {
    borderColor: '#4ade8040',
    backgroundColor: '#132338',
  },
  permCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  permCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  permCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  permBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  permBadgePending: {
    backgroundColor: '#ef444420',
  },
  permBadgeGranted: {
    backgroundColor: '#4ade8020',
  },
  permBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  permBadgeTextPending: {
    color: '#ef4444',
  },
  permBadgeTextGranted: {
    color: '#4ade80',
  },
  permCardDesc: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  permActionButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permActionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  gateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  gateFooterText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
