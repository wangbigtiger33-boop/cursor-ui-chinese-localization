# Verification Checklist

每次修改补丁脚本、更新 Cursor 或重新应用汉化后，都建议按这个清单验证。

## 命令验证

```bash
npm run check
node ./reapply-cursor-zh-localization.js --dry-run
```

应用补丁后验证目标 bundle：

```bash
node --check "/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js"
rg --fixed-strings "cursor-zh-visible-text-patch" "/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js" || true
```

如果第二条命令输出 `cursor-zh-visible-text-patch`，不要继续发布；这代表危险的全局可见文本补丁仍有残留。

## 界面验证

1. 退出并重新打开 Cursor。
2. 确认没有出现“窗口未响应”。
3. 打开设置页。
4. 打开插件页。
5. 打开插件市场。
6. 打开自动化页。
7. 打开左下角“分组方式”菜单。
8. 逐个打开这些二级菜单：
   - 状态
   - Git
   - 环境
   - 归档、未读
   - 来源
   - 元数据
9. 确认主要按钮、菜单项、空状态、搜索框 placeholder 能被中文用户理解。

## 回归风险

重点观察：

- Cursor 启动是否卡住。
- 菜单打开是否卡顿。
- 插件市场是否还能加载远程内容。
- 搜索框、按钮和 tab 是否还能点击。
- 用户历史标题和插件品牌名是否被误翻译。
