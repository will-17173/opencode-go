const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  // 只对 macOS 进行公证
  if (electronPlatformName !== 'darwin') {
    return;
  }

  console.log('🍎 Starting macOS notarization...');

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  // 方式 1: 使用 API Key（推荐）
  if (process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER) {
    console.log('Using App Store Connect API Key for notarization');

    try {
      await notarize({
        appBundleId: 'ai.opencode.go',
        appPath,
        appleApiKey: process.env.APPLE_API_KEY,
        appleApiKeyId: process.env.APPLE_API_KEY_ID,
        appleApiIssuer: process.env.APPLE_API_ISSUER,
      });

      console.log('✅ Notarization complete!');
    } catch (error) {
      console.error('❌ Notarization failed:', error);
      throw error;
    }
    return;
  }

  // 方式 2: 使用 Apple ID + Password（备用）
  if (process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD) {
    console.log('Using Apple ID for notarization');

    try {
      await notarize({
        appBundleId: 'ai.opencode.go',
        appPath,
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
        teamId: process.env.APPLE_TEAM_ID,
      });

      console.log('✅ Notarization complete!');
    } catch (error) {
      console.error('❌ Notarization failed:', error);
      throw error;
    }
    return;
  }

  // 没有配置公证凭据
  console.warn('⚠️  Skipping notarization: No credentials found');
  console.warn('Please set one of the following:');
  console.warn('  - APPLE_API_KEY, APPLE_API_KEY_ID, APPLE_API_ISSUER (recommended)');
  console.warn('  - APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID');
};
