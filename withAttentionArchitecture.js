const { withAndroidManifest } = require('@expo/config-plugins');

const withAttentionArchitecture = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    const mainApplication = androidManifest.manifest.application[0];

    // Remove old accessibility service if present
    if (mainApplication.service) {
      mainApplication.service = mainApplication.service.filter(
        (s) => s.$['android:name'] !== 'com.attentionarchitecture.AttentionArchitectureAccessibilityService'
      );
    } else {
      mainApplication.service = [];
    }

    // Check if AppBlockerForegroundService exists
    const serviceExists = mainApplication.service.some(
      (s) => s.$['android:name'] === 'com.attentionarchitecture.AppBlockerForegroundService'
    );

    if (!serviceExists) {
      mainApplication.service.push({
        $: {
          'android:name': 'com.attentionarchitecture.AppBlockerForegroundService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        'property': [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value': 'App usage monitoring for mindful focus blocking',
            },
          },
        ],
      });
    }

    return config;
  });
};

module.exports = withAttentionArchitecture;
