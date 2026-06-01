# BrowserTranslate

[![Release](https://img.shields.io/github/v/release/Lewen-Cai/BrowserTranslate?color=2563eb&label=release)](https://github.com/Lewen-Cai/BrowserTranslate/releases/latest)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![CI](https://github.com/Lewen-Cai/BrowserTranslate/actions/workflows/ci.yml/badge.svg)](https://github.com/Lewen-Cai/BrowserTranslate/actions/workflows/ci.yml)

**English** | [中文](./README_CN.md)

> Open-source, privacy-first browser translation extension. Bring your own LLM key. Zero relay, zero telemetry.

## Why

Existing translation extensions either lock LLM access behind paywalls, route your text through their servers, or hide the prompts that drive translation quality. BrowserTranslate is the opposite of all three.

- **Bring your own key** — works with any OpenAI-compatible API: OpenAI, DeepSeek, Moonshot, Groq, SiliconFlow, OpenRouter, local Ollama, LM Studio, vLLM
  - Need Anthropic or Gemini? Run any OpenAI-compatible proxy (LiteLLM, OpenRouter, etc.) and point Base URL at it.
- **Zero relay** — your text goes directly from your browser to the provider you configured. We have no server.
- **Zero telemetry** — no analytics, no error reporting, no remote logging
- **Open prompts** — every translation prompt is editable. Tune for academic / casual / technical / your-own-style
- **Auto status check on popup open** — endpoint + model reachability is pinged automatically and shown as a status indicator

## Features

- Selection-based translation with floating icon (or hotkey-only mode)
- Full-page bilingual translation — translates the main content of a page in place (navigation, headers and footers are left as-is), keeping the original above each translated block; renders progressively as you scroll (only the visible part is translated); blocks already in your target language are skipped; toggle from the popup ("Translate page" / "Show original"), or with the **Alt+A** hotkey in Hotkey trigger mode
- Streaming output via Server-Sent Events
- Cloud / Local provider modes — pick a preset (OpenAI, DeepSeek, Moonshot, Zhipu GLM, Qwen, SiliconFlow, OpenRouter, Mistral; China / International endpoints where applicable) or enter a custom OpenAI-compatible endpoint; local servers need no API key
- Remembers each provider's key + model — switching providers restores them, no re-typing
- 4 built-in prompt templates + unlimited custom templates
- Auto status check on popup open (pings endpoint and model availability)
- Dictionary mode — the model automatically decides whether a selection is a word/term to define or text to translate, in one streaming pass; dictionary results show the term's formal translation, pronunciation, part of speech, senses, and an example
- Settings export / import (Settings → Data) — save your config as JSON, import it on another device; API keys excluded by default (opt-in to include them)
- **YouTube subtitle translation** — On YouTube watch pages, click the "译" button in the player controls to translate the video's existing captions. The translation appears as a second line beneath YouTube's native subtitles (bilingual: original on top, translation below). Requires the video to have captions (manual or auto-generated) with captions (CC) turned on. Translations are produced by your configured model in batches. (YouTube only; no audio speech-recognition.)
- Translation cache (configurable TTL)
- Light / dark theme (follows system)
- UI available in 8 languages (Simplified/Traditional Chinese, English, Japanese, Korean, Spanish, French, German); auto-detects browser locale

## Install

### Chrome / Edge / Brave / Arc

1. Download the latest `.zip` from [Releases](https://github.com/Lewen-Cai/BrowserTranslate/releases)
2. Unzip
3. Open `chrome://extensions` → enable Developer mode → "Load unpacked" → select the unzipped folder

Chrome Web Store listing pending.

## Configure

1. Click the extension icon — the popup opens as the quick config panel.
2. Choose a **provider type**:
   - **Cloud** — pick a provider preset (presets auto-fill the Base URL; multi-region providers offer a China / International endpoint choice) or **Custom** to enter any OpenAI-compatible Base URL, then fill **API Key** and **Model**.
   - **Local** — enter your local **Base URL** (e.g. `http://localhost:11434/v1`) and **Model**. No API key needed.
3. Click **Apply config** to apply. The status indicator auto-pings on popup open and after Apply — green means endpoint and model are reachable.
4. Select text on any webpage → click the blue icon → see the translation. (Prefer a keyboard shortcut? Set the trigger mode to **Hotkey** in settings — then your shortcut works instead of the icon.)

Advanced settings (prompt templates, theme, UI language) live in the full settings page — accessible via the ⚙ icon at the top-right of the popup.

## Develop

```bash
pnpm install
pnpm dev          # start dev build, watches src/, output in .output/
pnpm test         # run tests in watch mode
pnpm build        # production build
```

Load `.output/chrome-mv3-dev/` (dev) or `.output/chrome-mv3/` (prod) as an unpacked extension.

## License

GPL-3.0. See [LICENSE](./LICENSE).

This license is chosen deliberately: derivative works must remain open-source, preventing the closed-source paywalled forks that motivated this project.
