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
