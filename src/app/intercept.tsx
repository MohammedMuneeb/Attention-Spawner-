import { useEffect, useState } from 'react';
import { Animated, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';

export default function InterceptScreen() {
  const { blockedApp } = useLocalSearchParams();
  const [countdown, setCountdown] = useState(5);
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
        snoozeApp(pkg, 5);
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

        <View style={styles.timerContainer}>
          {countdown > 0 ? (
            <Text style={styles.timerText}>{countdown}</Text>
          ) : (
            <Pressable style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>I'm sure, continue</Text>
            </Pressable>
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
  timerContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
  },
  cancelButtonText: {
    color: '#fff',
    opacity: 0.6,
    fontSize: 16,
  },
});
