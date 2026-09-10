import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export default function InterceptScreen() {
  const { blockedApp } = useLocalSearchParams();
  const [countdown, setCountdown] = useState(5);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
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

    return () => clearInterval(timer);
  }, []);

  const handleContinue = () => {
    // Normally we would just go back, but we might want to actually let them open it for x minutes
    // For now, we'll just go back to home screen
    router.replace('/');
  };

  const appName = typeof blockedApp === 'string' ? blockedApp.split('.').pop()?.toUpperCase() : 'APP';

  return (
    <View style={styles.container}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Ionicons name="leaf-outline" size={80} color="#fff" style={styles.icon} />
        
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

        <Pressable style={styles.cancelButton} onPress={() => router.replace('/')}>
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
