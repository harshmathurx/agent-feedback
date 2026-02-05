import { getExtensionState, setExtensionState } from '../utils/storage';

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  const currentState = await getExtensionState();
  const newState = !currentState;
  await setExtensionState(newState);

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
