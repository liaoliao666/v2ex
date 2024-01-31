const { withAndroidManifest } = require('@expo/config-plugins')

module.exports = function androiManifestPlugin(config) {
  // eslint-disable-next-line no-shadow
  return withAndroidManifest(config, async config => {
    let androidManifest = config.modResults.manifest

    // https://github.com/liaoliao666/v2ex/issues/11
    androidManifest.queries.push({
      intent: [
        {
          name: 'android.intent.action.VIEW',
          scheme: 'http',
        },
        {
          name: 'android.intent.action.VIEW',
          scheme: 'https',
        },
        {
          name: 'android.intent.action.VIEW',
          scheme: 'geo',
        },
        {
          name: 'android.intent.action.VIEW',
          scheme: 'google.navigation',
        },
      ].map(item => ({
        action: [
          {
            $: {
              'android:name': item.name,
            },
          },
        ],
        data: [
          {
            $: {
              'android:scheme': item.scheme,
            },
          },
        ],
      })),
    })

    // https://stackoverflow.com/questions/73901548/how-can-i-add-edit-android-manifest-meta-data-in-expo-managed
    androidManifest.application[0].$['android:extractNativeLibs'] = 'true'

    return config
  })
}
