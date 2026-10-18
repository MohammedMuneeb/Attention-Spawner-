import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import React from 'react';
import { AppState, useColorScheme } from 'react-native';
import { useIntegrityCheck } from '../hooks/useIntegrityCheck';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const navigationRef = useNavigationContainerRef();
  useIntegrityCheck();

  React.useEffect(() => {
    let isMounted = true;
    let eventSubscription: any = null;

    const navigateToIntercept = (blockedApp: string | null) => {
      if (!isMounted || !blockedApp) return;

      const attempt = () => {
        if (!isMounted) return;
        if (navigationRef?.isReady()) {
          try {
            const currentRoute = (navigationRef.getCurrentRoute() as any);
            if (currentRoute?.name === 'intercept') {
              return; // Already on intercept screen
            }
            router.replace({
              pathname: '/intercept',
              params: { blockedApp },
            });
          } catch (e) {
            console.log('Safe navigation suppressed error:', e);
          }
        } else {
          setTimeout(attempt, 50);
        }
      };

      // Slight delay to ensure React commit phase completes
      setTimeout(attempt, 50);
    };

    const checkIntent = async () => {
      try {
        const AttentionArchitectureModule = (await import('../../modules/attention-architecture')).default;
        const intentData = AttentionArchitectureModule.getInterceptIntent();
        if (intentData && intentData.isIntercept && isMounted) {
          navigateToIntercept(intentData.blockedApp);
        }
      } catch (e) {
        console.log('Module not ready', e);
      }
    };

    // Check on initial layout mount
    checkIntent();

    // Listen for events arriving while app is in foreground
    import('../../modules/attention-architecture').then((AttentionArchitectureModule) => {
      if (isMounted) {
        eventSubscription = (AttentionArchitectureModule.default as any).addListener('onIntercept', (event: any) => {
          if (isMounted && event?.blockedApp) {
            navigateToIntercept(event.blockedApp);
          }
        });
      }
    }).catch(e => console.log('Module not ready', e));

    // Check when app resumes to foreground
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
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
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
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
