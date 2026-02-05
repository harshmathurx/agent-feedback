# AgentFeedback Browser Extension Implementation Plan

> **Implementation Guide:** This is a complete implementation plan for building a browser extension from scratch. Follow each task sequentially. The extension will have the same UI/UX as the agentation npm package but written in vanilla TypeScript.

**Goal:** Build a Chrome/Firefox browser extension that lets users annotate any website and copy structured feedback optimized for AI coding agents.

**Architecture:** Content script injected into all pages using Shadow DOM for style isolation. Vanilla TypeScript UI (no React). Chrome extension APIs for storage and messaging. Supports 4 output detail levels: compact, standard, detailed, forensic.

**Tech Stack:** TypeScript, SCSS, esbuild, Chrome Extension Manifest V3, Shadow DOM

**Source Reference:** Copy SCSS styles from `/Users/harsh.rajmathur/Desktop/harsh-builds/agentation/_package-export/src/components/page-toolbar-css/styles.module.scss`

---

## Task 1: Project Setup & Extension Scaffold

**Files:**
- Create: `agent-feedback-extension/package.json`
- Create: `agent-feedback-extension/tsconfig.json`
- Create: `agent-feedback-extension/manifest.json`
- Create: `agent-feedback-extension/.gitignore`
- Create: `agent-feedback-extension/esbuild.config.js`

**Step 1: Initialize project directory**

```bash
mkdir agent-feedback-extension
cd agent-feedback-extension
npm init -y
```

**Step 2: Install dependencies**

```bash
npm install --save-dev \
  typescript \
  esbuild \
  esbuild-sass-plugin \
  @types/chrome \
  sass
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM"],
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

**Step 4: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "AgentFeedback",
  "description": "Visual feedback tool for AI agents - annotate any website",
  "version": "0.1.0",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "Toggle AgentFeedback"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_end",
      "all_frames": false
    }
  ],
  "commands": {
    "toggle-agentation": {
      "suggested_key": {
        "default": "Ctrl+Shift+A",
        "mac": "Command+Shift+A"
      },
      "description": "Toggle annotation toolbar"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": []
}
```

**Step 5: Create esbuild.config.js**

```javascript
const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: {
    content: './src/content/index.ts',
    background: './src/background/service-worker.ts',
  },
  bundle: true,
  outdir: './build',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: !watch,
  plugins: [sassPlugin()],
};

if (watch) {
  esbuild.context(buildOptions).then(ctx => {
    ctx.watch();
    console.log('👀 Watching for changes...');
  });
} else {
  esbuild.build(buildOptions).then(() => {
    console.log('✅ Build complete');
  });
}
```

**Step 6: Create .gitignore**

```
node_modules/
build/
*.log
.DS_Store
```

**Step 7: Add build scripts to package.json**

Update the `"scripts"` section in package.json:

```json
{
  "scripts": {
    "build": "node esbuild.config.js",
    "watch": "node esbuild.config.js --watch",
    "clean": "rm -rf build"
  }
}
```

**Step 8: Create directory structure**

```bash
mkdir -p src/content src/background src/utils src/styles icons
```

**Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: initial extension scaffold with build setup"
```

---

## Task 2: Copy Styles from Agentation

**Files:**
- Copy: `/Users/harsh.rajmathur/Desktop/harsh-builds/agentation/_package-export/src/components/page-toolbar-css/styles.module.scss` → `src/styles/toolbar.scss`
- Create: `src/styles/shadow-host.scss`

**Step 1: Copy the SCSS file**

```bash
cp /Users/harsh.rajmathur/Desktop/harsh-builds/agentation/_package-export/src/components/page-toolbar-css/styles.module.scss src/styles/toolbar.scss
```

**Step 2: Create shadow-host.scss for Shadow DOM reset**

Create `src/styles/shadow-host.scss`:

```scss
// Shadow DOM host styles - ensures clean slate
:host {
  all: initial;
  display: contents;
}

* {
  box-sizing: border-box;
}
```

**Step 3: Verify styles copied**

```bash
ls -lh src/styles/
```

Expected: Should see `toolbar.scss` (should be ~30-50KB based on agentation's styles)

**Step 4: Commit**

```bash
git add src/styles/
git commit -m "feat: copy SCSS styles from agentation npm package"
```

---

## Task 3: Type Definitions

**Files:**
- Create: `src/types/index.ts`

**Step 1: Create type definitions**

Create `src/types/index.ts`:

```typescript
export type Annotation = {
  id: string;
  x: number; // % of viewport width
  y: number; // px from top (viewport if fixed)
  comment: string;
  element: string; // e.g., "Button"
  elementPath: string; // e.g., "body > div > button"
  timestamp: number;

  // Optional metadata
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  nearbyElements?: string;
  computedStyles?: string;
  fullPath?: string;
  accessibility?: string;
  isMultiSelect?: boolean;
  isFixed?: boolean;
};

export type OutputDetailLevel = "compact" | "standard" | "detailed" | "forensic";

export type ToolbarSettings = {
  outputDetail: OutputDetailLevel;
  autoClearAfterCopy: boolean;
  annotationColor: string;
  blockInteractions: boolean;
};

export type AnnotationMode = "click" | "text" | "multiselect" | "area";

export const DEFAULT_SETTINGS: ToolbarSettings = {
  outputDetail: "standard",
  autoClearAfterCopy: false,
  annotationColor: "#3c82f7",
  blockInteractions: false,
};
```

**Step 2: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 4: Storage Utilities

**Files:**
- Create: `src/utils/storage.ts`

**Step 1: Create storage wrapper for Chrome storage API**

Create `src/utils/storage.ts`:

```typescript
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
```

**Step 2: Commit**

```bash
git add src/utils/storage.ts
git commit -m "feat: add Chrome storage utilities"
```

---

## Task 5: Element Identification Utilities

**Files:**
- Create: `src/utils/element-identification.ts`

**Step 1: Create element identification utilities**

Create `src/utils/element-identification.ts`:

```typescript
export function identifyElement(element: Element): string {
  return element.tagName.toLowerCase();
}

export function getElementPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    // Add ID if present
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break; // ID is unique, stop here
    }

    // Add first class if present
    if (current.classList.length > 0) {
      selector += `.${current.classList[0]}`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.length > 0 ? path.join(' > ') : 'unknown';
}

export function getFullElementPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
    }

    if (current.classList.length > 0) {
      selector += `.${Array.from(current.classList).join('.')}`;
    }

    path.unshift(selector);

    if (current === document.documentElement) break;
    current = current.parentElement;
  }

  return path.join(' > ');
}

export function getNearbyText(element: Element): string {
  const text = element.textContent?.trim() || '';
  return text.slice(0, 100);
}

export function getElementClasses(element: Element): string {
  return Array.from(element.classList).join(' ');
}

export function getAccessibilityInfo(element: Element): string {
  const info: string[] = [];

  const role = element.getAttribute('role');
  if (role) info.push(`role=${role}`);

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) info.push(`aria-label=${ariaLabel}`);

  const ariaDescribedBy = element.getAttribute('aria-describedby');
  if (ariaDescribedBy) info.push(`aria-describedby=${ariaDescribedBy}`);

  return info.join(', ');
}

export function getNearbyElements(element: Element): string {
  const nearby: string[] = [];

  // Previous sibling
  if (element.previousElementSibling) {
    nearby.push(`<${identifyElement(element.previousElementSibling)}>`);
  }

  // Next sibling
  if (element.nextElementSibling) {
    nearby.push(`<${identifyElement(element.nextElementSibling)}>`);
  }

  return nearby.join(', ');
}

export function getDetailedComputedStyles(element: Element): string {
  const computed = window.getComputedStyle(element);
  const important = [
    'display',
    'position',
    'width',
    'height',
    'background-color',
    'color',
    'font-size',
    'padding',
    'margin',
  ];

  return important
    .map(prop => `${prop}: ${computed.getPropertyValue(prop)}`)
    .join('; ');
}

export function getForensicComputedStyles(element: Element): string {
  const computed = window.getComputedStyle(element);
  const allProps: string[] = [];

  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    allProps.push(`${prop}: ${computed.getPropertyValue(prop)}`);
  }

  return allProps.join('; ');
}
```

**Step 2: Commit**

```bash
git add src/utils/element-identification.ts
git commit -m "feat: add element identification utilities"
```

---

## Task 6: Output Generator

**Files:**
- Create: `src/utils/output-generator.ts`

**Step 1: Create output generator with 4 detail levels**

Create `src/utils/output-generator.ts`:

```typescript
import type { Annotation, OutputDetailLevel } from '../types';

export function generateOutput(
  annotations: Annotation[],
  pathname: string,
  detailLevel: OutputDetailLevel = "standard"
): string {
  if (annotations.length === 0) return "";

  const viewport = `${window.innerWidth}×${window.innerHeight}`;

  let output = `## Page Feedback: ${pathname}\n`;

  if (detailLevel === "forensic") {
    // Full environment info for forensic mode
    output += `\n**Environment:**\n`;
    output += `- Viewport: ${viewport}\n`;
    output += `- URL: ${window.location.href}\n`;
    output += `- User Agent: ${navigator.userAgent}\n`;
    output += `- Timestamp: ${new Date().toISOString()}\n`;
    output += `- Device Pixel Ratio: ${window.devicePixelRatio}\n`;
    output += `\n---\n`;
  } else if (detailLevel !== "compact") {
    output += `**Viewport:** ${viewport}\n`;
  }
  output += "\n";

  annotations.forEach((a, i) => {
    if (detailLevel === "compact") {
      output += `${i + 1}. **${a.element}**: ${a.comment}`;
      if (a.selectedText) {
        output += ` (re: "${a.selectedText.slice(0, 30)}${a.selectedText.length > 30 ? "..." : ""}")`;
      }
      output += "\n";
    } else if (detailLevel === "forensic") {
      // Forensic mode - maximum detail
      output += `### ${i + 1}. ${a.element}\n`;
      if (a.isMultiSelect && a.fullPath) {
        output += `*Forensic data shown for first element of selection*\n`;
      }
      if (a.fullPath) {
        output += `**Full DOM Path:** ${a.fullPath}\n`;
      }
      if (a.cssClasses) {
        output += `**CSS Classes:** ${a.cssClasses}\n`;
      }
      if (a.boundingBox) {
        output += `**Position:** x:${Math.round(a.boundingBox.x)}, y:${Math.round(a.boundingBox.y)} (${Math.round(a.boundingBox.width)}×${Math.round(a.boundingBox.height)}px)\n`;
      }
      output += `**Annotation at:** ${a.x.toFixed(1)}% from left, ${Math.round(a.y)}px from top\n`;
      if (a.selectedText) {
        output += `**Selected text:** "${a.selectedText}"\n`;
      }
      if (a.nearbyText && !a.selectedText) {
        output += `**Context:** ${a.nearbyText.slice(0, 100)}\n`;
      }
      if (a.computedStyles) {
        output += `**Computed Styles:** ${a.computedStyles}\n`;
      }
      if (a.accessibility) {
        output += `**Accessibility:** ${a.accessibility}\n`;
      }
      if (a.nearbyElements) {
        output += `**Nearby Elements:** ${a.nearbyElements}\n`;
      }
      output += `**Feedback:** ${a.comment}\n\n`;
    } else {
      // Standard and detailed modes
      output += `### ${i + 1}. ${a.element}\n`;
      output += `**Location:** ${a.elementPath}\n`;

      if (detailLevel === "detailed") {
        if (a.cssClasses) {
          output += `**Classes:** ${a.cssClasses}\n`;
        }

        if (a.boundingBox) {
          output += `**Position:** ${Math.round(a.boundingBox.x)}px, ${Math.round(a.boundingBox.y)}px (${Math.round(a.boundingBox.width)}×${Math.round(a.boundingBox.height)}px)\n`;
        }
      }

      if (a.selectedText) {
        output += `**Selected text:** "${a.selectedText}"\n`;
      }

      if (detailLevel === "detailed" && a.nearbyText && !a.selectedText) {
        output += `**Context:** ${a.nearbyText.slice(0, 100)}\n`;
      }

      output += `**Feedback:** ${a.comment}\n\n`;
    }
  });

  return output.trim();
}
```

**Step 2: Commit**

```bash
git add src/utils/output-generator.ts
git commit -m "feat: add output generator with 4 detail levels"
```

---

## Task 7: Shadow DOM Setup

**Files:**
- Create: `src/content/shadow-dom.ts`

**Step 1: Create Shadow DOM manager**

Create `src/content/shadow-dom.ts`:

```typescript
import toolbarStyles from '../styles/toolbar.scss';
import shadowHostStyles from '../styles/shadow-host.scss';

export class ShadowDOMContainer {
  private hostElement: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private containerElement: HTMLDivElement;

  constructor() {
    // Create host element
    this.hostElement = document.createElement('div');
    this.hostElement.id = 'agent-feedback-host';

    // Attach shadow root
    this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });

    // Create style element
    const style = document.createElement('style');
    style.textContent = shadowHostStyles + '\n' + toolbarStyles;
    this.shadowRoot.appendChild(style);

    // Create container for toolbar
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'agentation-container';
    this.shadowRoot.appendChild(this.containerElement);

    // Append to body
    document.body.appendChild(this.hostElement);
  }

  getContainer(): HTMLDivElement {
    return this.containerElement;
  }

  getShadowRoot(): ShadowRoot {
    return this.shadowRoot;
  }

  destroy(): void {
    this.hostElement.remove();
  }
}
```

**Step 2: Commit**

```bash
git add src/content/shadow-dom.ts
git commit -m "feat: add Shadow DOM container manager"
```

---

## Task 8: Background Service Worker

**Files:**
- Create: `src/background/service-worker.ts`

**Step 1: Create service worker for extension icon and keyboard shortcuts**

Create `src/background/service-worker.ts`:

```typescript
import { getExtensionState, setExtensionState } from '../utils/storage';

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  const currentState = await getExtensionState();
  const newState = !currentState;
  await setExtensionState(newState);

  // Update icon
  chrome.action.setIcon({
    path: {
      16: newState ? 'icons/icon16.png' : 'icons/icon16-inactive.png',
      48: newState ? 'icons/icon48.png' : 'icons/icon48-inactive.png',
      128: newState ? 'icons/icon128.png' : 'icons/icon128-inactive.png',
    },
  });

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_EXTENSION', active: newState });
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-agentation') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    const currentState = await getExtensionState();
    const newState = !currentState;
    await setExtensionState(newState);

    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_EXTENSION', active: newState });
  }
});

// Initialize icon state on install
chrome.runtime.onInstalled.addListener(async () => {
  const state = await getExtensionState();
  chrome.action.setIcon({
    path: {
      16: state ? 'icons/icon16.png' : 'icons/icon16-inactive.png',
      48: state ? 'icons/icon48.png' : 'icons/icon48-inactive.png',
      128: state ? 'icons/icon128.png' : 'icons/icon128-inactive.png',
    },
  });
});
```

**Step 2: Commit**

```bash
git add src/background/service-worker.ts
git commit -m "feat: add background service worker for icon and shortcuts"
```

---

## Task 9: Toolbar UI Manager (Part 1 - Structure)

**Files:**
- Create: `src/content/toolbar.ts`

**Step 1: Create toolbar class with basic structure**

Create `src/content/toolbar.ts`:

```typescript
import type { Annotation, ToolbarSettings, AnnotationMode } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { saveAnnotations, loadAnnotations, saveSettings, loadSettings } from '../utils/storage';
import { generateOutput } from '../utils/output-generator';

export class Toolbar {
  private container: HTMLDivElement;
  private annotations: Annotation[] = [];
  private settings: ToolbarSettings = DEFAULT_SETTINGS;
  private isActive: boolean = false;
  private currentMode: AnnotationMode = 'click';
  private isDarkMode: boolean = false;
  private showSettings: boolean = false;

  // UI elements
  private toolbarElement: HTMLDivElement | null = null;
  private toggleButton: HTMLDivElement | null = null;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.detectDarkMode();
    this.init();
  }

  private detectDarkMode(): void {
    this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private async init(): Promise<void> {
    // Load saved settings
    const savedSettings = await loadSettings();
    if (savedSettings) {
      this.settings = savedSettings;
    }

    // Load annotations for current page
    this.annotations = await loadAnnotations(window.location.pathname);

    // Create toggle button
    this.createToggleButton();
  }

  private createToggleButton(): void {
    this.toggleButton = document.createElement('div');
    this.toggleButton.className = 'agentation-toggle-button';
    this.toggleButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;
    this.toggleButton.addEventListener('click', () => this.toggle());
    this.container.appendChild(this.toggleButton);
  }

  public toggle(): void {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  public activate(): void {
    this.isActive = true;
    if (this.toggleButton) {
      this.toggleButton.style.display = 'none';
    }
    this.createToolbar();
  }

  public deactivate(): void {
    this.isActive = false;
    if (this.toolbarElement) {
      this.toolbarElement.remove();
      this.toolbarElement = null;
    }
    if (this.toggleButton) {
      this.toggleButton.style.display = 'block';
    }
  }

  private createToolbar(): void {
    // Will implement in next step
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = 'agentation-toolbar';
    this.toolbarElement.innerHTML = '<div>Toolbar placeholder</div>';
    this.container.appendChild(this.toolbarElement);
  }

  public destroy(): void {
    if (this.toggleButton) {
      this.toggleButton.remove();
    }
    if (this.toolbarElement) {
      this.toolbarElement.remove();
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/content/toolbar.ts
git commit -m "feat: add toolbar UI manager basic structure"
```

---

## Task 10: Toolbar UI Manager (Part 2 - Full Toolbar HTML)

**Files:**
- Modify: `src/content/toolbar.ts`

**Step 1: Replace createToolbar method with full implementation**

In `src/content/toolbar.ts`, replace the `createToolbar()` method:

```typescript
private createToolbar(): void {
  this.toolbarElement = document.createElement('div');
  this.toolbarElement.className = `agentation-toolbar ${this.isDarkMode ? 'dark' : 'light'}`;

  this.toolbarElement.innerHTML = `
    <div class="toolbar-header">
      <div class="toolbar-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>

      <div class="toolbar-modes">
        <button class="mode-button active" data-mode="click" title="Click to annotate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 12L12 22L22 12L12 2Z" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button class="mode-button" data-mode="text" title="Select text">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 7V4H20V7" stroke="currentColor" stroke-width="2"/>
            <path d="M12 4V20" stroke="currentColor" stroke-width="2"/>
            <path d="M9 20H15" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button class="mode-button" data-mode="multiselect" title="Multi-select">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" stroke="currentColor" stroke-width="2"/>
            <rect x="13" y="13" width="8" height="8" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button class="mode-button" data-mode="area" title="Select area">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-actions">
        <button class="action-button" id="clear-btn" title="Clear all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button class="action-button" id="copy-btn" title="Copy feedback">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="13" height="13" stroke="currentColor" stroke-width="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button class="action-button" id="settings-btn" title="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button class="action-button" id="close-btn" title="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>

      <div class="annotation-count">
        <span>${this.annotations.length}</span>
      </div>
    </div>

    <div class="settings-panel" style="display: ${this.showSettings ? 'block' : 'none'}">
      <div class="settings-section">
        <label>Output Detail</label>
        <div class="output-detail-selector">
          <button class="detail-option ${this.settings.outputDetail === 'compact' ? 'active' : ''}" data-level="compact">Compact</button>
          <button class="detail-option ${this.settings.outputDetail === 'standard' ? 'active' : ''}" data-level="standard">Standard</button>
          <button class="detail-option ${this.settings.outputDetail === 'detailed' ? 'active' : ''}" data-level="detailed">Detailed</button>
          <button class="detail-option ${this.settings.outputDetail === 'forensic' ? 'active' : ''}" data-level="forensic">Forensic</button>
        </div>
      </div>

      <div class="settings-section">
        <label>Marker Color</label>
        <div class="color-options">
          ${this.renderColorOptions()}
        </div>
      </div>

      <div class="settings-section">
        <label class="checkbox-label">
          <input type="checkbox" id="auto-clear-checkbox" ${this.settings.autoClearAfterCopy ? 'checked' : ''}>
          <span>Auto-clear after copy</span>
        </label>
      </div>
    </div>
  `;

  this.container.appendChild(this.toolbarElement);
  this.attachEventListeners();
}

private renderColorOptions(): string {
  const colors = [
    { value: '#AF52DE', label: 'Purple' },
    { value: '#3c82f7', label: 'Blue' },
    { value: '#5AC8FA', label: 'Cyan' },
    { value: '#34C759', label: 'Green' },
    { value: '#FFD60A', label: 'Yellow' },
    { value: '#FF9500', label: 'Orange' },
    { value: '#FF3B30', label: 'Red' },
  ];

  return colors
    .map(
      color => `
      <button
        class="color-option ${this.settings.annotationColor === color.value ? 'active' : ''}"
        data-color="${color.value}"
        style="background-color: ${color.value}"
        title="${color.label}"
      ></button>
    `
    )
    .join('');
}

private attachEventListeners(): void {
  if (!this.toolbarElement) return;

  // Mode buttons
  this.toolbarElement.querySelectorAll('.mode-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = (e.currentTarget as HTMLElement).dataset.mode as AnnotationMode;
      this.setMode(mode);
    });
  });

  // Close button
  this.toolbarElement.querySelector('#close-btn')?.addEventListener('click', () => {
    this.deactivate();
  });

  // Settings button
  this.toolbarElement.querySelector('#settings-btn')?.addEventListener('click', () => {
    this.toggleSettings();
  });

  // Clear button
  this.toolbarElement.querySelector('#clear-btn')?.addEventListener('click', () => {
    this.clearAll();
  });

  // Copy button
  this.toolbarElement.querySelector('#copy-btn')?.addEventListener('click', () => {
    this.copyToClipboard();
  });

  // Output detail buttons
  this.toolbarElement.querySelectorAll('.detail-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const level = (e.currentTarget as HTMLElement).dataset.level as any;
      this.setOutputDetail(level);
    });
  });

  // Color options
  this.toolbarElement.querySelectorAll('.color-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const color = (e.currentTarget as HTMLElement).dataset.color!;
      this.setAnnotationColor(color);
    });
  });

  // Auto-clear checkbox
  this.toolbarElement.querySelector('#auto-clear-checkbox')?.addEventListener('change', (e) => {
    this.settings.autoClearAfterCopy = (e.target as HTMLInputElement).checked;
    saveSettings(this.settings);
  });
}

private setMode(mode: AnnotationMode): void {
  this.currentMode = mode;

  // Update button states
  this.toolbarElement?.querySelectorAll('.mode-button').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === mode);
  });
}

private toggleSettings(): void {
  this.showSettings = !this.showSettings;
  const panel = this.toolbarElement?.querySelector('.settings-panel') as HTMLElement;
  if (panel) {
    panel.style.display = this.showSettings ? 'block' : 'none';
  }
}

private setOutputDetail(level: string): void {
  this.settings.outputDetail = level as any;
  saveSettings(this.settings);

  // Update button states
  this.toolbarElement?.querySelectorAll('.detail-option').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.level === level);
  });
}

private setAnnotationColor(color: string): void {
  this.settings.annotationColor = color;
  saveSettings(this.settings);

  // Update button states
  this.toolbarElement?.querySelectorAll('.color-option').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.color === color);
  });
}

private clearAll(): void {
  this.annotations = [];
  saveAnnotations(window.location.pathname, this.annotations);
  this.updateAnnotationCount();
  // TODO: Remove annotation markers from page
}

private async copyToClipboard(): Promise<void> {
  const output = generateOutput(this.annotations, window.location.pathname, this.settings.outputDetail);

  try {
    await navigator.clipboard.writeText(output);
    // TODO: Show success feedback

    if (this.settings.autoClearAfterCopy) {
      setTimeout(() => this.clearAll(), 500);
    }
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

private updateAnnotationCount(): void {
  const countEl = this.toolbarElement?.querySelector('.annotation-count span');
  if (countEl) {
    countEl.textContent = String(this.annotations.length);
  }
}
```

**Step 2: Commit**

```bash
git add src/content/toolbar.ts
git commit -m "feat: implement full toolbar UI with settings panel"
```

---

## Task 11: Click Annotation Mode

**Files:**
- Modify: `src/content/toolbar.ts`
- Create: `src/content/annotator.ts`

**Step 1: Create annotator class**

Create `src/content/annotator.ts`:

```typescript
import type { Annotation } from '../types';
import {
  identifyElement,
  getElementPath,
  getFullElementPath,
  getNearbyText,
  getElementClasses,
  getAccessibilityInfo,
  getNearbyElements,
  getDetailedComputedStyles,
  getForensicComputedStyles,
} from '../utils/element-identification';

export class Annotator {
  private annotations: Annotation[] = [];
  private onAnnotationsChange: (annotations: Annotation[]) => void;
  private annotationColor: string;

  constructor(
    annotations: Annotation[],
    annotationColor: string,
    onAnnotationsChange: (annotations: Annotation[]) => void
  ) {
    this.annotations = annotations;
    this.annotationColor = annotationColor;
    this.onAnnotationsChange = onAnnotationsChange;
  }

  public createAnnotation(element: Element, comment: string): Annotation {
    const rect = element.getBoundingClientRect();
    const x = (rect.left / window.innerWidth) * 100;
    const y = rect.top + window.scrollY;

    const annotation: Annotation = {
      id: `annotation-${Date.now()}-${Math.random()}`,
      x,
      y,
      comment,
      element: identifyElement(element),
      elementPath: getElementPath(element),
      timestamp: Date.now(),
      boundingBox: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      },
      cssClasses: getElementClasses(element),
      nearbyText: getNearbyText(element),
      nearbyElements: getNearbyElements(element),
      fullPath: getFullElementPath(element),
      accessibility: getAccessibilityInfo(element),
      computedStyles: getDetailedComputedStyles(element),
      isFixed: window.getComputedStyle(element).position === 'fixed',
    };

    this.annotations.push(annotation);
    this.onAnnotationsChange([...this.annotations]);
    this.renderMarker(annotation);

    return annotation;
  }

  public deleteAnnotation(id: string): void {
    this.annotations = this.annotations.filter(a => a.id !== id);
    this.onAnnotationsChange([...this.annotations]);
    this.removeMarker(id);
  }

  public clearAll(): void {
    this.annotations.forEach(a => this.removeMarker(a.id));
    this.annotations = [];
    this.onAnnotationsChange([...this.annotations]);
  }

  public updateColor(color: string): void {
    this.annotationColor = color;
    // Re-render all markers with new color
    this.annotations.forEach(a => {
      this.removeMarker(a.id);
      this.renderMarker(a);
    });
  }

  private renderMarker(annotation: Annotation): void {
    const marker = document.createElement('div');
    marker.className = 'agentation-marker';
    marker.dataset.annotationId = annotation.id;
    marker.style.left = `${annotation.x}%`;
    marker.style.top = `${annotation.y}px`;
    marker.style.backgroundColor = this.annotationColor;
    marker.style.position = annotation.isFixed ? 'fixed' : 'absolute';

    const index = this.annotations.findIndex(a => a.id === annotation.id) + 1;
    marker.innerHTML = `<span>${index}</span>`;

    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'marker-delete';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteAnnotation(annotation.id);
    });
    marker.appendChild(deleteBtn);

    document.body.appendChild(marker);
  }

  private removeMarker(id: string): void {
    const marker = document.querySelector(`[data-annotation-id="${id}"]`);
    marker?.remove();
  }

  public getAnnotations(): Annotation[] {
    return [...this.annotations];
  }
}
```

**Step 2: Integrate annotator into toolbar**

In `src/content/toolbar.ts`, add at the top after imports:

```typescript
import { Annotator } from './annotator';
```

Add to class properties:

```typescript
private annotator: Annotator | null = null;
private clickHandler: ((e: MouseEvent) => void) | null = null;
```

Update the `init` method to create annotator:

```typescript
private async init(): Promise<void> {
  // ... existing code ...

  this.annotations = await loadAnnotations(window.location.pathname);

  // Create annotator
  this.annotator = new Annotator(
    this.annotations,
    this.settings.annotationColor,
    (annotations) => {
      this.annotations = annotations;
      saveAnnotations(window.location.pathname, annotations);
      this.updateAnnotationCount();
    }
  );

  this.createToggleButton();
}
```

Update `activate` method to enable click mode:

```typescript
public activate(): void {
  this.isActive = true;
  if (this.toggleButton) {
    this.toggleButton.style.display = 'none';
  }
  this.createToolbar();
  this.enableClickMode();
}
```

Add new method `enableClickMode`:

```typescript
private enableClickMode(): void {
  if (this.clickHandler) {
    document.removeEventListener('click', this.clickHandler);
  }

  this.clickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Ignore clicks on toolbar and markers
    if (
      target.closest('.agentation-toolbar') ||
      target.closest('.agentation-marker') ||
      target.closest('#agent-feedback-host')
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (this.currentMode === 'click') {
      this.handleClickAnnotation(target);
    }
  };

  document.addEventListener('click', this.clickHandler, true);
}

private handleClickAnnotation(element: HTMLElement): void {
  const comment = prompt('Add your feedback:');
  if (!comment) return;

  this.annotator?.createAnnotation(element, comment);
}
```

Update `deactivate` to remove click handler:

```typescript
public deactivate(): void {
  this.isActive = false;
  if (this.toolbarElement) {
    this.toolbarElement.remove();
    this.toolbarElement = null;
  }
  if (this.toggleButton) {
    this.toggleButton.style.display = 'block';
  }

  if (this.clickHandler) {
    document.removeEventListener('click', this.clickHandler, true);
    this.clickHandler = null;
  }
}
```

Update `clearAll` method:

```typescript
private clearAll(): void {
  this.annotator?.clearAll();
  this.updateAnnotationCount();
}
```

Update `setAnnotationColor`:

```typescript
private setAnnotationColor(color: string): void {
  this.settings.annotationColor = color;
  saveSettings(this.settings);
  this.annotator?.updateColor(color);

  // Update button states
  this.toolbarElement?.querySelectorAll('.color-option').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.color === color);
  });
}
```

**Step 3: Add marker styles to toolbar.scss**

Add to `src/styles/toolbar.scss`:

```scss
.agentation-marker {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  z-index: 999999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: markerBounce 0.3s ease-out;

  &:hover .marker-delete {
    opacity: 1;
  }
}

.marker-delete {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff3b30;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    background: #d32f2f;
  }
}

@keyframes markerBounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
```

**Step 4: Commit**

```bash
git add src/content/annotator.ts src/content/toolbar.ts src/styles/toolbar.scss
git commit -m "feat: implement click annotation mode with markers"
```

---

## Task 12: Content Script Entry Point

**Files:**
- Create: `src/content/index.ts`

**Step 1: Create content script entry**

Create `src/content/index.ts`:

```typescript
import { ShadowDOMContainer } from './shadow-dom';
import { Toolbar } from './toolbar';
import { getExtensionState } from '../utils/storage';

let shadowContainer: ShadowDOMContainer | null = null;
let toolbar: Toolbar | null = null;

async function initialize() {
  // Create shadow DOM container
  shadowContainer = new ShadowDOMContainer();

  // Create toolbar
  toolbar = new Toolbar(shadowContainer.getContainer());

  // Check if extension should be active
  const isActive = await getExtensionState();
  if (isActive) {
    toolbar.activate();
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_EXTENSION') {
    if (message.active) {
      toolbar?.activate();
    } else {
      toolbar?.deactivate();
    }
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
```

**Step 2: Commit**

```bash
git add src/content/index.ts
git commit -m "feat: add content script entry point"
```

---

## Task 13: Build & Test Basic Extension

**Files:**
- Create: `icons/icon16.png` (placeholder)
- Create: `icons/icon48.png` (placeholder)
- Create: `icons/icon128.png` (placeholder)

**Step 1: Create placeholder icons**

For now, create simple placeholder PNG files or download icon images. You can use any simple icon for testing.

```bash
# Create icons directory in build
mkdir -p build/icons

# Copy manifest to build
cp manifest.json build/

# Placeholder - you'll need actual PNG files
# For testing, you can create simple colored squares or download icons
```

**Step 2: Build the extension**

```bash
npm run build
```

Expected output: Build should complete successfully, creating `build/content.js` and `build/background.js`

**Step 3: Test in Chrome**

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/` directory
5. Visit any website
6. Click the extension icon to activate
7. Click on page elements to create annotations

**Step 4: Verify basic functionality**

- Extension icon appears in toolbar
- Clicking icon shows toggle button on page
- Clicking toggle button shows toolbar
- Click mode allows creating annotations
- Markers appear on page
- Annotations can be deleted
- Copy button generates output

**Step 5: Commit**

```bash
git add icons/ build/
git commit -m "feat: add placeholder icons and test basic extension"
```

---

## Task 14: Text Selection Mode

**Files:**
- Modify: `src/content/toolbar.ts`
- Modify: `src/content/annotator.ts`

**Step 1: Add text selection to annotator**

In `src/content/annotator.ts`, add method:

```typescript
public createTextAnnotation(selectedText: string, range: Range, comment: string): Annotation {
  const rect = range.getBoundingClientRect();
  const x = (rect.left / window.innerWidth) * 100;
  const y = rect.top + window.scrollY;

  const annotation: Annotation = {
    id: `annotation-${Date.now()}-${Math.random()}`,
    x,
    y,
    comment,
    element: 'Text Selection',
    elementPath: getElementPath(range.startContainer.parentElement!),
    timestamp: Date.now(),
    selectedText,
    boundingBox: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    },
  };

  this.annotations.push(annotation);
  this.onAnnotationsChange([...this.annotations]);
  this.renderMarker(annotation);

  return annotation;
}
```

**Step 2: Add text selection handler to toolbar**

In `src/content/toolbar.ts`, add property:

```typescript
private selectionHandler: (() => void) | null = null;
```

Update `setMode` method:

```typescript
private setMode(mode: AnnotationMode): void {
  this.currentMode = mode;

  // Update button states
  this.toolbarElement?.querySelectorAll('.mode-button').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === mode);
  });

  // Enable/disable text selection mode
  if (mode === 'text') {
    this.enableTextSelectionMode();
  } else {
    this.disableTextSelectionMode();
  }
}

private enableTextSelectionMode(): void {
  if (this.selectionHandler) {
    document.removeEventListener('mouseup', this.selectionHandler);
  }

  this.selectionHandler = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const comment = prompt('Add your feedback about this text:');
    if (!comment) {
      selection.removeAllRanges();
      return;
    }

    const range = selection.getRangeAt(0);
    this.annotator?.createTextAnnotation(selectedText, range, comment);
    selection.removeAllRanges();
  };

  document.addEventListener('mouseup', this.selectionHandler);
}

private disableTextSelectionMode(): void {
  if (this.selectionHandler) {
    document.removeEventListener('mouseup', this.selectionHandler);
    this.selectionHandler = null;
  }
}
```

Update `deactivate`:

```typescript
public deactivate(): void {
  this.isActive = false;
  if (this.toolbarElement) {
    this.toolbarElement.remove();
    this.toolbarElement = null;
  }
  if (this.toggleButton) {
    this.toggleButton.style.display = 'block';
  }

  if (this.clickHandler) {
    document.removeEventListener('click', this.clickHandler, true);
    this.clickHandler = null;
  }

  if (this.selectionHandler) {
    document.removeEventListener('mouseup', this.selectionHandler);
    this.selectionHandler = null;
  }
}
```

**Step 3: Commit**

```bash
git add src/content/annotator.ts src/content/toolbar.ts
git commit -m "feat: implement text selection annotation mode"
```

---

## Task 15: Multi-Select Mode

**Files:**
- Modify: `src/content/toolbar.ts`
- Modify: `src/content/annotator.ts`

**Step 1: Add multi-select to annotator**

In `src/content/annotator.ts`, add method:

```typescript
public createMultiSelectAnnotation(elements: Element[], comment: string): Annotation {
  // Use first element for positioning and metadata
  const firstElement = elements[0];
  const rect = firstElement.getBoundingClientRect();
  const x = (rect.left / window.innerWidth) * 100;
  const y = rect.top + window.scrollY;

  const annotation: Annotation = {
    id: `annotation-${Date.now()}-${Math.random()}`,
    x,
    y,
    comment,
    element: `${elements.length} elements`,
    elementPath: getElementPath(firstElement),
    timestamp: Date.now(),
    boundingBox: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    },
    isMultiSelect: true,
    fullPath: getFullElementPath(firstElement),
  };

  this.annotations.push(annotation);
  this.onAnnotationsChange([...this.annotations]);
  this.renderMarker(annotation);

  return annotation;
}
```

**Step 2: Add multi-select mode to toolbar**

In `src/content/toolbar.ts`, add properties:

```typescript
private multiSelectOverlay: HTMLDivElement | null = null;
private multiSelectStart: { x: number; y: number } | null = null;
private multiSelectHandler: ((e: MouseEvent) => void) | null = null;
```

Update `setMode`:

```typescript
private setMode(mode: AnnotationMode): void {
  this.currentMode = mode;

  // Update button states
  this.toolbarElement?.querySelectorAll('.mode-button').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === mode);
  });

  // Disable other modes
  this.disableTextSelectionMode();
  this.disableMultiSelectMode();

  // Enable appropriate mode
  if (mode === 'text') {
    this.enableTextSelectionMode();
  } else if (mode === 'multiselect') {
    this.enableMultiSelectMode();
  }
}

private enableMultiSelectMode(): void {
  let isDrawing = false;

  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.agentation-toolbar') ||
      target.closest('#agent-feedback-host')
    ) {
      return;
    }

    isDrawing = true;
    this.multiSelectStart = { x: e.clientX, y: e.clientY };

    // Create overlay
    this.multiSelectOverlay = document.createElement('div');
    this.multiSelectOverlay.className = 'multiselect-overlay';
    this.multiSelectOverlay.style.left = `${e.clientX}px`;
    this.multiSelectOverlay.style.top = `${e.clientY}px`;
    document.body.appendChild(this.multiSelectOverlay);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || !this.multiSelectOverlay || !this.multiSelectStart) return;

    const width = Math.abs(e.clientX - this.multiSelectStart.x);
    const height = Math.abs(e.clientY - this.multiSelectStart.y);
    const left = Math.min(e.clientX, this.multiSelectStart.x);
    const top = Math.min(e.clientY, this.multiSelectStart.y);

    this.multiSelectOverlay.style.left = `${left}px`;
    this.multiSelectOverlay.style.top = `${top}px`;
    this.multiSelectOverlay.style.width = `${width}px`;
    this.multiSelectOverlay.style.height = `${height}px`;
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDrawing || !this.multiSelectOverlay || !this.multiSelectStart) return;

    isDrawing = false;

    // Find elements within selection
    const rect = this.multiSelectOverlay.getBoundingClientRect();
    const selectedElements = this.getElementsInRect(rect);

    this.multiSelectOverlay.remove();
    this.multiSelectOverlay = null;
    this.multiSelectStart = null;

    if (selectedElements.length > 0) {
      const comment = prompt(`Add feedback for ${selectedElements.length} elements:`);
      if (comment) {
        this.annotator?.createMultiSelectAnnotation(selectedElements, comment);
      }
    }
  };

  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  this.multiSelectHandler = () => {
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}

private disableMultiSelectMode(): void {
  if (this.multiSelectHandler) {
    this.multiSelectHandler();
    this.multiSelectHandler = null;
  }
  if (this.multiSelectOverlay) {
    this.multiSelectOverlay.remove();
    this.multiSelectOverlay = null;
  }
}

private getElementsInRect(rect: DOMRect): Element[] {
  const elements: Element[] = [];
  const allElements = document.querySelectorAll('body *');

  allElements.forEach(el => {
    if (el.closest('#agent-feedback-host')) return;

    const elRect = el.getBoundingClientRect();
    if (
      elRect.left >= rect.left &&
      elRect.right <= rect.right &&
      elRect.top >= rect.top &&
      elRect.bottom <= rect.bottom
    ) {
      elements.push(el);
    }
  });

  return elements;
}
```

**Step 3: Add multiselect overlay styles**

Add to `src/styles/toolbar.scss`:

```scss
.multiselect-overlay {
  position: fixed;
  border: 2px dashed #3c82f7;
  background: rgba(60, 130, 247, 0.1);
  pointer-events: none;
  z-index: 999998;
}
```

**Step 4: Update deactivate**

```typescript
public deactivate(): void {
  this.isActive = false;
  if (this.toolbarElement) {
    this.toolbarElement.remove();
    this.toolbarElement = null;
  }
  if (this.toggleButton) {
    this.toggleButton.style.display = 'block';
  }

  if (this.clickHandler) {
    document.removeEventListener('click', this.clickHandler, true);
    this.clickHandler = null;
  }

  this.disableTextSelectionMode();
  this.disableMultiSelectMode();
}
```

**Step 5: Commit**

```bash
git add src/content/toolbar.ts src/content/annotator.ts src/styles/toolbar.scss
git commit -m "feat: implement multi-select annotation mode"
```

---

## Task 16: Area Selection Mode

**Files:**
- Modify: `src/content/toolbar.ts`
- Modify: `src/content/annotator.ts`

**Step 1: Add area annotation to annotator**

In `src/content/annotator.ts`, add method:

```typescript
public createAreaAnnotation(rect: DOMRect, comment: string): Annotation {
  const x = (rect.left / window.innerWidth) * 100;
  const y = rect.top + window.scrollY;

  const annotation: Annotation = {
    id: `annotation-${Date.now()}-${Math.random()}`,
    x,
    y,
    comment,
    element: 'Area Selection',
    elementPath: 'area',
    timestamp: Date.now(),
    boundingBox: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    },
  };

  this.annotations.push(annotation);
  this.onAnnotationsChange([...this.annotations]);
  this.renderMarker(annotation);

  return annotation;
}
```

**Step 2: Add area mode to toolbar**

In `src/content/toolbar.ts`, add properties:

```typescript
private areaSelectOverlay: HTMLDivElement | null = null;
private areaSelectHandler: (() => void) | null = null;
```

Update `setMode`:

```typescript
private setMode(mode: AnnotationMode): void {
  this.currentMode = mode;

  // Update button states
  this.toolbarElement?.querySelectorAll('.mode-button').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === mode);
  });

  // Disable other modes
  this.disableTextSelectionMode();
  this.disableMultiSelectMode();
  this.disableAreaMode();

  // Enable appropriate mode
  if (mode === 'text') {
    this.enableTextSelectionMode();
  } else if (mode === 'multiselect') {
    this.enableMultiSelectMode();
  } else if (mode === 'area') {
    this.enableAreaMode();
  }
}

private enableAreaMode(): void {
  let isDrawing = false;
  let startPos: { x: number; y: number } | null = null;

  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.agentation-toolbar') ||
      target.closest('#agent-feedback-host')
    ) {
      return;
    }

    e.preventDefault();
    isDrawing = true;
    startPos = { x: e.clientX, y: e.clientY };

    this.areaSelectOverlay = document.createElement('div');
    this.areaSelectOverlay.className = 'area-select-overlay';
    this.areaSelectOverlay.style.left = `${e.clientX}px`;
    this.areaSelectOverlay.style.top = `${e.clientY}px`;
    document.body.appendChild(this.areaSelectOverlay);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || !this.areaSelectOverlay || !startPos) return;

    const width = Math.abs(e.clientX - startPos.x);
    const height = Math.abs(e.clientY - startPos.y);
    const left = Math.min(e.clientX, startPos.x);
    const top = Math.min(e.clientY, startPos.y);

    this.areaSelectOverlay.style.left = `${left}px`;
    this.areaSelectOverlay.style.top = `${top}px`;
    this.areaSelectOverlay.style.width = `${width}px`;
    this.areaSelectOverlay.style.height = `${height}px`;
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDrawing || !this.areaSelectOverlay) return;

    isDrawing = false;
    const rect = this.areaSelectOverlay.getBoundingClientRect();

    this.areaSelectOverlay.remove();
    this.areaSelectOverlay = null;

    const comment = prompt('Add feedback for this area:');
    if (comment) {
      this.annotator?.createAreaAnnotation(rect, comment);
    }
  };

  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  this.areaSelectHandler = () => {
    document.removeEventListener('mousedown', handleMouseDown, true);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}

private disableAreaMode(): void {
  if (this.areaSelectHandler) {
    this.areaSelectHandler();
    this.areaSelectHandler = null;
  }
  if (this.areaSelectOverlay) {
    this.areaSelectOverlay.remove();
    this.areaSelectOverlay = null;
  }
}
```

**Step 3: Add area overlay styles**

Add to `src/styles/toolbar.scss`:

```scss
.area-select-overlay {
  position: fixed;
  border: 3px dashed #FF9500;
  background: rgba(255, 149, 0, 0.1);
  pointer-events: none;
  z-index: 999998;
}
```

**Step 4: Update deactivate**

```typescript
public deactivate(): void {
  this.isActive = false;
  if (this.toolbarElement) {
    this.toolbarElement.remove();
    this.toolbarElement = null;
  }
  if (this.toggleButton) {
    this.toggleButton.style.display = 'block';
  }

  if (this.clickHandler) {
    document.removeEventListener('click', this.clickHandler, true);
    this.clickHandler = null;
  }

  this.disableTextSelectionMode();
  this.disableMultiSelectMode();
  this.disableAreaMode();
}
```

**Step 5: Commit**

```bash
git add src/content/toolbar.ts src/content/annotator.ts src/styles/toolbar.scss
git commit -m "feat: implement area selection annotation mode"
```

---

## Task 17: Polish & Final Testing

**Files:**
- Modify: `src/styles/toolbar.scss`
- Create: `README.md`

**Step 1: Add missing toolbar styles**

Verify `src/styles/toolbar.scss` has all necessary styles matching agentation's design. If anything is missing, add it.

**Step 2: Create README**

Create `README.md`:

```markdown
# AgentFeedback Browser Extension

A browser extension that lets you annotate any website and copy structured feedback optimized for AI coding agents.

## Features

- **Click to annotate** – Click any element to add feedback
- **Text selection** – Highlight and annotate specific text
- **Multi-select** – Drag to select multiple elements
- **Area selection** – Draw rectangles to annotate regions
- **4 output levels** – Compact, Standard, Detailed, Forensic
- **Customizable markers** – Choose from 7 colors
- **Auto-clear option** – Automatically clear after copying

## Installation

### Chrome

1. Download or clone this repository
2. Run `npm install && npm run build`
3. Open Chrome and go to `chrome://extensions`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the `build/` directory

### Firefox

1. Same build steps as Chrome
2. Go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `build/manifest.json`

## Usage

1. Click the extension icon to toggle on/off
2. Or use keyboard shortcut: `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac)
3. Select annotation mode (click, text, multi-select, or area)
4. Click elements or drag to annotate
5. Click "Copy" to copy structured feedback
6. Paste into your AI agent for precise, context-rich feedback

## Development

```bash
npm install          # Install dependencies
npm run build        # Build extension
npm run watch        # Watch mode for development
```

## Keyboard Shortcuts

- `Ctrl+Shift+A` / `Cmd+Shift+A` – Toggle extension

## Output Formats

**Compact** – Minimal one-liners
**Standard** – Element paths and feedback
**Detailed** – Adds CSS classes, positions, context
**Forensic** – Full DOM paths, computed styles, accessibility info, environment details

## License

MIT
```

**Step 3: Test all features**

Comprehensive testing checklist:

- [ ] Extension loads without errors
- [ ] Toggle button appears on all pages
- [ ] Click mode creates annotations
- [ ] Text mode highlights and annotates text
- [ ] Multi-select mode selects multiple elements
- [ ] Area mode draws rectangles
- [ ] All 4 output formats generate correctly
- [ ] Markers can be deleted
- [ ] Clear all removes all annotations
- [ ] Settings persist across page reloads
- [ ] Annotations persist per page
- [ ] Color changes work
- [ ] Auto-clear after copy works
- [ ] Keyboard shortcut works
- [ ] Extension icon click toggles toolbar

**Step 4: Build production version**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add README.md src/styles/toolbar.scss
git commit -m "feat: polish styles and add README"
```

---

## Task 18: Package for Distribution

**Files:**
- Create: `package.sh` (optional packaging script)

**Step 1: Create distribution package**

```bash
# Ensure clean build
npm run clean
npm run build

# Create zip for Chrome Web Store
cd build
zip -r ../agent-feedback-extension.zip .
cd ..
```

**Step 2: Verify package contents**

```bash
unzip -l agent-feedback-extension.zip
```

Should contain:
- manifest.json
- content.js
- background.js
- icons/

**Step 3: Final commit**

```bash
git add .
git commit -m "chore: prepare extension for distribution"
git tag v0.1.0
```

---

## Next Steps After Implementation

1. **Create proper icons** – Design 16px, 48px, 128px icons for the extension
2. **Add animation pause feature** – Like agentation npm package has
3. **Test on complex websites** – GitHub, Twitter, Gmail, etc.
4. **Add popup UI** – Quick settings access from extension icon
5. **Firefox compatibility** – Test and adjust manifest for Firefox
6. **Submit to Chrome Web Store** – Create developer account and publish
7. **Create demo video** – Show features for store listing

## Architecture Summary

```
agent-feedback-extension/
├── src/
│   ├── content/
│   │   ├── index.ts           # Entry point
│   │   ├── shadow-dom.ts      # Shadow DOM isolation
│   │   ├── toolbar.ts         # Main UI manager
│   │   └── annotator.ts       # Annotation logic
│   ├── background/
│   │   └── service-worker.ts  # Extension background
│   ├── utils/
│   │   ├── storage.ts         # Chrome storage wrapper
│   │   ├── element-identification.ts
│   │   └── output-generator.ts
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── styles/
│       └── toolbar.scss      # Copied from agentation
└── build/                    # Compiled extension
```

## Testing Checklist

- [ ] All 4 annotation modes work
- [ ] All 4 output formats generate correctly
- [ ] Settings persist
- [ ] Annotations persist per page
- [ ] No style conflicts on popular sites
- [ ] Extension icon toggles correctly
- [ ] Keyboard shortcut works
- [ ] Works on HTTP and HTTPS
- [ ] No console errors
- [ ] Shadow DOM isolates styles completely
