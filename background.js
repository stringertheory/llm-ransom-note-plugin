let on = false;

chrome.runtime.onInstalled.addListener(() => {
  on = false;
  chrome.action.setIcon({ path: 'icon-off.png' });
});

chrome.action.onClicked.addListener(async (tab) => {
  on = !on;
  await chrome.action.setIcon({ path: on ? 'icon.png' : 'icon-off.png' });
  try {
    await chrome.tabs.sendMessage(tab.id, { ransomy: on });
  } catch {
    // No content script in this tab (host doesn't match).
  }
});
