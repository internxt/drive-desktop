const electronRebuild = require('@electron/rebuild');

module.exports = async (context) => {
  const { appDir, electronVersion, arch } = context;
  // Force compilation from source so native modules are built against the
  // exact Electron V8 headers rather than using a generic prebuilt. Without
  // this, prebuild-install downloads an Electron-v116 prebuilt compiled for
  // Electron 24 (V8 11.0) which segfaults under Electron 25+ (V8 11.4).
  process.env.npm_config_build_from_source = 'true';
  console.log(
    JSON.stringify({
      tag: 'ELECTRON_REBUILD',
      appDir,
      arch,
      electronVersion,
      nodeVersion: process.version,
      buildFromSource: process.env.npm_config_build_from_source,
    }),
  );
  await electronRebuild.rebuild({ buildPath: appDir, electronVersion, arch, force: true });

  return false;
};
