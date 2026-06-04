#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DEFAULT_TARGET =
  "/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js";

function parseArgs(argv) {
  const options = {
    target: DEFAULT_TARGET,
    dryRun: false,
    integrityPatch: true,
    backup: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--target") {
      options.target = argv[++i];
    } else if (arg.startsWith("--target=")) {
      options.target = arg.slice("--target=".length);
    } else if (arg === "--skip-integrity-patch") {
      options.integrityPatch = false;
    } else if (arg === "--no-backup") {
      options.backup = false;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Cursor UI Chinese Localization

Usage:
  node reapply-cursor-zh-localization.js [options]

Options:
  --target <path>            Cursor workbench bundle path
  --dry-run                  Print planned patch result without writing
  --skip-integrity-patch     Do not patch Cursor modified-bundle warning
  --no-backup                Do not create a backup before writing
  -h, --help                 Show help
`);
}

function countOccurrences(source, needle) {
  if (!needle) return 0;
  let index = -1;
  let count = 0;
  while ((index = source.indexOf(needle, index + 1)) !== -1) count++;
  return count;
}

function replaceAllExact(source, from, to, label, stats) {
  const count = countOccurrences(source, from);
  if (count === 0) {
    stats.skipped.push(label || from);
    return source;
  }
  stats.patched.push({ label: label || from, count });
  return source.split(from).join(to);
}

function replaceAllLimited(source, from, to, label, maxCount, stats) {
  const count = countOccurrences(source, from);
  if (count === 0) {
    stats.skipped.push(label || from);
    return source;
  }
  if (count > maxCount) {
    stats.tooBroad.push({ label: label || from, count, maxCount });
    return source;
  }
  stats.patched.push({ label: label || from, count });
  return source.split(from).join(to);
}

function buildReplacements() {
  const exactUiSnippets = [
    ['ccm={docs:"Docs",contact:"Contact"}', 'ccm={docs:"文档",contact:"联系"}'],
    ['"vscode-settings":"VS Code Settings"', '"vscode-settings":"VS Code 设置"'],
    ['"plan-usage":"Plan & Usage"', '"plan-usage":"计划与用量"'],
    ['tab:"Tab"', 'tab:"Tab 补全"'],
    ['plugins:"Plugins"', 'plugins:"插件"'],
    ['indexing:"Indexing & Docs"', 'indexing:"索引与文档"'],
    ['mcp:"Tools & MCPs"', 'mcp:"工具与 MCP"'],
    ['hooks:"Hooks"', 'hooks:"钩子"'],
    ['beta:"Beta"', 'beta:"Beta 测试"'],
    ['network:"Network"', 'network:"网络"'],
    ['"background-composer":"Cloud Agents"', '"background-composer":"云端智能体"'],
    ['worktrees:"Worktrees"', 'worktrees:"工作树"'],
    ['n.isGlass?"Indexing":"Indexing & Docs"', 'n.isGlass?"索引":"索引与文档"'],
    ['{value:"on",label:"On"},{value:"off",label:"Off"},{value:"auto",label:"System"}', '{value:"on",label:"开启"},{value:"off",label:"关闭"},{value:"auto",label:"跟随系统"}'],
    ['title:"Chat"', 'title:"聊天"'],
    ['title:"Colors"', 'title:"颜色"'],
    ['title:"Typography"', 'title:"字体排版"'],
    ['title:"Motion"', 'title:"动态效果"'],
    ['title:"Cleanup"', 'title:"清理"'],
    ['label:"Theme"', 'label:"主题"'],
    ['"aria-label":"Theme"', '"aria-label":"主题"'],
    ['label:"Hue"', 'label:"色相"'],
    ['label:"Intensity"', 'label:"强度"'],
    ['children:"Compact"', 'children:"紧凑"'],
    ['children:"Detailed"', 'children:"详细"'],
    ['children:"System"', 'children:"跟随系统"'],
    ['"aria-label":"Decrease"', '"aria-label":"减小"'],
    ['"aria-label":"Increase"', '"aria-label":"增大"'],
    ['class=marketplace-editor__sidebar-title>Marketplace', 'class=marketplace-editor__sidebar-title>插件市场'],
    ['class=marketplace-editor__sidebar-docs>Documentation<span>', 'class=marketplace-editor__sidebar-docs>文档<span>'],
    ['class=marketplace-editor__sidebar-docs>View source code<span>', 'class=marketplace-editor__sidebar-docs>查看源代码<span>'],
    ['class=marketplace-editor__sidebar-meta-row>Created by ', 'class=marketplace-editor__sidebar-meta-row>创建者：'],
    ['A==="now"?"Updated just now"', 'A==="now"?"刚刚更新"'],
    ['Last updated ${A} ago', '上次更新于 ${A} 前'],
  ];

  const limitedVisibleText = [
    ["Group by", "分组方式", 12],
    ["Show Machine Label", "显示机器标签", 4],
    ["Show Icon", "显示图标", 8],
    ["Mark All as Read", "全部标为已读", 6],
    ["Search settings", "搜索设置", 4],
    ["Search or Paste Link", "搜索或粘贴链接", 6],
    ["Search plugins", "搜索插件", 4],
    ["Theme", "主题", 12],
    ["Choose between light, dark, or high contrast themes", "选择浅色、深色或高对比度主题", 4],
    ["Chat", "聊天", 18],
    ["Tool Call Density", "工具调用密度", 8],
    ["Adjust how much detail is shown for tool calls", "调整工具调用显示的详细程度", 4],
    ["Conversation density", "对话密度", 8],
    ["Conversation density preview", "对话密度预览", 4],
    ["Compact", "紧凑", 20],
    ["Detailed", "详细", 12],
    ["Colors", "颜色", 12],
    ["Hue", "色相", 12],
    ["Choose a tint color", "选择强调色", 4],
    ["Tint hue", "强调色色相", 4],
    ["Intensity", "强度", 12],
    ["Control how strongly the tint is applied", "控制强调色应用强度", 4],
    ["Tint intensity", "强调色强度", 4],
    ["Reduce Transparency", "降低透明度", 8],
    ["Replace translucent surfaces with opaque backgrounds", "用不透明背景替代半透明界面", 4],
    ["Typography", "字体排版", 8],
    ["UI Font Size", "界面字体大小", 8],
    ["Font size for the Cursor user interface", "Cursor 界面的字体大小", 4],
    ["Code Font Size", "代码字体大小", 8],
    ["Font size for code editors and diffs", "代码编辑器和差异视图的字体大小", 4],
    ["UI Font Family", "界面字体", 8],
    ["Override the Cursor user interface typeface", "覆盖 Cursor 界面的字体", 4],
    ["Code Font Family", "代码字体", 8],
    ["Override the font for code editors and diffs", "覆盖代码编辑器和差异视图的字体", 4],
    ["System font", "系统字体", 8],
    ["System monospace", "系统等宽字体", 8],
    ["Font Smoothing", "字体平滑", 8],
    ["Use native macOS font anti-aliasing", "使用 macOS 原生字体抗锯齿", 4],
    ["Reduce Motion", "减少动态效果", 8],
    ["Minimize interface animations. System follows your OS preference.", "尽量减少界面动画。跟随系统会使用你的操作系统偏好。", 4],
    ["Hide Email Address", "隐藏邮箱地址", 8],
    ["Partially mask your email address in the Cursor user interface", "在 Cursor 界面中部分遮挡你的邮箱地址", 4],
    ["Reset to default", "恢复默认", 20],
    ["Decrease", "减小", 20],
    ["Increase", "增大", 20],
    ["Refer friends, earn up to $250", "邀请朋友，最高赚取 $250", 8],
    ["Refer friends, earn usage credits", "邀请朋友，赚取用量额度", 8],
    ["Earn up to $250 every month by referring friends. They get 50% off their first month; you get $25 in usage credit when they buy a plan. Valid for 10 rewards per month.", "每月通过邀请朋友最高可赚取 $250。朋友首月可享 5 折；当他们购买套餐后，你将获得 $25 用量额度。每月最多 10 次奖励。", 4],
    ["View referral history", "查看邀请记录", 4],
    ["Invite by email", "通过邮箱邀请", 4],
    ["Email addresses", "邮箱地址", 4],
    ["Add emails, separated by commas", "添加邮箱，多个邮箱用逗号分隔", 4],
    ["Send invite", "发送邀请", 4],
    ["Referral link", "邀请链接", 6],
    ["Compact Terminal Tool Calls", "紧凑显示终端工具调用", 8],
    ["Show terminal commands in compact view by default", "默认以紧凑视图显示终端命令", 4],
    ["Cursor periodically removes old worktrees to free disk space. Tune how aggressively cleanup runs.", "Cursor 会定期移除旧工作树以释放磁盘空间。你可以调整清理策略的激进程度。", 4],
    ["Cleanup", "清理", 10],
    ["Max worktrees", "最大工作树数量", 8],
    ["Maximum number of Cursor-managed worktrees to retain across all workspaces. Older worktrees are removed first.", "所有工作区中最多保留的 Cursor 管理工作树数量。较旧的工作树会优先移除。", 4],
    ["Max total size (GB)", "最大总大小（GB）", 8],
    ["Maximum total size in GB across all Cursor-managed worktrees. Set to 0 to disable the size limit.", "所有 Cursor 管理工作树的最大总大小（GB）。设为 0 可禁用大小限制。", 4],
    ["Cursor-managed worktrees", "Cursor 管理的工作树", 8],
    ["No Cursor-managed worktrees on this machine.", "这台机器上没有 Cursor 管理的工作树。", 4],
    ["Source repository unknown", "源仓库未知", 4],
    ["Updated just now", "刚刚更新", 4],
    ["No Plugins", "没有插件", 8],
    ["No Result", "没有结果", 8],
    ["Add Plugin", "添加插件", 8],
    ["Pasted Link", "粘贴的链接", 4],
    ["Try a different search term", "试试更换搜索关键词", 4],
    ["Search skills, rules, subagents, MCPs, and hooks", "搜索技能、规则、子智能体、MCP 和 hooks", 4],
  ];

  const exactMenuPairs = [
    ['{key:"today",label:"Today",sectionIcon:"clock"}', '{key:"today",label:"今天",sectionIcon:"clock"}'],
    ['{key:"yesterday",label:"Yesterday",sectionIcon:"clock"}', '{key:"yesterday",label:"昨天",sectionIcon:"clock"}'],
    ['{key:"last_7_days",label:"Last 7 Days",sectionIcon:"clock"}', '{key:"last_7_days",label:"过去 7 天",sectionIcon:"clock"}'],
    ['{key:"last_30_days",label:"Last 30 Days",sectionIcon:"clock"}', '{key:"last_30_days",label:"过去 30 天",sectionIcon:"clock"}'],
    ['{key:"older",label:"Older",sectionIcon:"clock"}', '{key:"older",label:"更早",sectionIcon:"clock"}'],
    ['{key:"needs_attention",label:"Needs Attention",sectionIcon:"exclamation-circle"}', '{key:"needs_attention",label:"需要关注",sectionIcon:"exclamation-circle"}'],
    ['{key:"in_progress",label:"Running",sectionIcon:{element:"ascii-loader"}}', '{key:"in_progress",label:"运行中",sectionIcon:{element:"ascii-loader"}}'],
    ['{key:"source:draft",label:"Draft",sectionIcon:"circle-dashed"}', '{key:"source:draft",label:"草稿",sectionIcon:"circle-dashed"}'],
    ['{key:"done",label:"Completed",sectionIcon:"check-circle"}', '{key:"done",label:"已完成",sectionIcon:"check-circle"}'],
    ['{value:"draft",label:"Draft",icon:"circle-dashed"}', '{value:"draft",label:"草稿",icon:"circle-dashed"}'],
    ['{value:"running",label:"Running",icon:"loading"}', '{value:"running",label:"运行中",icon:"loading"}'],
    ['{value:"needs_attention",label:"Needs Attention",icon:"exclamation-circle"}', '{value:"needs_attention",label:"需要关注",icon:"exclamation-circle"}'],
    ['{value:"git:draft",label:"Draft",icon:"git-pull-request-draft"}', '{value:"git:draft",label:"草稿",icon:"git-pull-request-draft"}'],
    ['{value:"git:merged",label:"Merged",icon:"git-merge"}', '{value:"git:merged",label:"已合并",icon:"git-merge"}'],
    ['{value:"git:closed",label:"Closed",icon:"git-pull-request-closed"}', '{value:"git:closed",label:"已关闭",icon:"git-pull-request-closed"}'],
    ['{value:"git:none",label:"No PR",icon:"git-pull-request"}', '{value:"git:none",label:"无拉取请求",icon:"git-pull-request"}'],
    ['{value:"source:desktop",label:"Desktop",icon:"agent"}', '{value:"source:desktop",label:"桌面端",icon:"agent"}'],
    ['{value:"source:web",label:"Web",icon:"globe"}', '{value:"source:web",label:"网页端",icon:"globe"}'],
    ['{value:"source:mobile",label:"Mobile",icon:"device-mobile"}', '{value:"source:mobile",label:"移动端",icon:"device-mobile"}'],
    ['{value:"source:scm",label:"SCM",icon:"git-branch"}', '{value:"source:scm",label:"源代码管理",icon:"git-branch"}'],
    ['{value:"source:cli",label:"CLI",icon:"terminal"}', '{value:"source:cli",label:"命令行",icon:"terminal"}'],
    ['{value:"source:third_party",label:"Third-party Agents",icon:"arrow-bracket-from-up-dashed"}', '{value:"source:third_party",label:"第三方智能体",icon:"arrow-bracket-from-up-dashed"}'],
    ['{value:"source:setup",label:"Setup",icon:"wrench"}', '{value:"source:setup",label:"设置",icon:"wrench"}'],
    ['{value:"source:sdk",label:"SDK",icon:"terminal"}', '{value:"source:sdk",label:"SDK 开发包",icon:"terminal"}'],
    ['{value:"source:api",label:"API",icon:"code"}', '{value:"source:api",label:"API 接口",icon:"code"}'],
    ['{value:"source:bugbot_autofix",label:"Bugbot Autofix",icon:"bugbot"}', '{value:"source:bugbot_autofix",label:"Bugbot 自动修复",icon:"bugbot"}'],
    ['{value:"source:qabot_frontend",label:"Frontend QA",icon:"robot"}', '{value:"source:qabot_frontend",label:"前端 QA",icon:"robot"}'],
    ['{value:"workspace",label:"Workspace",icon:"folder"}', '{value:"workspace",label:"工作区",icon:"folder"}'],
    ['{value:"branch",label:"Branch Name",icon:"git-branch"}', '{value:"branch",label:"分支名称",icon:"git-branch"}'],
    ['{value:"updatedAt",label:"Updated",icon:"clock"}', '{value:"updatedAt",label:"更新时间",icon:"clock"}'],
    ['{mode:"only_unread",label:"Only Unread",icon:"bell"}', '{mode:"only_unread",label:"仅未读",icon:"bell"}'],
    ['{mode:"only_archived",label:"Only Archived",icon:"archive"}', '{mode:"only_archived",label:"仅归档",icon:"archive"}'],
    ['{mode:"include_archived",label:"Include Archived",icon:"layers"}', '{mode:"include_archived",label:"包含已归档",icon:"layers"}'],
    ['{mode:"off",label:"Off",icon:"circle"}', '{mode:"off",label:"关闭",icon:"circle"}'],
  ];

  return { exactUiSnippets, limitedVisibleText, exactMenuPairs };
}

function applyPatches(source, options) {
  const stats = { patched: [], skipped: [], tooBroad: [] };
  let output = source;
  const { exactUiSnippets, limitedVisibleText, exactMenuPairs } = buildReplacements();

  for (const [from, to] of exactUiSnippets) {
    output = replaceAllExact(output, from, to, from, stats);
  }

  for (const [from, to, maxCount] of limitedVisibleText) {
    output = replaceAllLimited(output, from, to, from, maxCount, stats);
  }

  for (const [from, to] of exactMenuPairs) {
    output = replaceAllExact(output, from, to, from.slice(0, 80), stats);
  }

  if (options.integrityPatch) {
    output = replaceAllExact(
      output,
      "return{isPure:t,proof:e}}async _resolve",
      "return{isPure:true,proof:e}}async _resolve",
      "disable modified-bundle warning",
      stats
    );
  }

  return { output, stats };
}

function makeBackup(target) {
  const backupDir = path.join(
    process.env.HOME || ".",
    ".cursor",
    "localization-backups",
    `manual-reapply-${new Date().toISOString().replace(/[:.]/g, "-")}`
  );
  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(target, path.join(backupDir, path.basename(target)));
  return backupDir;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!options.target) throw new Error("Missing --target path");
  if (!fs.existsSync(options.target)) {
    throw new Error(`Cursor bundle not found: ${options.target}`);
  }

  const input = fs.readFileSync(options.target, "utf8");
  const { output, stats } = applyPatches(input, options);

  console.log(`target: ${options.target}`);
  console.log(`patched patterns: ${stats.patched.length}`);
  for (const item of stats.patched) {
    console.log(`  + ${item.label} (${item.count})`);
  }
  console.log(`skipped patterns: ${stats.skipped.length}`);
  console.log(`too broad patterns: ${stats.tooBroad.length}`);
  for (const item of stats.tooBroad) {
    console.log(`  ! ${item.label} (${item.count} > ${item.maxCount})`);
  }

  if (output.includes("cursor-zh-visible-text-patch")) {
    throw new Error("Unsafe global visible-text patch marker is present. Refusing to write.");
  }

  if (options.dryRun) {
    console.log("dry-run: no files written");
    return;
  }

  let backupDir = null;
  if (options.backup) {
    backupDir = makeBackup(options.target);
  }

  fs.writeFileSync(options.target, output);
  execFileSync("node", ["--check", options.target], { stdio: "inherit" });

  if (backupDir) console.log(`backup: ${backupDir}`);
  console.log("done");
}

main();
