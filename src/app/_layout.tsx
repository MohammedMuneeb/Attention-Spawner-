import { DarkTheme, DefaultTheme, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import React from 'react';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useIntegrityCheck } from '../hooks/useIntegrityCheck';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  useIntegrityCheck();
  
  React.useEffect(() => {
    let isMounted = true;
    
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
      } catch(e) {
        console.log('Module not ready', e);
      }
    };

    // Check initially
    checkIntent();

    // Listen for events (if they arrive correctly)
    import('../../modules/attention-architecture').then((AttentionArchitectureModule) => {
      AttentionArchitectureModule.default.addListener('onIntercept', (event) => {
        if (isMounted) {
          router.replace({
            pathname: '/intercept',
            params: { blockedApp: event.blockedApp }
          });
        }
      });
    }).catch(e => console.log('Module not ready', e));

    // Ultimate failsafe: check when app comes to foreground
    const { AppState } = require('react-native');
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkIntent();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
