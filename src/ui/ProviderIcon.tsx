import type { JSX } from 'preact';
import { Server, SlidersHorizontal } from '~/ui/icons';
import type { ProviderId } from '~/core/providers/registry';

// Vendor marks from Lobe Icons (https://github.com/lobehub/lobe-icons), MIT.
// The files are vendored into src/ui/brandIcons rather than pulled from the
// package at runtime: an extension can't fetch anything at display time, and we
// only need ten of the nine hundred icons the set ships.
//
// Each is a 1em-square SVG, so the wrapper's font-size is what sets the drawn
// size. The monochrome ones (OpenAI, OpenRouter, Z.ai) paint with currentColor
// and therefore follow the theme; the rest carry their own brand colours, which
// is intended — they identify a third party and must not shift with the theme.
//
// Zhipu's slot uses the Z.ai mark: that is the brand the platform ships under
// today, and it is what the endpoint dropdown offers.
import openaiSvg from './brandIcons/openai.svg?raw';
import deepseekSvg from './brandIcons/deepseek-color.svg?raw';
import kimiSvg from './brandIcons/kimi-color.svg?raw';
import zaiSvg from './brandIcons/zai.svg?raw';
import qwenSvg from './brandIcons/qwen-color.svg?raw';
import siliconflowSvg from './brandIcons/siliconcloud-color.svg?raw';
import openrouterSvg from './brandIcons/openrouter.svg?raw';
import mistralSvg from './brandIcons/mistral-color.svg?raw';
import microsoftSvg from './brandIcons/microsoft-color.svg?raw';
import googleSvg from './brandIcons/google-color.svg?raw';
import claudeSvg from './brandIcons/claude-color.svg?raw';
import geminiSvg from './brandIcons/gemini-color.svg?raw';
import opencodeSvg from './brandIcons/opencode.svg?raw';

export type ProviderIconId = ProviderId;

const BRAND_SVGS: Partial<Record<ProviderIconId, string>> = {
  openai: openaiSvg,
  deepseek: deepseekSvg,
  moonshot: kimiSvg,
  zhipu: zaiSvg,
  dashscope: qwenSvg,
  siliconflow: siliconflowSvg,
  openrouter: openrouterSvg,
  mistral: mistralSvg,
  microsoft: microsoftSvg,
  google: googleSvg,
  anthropic: claudeSvg,
  gemini: geminiSvg,
  opencode: opencodeSvg,
};

interface Props {
  id: ProviderIconId;
  size?: number;
  class?: string;
}

export function ProviderIcon({ id, size = 16, class: cls }: Props): JSX.Element {
  const svg = BRAND_SVGS[id];

  // A self-hosted runtime covers several projects and a hand-entered endpoint
  // has no vendor at all, so both get a neutral glyph that follows the theme.
  if (!svg) {
    const Glyph = id === 'local' ? Server : SlidersHorizontal;
    return (
      <span
        class={`inline-flex shrink-0 items-center justify-center text-ap-muted ${cls ?? ''}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-hidden="true"
      >
        <Glyph size={size} />
      </span>
    );
  }

  return (
    <span
      class={`inline-flex shrink-0 items-center justify-center ${cls ?? ''}`}
      style={{ width: `${size}px`, height: `${size}px`, fontSize: `${size}px` }}
      aria-hidden="true"
      // Static, build-time-inlined markup — no user input reaches this.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
