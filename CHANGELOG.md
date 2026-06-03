# Changelog

## v0.1.0 - 2026-06-04

首次公开发布。

### Added

- 零依赖 Node.js 补丁脚本：`reapply-cursor-zh-localization.js`。
- 自动备份 Cursor workbench bundle。
- `--dry-run`、`--target`、`--skip-integrity-patch` 和 `--no-backup` 参数。
- 主要 Cursor 操作界面汉化：
  - 主侧栏
  - 设置侧栏和设置内容
  - 智能体输入区
  - 自动化页
  - 插件页和插件市场
  - 分组/筛选菜单及关键二级菜单
- 明确禁止 `cursor-zh-visible-text-patch` 这类全局可见文本扫描补丁。
- README、维护说明、验证清单、贡献指南和 Issue 模板。

### Verified

- Cursor 能正常启动，没有窗口未响应。
- 设置、插件、插件市场、自动化、分组方式菜单均能打开。
- `node --check` 验证通过。
