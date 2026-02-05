import type { Annotation, ToolbarSettings } from '../types';

const STORAGE_KEY_PREFIX = 'agent-feedback';

export function getStorageKey(pathname: string): string {
  return `${STORAGE_KEY_PREFIX}:${pathname}`;
}

export async function saveAnnotations(
  pathname: string,
  annotations: Annotation[]
): Promise<void> {
  const key = getStorageKey(pathname);
  await chrome.storage.local.set({ [key]: annotations });
}

export async function loadAnnotations(pathname: string): Promise<Annotation[]> {
  const key = getStorageKey(pathname);
  const result = await chrome.storage.local.get(key);
  return result[key] || [];
}

export async function saveSettings(settings: ToolbarSettings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

export async function loadSettings(): Promise<ToolbarSettings | null> {
  const result = await chrome.storage.local.get('settings');
  return result.settings || null;
}

export async function getExtensionState(): Promise<boolean> {
  const result = await chrome.storage.local.get('extensionActive');
  return result.extensionActive ?? false;
}

export async function setExtensionState(active: boolean): Promise<void> {
  await chrome.storage.local.set({ extensionActive: active });
}
