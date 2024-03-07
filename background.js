let on;

chrome.runtime.onInstalled.addListener(() => {
  on = false;
  chrome.action.setIcon({path: "icon-off.png"});
});

chrome.action.onClicked.addListener(async (tab) => {

  // toggle
  on = on ? false : true;

  const method = on ? 'insertCSS' : 'removeCSS'
  const iconPath = on ? 'icon.png' : 'icon-off.png'
  
  await chrome.scripting[method]({
    files: ['style.css'],
    target: { tabId: tab.id }
  });
  await chrome.action.setIcon({path: iconPath});
  await chrome.tabs.sendMessage(tab.id, {font: "Comic Sans MS"});
  
});
