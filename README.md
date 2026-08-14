# BrowserTranslate

<p align="center">
  <img src="./assets/banner.png" alt="BrowserTranslate — privacy-first, bring-your-own-key browser translation" width="800">
</p>

[![Release](https://img.shields.io/github/v/release/Lewen-Cai/BrowserTranslate?color=2563eb&label=release)](https://github.com/Lewen-Cai/BrowserTranslate/releases/latest)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![CI](https://github.com/Lewen-Cai/BrowserTranslate/actions/workflows/ci.yml/badge.svg)](https://github.com/Lewen-Cai/BrowserTranslate/actions/workflows/ci.yml)

**English** | [中文](./README_CN.md)

> Open-source, privacy-first browser translation extension. Bring your own LLM key. Zero relay, zero telemetry.

## Why

Existing translation extensions either lock LLM access behind paywalls, route your text through their servers, or hide the prompts that drive translation quality. BrowserTranslate is the opposite of all three.

- **Bring your own key** — works with any OpenAI-compatible API. Built-in presets: OpenAI, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral. Local runtimes: LM Studio, Ollama, llama.cpp, vLLM
  - Need Anthropic or Gemini? Run any OpenAI-compatible proxy (LiteLLM, OpenRouter, etc.) and point Base URL at it.
- **Zero relay** — your text goes directly from your browser to the provider you configured. We have no server.
- **Zero telemetry** — no analytics, no error reporting, no remote logging
- **Open prompts** — the translation prompt is fixed but fully open source; the model judges register and topic on its own
- **Auto status check on popup open** — endpoint + model reachability is pinged automatically and shown as a status indicator

## Features

- **Works with no API key** — choose Microsoft or Google as the translation engine and everything (selection, full page, subtitles) translates immediately, at no cost. Switch to your own LLM whenever you want dictionary lookups or better prose. See the [note on the free engines](#a-note-on-the-free-engines) below.
- Selection-based translation with floating icon (or hotkey-only mode); the result card shows the source above the translation, can be pinned so it keeps its place on screen while you scroll and clicks elsewhere don't dismiss it, drags by its grip when it lands on top of what you were reading, and names the model or service that produced the result
- Full-page bilingual translation — translates the main content of a page in place (navigation, headers and footers are left as-is), keeping the original above each translated block; renders progressively as you scroll (only the visible part is translated); blocks already in your target language are skipped; toggle from the popup ("Translate page" / "Show original"), or with the **Alt+A** hotkey in Hotkey trigger mode
- Streaming output via Server-Sent Events
- Cloud / Local provider modes — pick a preset (OpenAI, DeepSeek, Moonshot, Zhipu GLM, Qwen, SiliconFlow, OpenRouter, Mistral; China / International endpoints where applicable) or enter a custom OpenAI-compatible endpoint; local servers need no API key
- Remembers each provider's key + model — switching providers restores them, no re-typing
- Model thinking off by default — hybrid reasoning models (e.g. DeepSeek V4) reply fast without billing hidden reasoning tokens; a per-provider control turns thinking back on at five effort levels (Low / Medium / High / XHigh / Max), mapped to each provider's native parameter (DeepSeek, Zhipu, Qwen, SiliconFlow, OpenRouter)
- Auto status check on popup open (pings endpoint and model availability)
- Dictionary mode — the model automatically decides whether a selection is a word/term to define or text to translate, in one streaming pass; dictionary results show the term's formal translation, pronunciation, part of speech, senses, and an example
- Settings export / import (Settings → Data) — save your config as JSON, import it on another device; API keys excluded by default (opt-in to include them)
- **YouTube subtitle translation** — On YouTube watch pages, click the translate button (the languages icon) in the player controls to open the subtitle menu, and turn on the switch to translate the video's existing captions. Both lines are drawn over the player — original on top, translation below — and the grip above them drags the block anywhere in the picture; dragged past the middle it anchors to the top. The position is remembered, including in fullscreen, and the block lifts clear of the control bar while it is showing. Auto-generated (ASR) captions work as well as creator-provided tracks: ASR arrives a couple of words at a time, so those fragments are regrouped into sentences before translating. Only the cues around the playhead are translated, so subtitles start appearing within a second or two even on a long video, and scrubbing lands on the new position immediately. Turn captions (CC) on first so YouTube loads the track. Subtitle style — display mode (bilingual, original only, translation only), which line sits on top, backdrop opacity, and size, colour, font and weight for each line — is on the menu's "Subtitle style" page, and in Settings → Video. (YouTube only; no audio speech-recognition.)
- Translation cache (configurable TTL)
- Light / dark appearance following the system or your choice; Latin text is set in JetBrains Mono, and CJK in Source Han Serif with a fallback stack chosen per language — Chinese, Japanese and Korean each get a face of their own rather than sharing one
- UI available in 8 languages (Simplified/Traditional Chinese, English, Japanese, Korean, Spanish, French, German); auto-detects browser locale

## Architecture

<p align="center">
  <img src="./assets/framework.png" alt="BrowserTranslate architecture: the background service worker is the only network call site; your text goes directly to your configured endpoint and your API key never reaches the page" width="760">
</p>

The background service worker is the **only** place that makes network calls — your text goes straight from your browser to the endpoint you configured, and your API key never touches the page. No relay server, ever.

## Install

### Chrome / Edge / Brave / Arc

1. Download the latest `.zip` from [Releases](https://github.com/Lewen-Cai/BrowserTranslate/releases)
2. Unzip
3. Open `chrome://extensions` → enable Developer mode → "Load unpacked" → select the unzipped folder

Chrome Web Store listing pending.

## Configure

A fresh install already translates — the engine defaults to Microsoft, so you can select text and go. Everything below is for switching to your own model.

1. Click the extension icon — the popup opens as the quick config panel.
2. Pick a **translation engine**: **Microsoft** or **Google** (free, no key) or **Your API** (your own OpenAI-compatible model). Only the last one supports dictionary lookups.
3. If you chose **Your API**, choose a **provider type**:
   - **Cloud** — pick a provider preset (presets auto-fill the Base URL; multi-region providers offer a China / International endpoint choice) or **Custom** to enter any OpenAI-compatible Base URL, then fill **API Key** and **Model**.
   - **Local** — enter your local **Base URL** (e.g. `http://localhost:11434/v1`) and **Model**. No API key needed.
4. Click **Apply config** to apply. The status indicator auto-pings on popup open and after Apply — green means endpoint and model are reachable.
5. Select text on any webpage → click the blue icon → see the translation. (Prefer a keyboard shortcut? Set the trigger mode to **Hotkey** in settings — then your shortcut works instead of the icon.)

Advanced settings (UI language, cache, subtitle appearance, data export) live in the full settings page — accessible via the ⚙ icon at the top-right of the popup.

### A note on the free engines

The Microsoft and Google options call public translation endpoints (`edge.microsoft.com`, `translate-pa.googleapis.com`). Please understand what that means before relying on them:

- **They are not official APIs.** They are the endpoints those companies' own web and browser translation features use. There is no published contract for them.
- **This project is not affiliated with, sponsored by, or endorsed by Microsoft or Google.** Their names and marks belong to them and are used only to identify the service you are choosing.
- **They can change or stop working at any time**, without notice. If that happens, switch the engine in settings — your own API keeps working regardless.
- **Text you translate is sent to those services**, subject to their terms and privacy policies, not this project's. If that matters for what you are translating, use your own endpoint instead.
- **No warranty.** These options are provided as-is, and you use them at your own risk. If your use is commercial or high-volume, use the vendors' official, licensed APIs.

The engine defaults to Microsoft only so a fresh install does something useful. Switching to **Your API** at any point removes all of the above.

## Develop

```bash
pnpm install
pnpm dev          # start dev build, watches src/, output in .output/
pnpm test         # run tests in watch mode
pnpm build        # production build
```

Load `.output/chrome-mv3-dev/` (dev) or `.output/chrome-mv3/` (prod) as an unpacked extension.

## Acknowledgements

- [read-frog](https://github.com/mengxi-ream/read-frog) (GPL-3.0) — thanks to this project, which we learned a lot from while building this extension. It is an excellent piece of work in its own right and well worth using — go give it a try.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) (MIT) — the vendor marks shown next to each provider. Those marks are the trademarks of their respective owners and are used only to identify the service being selected.

## License

GPL-3.0. See [LICENSE](./LICENSE).

This license is chosen deliberately: derivative works must remain open-source, preventing the closed-source paywalled forks that motivated this project.
