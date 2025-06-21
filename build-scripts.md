# React Native 构建脚本说明

## 重要说明

本项目的 release 构建配置已经设置为**手动内置 bundle 模式**，这意味着：
- 构建命令会先手动生成 JavaScript bundle，再构建安装包
- 确保 bundle 和资源文件被正确内置到 APK/AAB/IPA 文件中
- 应用启动时不需要连接开发服务器
- 适合生产环境发布

## Android 构建

### 生成 APK 文件（手动内置 bundle）
```bash
yarn android:release
```
生成的 APK 文件位置：`android/app/build/outputs/apk/release/app-release.apk`

### 生成 AAB 文件（手动内置 bundle，推荐用于 Google Play）
```bash
yarn android:bundle
```
生成的 AAB 文件位置：`android/app/build/outputs/bundle/release/app-release.aab`

### 清理构建缓存
```bash
yarn android:clean
```

## iOS 构建

### 生成 Archive 文件（手动内置 bundle）
```bash
yarn ios:release
```
生成的 Archive 文件位置：`ios/build/v2fun.xcarchive`

### 生成 IPA 文件
```bash
yarn ios:ipa
```
生成的 IPA 文件位置：`ios/build/ipa/v2fun.ipa`

### 清理构建缓存
```bash
yarn ios:clean
```

## 组合构建命令

### Android 完整构建（清理 + 构建）
```bash
yarn build:android
```

### iOS 完整构建（清理 + 构建）
```bash
yarn build:ios
```

### Android Bundle 构建（清理 + 构建）
```bash
yarn build:bundle
```

## 一键构建命令

### 快速构建（推荐）
```bash
yarn quick:build android    # 构建 Android APK
yarn quick:build ios        # 构建 iOS Archive
```

### 高级构建（支持更多选项）
```bash
yarn build:release                    # 构建所有平台的默认类型
yarn build:release android apk        # 构建 Android APK
yarn build:release android aab        # 构建 Android AAB
yarn build:release ios archive        # 构建 iOS Archive
yarn build:release ios ipa            # 构建 iOS IPA
```

## Bundle 配置说明

### Android Bundle 配置
- **入口文件**: `index.js`
- **输出文件**: `android/app/src/main/assets/index.android.bundle`（手动生成）
- **资源目录**: `android/app/src/main/res`（手动生成）
- **开发模式**: 关闭（`--dev false`）

### iOS Bundle 配置
- **入口文件**: `index.js`
- **输出文件**: `ios/main.jsbundle`（手动生成）
- **资源目录**: `ios`（手动生成）
- **开发模式**: 关闭（`--dev false`）

### Metro 配置
在 `metro.config.js` 中已配置：
- 启用 Hermes 引擎
- 启用 inlineRequires 优化
- 生成 source map（用于调试）

## 注意事项

### Android 签名配置
1. 当前使用 debug 签名，生产环境需要配置正式签名
2. 在 `android/app/build.gradle` 中配置 `signingConfigs` 和 `release` 构建类型
3. 生成正式签名密钥：
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

### iOS 配置
1. 更新 `ios/exportOptions.plist` 中的 `teamID` 为你的开发者团队 ID
2. 确保在 Xcode 中配置了正确的 Bundle Identifier 和证书
3. 根据发布方式修改 `method` 字段：
   - `app-store`: App Store 发布
   - `ad-hoc`: 内测分发
   - `enterprise`: 企业分发
   - `development`: 开发测试

### 手动 Bundle 的优势
1. **明确控制**: 可以明确控制 bundle 生成过程
2. **减少错误**: 避免自动生成可能的问题
3. **一致性**: 确保每次构建都包含最新的代码
4. **离线运行**: 应用不需要网络连接即可运行
5. **启动速度**: 无需等待 bundle 下载
6. **稳定性**: 避免网络问题导致的加载失败
7. **安全性**: JavaScript 代码被打包在应用内

### 环境变量
建议在构建前设置以下环境变量：
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 故障排除

### Android 常见问题
1. 如果遇到权限问题，确保 `gradlew` 有执行权限：
   ```bash
   chmod +x android/gradlew
   ```

2. 如果遇到内存不足，在 `android/gradle.properties` 中调整：
   ```properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=4096m -XX:+HeapDumpOnOutOfMemoryError
   ```

3. 如果 bundle 生成失败，检查 Metro 配置：
   ```bash
   npx react-native start --reset-cache
   ```

### iOS 常见问题
1. 确保已安装 Xcode Command Line Tools：
   ```bash
   xcode-select --install
   ```

2. 如果遇到证书问题，检查 Xcode 中的签名配置

3. 清理 Xcode 缓存：
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

4. 如果 bundle 生成失败，清理 Metro 缓存：
   ```bash
   npx react-native start --reset-cache
   ```

### Bundle 相关问题
1. **Bundle 文件过大**: 检查是否包含了不必要的依赖
2. **Bundle 生成失败**: 检查 JavaScript 代码是否有语法错误
3. **资源文件缺失**: 确保所有图片、字体等资源文件路径正确

### 文件结构
```
项目根目录/
├── android/app/src/main/
│   ├── assets/                    # Gradle 自动生成 bundle
│   └── res/                       # Gradle 自动处理资源文件
├── ios/                           # Xcode 自动生成 bundle
└── scripts/
    ├── build-release.js           # 高级构建脚本
    └── verify-build.js            # 构建验证脚本
``` 