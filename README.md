# Grok Guarder

Grok 黑洞图标显示在 Windows x64 上的 Cursor Agents 主窗口和经典编辑器。单击图标展开或收起原版浮动面板，拖动图标可以调整它在当前窗口的位置。从 Guarder 启动的 Cursor 会和界面一起绘制图标，窗口拖动无需等待另一层的位置更新。编辑器里的 **Alt+Shift+G** 同样可以切换面板。

## 安装

1. 用 **扩展：从 VSIX 安装…** 安装 `grok-guarder-cursor-0.1.0-win32-x64.vsix`。
2. 在 PowerShell 运行 `./install.ps1 -CursorExe 'C:/Path/To/Cursor.exe'`。此步骤启动后台组件并创建「Cursor - Grok Guarder」启动入口，Windows 登录时也会启动黑洞图标。
3. 正常退出现有 Cursor，从「Cursor - Grok Guarder」重新打开。使用原来的 Cursor 用户配置。之后在主窗口点击 **IDE**，新打开的编辑器窗口也会载入壁纸和同步语言。

Grok 网页由面板自己的 Microsoft Edge WebView2 Runtime 渲染。语言页的五个按钮立即切换 Guarder。勾选「同步 Cursor 界面语言」可补充 Cursor Agents 的菜单、设置、自动化、自定义和插件市场译文，支持简体中文、繁體中文、英语、日语和韩语。经典编辑器使用 Cursor 的语言包。跳转到系统浏览器的页面使用各自的网页语言。

使用 Google 账号时，从 Grok 页底部的「在浏览器中打开 Grok」开始，在系统浏览器的 Grok 官网登录并继续使用。浏览器保存自己的登录会话。使用 X 账号时可直接在面板里登录。

壁纸的「应用」会更新受 Guarder 管理的 Cursor 窗口。视频转码使用 PATH 下的 FFmpeg 与 FFprobe，也可通过 `GUARDER_FFMPEG`、`GUARDER_FFPROBE` 指定。生词本沿用已有的本地目录。

使用壁纸时，「字体颜色」同时适用于顶部工具栏、侧栏导航、代码仓库，以及输入框上方的项目、分支和运行环境图标。草稿和已完成会话分别使用空心和实心圆点。同步界面语言也会翻译输入框占位提示和主页底部的轮换提示。

生词本和 Codex、Antigravity 共用 `Documents/GPT Salad Vocabulary`。Notion、Obsidian 和 OneNote 地址按平台读取现有配置，也可在面板中修改。「同步词条」会按对应应用的格式复制词条，随后可粘贴到目标笔记。

## 构建

运行 `./native/build.ps1` 编译 Windows 子窗体，运行 `npm test` 检查通用逻辑，使用 `npx --yes @vscode/vsce@4.1.1 package --allow-missing-repository --target win32-x64` 打包。

屏幕背景和语言通过 Cursor 自带的本机 Electron 调试管道应用到宿主。此版本使用进程继承的管道，不要求开放浏览器调试端口或修改 Cursor 的应用文件。
