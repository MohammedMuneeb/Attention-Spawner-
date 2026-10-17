import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import React from 'react';
import { useColorScheme } from 'react-native';
import { useIntegrityCheck } from '../hooks/useIntegrityCheck';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const rootNavigationState = useRootNavigationState();
  useIntegrityCheck();

  React.useEffect(() => {
    if (!rootNavigationState?.key) return;

    let isMounted = true;
    let eventSubscription: any = null;

    const checkIntent = async () => {
      try {
        const AttentionArchitectureModule = (await import('../../modules/attention-architecture')).default;
        const intentData = AttentionArchitectureModule.getInterceptIntent();
        if (intentData && intentData.isIntercept && isMounted) {
          router.replace({
            pathname: '/intercept',
            params: { blockedApp: intentData.blockedApp }
          });
        }
      } catch (e) {
        console.log('Module not ready', e);
      }
    };

    // Check initially once root navigator is ready
    checkIntent();

    // Listen for events (if they arrive while app is in foreground)
    import('../../modules/attention-architecture').then((AttentionArchitectureModule) => {
      if (isMounted) {
        eventSubscription = (AttentionArchitectureModule.default as any).addListener('onIntercept', (event: any) => {
          if (isMounted) {
            router.replace({
              pathname: '/intercept',
              params: { blockedApp: event.blockedApp }
            });
          }
        });
      }
    }).catch(e => console.log('Module not ready', e));

    // Ultimate failsafe: check when app comes to foreground
    const { AppState } = require('react-native');
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: any) => {
      if (nextAppState === 'active') {
        checkIntent();
      }
    });

    return () => {
      isMounted = false;
      if (eventSubscription && typeof eventSubscription.remove === 'function') {
        eventSubscription.remove();
      }
      appStateSubscription.remove();
    };
  }, [rootNavigationState?.key]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="intercept"
          options={{
            headerShown: false,
            animation: 'fade',
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
