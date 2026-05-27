const { withPodfile } = require("expo/config-plugins");

const HELPER_MARKER = "# @generated begin v2fun-expo-modules-jsi-embed";
const HELPER = `${HELPER_MARKER}
def ensure_expo_modules_jsi_embedded
  framework_path = '\${PODS_XCFRAMEWORKS_BUILD_DIR}/ExpoModulesJSI/ExpoModulesJSI.framework'
  framework_binary_path = "\#{framework_path}/ExpoModulesJSI"
  framework_output_path = '\${TARGET_BUILD_DIR}/\${FRAMEWORKS_FOLDER_PATH}/ExpoModulesJSI.framework'

  project_path = Dir[File.join(__dir__, '*.xcodeproj')].first
  return unless project_path

  project = Xcodeproj::Project.open(project_path)
  app_target = project.targets.find do |project_target|
    project_target.respond_to?(:product_type) &&
      project_target.product_type == 'com.apple.product-type.application'
  end
  return unless app_target

  phase = app_target.shell_script_build_phases.find do |build_phase|
    build_phase.name == '[CP] Embed Pods Frameworks'
  end

  if phase
    phase.input_paths << framework_binary_path unless phase.input_paths.include?(framework_binary_path)
    phase.output_paths << framework_output_path unless phase.output_paths.include?(framework_output_path)
    project.save
  end

  frameworks_script_path = File.join(
    __dir__,
    'Pods',
    'Target Support Files',
    "Pods-\#{app_target.name}",
    "Pods-\#{app_target.name}-frameworks.sh"
  )

  return unless File.exist?(frameworks_script_path)

  install_line = "  install_framework \\"\#{framework_path}\\"\\n"
  frameworks_script = File.read(frameworks_script_path)
  unless frameworks_script.include?(framework_path)
    frameworks_script = frameworks_script.gsub(
      /if \\[\\[ "\\$CONFIGURATION" == "(Debug|Release)" \\]\\]; then\\n/,
      "\\\\0\#{install_line}"
    )
    File.write(frameworks_script_path, frameworks_script)
  end
end
# @generated end v2fun-expo-modules-jsi-embed
`;

function insertHelper(contents) {
  if (contents.includes(HELPER_MARKER)) {
    return contents;
  }

  return contents.replace(
    /(\nplatform :ios,)/,
    `\n${HELPER}$1`
  );
}

function insertPostInstallCall(contents) {
  if (contents.includes("\n    ensure_expo_modules_jsi_embedded")) {
    return contents;
  }

  const postInstallIndex = contents.indexOf("  post_install do |installer|");
  if (postInstallIndex === -1) {
    throw new Error(
      "Cannot patch ios/Podfile: post_install hook was not found."
    );
  }

  const endIndex = contents.indexOf("\n  end\nend", postInstallIndex);
  if (endIndex === -1) {
    throw new Error(
      "Cannot patch ios/Podfile: post_install hook end was not found."
    );
  }

  return (
    contents.slice(0, endIndex) +
    "\n    ensure_expo_modules_jsi_embedded" +
    contents.slice(endIndex)
  );
}

module.exports = function withExpoModulesJsiEmbed(config) {
  return withPodfile(config, (config) => {
    config.modResults.contents = insertPostInstallCall(
      insertHelper(config.modResults.contents)
    );
    return config;
  });
};
