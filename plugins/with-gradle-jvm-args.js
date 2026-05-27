const { withGradleProperties } = require("expo/config-plugins");

const GRADLE_JVM_ARGS =
  "-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8";

function setGradleProperty(properties, key, value) {
  const existing = properties.find(
    (property) => property.type === "property" && property.key === key
  );

  if (existing) {
    existing.value = value;
    return;
  }

  properties.push({
    type: "property",
    key,
    value,
  });
}

module.exports = function withGradleJvmArgs(config) {
  return withGradleProperties(config, (config) => {
    setGradleProperty(config.modResults, "org.gradle.jvmargs", GRADLE_JVM_ARGS);
    return config;
  });
};
