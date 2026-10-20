import { useEffect, useState } from 'react';
import { Animated, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';

const DURATIONS = [5, 10, 15, 30];

export default function InterceptScreen() {
  const { blockedApp } = useLocalSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Intercept hardware back button to cleanly exit without navigation errors
    const onBackPress = () => {
      BackHandler.exitApp();
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      backSub.remove();
      clearInterval(timer);
    };
  }, []);

  const handleContinue = async () => {
    const pkg = typeof blockedApp === 'string' ? blockedApp : null;
    if (pkg) {
      try {
        const { snoozeApp } = await import('../utils/blockerManager');
        snoozeApp(pkg, selectedMinutes);
      } catch (e) {
        console.log('Could not snooze/launch app', e);
      }
    }
    // Dismiss AttentionSpawner so user can proceed into the app
    BackHandler.exitApp();
  };

  const handleNeverMind = async () => {
    try {
      const AttentionArchitectureModule = (await import('../../modules/attention-architecture')).default;
      if (typeof (AttentionArchitectureModule as any).goToHomeScreen === 'function') {
        (AttentionArchitectureModule as any).goToHomeScreen();
      }
    } catch (e) {
      console.log('Could not navigate to home screen', e);
    }
    BackHandler.exitApp();
  };

  const appName = typeof blockedApp === 'string' ? blockedApp.split('.').pop()?.toUpperCase() : 'APP';

  return (
    <View style={styles.container}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image
          source={require('@/assets/images/attentionspawner.png')}
          style={styles.logoImage}
          contentFit="contain"
        />

        <Text style={styles.title}>Mindful Pause</Text>
        <Text style={styles.subtitle}>
          You are about to open {appName}.
        </Text>
        <Text style={styles.description}>
          Take a deep breath and ask yourself if this is intentional.
        </Text>

        <View style={styles.actionContainer}>
          {countdown > 0 ? (
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{countdown}</Text>
              <Text style={styles.timerSub}>breathe...</Text>
            </View>
          ) : (
            <View style={styles.pickerSection}>
              <Text style={styles.pickerTitle}>Set your mindful duration:</Text>
              <View style={styles.chipRow}>
                {DURATIONS.map((mins) => {
                  const isSelected = selectedMinutes === mins;
                  return (
                    <Pressable
                      key={mins}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setSelectedMinutes(mins)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {mins}m
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.button} onPress={handleContinue}>
                <Text style={styles.buttonText}>
                  Continue for {selectedMinutes} min
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable style={styles.cancelButton} onPress={handleNeverMind}>
          <Text style={styles.cancelButtonText}>Never mind</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '85%',
  },
  logoImage: {
    width: 90,
    height: 90,
    marginBottom: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e0e0',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  timerText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 46,
  },
  timerSub: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  pickerSection: {
    width: '100%',
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
    width: '100%',
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: '#4ade8022',
    borderColor: '#4ade80',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#4ade80',
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    backgroundColor: '#4ade80',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 6,
    padding: 10,
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 15,
  },
});
