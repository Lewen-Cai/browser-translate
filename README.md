<p align="center">
  <img src="./assets/banner.png" alt="BrowserTranslate — privacy-first browser translation" width="900">
</p>
<h1 align="center">BrowserTranslate</h1>
<p align="center">
  <strong>Read webpages and subtitles with the model you choose.</strong><br>
  Open-source browser translation · Bring your own key · No relay · No telemetry
</p>

<p align="center">
  <a href="./README.md"><kbd><b>English</b></kbd></a>
  <a href="./README_zh-CN.md"><kbd>简体中文</kbd></a>
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
  <a href="#installation">Install</a> · <a href="#configuration">Configure</a> · <a href="./CHANGELOG.md">Changelog</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Issues</a>
</p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Latest release"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Why BrowserTranslate?

Use your preferred translation provider without a mandatory subscription to this extension or a relay operated by us.

- **Your model, your key.** Connect an OpenAI-compatible endpoint or a local runtime. Provider compatibility depends on the endpoint and model.
- **Direct requests.** Translated text goes from your browser to the selected provider. This project operates no relay server.
- **No telemetry.** No analytics, remote error reporting or remote logging by the extension.
- **Editable base prompts.** Inspect the default, create your own templates and share one base prompt across LLM translation modes. Internal dictionary and output-format rules remain managed by the extension.

<a id="features"></a>
## Features

- **Start without an API key.** Microsoft and Google translation services are enabled by default; new installations route all three modes to Microsoft. They use unofficial public endpoints: read the [free-service notice](#free-engines) before relying on them.
- **Independent engines.** Selection cards, full-page translation and video subtitles can each use a different provider. Configure multiple providers and switch without re-entering their settings.
- **Selection translation.** Select text, then click the floating icon, or use hotkey mode. The card streams ordinary text, shows the source above the result and offers copy, retranslate, provider and target-language controls. Per-card choices do not change global settings; retranslate bypasses the cache.
- **A stable, movable card.** Set its dimensions in General → Appearance. Source and translation scroll independently; the source occupies at most 30% of the shared body. While waiting, the card shows a compact loading state. Pin it to keep it open while scrolling or clicking elsewhere, and drag it out of the way.
- **Full-page bilingual translation.** Translates page content in place, keeping originals above translations and generally excluding navigation, headers and footers. Translation progresses around the viewport as you scroll. Use the popup's Current page → Bilingual translation switch, or **Alt+A** in hotkey mode.
- **Automatic dictionary lookup for short selections.** A model can define a word or short term with translation, pronunciation, part of speech, senses and an example. Obvious passages, multiline text and code-like selections use a translation-only prompt. Free services translate text but do not generate dictionary entries.
- **Mixed-language input is allowed.** Matching source and target languages never blocks a request. Regional rewrites depend on the selected model or service.
- **Local configuration and cache.** Cache lifetime is configurable in Settings → Data. Export/import settings and custom prompts as JSON; cache is not included and API keys are excluded unless explicitly requested.
- **Compact interface.** Light/dark mode follows the system or your choice. Five settings pages: General, Translation, Providers, Subtitles and Data. Interface text uses system fonts; code/endpoint fields retain monospace fonts.

<a id="subtitles"></a>
### Video subtitles

Works with existing captions on **YouTube**, **Zoom cloud recordings**, **Canvas course recordings**, and compatible players exposing captions through standard `<track>`/TextTrack mechanisms. Support depends on the site's player and accessible caption track; not every embedded player has been tested. **No audio transcription is performed.**

Click the translation icon in the player's controls, then enable subtitle translation. If no suitable control bar is available, the button appears in a corner of the video. On YouTube, enable native captions (CC) first so the track is loaded. Other players may also need their caption track activated. Creator-provided and supported auto-generated captions can be used; rolling ASR fragments are combined into sentences before translation.

Original and translated lines are drawn over the player. Drag the block using its grip; its position is remembered, including in fullscreen, and it moves clear of visible player controls. Translation prioritizes cues around the playhead and adapts after seeking. Speaker labels are kept outside translation and restored verbatim when recognized. Latency depends on the provider and video; there is no fixed response-time guarantee.

The player menu and **Settings → Subtitles** control bilingual/original-only/translation-only display, line order, background opacity, and each line's size, color, font and weight. Settings includes a live preview, precise numeric controls, a small color palette, HEX input and a reset button.

<a id="languages"></a>
### Languages

**56 translation targets** are independent of the **14 interface languages** linked above. The interface can follow the browser's locale. Target pickers in the popup, settings and card search native, English and interface-language names, language codes and English-region aliases. RTL names keep their reading direction while menu rows stay aligned.

English targets are **United States, United Kingdom and Australia**; old generic `en` settings migrate to US English. Chinese targets are **Simplified and Traditional**. LLMs receive explicit regional spelling and vocabulary instructions. Free services use the requested variety where supported, otherwise generic English silently, without switching providers.

<a id="architecture"></a>
## Architecture

<p align="center">
  <img src="./assets/framework.png" alt="BrowserTranslate architecture and direct provider connections" width="760">
</p>

LLM and machine-translation requests run in the **background service worker**. Website JavaScript is not given your API key. Content scripts display results and integrate with pages/players; site-specific caption retrieval may also run in content or page context. There is no project-operated relay.

<a id="installation"></a>
## Install

Currently for **Chromium-based desktop browsers**, including Chrome, Edge, Brave and Arc. Firefox is not currently supported.

1. Download the latest `.zip` from [Releases](https://github.com/Lewen-Cai/browser-translate/releases).
2. Unzip it into a folder you will keep.
3. Open `chrome://extensions` (or your browser's extensions page), enable **Developer mode**, choose **Load unpacked**, and select that folder.

### Update manually

Unpacked extensions do not auto-update. Download the new archive, extract it over your existing folder and press **Reload** on the extensions page. Refresh open webpages afterwards. On Windows/macOS, installing self-hosted extensions through the managed installation mechanism generally requires enterprise policy; loading unpacked is a separate workflow.

The settings header displays the installed version and a manual update-check button. It queries GitHub only when pressed and offers the release archive if a newer version exists. It does not install the update automatically. The popup does not repeat the version number.

<a id="configuration"></a>
## Configure

A new installation uses Microsoft for all translation modes. To use your own model:

1. Open the extension popup and click its settings icon.
2. In **Providers**, enable a provider and enter the endpoint, model and API key. Local runtimes do not require a key. Enabled rows report connection status/latency; this check contacts that provider.
3. In **Translation → Translation engines**, assign a provider independently to selection cards, full pages and subtitles.
4. Choose a target language, select text on a supported webpage, and click the blue icon. For keyboard operation, choose hotkey mode in **General**: defaults are **Alt+T** for selection and **Alt+A** for full-page translation. Both shortcuts operate only in hotkey mode.

The popup contains target language, the current-page bilingual switch and engine choices. Trigger mode and shortcuts are settings-only. Unsupported pages disable page translation; a missing content script produces a refresh hint. Prompt/engine policy lives in **Translation**, credentials in **Providers**, subtitle appearance in **Subtitles**, and cache/export/import in **Data**.

### Providers and thinking controls

Presets include **OpenAI, Claude, Gemini, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral and opencode**. Local options include **LM Studio, Ollama, llama.cpp and vLLM**. Other compatible services can use a custom endpoint.

Endpoint choices distinguish regions and plans: for example, opencode Zen/Go and Qwen's Beijing, Singapore, Hong Kong and Virginia regions plus Token Plan. Accounts, keys and model catalogs are not necessarily interchangeable. Supported providers can also accept custom workspace URLs where needed.

Where supported, the extension requests thinking off by default and offers **Low / Medium / High / XHigh / Max** levels mapped to provider parameters. For custom/local servers, select the parameter dialect or leave **Send nothing**. When no supported control is sent, the server's default applies. Actual support, latency and reasoning-token billing depend on the endpoint/model, not just the UI setting.

<a id="prompts"></a>
### Your base prompt

In **Translation → Base prompt**, the library is beside the editor (stacked on narrow windows). The default is visible and read-only. **New** creates from the default or from scratch. Guidance is inside the card below the editor. Selecting a template only opens it; the prompt currently in use is marked separately.

- **Save & apply** saves a draft and applies it in one step.
- **Save changes** updates the prompt already in use.
- **Apply Prompt** applies a saved template; it is disabled when already in use.
- **Cancel** discards local edits.
- **Template actions** contains save without applying, duplicate, replace draft text with the default, and delete. Destructive replacement/deletion requires confirmation; deleting the active template falls back to Default.

Custom instructions **replace**, rather than append to, the default base prompt. The extension still adds target language, regional conventions, routing and output-format rules; these internal protocols are not editable. Conflicting instructions or weaker models may produce imperfect results. Literal `{{...}}` is not substituted: this is a plain-text editor.

Store up to **20 custom templates**, each with up to **12,000 characters** of instructions. Templates apply only to LLMs, not Microsoft/Google translation services. Prompt changes use separate cache entries. Templates and the active choice are included in settings exports.

<a id="validation"></a>
### Response validation

Obvious passages never receive dictionary-mode instructions. Short selections retain model choice, but dictionary entries must correspond to the entire selection, not one extracted word. Suspicious structured output is buffered and validated; the card receives an explicit result type instead of guessing from `{`.

An invalid selection response gets at most **one text-only correction request**. Invalid page/subtitle batches fall back to **one text-only request per uncached segment**. Corrections can cost extra tokens; transport retries are separate. Persistent format failures show an error rather than raw protocol JSON and are not cached.

Batch IDs must be complete and unique; results are restored to input order, and non-string values are rejected rather than coerced. Protocol-aware cache keys and cache-read validation isolate older unchecked LLM results. Literal structured source content can still be translated as text.

**Format validation cannot guarantee semantic accuracy or detect every omission.** Source-language labels are local display hints, including a conservative mixed-script label; they never block or route requests.

<a id="free-engines"></a>
### About the free translation services

Microsoft and Google use public endpoints at `edge.microsoft.com` and `translate-pa.googleapis.com`.

- **Not official APIs:** these endpoints serve the vendors' web/browser translation features and have no published contract for this extension.
- **No affiliation or endorsement:** this project is not affiliated with, sponsored by or endorsed by Microsoft or Google. Names and marks identify the selected service and belong to their owners.
- **Availability is not guaranteed:** endpoints may change or stop working without notice. You can switch to your configured model; its availability depends on its own provider.
- **Text is sent to the selected service:** its terms and privacy policy apply. Use your own appropriate endpoint for sensitive content.
- **No warranty:** provided as-is, at your own risk. For commercial or high-volume use, choose official, licensed APIs.

Microsoft is the default for a useful first-run experience. Routing a mode to your own model means that mode no longer uses these public translation endpoints.

<a id="privacy"></a>
## Privacy and local data

The project operates no relay and collects no telemetry. This does **not** mean all processing is local: cloud providers receive the text you ask them to translate, while a local runtime can keep model processing on your machine. Caption retrieval contacts the relevant video site. Manual update checks contact GitHub; services receive normal network metadata such as your IP address.

Settings, API keys and the translation cache are stored in `chrome.storage.local`. **The extension does not encrypt API keys.** Settings exports omit keys by default; including them creates a plaintext file you must keep private. Cache is not exported. No browsable translation-history feature is maintained.

<a id="development"></a>
## Develop

```bash
pnpm install
pnpm dev          # Watch build: .output/chrome-mv3-dev/
pnpm test         # Tests in watch mode
pnpm test:run     # Single test run
pnpm typecheck    # WXT type generation + TypeScript
pnpm lint
pnpm build        # Production: .output/chrome-mv3/
```

Load the development or production output folder as an unpacked extension. Reload it and refresh target webpages after changing builds. Release notes are in [CHANGELOG.md](./CHANGELOG.md); bugs and requests belong in [Issues](https://github.com/Lewen-Cai/browser-translate/issues). Please remove API keys and private page content from reports.

<a id="acknowledgements"></a>
## Acknowledgements

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; an excellent project we learned from while building this extension.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; provider logos. Trademarks remain with their respective owners and only identify the selected service.

<a id="license"></a>
## License

[GPL-3.0](./LICENSE). Distributed derivative works must comply with its source-code and licensing obligations. Third-party assets retain their respective licenses.
