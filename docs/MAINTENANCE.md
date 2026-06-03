# Maintenance Guide

这份文档给维护者和其他智能体使用，目标是用最少上下文继续维护项目。

## 工作目标

让中文母语用户能看懂 Cursor 操作界面的主要按钮、菜单、设置项、筛选项和常用提示。

## 核心文件

```text
reapply-cursor-zh-localization.js
```

默认补丁目标：

```text
/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js
```

## 更新 Cursor 后怎么做

1. 退出 Cursor。
2. 运行：

```bash
node ./reapply-cursor-zh-localization.js --dry-run
```

3. 如果大量规则显示 skipped，说明 Cursor bundle 结构可能变化，需要重新定位相关字符串。
4. 确认没问题后运行：

```bash
node ./reapply-cursor-zh-localization.js
```

5. 按 [VERIFY.md](./VERIFY.md) 实测。

## 增加新翻译规则

优先级：

1. 精确代码片段替换。
2. 带最大命中次数限制的可见短语替换。
3. 不要做全局页面扫描。

新增规则时要判断它是不是：

- 用户可见文案：可以翻译。
- 内部标识符：不要翻译。
- 品牌名或产品名：通常保留英文。
- 远程接口返回内容：通常不要翻译。

## 已知危险做法

不要引入：

```text
cursor-zh-visible-text-patch
```

不要使用全局 `MutationObserver` 扫描页面所有文本节点。这个做法曾经造成 Cursor 窗口未响应。

## 推荐发布流程

```bash
npm run check
node ./reapply-cursor-zh-localization.js --dry-run
git status --short
git add .
git commit -m "Update Cursor Chinese localization"
git push
```

如果是正式版本，再打 tag：

```bash
git tag -a v0.1.1 -m "v0.1.1"
git push origin v0.1.1
```
