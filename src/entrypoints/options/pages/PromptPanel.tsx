import { useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { useT } from '~/i18n';
import { DEFAULT_STYLE_PROMPT } from '~/core/prompt/style';
import {
  DEFAULT_PROMPT_ID, MAX_PROMPT_LENGTH, MAX_PROMPT_NAME, MAX_PROMPT_TEMPLATES,
  type PromptSettings,
} from '~/core/prompt/templates';
import { Button } from '~/ui/components/Button';
import { Check, Copy, Ellipsis, FileText, Lock, Plus, RotateCcw, Trash2 } from '~/ui/icons';
import { cn } from '~/lib/cn';

interface Props {
  settings: PromptSettings;
  onChange: (settings: PromptSettings) => Promise<void>;
}

/** A template library and a local editor. Selecting a row never activates it. */
export function PromptPanel({ settings, onChange }: Props) {
  const t = useT();
  const initial = settings.templates.find((p) => p.id === settings.activeId);
  const [selected, setSelected] = useState(settings.activeId);
  const [name, setName] = useState(initial?.name ?? '');
  const [body, setBody] = useState(initial?.body ?? DEFAULT_STYLE_PROMPT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [menu, setMenu] = useState<'new' | 'more' | null>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const nameField = useRef<HTMLInputElement>(null);
  const focusName = useRef(false);
  const returnId = useRef(settings.activeId);
  const returnDraft = useRef<{ id: string; name: string; body: string } | null>(null);
  const saving = useRef(false);
  const uid = useId();
  const saved = settings.templates.find((p) => p.id === selected);
  const builtin = selected === DEFAULT_PROMPT_ID;
  const isNew = !builtin && !saved;
  const active = selected === settings.activeId;
  const dirty = !builtin && (!saved || name !== saved.name || body !== saved.body);
  const valid = !!name.trim() && !!body.trim();
  const full = settings.templates.length >= MAX_PROMPT_TEMPLATES;
  const activeName = settings.templates.find((p) => p.id === settings.activeId)?.name ?? t('promptDefault');
  const title = builtin ? t('promptDefault') : name.trim() || t('promptCustom');
  const limitMessage = t('promptLimit').replace('{count}', String(MAX_PROMPT_TEMPLATES));

  useLayoutEffect(() => {
    if (focusName.current) {
      nameField.current?.focus(); nameField.current?.select(); focusName.current = false;
    }
  }, [selected]);
  useLayoutEffect(() => {
    if (menu) menuPanel.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [menu]);
  useEffect(() => {
    if (!menu) return;
    const outside = (e: PointerEvent) => {
      if (!menuPanel.current?.contains(e.target as Node) && !menuTrigger.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [menu]);

  function canLeave() { return !dirty || window.confirm(t('promptDiscard')); }
  function loadEditor(id: string) {
    const template = settings.templates.find((p) => p.id === id);
    const next = template?.id ?? DEFAULT_PROMPT_ID;
    setSelected(next); setName(template?.name ?? ''); setBody(template?.body ?? DEFAULT_STYLE_PROMPT);
    setError(false); setMenu(null);
  }
  function choose(id: string) {
    if (busy || id === selected || !canLeave()) return;
    loadEditor(id);
  }
  function uniqueName(seed: string) {
    const names = new Set(settings.templates.map((p) => p.name));
    let candidate = seed.slice(0, MAX_PROMPT_NAME);
    for (let n = 2; names.has(candidate); n++) {
      const suffix = ` ${n}`;
      candidate = seed.slice(0, MAX_PROMPT_NAME - suffix.length) + suffix;
    }
    return candidate;
  }
  function create(from: 'default' | 'blank' | 'copy') {
    if (busy || full || (from !== 'copy' && !canLeave())) return;
    // Duplicating the editor keeps its current text, including unsaved edits.
    // There is no loss of draft content to confirm in that case.
    returnId.current = saved?.id ?? (builtin ? DEFAULT_PROMPT_ID : returnId.current);
    returnDraft.current = from === 'copy' ? { id: selected, name, body } : null;
    const nextName = from === 'blank' ? '' : uniqueName(from === 'copy' ? name || t('promptCustom') : t('promptCustom'));
    setName(nextName);
    setBody(from === 'default' ? DEFAULT_STYLE_PROMPT : from === 'copy' ? body : '');
    focusName.current = true;
    setSelected(crypto.randomUUID()); setError(false); setMenu(null);
  }
  async function persist(next: PromptSettings, after?: () => void) {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError(false); setMenu(null);
    try { await onChange(next); after?.(); }
    catch { setError(true); }
    finally { saving.current = false; setBusy(false); }
  }
  function save(activate: boolean) {
    if (!valid || builtin || busy || (!saved && full)) return;
    const template = { id: selected, name: name.trim(), body };
    void persist({
      activeId: activate ? selected : settings.activeId,
      templates: saved ? settings.templates.map((p) => p.id === selected ? template : p) : [...settings.templates, template],
    }, () => setName(template.name));
  }
  function cancel() {
    // Cancelling a copy must not discard edits in the original editor.
    const previous = isNew ? returnDraft.current : null;
    if (previous) {
      setSelected(previous.id); setName(previous.name); setBody(previous.body);
      setError(false); setMenu(null); returnDraft.current = null;
    } else loadEditor(isNew ? returnId.current : selected);
  }
  function remove() {
    if (!saved || !window.confirm(t('promptDeleteConfirm'))) return;
    void persist({ activeId: active ? DEFAULT_PROMPT_ID : settings.activeId,
      templates: settings.templates.filter((p) => p.id !== selected) }, () => loadEditor(DEFAULT_PROMPT_ID));
  }
  function replaceDefault() {
    setMenu(null);
    if (body.trim() && !window.confirm(t('promptReplaceConfirm'))) return;
    setBody(DEFAULT_STYLE_PROMPT);
  }
  function toggleMenu(kind: 'new' | 'more', trigger: HTMLButtonElement) {
    menuTrigger.current = trigger;
    setMenu(menu === kind ? null : kind);
  }
  function menuKeys(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation(); setMenu(null); menuTrigger.current?.focus();
    } else if (e.key === 'Tab') setMenu(null);
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const items = Array.from(menuPanel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
      const current = items.indexOf(e.target as HTMLButtonElement);
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1
        : Math.max(0, Math.min(items.length - 1, current + (e.key === 'ArrowDown' ? 1 : -1)));
      items[next]?.focus();
    }
  }
  const rows = [
    { id: DEFAULT_PROMPT_ID, name: t('promptDefault') },
    ...settings.templates,
    ...(isNew ? [{ id: selected, name: name.trim() || t('promptCustom') }] : []),
  ];

  return (
    <div>
      <div class="ap-prompt-workbench" onKeyDown={(e) => { if (menu) menuKeys(e); }}>
        <aside class="ap-prompt-library" aria-label={t('promptLibrary')}>
          <div class="ap-prompt-library-head">
            <h3 class="text-xs font-semibold text-ap-muted">{t('promptLibrary')}</h3>
            <div class="relative">
              <button type="button" class="ap-prompt-new" disabled={busy || full} title={full ? limitMessage : t('promptNew')}
                aria-label={t('promptNew')} aria-haspopup="menu" aria-expanded={menu === 'new'} aria-controls={menu === 'new' ? `${uid}-new` : undefined}
                onClick={(e) => toggleMenu('new', e.currentTarget)}><Plus size={13} />{t('promptNew')}</button>
              {menu === 'new' && <div ref={menuPanel} id={`${uid}-new`} role="menu" aria-label={t('promptNew')} class="ap-prompt-menu ap-prompt-menu-new">
                <button type="button" role="menuitem" onClick={() => create('default')}><Copy size={14} />{t('promptFromDefault')}</button>
                <button type="button" role="menuitem" onClick={() => create('blank')}><FileText size={14} />{t('promptBlank')}</button>
              </div>}
            </div>
          </div>
          <div class="ap-prompt-list" role="group" aria-label={t('promptLibrary')}>
            {rows.map((row) => <button key={row.id} type="button" aria-pressed={selected === row.id} disabled={busy}
              class="ap-prompt-row" onClick={() => choose(row.id)}
              aria-label={`${row.name}${row.id === settings.activeId ? ` · ${t('promptInUse')}` : ''}`}>
              {row.id === DEFAULT_PROMPT_ID ? <Lock size={14} /> : <FileText size={14} />}
              <span class="min-w-0 flex-1 truncate text-left">{row.name}</span>
              {row.id === selected && dirty ? <span class="ap-prompt-draft-dot" title={t('promptDraft')} />
                : row.id === settings.activeId && <Check size={13} class="text-ap-success" />}
            </button>)}
          </div>
          <div class="ap-prompt-current">
            <span class="text-xs text-ap-muted">{t('promptActive')}</span>
            <span class="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium"><Check size={12} class="shrink-0 text-ap-success" /><span class="truncate">{activeName}</span></span>
          </div>
        </aside>

        <section class="ap-prompt-editor">
          <header class="ap-prompt-editor-head">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <h3 class="max-w-full truncate text-sm font-semibold">{title}</h3>
              {builtin && <span class="ap-prompt-badge"><Lock size={10} />{t('promptReadOnlyBadge')}</span>}
              {dirty ? <span class="ap-prompt-badge ap-prompt-badge-draft">{t(isNew ? 'promptDraft' : 'promptUnsavedChanges')}</span>
                : active && <span class="ap-prompt-badge ap-prompt-badge-active"><Check size={11} />{t('promptInUse')}</span>}
            </div>
            {!builtin && <div class="relative ml-auto shrink-0">
              <button type="button" class="ap-prompt-more" aria-label={t('promptMore')} title={t('promptMore')} disabled={busy}
                aria-haspopup="menu" aria-expanded={menu === 'more'} aria-controls={menu === 'more' ? `${uid}-more` : undefined}
                onClick={(e) => toggleMenu('more', e.currentTarget)}><Ellipsis size={18} /></button>
              {menu === 'more' && <div ref={menuPanel} id={`${uid}-more`} role="menu" aria-label={t('promptMore')} class="ap-prompt-menu">
                {dirty && !active && <button type="button" role="menuitem" disabled={!valid} onClick={() => save(false)}><Check size={14} />{t('promptSaveOnly')}</button>}
                {saved && <button type="button" role="menuitem" disabled={full} title={full ? limitMessage : undefined} onClick={() => create('copy')}><Copy size={14} />{t('promptCopy')}</button>}
                {body !== DEFAULT_STYLE_PROMPT && <button type="button" role="menuitem" onClick={replaceDefault}><RotateCcw size={14} />{t('promptReplaceDefault')}</button>}
                {saved && <button type="button" role="menuitem" class="ap-prompt-delete" onClick={remove}><Trash2 size={14} />{t('promptDelete')}</button>}
              </div>}
            </div>}
          </header>
          <div class="ap-prompt-fields">
            {!builtin && <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-ap-muted">{t('promptName')}</span>
              <input ref={nameField} value={name} maxLength={MAX_PROMPT_NAME} disabled={busy}
                class="h-9 w-full rounded-lg border border-ap-border bg-ap-surface px-3 text-sm text-ap-fg focus:border-ap-brand focus:outline-none"
                onInput={(e) => setName(e.currentTarget.value)} />
            </label>}
            <label class="mt-4 block">
              <span class="mb-2 flex items-center justify-between gap-2 text-xs text-ap-muted">
                <span class="font-medium">{t('promptBody')}</span>
                <span aria-hidden="true" class="tabular-nums">{body.length.toLocaleString()} / {MAX_PROMPT_LENGTH.toLocaleString()}</span>
              </span>
              <textarea value={body} readOnly={builtin} disabled={busy} maxLength={MAX_PROMPT_LENGTH} rows={9} spellcheck={false} dir="auto"
                aria-label={t('promptBody')} class={cn('ap-prompt-textarea', builtin && 'ap-prompt-readonly')}
                onInput={(e) => setBody(e.currentTarget.value)} />
            </label>
            <div class="ap-prompt-help mt-3 space-y-1 text-xs leading-relaxed text-ap-muted">
              {builtin && <p>{t('promptReadOnly')}</p>}
              <p>{t('promptHint')}</p>
            </div>
            {error && <p role="alert" class="mt-2 text-xs text-ap-danger">{t('promptSaveFailed')}</p>}
          </div>
          <footer class="ap-prompt-footer">
            <p class="min-w-0 flex-1 text-xs leading-relaxed text-ap-muted">
              {full && isNew ? limitMessage : dirty && !valid ? t('promptRequired') : !dirty && !builtin
                ? <span class="inline-flex items-center gap-1 text-ap-success"><Check size={12} />{t('promptSaved')}</span> : t('promptScope')}
            </p>
            <div class="flex flex-wrap items-center gap-2">
              {dirty && <Button variant="secondary" size="sm" disabled={busy} onClick={cancel}>{t('promptCancel')}</Button>}
              {dirty && <Button size="sm" disabled={busy || !valid || (isNew && full)} onClick={() => save(true)}>
                {busy ? t('loading') : t(active ? 'promptSaveChanges' : 'promptSaveActivate')}
              </Button>}
              {!dirty && <Button size="sm" disabled={busy || active} onClick={() => {
                if (!active && !busy) void persist({ ...settings, activeId: selected });
              }}>
                {busy ? t('loading') : t('promptUse')}
              </Button>}
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
