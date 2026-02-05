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
      overflow: visible !important;
    }

    .agentation-marker:hover .marker-delete {
      opacity: 1;
    }

    .agentation-marker:hover .marker-tooltip {
      opacity: 1 !important;
      visibility: visible !important;
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

    .marker-tooltip {
      position: absolute !important;
      bottom: calc(100% + 10px) !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: #1a1a1a !important;
      color: white !important;
      padding: 8px 12px !important;
      border-radius: 8px !important;
      font-size: 13px !important;
      font-weight: 400 !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      white-space: nowrap !important;
      max-width: 200px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transition: opacity 0.2s, visibility 0.2s !important;
      pointer-events: none !important;
      z-index: 1000000 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      display: block !important;
    }

    .marker-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #1a1a1a;
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
