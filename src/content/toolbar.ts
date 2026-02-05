import type { Annotation, ToolbarSettings, AnnotationMode } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { saveAnnotations, loadAnnotations, saveSettings, loadSettings } from '../utils/storage';
import { generateOutput } from '../utils/output-generator';
import { Annotator } from './annotator';

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

  // Annotator
  private annotator: Annotator | null = null;
  private clickHandler: ((e: MouseEvent) => void) | null = null;

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

    // Create toggle button
    this.createToggleButton();
  }

  private createToggleButton(): void {
    this.toggleButton = document.createElement('div');
    this.toggleButton.className = 'agentation-toggle-button';

    // Add inline styles as fallback
    Object.assign(this.toggleButton.style, {
      position: 'fixed',
      bottom: '1.25rem',
      right: '1.25rem',
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: '#1a1a1a',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: '100000',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease, background 0.2s ease'
    });

    this.toggleButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;

    this.toggleButton.addEventListener('click', () => this.toggle());
    this.toggleButton.addEventListener('mouseenter', () => {
      this.toggleButton!.style.background = '#2a2a2a';
      this.toggleButton!.style.transform = 'scale(1.05)';
    });
    this.toggleButton.addEventListener('mouseleave', () => {
      this.toggleButton!.style.background = '#1a1a1a';
      this.toggleButton!.style.transform = 'scale(1)';
    });

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
    this.enableClickMode();
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

    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
      this.clickHandler = null;
    }
  }

  private createToolbar(): void {
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = `agentation-toolbar ${this.isDarkMode ? 'dark' : 'light'}`;

    // Add inline styles to ensure visibility
    Object.assign(this.toolbarElement.style, {
      position: 'fixed',
      bottom: '1.25rem',
      right: '1.25rem',
      zIndex: '100000',
      background: this.isDarkMode ? '#1a1a1a' : '#ffffff',
      color: this.isDarkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.85)',
      borderRadius: '1.5rem',
      padding: '0.375rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: 'none'
    });

    this.toolbarElement.innerHTML = `
      <div class="toolbar-header" style="display: flex; align-items: center; gap: 0.375rem; width: 100%;">
        <div class="toolbar-logo" style="display: flex; align-items: center; justify-content: center; color: currentColor;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>

        <div class="toolbar-modes" style="display: flex; align-items: center; gap: 0.375rem;">
          <button class="mode-button active" data-mode="click" title="Click to annotate" style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: none; background: rgba(60, 130, 247, 0.25); color: #3c82f7;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2L2 12L12 22L22 12L12 2Z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="mode-button" data-mode="text" title="Select text" style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: none; background: transparent; color: rgba(255, 255, 255, 0.85);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 7V4H20V7" stroke="currentColor" stroke-width="2"/>
              <path d="M12 4V20" stroke="currentColor" stroke-width="2"/>
              <path d="M9 20H15" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="mode-button" data-mode="multiselect" title="Multi-select" style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: none; background: transparent; color: rgba(255, 255, 255, 0.85);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="8" height="8" stroke="currentColor" stroke-width="2"/>
              <rect x="13" y="13" width="8" height="8" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="mode-button" data-mode="area" title="Select area" style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: none; background: transparent; color: rgba(255, 255, 255, 0.85);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
            </svg>
          </button>
        </div>

        <div class="toolbar-actions" style="display: flex; align-items: center; gap: 0.375rem;">
          <button class="action-button" id="clear-btn" title="Clear all" style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: none; background: transparent; color: rgba(255, 255, 255, 0.85); transition: background-color 0.15s ease, color 0.15s ease, transform 0.1s ease;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4h8v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="action-button" id="copy-btn" title="Copy feedback" style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: none; background: transparent; color: rgba(255, 255, 255, 0.85); transition: background-color 0.15s ease, color 0.15s ease, transform 0.1s ease;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" stroke="currentColor" stroke-width="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="action-button" id="settings-btn" title="Settings" style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: none; background: transparent; color: rgba(255, 255, 255, 0.85); transition: background-color 0.15s ease, color 0.15s ease, transform 0.1s ease;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="action-button" id="close-btn" title="Close" style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: none; background: transparent; color: rgba(255, 255, 255, 0.85); transition: background-color 0.15s ease, color 0.15s ease, transform 0.1s ease;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <div class="annotation-count" style="position: absolute; top: -16px; right: -16px; user-select: none; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #3c82f7; color: white; font-size: 0.625rem; font-weight: 600; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
          <span style="color: white; font-size: 0.625rem; font-weight: 600;">${this.annotations.length}</span>
        </div>
      </div>

      <div class="settings-panel" style="display: ${this.showSettings ? 'block' : 'none'}; position: absolute; right: 5px; bottom: calc(100% + 0.5rem); z-index: 1; background: white; border-radius: 1rem; padding: 13px 1rem 16px; min-width: 205px; box-shadow: 0 1px 8px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);">
        <div class="settings-section" style="margin-top: 0;">
          <label style="font-size: 0.8125rem; font-weight: 400; letter-spacing: -0.0094em; color: rgba(0, 0, 0, 0.5); display: block; margin-bottom: 0.5rem;">Output Detail</label>
          <div class="output-detail-selector" style="display: flex; gap: 0.25rem;">
            <button class="detail-option ${this.settings.outputDetail === 'compact' ? 'active' : ''}" data-level="compact" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 0.375rem 0.5rem; border: none; border-radius: 0.375rem; background: ${this.settings.outputDetail === 'compact' ? 'rgba(60, 130, 247, 0.15)' : 'transparent'}; font-size: 0.6875rem; font-weight: 500; color: ${this.settings.outputDetail === 'compact' ? '#3c82f7' : 'rgba(0, 0, 0, 0.7)'}; cursor: pointer; transition: background-color 0.15s ease, color 0.15s ease;">Compact</button>
            <button class="detail-option ${this.settings.outputDetail === 'standard' ? 'active' : ''}" data-level="standard" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 0.375rem 0.5rem; border: none; border-radius: 0.375rem; background: ${this.settings.outputDetail === 'standard' ? 'rgba(60, 130, 247, 0.15)' : 'transparent'}; font-size: 0.6875rem; font-weight: 500; color: ${this.settings.outputDetail === 'standard' ? '#3c82f7' : 'rgba(0, 0, 0, 0.7)'}; cursor: pointer; transition: background-color 0.15s ease, color 0.15s ease;">Standard</button>
            <button class="detail-option ${this.settings.outputDetail === 'detailed' ? 'active' : ''}" data-level="detailed" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 0.375rem 0.5rem; border: none; border-radius: 0.375rem; background: ${this.settings.outputDetail === 'detailed' ? 'rgba(60, 130, 247, 0.15)' : 'transparent'}; font-size: 0.6875rem; font-weight: 500; color: ${this.settings.outputDetail === 'detailed' ? '#3c82f7' : 'rgba(0, 0, 0, 0.7)'}; cursor: pointer; transition: background-color 0.15s ease, color 0.15s ease;">Detailed</button>
            <button class="detail-option ${this.settings.outputDetail === 'forensic' ? 'active' : ''}" data-level="forensic" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 0.375rem 0.5rem; border: none; border-radius: 0.375rem; background: ${this.settings.outputDetail === 'forensic' ? 'rgba(60, 130, 247, 0.15)' : 'transparent'}; font-size: 0.6875rem; font-weight: 500; color: ${this.settings.outputDetail === 'forensic' ? '#3c82f7' : 'rgba(0, 0, 0, 0.7)'}; cursor: pointer; transition: background-color 0.15s ease, color 0.15s ease;">Forensic</button>
          </div>
        </div>

        <div class="settings-section" style="margin-top: 0.5rem; padding-top: calc(0.5rem + 2px); border-top: 1px solid rgba(0, 0, 0, 0.08);">
          <label style="font-size: 0.8125rem; font-weight: 400; letter-spacing: -0.0094em; color: rgba(0, 0, 0, 0.5); display: block; margin-bottom: 10px;">Marker Color</label>
          <div class="color-options" style="display: flex; gap: 0.5rem; margin-top: 0.375rem; margin-bottom: 1px;">
            ${this.renderColorOptions()}
          </div>
        </div>

        <div class="settings-section" style="margin-top: 0.5rem; padding-top: calc(0.5rem + 2px); border-top: 1px solid rgba(0, 0, 0, 0.08);">
          <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" id="auto-clear-checkbox" ${this.settings.autoClearAfterCopy ? 'checked' : ''} style="position: absolute; opacity: 0; width: 0; height: 0;">
            <div style="position: relative; width: 14px; height: 14px; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 4px; background: ${this.settings.autoClearAfterCopy ? '#1a1a1a' : '#fff'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${this.settings.autoClearAfterCopy ? '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
            </div>
            <span style="font-size: 0.8125rem; font-weight: 400; color: rgba(0, 0, 0, 0.5); letter-spacing: -0.0094em;">Auto-clear after copy</span>
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
          style="display: block; width: 20px; height: 20px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; background-color: ${color.value}; transform: ${this.settings.annotationColor === color.value ? 'scale(0.83)' : 'scale(1)'}; transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);"
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
    this.annotator?.updateColor(color);

    // Update button states
    this.toolbarElement?.querySelectorAll('.color-option').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.color === color);
    });
  }

  private clearAll(): void {
    this.annotator?.clearAll();
    this.updateAnnotationCount();
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

  public destroy(): void {
    if (this.toggleButton) {
      this.toggleButton.remove();
    }
    if (this.toolbarElement) {
      this.toolbarElement.remove();
    }
  }
}
