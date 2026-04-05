/**
 * Background Service Worker
 * Handles download requests from content scripts.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download") {
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: false
    }, (id) => {
      if (chrome.runtime.lastError) {
        console.error("Download Error:", chrome.runtime.lastError.message);
      }
    });
  }
});
