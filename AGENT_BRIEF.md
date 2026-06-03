# Agent Brief: Cursor UI Chinese Localization

Task: maintain an unofficial Chinese UI localization patch for macOS Cursor.

Primary file to patch:

```text
/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js
```

Project files:

```text
Repository root of this project.
```

Run:

```bash
node ./reapply-cursor-zh-localization.js
```

Validation:

```bash
node --check "/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js"
rg -n --fixed-strings "cursor-zh-visible-text-patch" "/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js" || true
```

Must not do:

- Do not add global DOM text scanning.
- Do not add MutationObserver-based visible text replacement.
- Do not replace internal IDs, config keys, enum values, CSS classes, command IDs, model IDs, event names, or paths.
- Do not translate user history titles or remote plugin descriptions.

Known bad patch:

```text
cursor-zh-visible-text-patch
```

It caused Cursor window unresponsive. It must remain absent.

What is already localized:

- Main sidebar, settings sidebar, settings pages.
- Agent input area.
- Automations page.
- Plugins page and plugin marketplace.
- Group/filter menu: status, Git, archive/unread, source, metadata.

Keep English:

- Brand/product names: Slack, Linear, Datadog, Figma.
- User-created chat titles.
- Remote plugin descriptions.
- Recognizable technical acronyms: MCP, SDK, API, Git.

After patching, restart Cursor and test:

- Launch Cursor.
- Open Automations.
- Open the bottom-left Group By menu.
- Open Status, Git, Archive/Unread, Source, Metadata submenus.
- Open Settings.
- Open Plugins.
- Open Plugin Marketplace.

Current conclusion: no unresponsive bug after exact static string replacement. The previous unresponsive bug was caused by global visible-text scanning, not by exact bundle string patches.
