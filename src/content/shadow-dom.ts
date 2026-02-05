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
