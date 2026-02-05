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
