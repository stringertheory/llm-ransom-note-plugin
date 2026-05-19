const DEFAULT_MODE = 'token-coherent';

function setIcon(on) {
  chrome.action.setIcon({ path: on ? 'icon.png' : 'icon-off.png' });
}

chrome.runtime.onInstalled.addListener(async () => {
  const cur = await chrome.storage.local.get({ on: false, mode: DEFAULT_MODE });
  await chrome.storage.local.set(cur);
  setIcon(cur.on);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.on) setIcon(!!changes.on.newValue);
});
