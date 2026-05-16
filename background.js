chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.set({
    installDate: Date.now(),
    version: chrome.runtime.getManifest().version,
  });
});

chrome.downloads.onChanged.addListener((downloadDelta) => {
  if (downloadDelta.state && downloadDelta.state.current === "complete") {
    console.log("Download completed:", downloadDelta.id);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return true;
});
