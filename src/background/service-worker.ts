import { getExtensionState, setExtensionState } from '../utils/storage';

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  // Don't try to inject on chrome:// or other restricted pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  const currentState = await getExtensionState();
  const newState = !currentState;
  await setExtensionState(newState);

  // Send message to content script with error handling
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_EXTENSION', active: newState });
  } catch (error) {
    // Content script not loaded yet - this is fine, it will check state on load
    console.log('Content script not ready yet');
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-agentation') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id || !tab.url) return;

    // Don't try to inject on chrome:// or other restricted pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }

    const currentState = await getExtensionState();
    const newState = !currentState;
    await setExtensionState(newState);

    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_EXTENSION', active: newState });
    } catch (error) {
      // Content script not loaded yet - this is fine, it will check state on load
      console.log('Content script not ready yet');
    }
  }
});
