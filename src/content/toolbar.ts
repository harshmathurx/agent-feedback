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
