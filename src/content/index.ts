import { ShadowDOMContainer } from './shadow-dom';
import { Toolbar } from './toolbar';
import { getExtensionState } from '../utils/storage';

let shadowContainer: ShadowDOMContainer | null = null;
let toolbar: Toolbar | null = null;

function injectMarkerStyles() {
  const style = document.createElement('style');
  style.id = 'agentation-marker-styles';
  style.textContent = `
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
    }

    .agentation-marker:hover .marker-delete {
      opacity: 1;
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
    }

    .marker-delete:hover {
      background: #d32f2f;
    }

    @keyframes markerBounce {
      0% { transform: scale(0); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

async function initialize() {
  // Inject global marker styles
  injectMarkerStyles();

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
