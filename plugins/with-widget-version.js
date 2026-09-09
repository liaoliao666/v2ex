const { withXcodeProject } = require('expo/config-plugins')

const WIDGET_TARGET_NAME = 'ExpoWidgetsTarget'

module.exports = function withWidgetVersion(config) {
  const marketingVersion = config.version
  const currentProjectVersion = config.ios?.buildNumber

  if (!marketingVersion || !currentProjectVersion) {
    throw new Error(
      'Cannot configure the widget version without expo.version and expo.ios.buildNumber.'
    )
  }

  return withXcodeProject(config, config => {
    const configurations = config.modResults.pbxXCBuildConfigurationSection()
    const widgetInfoPlist = `${WIDGET_TARGET_NAME}/Info.plist`
    let updatedConfigurations = 0

    for (const configuration of Object.values(configurations)) {
      if (
        typeof configuration !== 'object' ||
        configuration === null ||
        configuration.buildSettings?.INFOPLIST_FILE !== widgetInfoPlist
      ) {
        continue
      }

      configuration.buildSettings.MARKETING_VERSION = marketingVersion
      configuration.buildSettings.CURRENT_PROJECT_VERSION =
        currentProjectVersion
      updatedConfigurations += 1
    }

    if (updatedConfigurations === 0) {
      throw new Error(
        `Cannot configure ${WIDGET_TARGET_NAME}: list this plugin before expo-widgets.`
      )
    }

    return config
  })
}
