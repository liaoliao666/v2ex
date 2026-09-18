# V2Fun

> V2EX 好看的第三方客户端，原生 App，支持夜间模式。

## 预览

![Preview](https://files.catbox.moe/q6sy9n.gif)

## 下载

- [iOS App Store](https://apps.apple.com/cn/app/v2fun/id1659591551?l=en)
- [Android Apk](https://github.com/liaoliao666/v2ex/releases/latest)

## 本地运行

[Expo 文档](https://docs.expo.dev/)

### iOS

iOS 开发需要 Xcode、Command Line Tools 和 CocoaPods。推荐使用 Homebrew 安装：

```sh
brew install cocoapods
```

安装完成后，确认 `pod --version` 可以正常运行，然后启动：

```sh
yarn ios
```

首次运行时，如果没有 `ios` 目录，Expo 会自动执行 prebuild。修改原生配置或添加需要原生配置的插件后，手动同步：

```sh
npx expo prebuild --platform ios
```

## URL Scheme

| 页面     | URL Scheme               | 例子                                 |
| -------- | ------------------------ | ------------------------------------ |
| 搜索     | `v2fun://search/:query?` | `v2fun://search/v2fun这款应用怎么样` |
| 帖子 | `v2fun://topic/:id`      | `v2fun://topic/904226`               |
| 用户 | `member/:username`      | `v2fun://member/iliaoliao`               |
| 节点 | `node/:name`      | `v2fun://node/apple`               |

## Issues

希望做出贡献？ [Good First Issue][good-first-issue]

### 🐛 Bugs

请针对错误、缺少文档或意外行为提出问题。

[**See Bugs**][bugs]

### 💡 新功能建议

请提交问题以建议新功能。 通过添加对功能请求进行投票
一个 👍。 这有助于作者确定工作的优先级。

[**See Feature Requests**][requests]

## 感谢

- [V2HOT](https://www.v2ex.com/t/822020?utm_source=pipecraft.net) : 一个能看每天 V2EX 最热的网站，历史最热功能基于此实现，感谢 🙏
- [SOV2EX](https://github.com/Bynil/sov2ex) : 一个便捷的 V2EX 站内搜索引擎，搜索功能基于此实现，感谢 🙏

## LICENSE

MIT

<!-- prettier-ignore-start -->
[bugs]: https://github.com/liaoliao666/v2ex/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+sort%3Acreated-desc+label%3Abug
[requests]: https://github.com/liaoliao666/v2ex/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+sort%3Areactions-%2B1-desc+label%3Aenhancement
[good-first-issue]: https://github.com/liaoliao666/v2ex/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+sort%3Areactions-%2B1-desc+label%3Aenhancement+label%3A%22good+first+issue%22
<!-- prettier-ignore-end -->
