# GitHub Publishing Guide

## Repository

```text
cursor-ui-chinese-localization
```

## One-line description

```text
Unofficial Chinese UI localization patch for macOS Cursor.
```

## Suggested Topics

```text
cursor
cursor-editor
localization
chinese
macos
nodejs
ui-translation
```

## Publish Commands

From this directory:

```bash
git init
git add .
git commit -m "Initial Cursor UI Chinese localization patch"
```

Then create a GitHub repository and push:

```bash
git remote add origin git@github.com:<your-name>/cursor-ui-chinese-localization.git
git branch -M main
git push -u origin main
```

## Release Checklist

- Run `npm run check`.
- Run `npm run dry-run`.
- Confirm Cursor is closed before applying the script.
- Apply script on a test machine.
- Restart Cursor.
- Verify settings, plugins, plugin marketplace, automations, and group/filter menus.
- Confirm `cursor-zh-visible-text-patch` is absent.

## Create a version tag

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

## Suggested GitHub release title

```text
v0.1.0 - Initial Cursor UI Chinese localization patch
```

## Suggested GitHub release notes

```text
首次公开发布 Cursor UI Chinese Localization。

Highlights:
- 零依赖 Node.js 补丁脚本。
- 自动备份 Cursor workbench bundle。
- 汉化主侧栏、设置页、插件页、插件市场、自动化页和分组筛选菜单。
- 禁止全局可见文本扫描，避免 Cursor 窗口未响应。
- 附带维护说明、验证清单和 Issue 模板。

Before use:
- 退出 Cursor。
- 运行 node ./reapply-cursor-zh-localization.js。
- 重启 Cursor 并按 docs/VERIFY.md 验证。
```

## README warning to keep

This project modifies Cursor's local app bundle. Cursor updates may overwrite the patch. This is unofficial and not affiliated with Cursor or Anysphere.
