<p align="center">
  <img src="./assets/banner.png" alt="BrowserTranslate — 隐私优先的浏览器翻译" width="900">
</p>
<h1 align="center">BrowserTranslate</h1>
<p align="center">
  <strong>用你选择的模型，阅读网页与视频字幕。</strong><br>
  开源浏览器翻译 · 自带 API Key · 零中转 · 零遥测
</p>
<p align="center">
  <a href="./README.md"><kbd>English</kbd></a>
  <a href="./README_zh-CN.md"><kbd><b>简体中文</b></kbd></a>
  <a href="./README_zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./README_ja.md"><kbd>日本語</kbd></a>
  <a href="./README_ko.md"><kbd>한국어</kbd></a>
  <a href="./README_es.md"><kbd>Español</kbd></a>
  <a href="./README_fr.md"><kbd>Français</kbd></a><br>
  <a href="./README_de.md"><kbd>Deutsch</kbd></a>
  <a href="./README_pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./README_it.md"><kbd>Italiano</kbd></a>
  <a href="./README_ru.md"><kbd>Русский</kbd></a>
  <a href="./README_tr.md"><kbd>Türkçe</kbd></a>
  <a href="./README_vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./README_id.md"><kbd>Bahasa Indonesia</kbd></a>
</p>
<p align="center">
  <a href="#installation">安装</a> · <a href="#configuration">配置</a> · <a href="./CHANGELOG.md">更新日志</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">问题反馈</a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="最新发布版本"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## 为什么选择 BrowserTranslate？

使用你喜欢的翻译服务，无需订阅本扩展，也不必经过我们运营的中转服务器。

- **自己的模型与 Key**：接入兼容 OpenAI 的端点或本地运行时，具体兼容性取决于端点和模型。
- **直连服务商**：待译文本由浏览器直接发送给选定服务方，本项目不运营中转服务器。
- **零遥测**：扩展不收集分析数据，不做远程错误上报或远程日志记录。
- **可编辑的基础 Prompt**：查看默认模板、创建自己的版本，所有 LLM 翻译场景共用一套基础指令；内部词典与输出格式规则仍由扩展管理。

<a id="features"></a>
## 功能

- **无需 API Key 即可开始**：微软和谷歌翻译服务默认启用，新安装的三个翻译场景都使用微软。它们调用非官方公开端点，使用前请阅读[免费服务说明](#free-engines)。
- **各场景独立选择引擎**：划词卡片、整页和字幕可以分别指定服务商，同时保存多个服务商配置，切换时无需重新填写。
- **划词翻译**：选中文字后点击浮动图标，或使用快捷键模式。普通译文流式输出，原文显示在译文上方；卡片提供复制、重新翻译、引擎与目标语言选择。卡片内的临时选择不改变全局设置，重新翻译会跳过缓存。
- **稳定且可移动的卡片**：在「通用 → 外观」设置尺寸。原文与译文独立滚动，原文最多占共享正文区域的 30%；等待结果时显示紧凑加载状态。固定后滚动或点击页面别处也不会关闭，并可拖动把手调整位置。
- **整页双语翻译**：在页面正文中原地插入译文，原文在上，通常跳过导航、页眉和页脚。随视口滚动逐步处理。可用 popup「当前页面 → 双语翻译」开关，或在快捷键模式下按 **Alt+A**。
- **短选区自动查词**：模型可为单词或短术语提供译名、音标、词性、释义和例句。明显段落、多行或代码类内容只走翻译。普通翻译服务不生成词典条目。
- **允许混合语言输入**：不会因源语言与目标语言相同而阻止请求，地区写法转换的效果取决于模型或服务。
- **本地配置与缓存**：在「设置 → 数据」调整缓存有效期，导出／导入 JSON 设置和自定义 Prompt。缓存不导出，API Key 默认排除，需主动勾选才包含。
- **紧凑界面**：明暗主题跟随系统或手动选择；设置分为通用、翻译、服务商、字幕、数据五页。界面使用系统字体，代码与端点字段使用等宽字体。

<a id="subtitles"></a>
### 视频字幕

支持 **YouTube、Zoom 云录制、Canvas 课程录制**，以及通过标准 `<track>`／TextTrack 提供可访问字幕的兼容播放器。具体取决于站点播放器与字幕轨，并非所有嵌入式播放器都经过测试。**仅翻译已有字幕，不进行音频转录。**

点击播放器控制栏中的翻译图标，再打开字幕翻译开关。没有合适控制栏时，按钮位于视频角落。YouTube 请先开启原生字幕（CC）以加载字幕轨；其他播放器也可能需要先激活字幕。人工字幕和受支持的自动生成字幕均可使用；滚动式 ASR 碎片会先合并为句子再翻译。

原文与译文叠加显示在视频上，可拖动把手移动；位置会被记住，全屏下同样生效，并会避让显示中的控制栏。翻译优先处理播放头附近的字幕，拖动进度后重新安排任务。识别出的说话人标签不参与翻译，显示时原样还原。速度取决于服务商和视频，不保证固定出字时间。

播放器菜单与**「设置 → 字幕」**可调整双语／仅原文／仅译文、上下顺序、背景透明度，以及两行各自的字号、颜色、字体和字重。设置页提供即时预览、精确数值、小色板、HEX 色值及重置按钮。

<a id="languages"></a>
### 语言

**56 个翻译目标**与顶部导航中的 **14 种界面语言**独立设置，界面可以跟随浏览器语言。popup、设置页和卡片的语言选择器支持原生名称、英文名称、当前界面语言名称、语言代码和英语地区别名搜索。RTL 文字保留阅读方向，菜单行仍统一对齐。

英语区分**美国、英国、澳大利亚**，旧的通用 `en` 配置迁移为美式英语。中文明确区分**简体与繁体**。LLM 会收到地区拼写和用词要求；免费服务支持时使用对应变体，否则静默回退为通用英语，不切换服务商。

<a id="architecture"></a>
## 架构

<p align="center">
  <img src="./assets/framework.png" alt="BrowserTranslate 架构与直连服务商的数据流" width="760">
</p>

LLM 与机器翻译请求由**后台 Service Worker**发起，不向网站 JavaScript 提供你的 API Key。内容脚本负责显示结果及页面／播放器集成；特定站点的字幕获取也可能在内容脚本或页面上下文执行。本项目没有中转服务器。

<a id="installation"></a>
## 安装

目前面向 **Chromium 桌面浏览器**，包括 Chrome、Edge、Brave、Arc，暂不支持 Firefox。

1. 从 [Releases](https://github.com/Lewen-Cai/browser-translate/releases) 下载最新 `.zip`。
2. 解压到准备长期保留的目录。
3. 打开 `chrome://extensions`（或浏览器的扩展管理页），启用**开发者模式**，点击**加载已解压的扩展程序**，选择该目录。

### 手动更新

已解压扩展不会自动更新。下载新版压缩包，覆盖原目录，在扩展页点击**重新加载**，然后刷新已打开的网页。Windows／macOS 的自托管扩展若走受管理的安装方式，通常需要企业策略；加载已解压扩展是另一种流程。

设置页右上角显示已安装版本和手动更新检查按钮。只有按下按钮才向 GitHub 查询，有新版时提供压缩包下载，不会自动安装。popup 不重复显示版本号。

<a id="configuration"></a>
## 配置

新安装默认全部使用微软。接入自己的模型：

1. 打开扩展 popup，点击设置图标。
2. 在**「服务商」**启用服务方，填写端点、模型和 API Key；本地运行时不要求 Key。启用行会显示连接状态／延迟，此检查会联系对应服务商。
3. 在**「翻译 → 翻译引擎」**分别为划词、整页和字幕选择服务商。
4. 选择目标语言，在支持的网页选中文字并点击蓝色图标。键盘操作在**「通用」**开启快捷键模式，默认 **Alt+T** 划词、**Alt+A** 整页；两个快捷键都只在快捷键模式下生效。

popup 保留目标语言、当前页双语开关与引擎选择，触发方式和快捷键仅在设置页。受限页面禁用翻译；内容脚本不可用时提示刷新。Prompt 和引擎策略位于「翻译」，凭据位于「服务商」，字幕外观位于「字幕」，缓存及导入／导出位于「数据」。

### 服务商与思考控制

预设包括 **OpenAI、Claude、Gemini、DeepSeek、Moonshot、Zhipu、Qwen、SiliconFlow、OpenRouter、Mistral、opencode**；本地选项包括 **LM Studio、Ollama、llama.cpp、vLLM**。其他兼容服务可使用自定义端点。

端点会区分地区和套餐，例如 opencode Zen／Go，以及 Qwen 的北京、新加坡、香港、美国弗吉尼亚和 Token Plan。账号、Key 与模型目录不一定通用。支持的服务商也允许填写所需的工作空间专属地址。

在支持控制时，扩展默认请求关闭思考，并提供映射到服务商参数的 **Low／Medium／High／XHigh／Max** 五档。自定义／本地服务可指定参数方言，也可保持「不发送」。未发送受支持的控制参数时，由服务端默认行为决定。实际支持、延迟和思考 token 计费取决于端点及模型，不能仅凭界面开关保证。

<a id="prompts"></a>
### 自定义基础 Prompt

在**「翻译 → 基础 Prompt」**，左侧模板列表、右侧编辑器，窄窗口改为上下布局。默认内容可见但只读。通过**「新建」**选择基于默认或从空白创建；说明在编辑框下方。选择模板只切换编辑对象，当前使用的 Prompt 单独标记。

- **保存并应用**：一次保存草稿并使其生效。
- **保存修改**：更新正在使用的 Prompt。
- **应用 Prompt**：应用已保存模板，已在使用时禁用。
- **取消**：放弃本地编辑。
- **模板操作**：仅保存暂不应用、复制、用默认内容替换草稿、删除。破坏性替换和删除需确认，删除当前模板会回退到默认。

自定义指令**替代**默认基础 Prompt，不是追加。目标语言、地区规范、路由和输出格式仍由扩展加入，内部协议不能编辑。指令冲突或模型能力不足仍可能影响结果。编辑器只保存纯文本，不替换 `{{...}}`。

最多 **20 套自定义模板**，每套基础指令最多 **12,000 字符**。仅对 LLM 生效，不影响微软／谷歌普通翻译。修改 Prompt 会使用独立缓存，设置导出包含模板与当前选择。

<a id="validation"></a>
### 响应校验

明显长文不接收查词指令。短选区仍由模型选择模式，但词条必须对应整个选区，不能只抽出其中一个词。可疑结构化输出先缓冲校验，卡片根据明确的结果类型渲染，不靠 `{` 猜测。

划词响应格式错误时，最多追加**一次纯文本纠正请求**。整页／字幕批次错误时，每个未缓存段落最多回退为**一次纯文本请求**。可能增加 token 用量，网络重试另行计算。持续格式错误显示错误提示，不把原始协议 JSON 当译文，也不缓存失败结果。

批次 ID 必须完整且唯一，结果按输入顺序还原；数字或对象不强制转成译文。协议缓存标识与读取校验隔离旧的未验证 LLM 结果。原文中的结构化内容仍可作为文本翻译。

**格式校验不保证语义准确，也无法发现所有漏译。** 源语言标签只是本地显示提示，可对明显混合文字作保守标注，不会阻止请求或决定请求模式。

<a id="free-engines"></a>
### 关于免费翻译服务

微软和谷歌调用 `edge.microsoft.com`、`translate-pa.googleapis.com` 的公开端点。

- **不是官方 API**：这些端点服务于厂商自己的网页／浏览器翻译功能，并未为本扩展提供公开服务契约。
- **无隶属或背书**：本项目与微软、谷歌无隶属、赞助或认可关系；名称和商标仅标识所选服务，归原权利人所有。
- **不保证可用**：端点可能随时改变或停止。可切换自己的模型，其可用性仍取决于对应服务商。
- **文本会发送给服务方**：适用其条款和隐私政策。敏感内容应选择合适的自有端点。
- **不作担保**：按现状提供，风险自负；商业或大批量使用应选择正式授权的官方 API。

默认使用微软是为了首次安装即可使用。将某个场景改为自己的模型后，该场景不再调用这些公开翻译端点。

<a id="privacy"></a>
## 隐私与本地数据

本项目不运营中转、不收集遥测，但**不代表所有处理都在本地**：云服务会收到你提交的待译文本，本地运行时则可以把模型处理留在本机。字幕获取会联系视频站点；手动更新检查会联系 GitHub。这些服务会收到 IP 地址等正常网络元数据。

设置、API Key 和翻译缓存存于 `chrome.storage.local`。**扩展不对 API Key 加密。** 导出默认不含 Key，主动包含后会生成明文文件，请妥善保管。缓存不导出，也不提供可浏览的翻译历史功能。

<a id="development"></a>
## 开发

```bash
pnpm install
pnpm dev          # 监听构建：.output/chrome-mv3-dev/
pnpm test         # 监听模式测试
pnpm test:run     # 单次测试
pnpm typecheck    # WXT 类型生成 + TypeScript
pnpm lint
pnpm build        # 生产构建：.output/chrome-mv3/
```

将开发或生产输出目录作为已解压扩展加载；更换构建后重新加载扩展并刷新网页。[CHANGELOG.md](./CHANGELOG.md) 记录版本变化，[Issues](https://github.com/Lewen-Cai/browser-translate/issues) 接收问题和建议。反馈时请移除 API Key 和私人网页内容。

<a id="acknowledgements"></a>
## 致谢

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0；开发本扩展时参考和学习的优秀项目。
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT；提供服务商品牌图标。商标归各自权利人所有，仅用于标识服务。

<a id="license"></a>
## 许可证

[GPL-3.0](./LICENSE)。分发派生作品时须遵守对应的源代码与许可义务；第三方素材保留各自许可证。
