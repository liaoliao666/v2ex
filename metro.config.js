const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;
config.resolver.unstable_conditionNames = ["require"];

// Add custom resolveRequest function
config.resolver.resolveRequest = (context, moduleName, platform) => {
if (moduleName === "axios") {
// Specifically use 'browser' condition for axios
return context.resolveRequest(
{ ...context, unstable_conditionNames: ["browser"] },
moduleName,
platform
);
}
// Fallback to default resolver for other modules
return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;