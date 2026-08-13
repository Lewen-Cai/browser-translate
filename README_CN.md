# BrowserTranslate

<p align="center">
  <img src="./assets/banner.png" alt="BrowserTranslate — 隐私优先、自带 Key 的浏览器翻译扩展" width="800">
</p>

[![Release](https://img.shields.io/github/v/release/Lewen-Cai/BrowserTranslate?color=2563eb&label=release)](https://github.com/Lewen-Cai/BrowserTranslate/releases/latest)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)

[English](./README.md) | **中文**

> 开源、隐私优先的浏览器翻译扩展。自带 LLM API Key，零中转，零遥测。

## 为什么

市面上的翻译扩展要么把 LLM 锁在付费墙后、要么把你的文本经它们的服务器中转、要么把决定翻译质量的 prompt 藏起来。BrowserTranslate 反对以上三点。

- **自带 Key**：兼容所有 OpenAI 协议的服务。内置预设：OpenAI、DeepSeek、Moonshot、Zhipu、Qwen、SiliconFlow、OpenRouter、Mistral；本地运行时：LM Studio、Ollama、llama.cpp、vLLM
  - 想用 Anthropic 或 Gemini？通过任何 OpenAI 兼容代理（LiteLLM、OpenRouter 等）转一层，把 Base URL 指向代理即可。
- **零中转**：翻译请求由你的浏览器直接打到你配置的服务方，我们没有服务器
- **零遥测**：不接入任何统计、错误上报、远程日志
- **Prompt 开放**：翻译 prompt 固定但完全开源，语域与主题由模型自行判断
- **打开 popup 自动检测连接**：自动 ping 端点和模型可用性，状态指示灯实时显示

## 功能

- 划词翻译（图标二段触发，或纯快捷键模式）
- 整页双语翻译——原地翻译页面正文（导航栏、页眉、页脚等保持原样），每段译文显示在原文下方；随滚动逐步加载（仅翻译可见部分）；已是目标语言的段落自动跳过；可从弹窗（"翻译页面" / "显示原文"）开关，或在「快捷键」触发模式下用 **Alt+A** 热键
- 流式输出（SSE）
- 云端 / 本地两种服务模式——选预设（OpenAI、DeepSeek、Moonshot、Zhipu GLM、Qwen、SiliconFlow、OpenRouter、Mistral；部分供应商可选国内 / 国际节点）或自定义 OpenAI 兼容端点；本地服务无需 API Key
- 记住每个服务商的 key 与模型——切换服务商时自动恢复，无需重输
- 模型思考默认关闭——混合推理模型（如 DeepSeek V4）无需为每次翻译先"思考"，出字更快、也不为隐藏的思考 token 计费；支持的服务商（DeepSeek、Zhipu、Qwen、SiliconFlow、OpenRouter）可按服务商开回思考，并提供 Low / Medium / High / XHigh / Max 五档强度（自动映射到各服务商的原生参数）
- 打开 popup 自动检测连接（ping 端点 + 模型有效性）
- 词典模式——由模型在一次流式请求中自动判定选区是"查词"还是"翻译"，词典结果展示该词条的正式译名、音标、词性、释义和例句
- 设置导出 / 导入（设置 → 数据）——将配置导出为 JSON 文件，在其他设备导入；API Key 默认不导出（勾选后可包含，附明文提示）
- **YouTube 字幕翻译** — 在 YouTube 观看页，点击播放器控制栏里的翻译按钮（语言图标，悬停显示"翻译字幕"）即可翻译视频已有的字幕。译文以第二行的形式显示在 YouTube 原生字幕下方（双语：原文在上、译文在下）。仅支持 UP 主上传的人工字幕轨道——该按钮只在有这类轨道的视频上出现（自动生成的字幕不支持，因为 YouTube 的渲染方式会盖住译文）。请打开字幕（CC）以显示原生字幕行。译文由你配置的模型批量生成。（仅支持 YouTube；不做语音识别。）
- 翻译缓存（可配 TTL）
- 主题系统——4 款内置主题（Cobalt、Graphite、Sepia、Teal），统一作用于 popup、设置页和页内翻译卡片，每款自带浅色 / 深色两套配色和各自的字体风格（明暗模式跟随系统或手动选择）；也可以上传 JSON 文件自定义主题（格式见下文）
- 界面支持 8 种语言（简体/繁体中文、English、日本語、한국어、Español、Français、Deutsch），自动跟随浏览器语言

## 架构

<p align="center">
  <img src="./assets/framework.png" alt="BrowserTranslate 架构图：后台 Service Worker 是唯一发起网络请求的地方，文本从浏览器直达你配置的服务方，API Key 不进入页面" width="760">
</p>

后台 Service Worker 是**唯一**发起网络请求的地方——你的文本从浏览器直达你配置的服务方，API Key 绝不进入页面。没有中转服务器。

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

高级设置（主题、界面语言、缓存、数据导出）在完整设置页里 —— 通过 popup 右上角的 ⚙ 图标进入。

## 自定义主题格式

设置 → General → Appearance → **上传主题** 接受如下结构的 JSON 文件（格式为严格校验——出现任何未知字段都会被拒绝）：

```jsonc
{
  "name": "My Theme",              // 必填，≤ 40 字符
  "colors": {
    "light": {                     // 必填——12 个 token 必须全部提供，值为 "R G B" 三元组（0–255）
      "bg": "252 252 250",         // 页面背景
      "surface": "255 255 255",    // 卡片 / 输入框底色
      "fg": "24 24 27",            // 主文字
      "fg-muted": "113 113 122",   // 次级文字
      "fg-subtle": "161 161 170",  // 三级文字
      "border": "228 228 231",     // 细边框
      "border-strong": "212 212 216",
      "brand": "37 99 235",        // 强调色（按钮、触发图标）
      "brand-fg": "255 255 255",   // 强调色上的文字
      "brand-soft": "219 234 254", // 强调色浅底
      "danger": "220 38 38",
      "success": "22 163 74"
    },
    "dark": { "bg": "10 10 10" }   // 可选，可只给部分——缺失的 token 回退到 light 的值
  },
  "fonts": {                       // 可选；两个字段也各自可选（缺省为 Geist）
    "sans": "Inter, system-ui, sans-serif",       // 只接受纯 font-family 字体栈
    "mono": "JetBrains Mono, ui-monospace, monospace"
  }
}
```

字体需已安装在你的电脑上（不支持加载字体文件），且字体值不能包含 `;`、`{`、`}`、`url(`。

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
