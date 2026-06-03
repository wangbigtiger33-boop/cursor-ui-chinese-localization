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
