# BrowserTranslate

[![Release](https://img.shields.io/github/v/release/Lewen-Cai/BrowserTranslate?color=2563eb&label=release)](https://github.com/Lewen-Cai/BrowserTranslate/releases/latest)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)

[English](./README.md) | **中文**

> 开源、隐私优先的浏览器翻译扩展。自带 LLM API Key，零中转，零遥测。

## 为什么

市面上的翻译扩展要么把 LLM 锁在付费墙后、要么把你的文本经它们的服务器中转、要么把决定翻译质量的 prompt 藏起来。BrowserTranslate 反对以上三点。

- **自带 Key**：兼容所有 OpenAI 协议的服务——OpenAI、DeepSeek、Moonshot、Groq、SiliconFlow、OpenRouter、本地 Ollama / LM Studio / vLLM
  - 想用 Anthropic 或 Gemini？通过任何 OpenAI 兼容代理（LiteLLM、OpenRouter 等）转一层，把 Base URL 指向代理即可。
- **零中转**：翻译请求由你的浏览器直接打到你配置的服务方，我们没有服务器
- **零遥测**：不接入任何统计、错误上报、远程日志
- **Prompt 开放**：所有翻译 prompt 都可编辑，自由调教学术 / 口语 / 技术风格
- **打开 popup 自动检测连接**：自动 ping 端点和模型可用性，状态指示灯实时显示

## 功能

- 划词翻译（图标二段触发，或纯快捷键模式）
- 整页双语翻译——原地翻译页面正文（导航栏、页眉、页脚等保持原样），每段译文显示在原文下方；随滚动逐步加载（仅翻译可见部分）；已是目标语言的段落自动跳过；可从弹窗（"翻译页面" / "显示原文"）开关，或在「快捷键」触发模式下用 **Alt+A** 热键
- 流式输出（SSE）
- 云端 / 本地两种服务模式——选预设（OpenAI、DeepSeek、Moonshot、Zhipu GLM、Qwen、SiliconFlow、OpenRouter、Mistral；部分供应商可选国内 / 国际节点）或自定义 OpenAI 兼容端点；本地服务无需 API Key
- 记住每个服务商的 key 与模型——切换服务商时自动恢复，无需重输
- 4 个内置 Prompt 模板 + 无限自定义模板
- 打开 popup 自动检测连接（ping 端点 + 模型有效性）
- 词典模式——由模型在一次流式请求中自动判定选区是"查词"还是"翻译"，词典结果展示该词条的正式译名、音标、词性、释义和例句
- 设置导出 / 导入（设置 → 数据）——将配置导出为 JSON 文件，在其他设备导入；API Key 默认不导出（勾选后可包含，附明文提示）
- **YouTube 字幕翻译** — 在 YouTube 观看页，点击播放器控制栏的"译"按钮即可翻译视频已有的字幕。译文以第二行的形式显示在 YouTube 原生字幕下方（双语：原文在上、译文在下）。需要视频本身带字幕（UP 主上传或自动生成）并已打开字幕（CC）。译文由你配置的模型批量生成。（仅支持 YouTube；不做语音识别。）
- 翻译缓存（可配 TTL）
- 浅色 / 深色主题（跟随系统）
- 界面支持 8 种语言（简体/繁体中文、English、日本語、한국어、Español、Français、Deutsch），自动跟随浏览器语言

## 安装

### Chrome / Edge / Brave / Arc

1. 在 [Releases](https://github.com/Lewen-Cai/BrowserTranslate/releases) 下载最新 `.zip`
2. 解压
3. 打开 `chrome://extensions` → 开启开发者模式 → "加载已解压的扩展程序" → 选解压后的目录

Chrome Web Store 上架中。

## 配置

1. 点扩展图标，popup 即是快速配置面板。
2. 选择**服务类型**：
   - **云服务**——选供应商预设（预设会自动填好 Base URL；多区域供应商可选国内 / 国际节点），或选 **自定义** 自填任意 OpenAI 兼容的 Base URL，然后填 **API Key** 和 **模型**。
   - **本地**——填本地 **Base URL**（例如 `http://localhost:11434/v1`）和 **模型**，无需 API Key。
3. 点 **应用配置** 应用生效。状态指示灯会在 popup 打开和应用后自动 ping —— 绿色表示端点和模型可用。
4. 在任意网页选中文字 → 点蓝色图标 → 看到译文。（想用快捷键？在设置里把触发模式切为「快捷键」，此时用快捷键代替图标。）

高级设置（Prompt 模板、主题、界面语言）在完整设置页里 —— 通过 popup 右上角的 ⚙ 图标进入。

## 开发

```bash
pnpm install
pnpm dev          # 开发构建，监听 src/，输出到 .output/
pnpm test         # 监听模式跑测试
pnpm build        # 生产构建
```

加载 `.output/chrome-mv3-dev/`（开发）或 `.output/chrome-mv3/`（生产）作为未打包扩展。

## 许可证

GPL-3.0。详见 [LICENSE](./LICENSE)。

选用 GPL 是刻意的：派生作品必须保持开源，防止本项目的初衷被闭源付费 fork 反噬。
