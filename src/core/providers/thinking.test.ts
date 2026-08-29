import { describe, it, expect } from 'vitest';
import {
  DIALECT_WIRE_LABEL,
  THINKING_DIALECTS,
  dialectPatch,
  isThinkingDialect,
  type ThinkingDialect,
} from './thinking';
import { THINKING_SETTINGS } from '~/storage/schema';

describe('dialectPatch', () => {
  it("sends nothing at all for 'none', at every setting", () => {
    for (const setting of THINKING_SETTINGS) expect(dialectPatch('none', setting)).toBeNull();
  });

  it('turns thinking off through the field the endpoint actually reads', () => {
    // Every dialect but 'none' has to have a way of saying off — a control that
    // can only turn thinking *up* would be worse than no control.
    expect(dialectPatch('thinking-effort', 'off')).toEqual({ thinking: { type: 'disabled' } });
    expect(dialectPatch('thinking-enabled-effort', 'off')).toEqual({
      thinking: { type: 'disabled' },
    });
    expect(dialectPatch('thinking-budget', 'off')).toEqual({ thinking: { type: 'disabled' } });
    expect(dialectPatch('enable-thinking', 'off')).toEqual({ enable_thinking: false });
    expect(dialectPatch('reasoning-object', 'off')).toEqual({ reasoning: { enabled: false } });
    expect(dialectPatch('effort', 'off')).toEqual({ reasoning_effort: 'none' });
    expect(dialectPatch('effort-capped', 'off')).toEqual({ reasoning_effort: 'none' });
  });

  it('passes the tier straight through where the scale is the full one', () => {
    expect(dialectPatch('thinking-effort', 'xhigh')).toEqual({ reasoning_effort: 'xhigh' });
    expect(dialectPatch('thinking-effort', 'max')).toEqual({ reasoning_effort: 'max' });
  });

  it('pairs the tier with an explicit enable where the endpoint needs both', () => {
    expect(dialectPatch('thinking-enabled-effort', 'low')).toEqual({
      thinking: { type: 'enabled' },
      reasoning_effort: 'low',
    });
  });

  it('translates tiers into token budgets for the budget-based dialects', () => {
    expect(dialectPatch('enable-thinking', 'low')).toEqual({
      enable_thinking: true,
      thinking_budget: 2048,
    });
    expect(dialectPatch('enable-thinking', 'max')).toEqual({
      enable_thinking: true,
      thinking_budget: 32768,
    });
    expect(dialectPatch('thinking-budget', 'high')).toEqual({
      thinking: { type: 'enabled', budget_tokens: 8192 },
    });
  });

  it('caps the tier where the endpoint refuses the top of our scale', () => {
    expect(dialectPatch('effort-capped', 'medium')).toEqual({ reasoning_effort: 'medium' });
    expect(dialectPatch('effort-capped', 'xhigh')).toEqual({ reasoning_effort: 'high' });
    expect(dialectPatch('effort-capped', 'max')).toEqual({ reasoning_effort: 'high' });
    expect(dialectPatch('reasoning-object', 'max')).toEqual({ reasoning: { effort: 'high' } });
    // opencode's scale reaches xhigh but stops short of max.
    expect(dialectPatch('effort', 'xhigh')).toEqual({ reasoning_effort: 'xhigh' });
    expect(dialectPatch('effort', 'max')).toEqual({ reasoning_effort: 'xhigh' });
  });

  it('answers for every dialect at every setting, and only with an object or null', () => {
    for (const dialect of THINKING_DIALECTS) {
      for (const setting of THINKING_SETTINGS) {
        const patch = dialectPatch(dialect, setting);
        if (dialect === 'none') expect(patch).toBeNull();
        else expect(patch).toBeTypeOf('object');
      }
    }
  });

  it('never sends an empty patch, which would be a request field for nothing', () => {
    for (const dialect of THINKING_DIALECTS) {
      if (dialect === 'none') continue;
      for (const setting of THINKING_SETTINGS) {
        expect(Object.keys(dialectPatch(dialect, setting) ?? {}).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('the dialect list', () => {
  it('names the wire format of every dialect, so the picker can label itself', () => {
    for (const dialect of THINKING_DIALECTS) {
      expect(DIALECT_WIRE_LABEL[dialect]).toBeTruthy();
    }
  });

  it('recognises its own ids and nothing else', () => {
    for (const dialect of THINKING_DIALECTS) expect(isThinkingDialect(dialect)).toBe(true);
    for (const junk of ['', 'deepseek', 'reasoning', null, undefined, 7, {}]) {
      expect(isThinkingDialect(junk)).toBe(false);
    }
  });

  it('leaves no dialect unreachable from the picker', () => {
    const labelled = Object.keys(DIALECT_WIRE_LABEL) as ThinkingDialect[];
    expect([...labelled].sort()).toEqual([...THINKING_DIALECTS].sort());
  });
});
