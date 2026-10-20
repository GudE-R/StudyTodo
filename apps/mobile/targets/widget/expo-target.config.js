/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "widget",
  deploymentTarget: "17.0",
  entitlements: {
    // アプリ本体（app.config.ts）と同じ App Group で今日の Todo を受け取る
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});
