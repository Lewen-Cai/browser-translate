import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'preact/hooks';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { PromptPanel } from './PromptPanel';
import { defaultPromptSettings, MAX_PROMPT_TEMPLATES, type PromptSettings } from '~/core/prompt/templates';
import { DEFAULT_STYLE_PROMPT } from '~/core/prompt/style';
import { useAppStore } from '~/storage/store';
import { createDefaultAppData } from '~/storage/defaults';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const academic = { id: 'academic', name: 'Academic', body: 'Use academic terminology.' };

function open(initial = defaultPromptSettings(), onSave?: () => Promise<void>) {
  const data = createDefaultAppData();
  data.settings.uiLanguage = 'en';
  useAppStore.setState({ data });
  const changes = vi.fn();
  function Harness() {
    const [settings, setSettings] = useState<PromptSettings>(initial);
    return <PromptPanel settings={settings} onChange={async (next) => { changes(next); await onSave?.(); setSettings(next); }} />;
  }
  render(<Harness />);
  return changes;
}
const instructions = () => screen.getByRole('textbox', { name: 'Base instructions' }) as HTMLTextAreaElement;
const row = (name: string) => within(screen.getByRole('group', { name: 'Templates' })).getByRole('button', { name });
function createFromDefault() {
  fireEvent.click(screen.getByRole('button', { name: 'New', exact: true }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Create from default' }));
}
function action(name: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Template actions' }));
  fireEvent.click(screen.getByRole('menuitem', { name }));
}

describe('PromptPanel workspace', () => {
  it('keeps explanation inside the card and offers only Apply Prompt in the default footer', () => {
    const changes = open();
    expect(instructions().readOnly).toBe(true);
    expect(instructions().value).toBe(DEFAULT_STYLE_PROMPT);
    expect(row('Default · In use').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Read-only')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'In use' })).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Create from default' })).toBeNull();
    expect(screen.queryByText('How base prompts work')).toBeNull();
    expect(screen.getByText(/Choose one base template/).closest('.ap-prompt-workbench')).not.toBeNull();
    const apply = screen.getByRole('button', { name: 'Apply Prompt' }) as HTMLButtonElement;
    expect(apply.disabled).toBe(true);
    fireEvent.click(apply);
    expect(changes).not.toHaveBeenCalled();
    expect(screen.queryByText(/OUTPUT PROTOCOL/)).toBeNull();
  });

  it('creates from default and saves/activates in one write', async () => {
    const changes = open();
    createFromDefault();
    expect(instructions().value).toBe(DEFAULT_STYLE_PROMPT);
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Template name' }));
    fireEvent.input(screen.getByLabelText('Template name'), { target: { value: 'Academic' } });
    fireEvent.input(instructions(), { target: { value: academic.body } });
    expect(changes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save & apply' }));
    await waitFor(() => expect(screen.getByText('Changes saved')).not.toBeNull());
    expect(changes).toHaveBeenCalledTimes(1);
    const saved = changes.mock.calls[0]![0] as PromptSettings;
    expect(saved.activeId).toBe(saved.templates[0]!.id);
    expect(saved.templates[0]).toMatchObject({ name: 'Academic', body: academic.body });
  });

  it('offers a clearly named blank draft, required-field hint and cancellation', () => {
    const changes = open();
    fireEvent.click(screen.getByRole('button', { name: 'New', exact: true }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Start from scratch' }));
    expect(instructions().value).toBe('');
    expect((screen.getByRole('button', { name: 'Save & apply' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Add a name and instructions to save.')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(instructions().readOnly).toBe(true);
    expect(changes).not.toHaveBeenCalled();
  });

  it('selects without activation and supports saving for later from the menu', async () => {
    const changes = open({ activeId: 'default', templates: [academic] });
    fireEvent.click(row('Academic'));
    expect(changes).not.toHaveBeenCalled();
    fireEvent.input(instructions(), { target: { value: 'New instructions.' } });
    action('Save without applying');
    await screen.findByRole('button', { name: 'Apply Prompt' });
    expect(changes.mock.calls[0]![0]).toMatchObject({ activeId: 'default', templates: [{ body: 'New instructions.' }] });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Prompt' }));
    await waitFor(() => expect(changes).toHaveBeenCalledTimes(2));
    expect(changes.mock.calls[1]![0].activeId).toBe('academic');
  });

  it('uses Save changes for the active template and confirms switching away from edits', async () => {
    const changes = open({ activeId: 'academic', templates: [academic] });
    fireEvent.input(instructions(), { target: { value: 'Edited active instructions.' } });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(row('Default'));
    expect(instructions().value).toBe('Edited active instructions.');
    expect(row('Academic · In use').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.getByText('Changes saved')).not.toBeNull());
    expect(changes.mock.calls[0]![0].activeId).toBe('academic');
    expect(changes.mock.calls[0]![0].templates[0].body).toBe('Edited active instructions.');
  });

  it('duplicates edited content into a new uniquely named draft without mutating the original', () => {
    const changes = open({ activeId: 'academic', templates: [academic] });
    fireEvent.input(instructions(), { target: { value: 'Keep this unsaved text in the copy.' } });
    action('Duplicate current template');
    expect((screen.getByLabelText('Template name') as HTMLInputElement).value).toBe('Academic 2');
    expect(instructions().value).toBe('Keep this unsaved text in the copy.');
    expect(changes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(instructions().value).toBe('Keep this unsaved text in the copy.');
    expect(row('Academic · In use').getAttribute('aria-pressed')).toBe('true');
  });

  it('replaces draft content only after confirmation and deletes active templates safely', async () => {
    const changes = open({ activeId: 'academic', templates: [academic] });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    action('Replace draft with default text');
    expect(instructions().value).toBe(academic.body);
    confirm.mockReturnValue(true);
    action('Replace draft with default text');
    expect(instructions().value).toBe(DEFAULT_STYLE_PROMPT);
    expect(changes).not.toHaveBeenCalled();
    action('Delete');
    await waitFor(() => expect(instructions().readOnly).toBe(true));
    expect(changes).toHaveBeenLastCalledWith(defaultPromptSettings());
  });

  it('retains the draft and active choice when saving fails', async () => {
    open(defaultPromptSettings(), async () => { throw new Error('storage unavailable'); });
    createFromDefault();
    fireEvent.input(instructions(), { target: { value: 'Do not lose my draft.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save & apply' }));
    await screen.findByRole('alert');
    expect(instructions().value).toBe('Do not lose my draft.');
    expect(row('Default · In use')).not.toBeNull();
    expect((screen.getByRole('button', { name: 'Save & apply' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('supports menu arrows and Escape with focus return', () => {
    open();
    const trigger = screen.getByRole('button', { name: 'New', exact: true });
    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Create from default' }));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Start from scratch' }));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps existing templates editable when the creation limit is reached', () => {
    open({ activeId: 'default', templates: Array.from({ length: MAX_PROMPT_TEMPLATES }, (_, i) => ({ ...academic, id: String(i), name: `Template ${i}` })) });
    expect((screen.getByRole('button', { name: 'New', exact: true }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(row('Template 0'));
    expect(instructions().readOnly).toBe(false);
  });
});
