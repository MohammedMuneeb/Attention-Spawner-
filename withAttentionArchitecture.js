const { withAndroidManifest, withGradleProperties, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withAttentionArchitecture = (config) => {
  // 1. Android Manifest configuration (Foreground Service)
  config = withAndroidManifest(config, async (config) => {
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

  // 2. Enable R8 Minification, Obfuscation & Resource Shrinking in gradle.properties
  config = withGradleProperties(config, (config) => {
    const setProp = (key, value) => {
      const item = config.modResults.find((p) => p.type === 'property' && p.key === key);
      if (item) {
        item.value = value;
      } else {
        config.modResults.push({ type: 'property', key, value });
      }
    };

    setProp('android.enableMinifyInReleaseBuilds', 'true');
    setProp('android.enableShrinkResourcesInReleaseBuilds', 'true');

    return config;
  });

  // 3. Ensure custom ProGuard keep rules exist for R8 code shrinking
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardFile = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );
      const keepRules = `
# Attention Architecture R8 / ProGuard Keep Rules
-keep class com.attentionarchitecture.** { *; }
-keepclassmembers class com.attentionarchitecture.** { *; }
-keep class expo.modules.** { *; }
-keepclassmembers class expo.modules.** { *; }
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
`;
      if (fs.existsSync(proguardFile)) {
        const contents = fs.readFileSync(proguardFile, 'utf8');
        if (!contents.includes('com.attentionarchitecture')) {
          fs.writeFileSync(proguardFile, contents + '\n' + keepRules);
        }
      }
      return config;
    },
  ]);

  return config;
};

module.exports = withAttentionArchitecture;
