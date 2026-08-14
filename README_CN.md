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

- **无需 API Key 即可使用**——把翻译引擎切到微软或谷歌，划词、整页、字幕全部立刻可用，且完全免费。想要词典查询或更好的译文时，再切回自己的大模型。使用前请阅读下方[关于免费引擎的说明](#关于免费引擎)。
- 划词翻译（图标二段触发，或纯快捷键模式）；结果卡片会同时显示原文与译文，可固定（pin）——固定后停在屏幕上，滚动页面也不会跟着跑掉，点击别处也不会消失，挡住正文时拖动把手即可挪开，底部还会标明本次翻译由哪个模型或服务完成
- 整页双语翻译——原地翻译页面正文（导航栏、页眉、页脚等保持原样），每段译文显示在原文下方；随滚动逐步加载（仅翻译可见部分）；已是目标语言的段落自动跳过；可从弹窗（"翻译页面" / "显示原文"）开关，或在「快捷键」触发模式下用 **Alt+A** 热键
- 流式输出（SSE）
- 云端 / 本地两种服务模式——选预设（OpenAI、DeepSeek、Moonshot、Zhipu GLM、Qwen、SiliconFlow、OpenRouter、Mistral；部分供应商可选国内 / 国际节点）或自定义 OpenAI 兼容端点；本地服务无需 API Key
- 记住每个服务商的 key 与模型——切换服务商时自动恢复，无需重输
- 模型思考默认关闭——混合推理模型（如 DeepSeek V4）无需为每次翻译先"思考"，出字更快、也不为隐藏的思考 token 计费；支持的服务商（DeepSeek、Zhipu、Qwen、SiliconFlow、OpenRouter）可按服务商开回思考，并提供 Low / Medium / High / XHigh / Max 五档强度（自动映射到各服务商的原生参数）
- 打开 popup 自动检测连接（ping 端点 + 模型有效性）
- 词典模式——由模型在一次流式请求中自动判定选区是"查词"还是"翻译"，词典结果展示该词条的正式译名、音标、词性、释义和例句
- 设置导出 / 导入（设置 → 数据）——将配置导出为 JSON 文件，在其他设备导入；API Key 默认不导出（勾选后可包含，附明文提示）
- **YouTube 字幕翻译** — 在 YouTube 观看页，点击播放器控制栏里的翻译按钮（语言图标）打开字幕菜单，再打开开关即可翻译视频已有的字幕。双语两行由扩展自己绘制在播放器上（原文在上、译文在下），拖动字幕上方的把手可以把字幕移到画面任意位置，越过画面中线后会改为吸附顶部。位置会被记住，全屏下同样生效；控制栏出现时字幕会自动上移让开。除 UP 主上传的人工字幕外，自动生成（ASR）的字幕也支持：ASR 是一次几个词地送来的，会先重新拼成完整句子再翻译。只翻译播放头附近的字幕，因此长视频也能在一两秒内出字幕，拖动进度条会立刻跟到新位置。请先打开字幕（CC），YouTube 才会加载字幕轨。字幕样式——显示模式（双语／仅原文／仅译文）、译文位置、背景不透明度，以及原文与译文各自的字号、颜色、字体和字重——在菜单的"字幕样式"页里调整，设置 → 视频 里也有同样的选项。（仅支持 YouTube；不做语音识别。）
- 翻译缓存（可配 TTL）
- 明暗外观跟随系统或手动指定；拉丁文字用 JetBrains Mono，中日韩用思源宋体，并按语言分别配置回退栈——中文、日文、韩文各用各自的字形，不会互相串用
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

装好即可翻译——引擎默认是微软，直接划词就能用。以下步骤只在你想换成自己的模型时才需要。

1. 点扩展图标，popup 即是快速配置面板。
2. 选择**翻译引擎**：**微软**或**谷歌**（免费、无需 Key），或**自有 API**（你自己的 OpenAI 兼容模型）。只有最后一种支持词典查询。
3. 若选了**自有 API**，再选择**服务类型**：
   - **云服务**——选供应商预设（预设会自动填好 Base URL；多区域供应商可选国内 / 国际节点），或选 **自定义** 自填任意 OpenAI 兼容的 Base URL，然后填 **API Key** 和 **模型**。
   - **本地**——填本地 **Base URL**（例如 `http://localhost:11434/v1`）和 **模型**，无需 API Key。
3. 点 **应用配置** 应用生效。状态指示灯会在 popup 打开和应用后自动 ping —— 绿色表示端点和模型可用。
4. 在任意网页选中文字 → 点蓝色图标 → 看到译文。（想用快捷键？在设置里把触发模式切为「快捷键」，此时用快捷键代替图标。）

高级设置（界面语言、缓存、字幕外观、数据导出）在完整设置页里 —— 通过 popup 右上角的 ⚙ 图标进入。

### 关于免费引擎

微软和谷歌两个选项调用的是公开翻译端点（`edge.microsoft.com`、`translate-pa.googleapis.com`）。依赖它们之前请先了解：

- **它们不是官方 API。** 这些是两家公司自己的网页 / 浏览器翻译功能所用的端点，没有公开的服务契约。
- **本项目与微软、谷歌没有任何隶属、赞助或授权关系。** 相关名称与标识归其各自所有者，此处仅用于标明你所选择的服务。
- **它们可能随时变更或失效**，且不会有任何通知。真出现这种情况，在设置里换个引擎即可——你自己的 API 不受影响。
- **你翻译的文本会被发送到这些服务**，适用的是它们各自的条款与隐私政策，而非本项目的。如果所译内容对此敏感，请改用自己的端点。
- **不作任何担保。** 这些选项按现状提供，风险自负。若用于商业或大批量场景，请使用厂商官方的、获得授权的 API。

默认引擎设为微软，只是为了让刚装好的扩展就能用。任何时候切到**自有 API**，以上顾虑就都不存在了。

## 开发

```bash
pnpm install
pnpm dev          # 开发构建，监听 src/，输出到 .output/
pnpm test         # 监听模式跑测试
pnpm build        # 生产构建
```

加载 `.output/chrome-mv3-dev/`（开发）或 `.output/chrome-mv3/`（生产）作为未打包扩展。

## 致谢

- [read-frog](https://github.com/mengxi-ream/read-frog)（GPL-3.0）——感谢这个项目，开发本扩展的过程中从它身上学到了很多。它本身也是一款做得非常好的插件，很推荐大家去用用看。
- [Lobe Icons](https://github.com/lobehub/lobe-icons)（MIT）——各供应商旁的品牌标识。这些标识为其各自所有者的商标，此处仅用于标明所选择的服务。

## 许可证

GPL-3.0。详见 [LICENSE](./LICENSE)。

选用 GPL 是刻意的：派生作品必须保持开源，防止本项目的初衷被闭源付费 fork 反噬。
