# GitHub Publishing Guide

## Suggested Repository Name

```text
cursor-ui-chinese-localization
```

## One-Line Description

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

## README Warning To Keep

This project modifies Cursor's local app bundle. Cursor updates may overwrite the patch. This is unofficial and not affiliated with Cursor or Anysphere.

