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
