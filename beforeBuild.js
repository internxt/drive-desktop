const electronRebuild = require('electron-rebuild');

module.exports = async (context) => {
	const { appDir, electronVersion, arch } = context;
	await electronRebuild.rebuild({ buildPath: appDir, electronVersion, arch });

	return false;
};
