chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;

    const tabId = tab.id;
    chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_SCAN' }, () => {
        if (chrome.runtime.lastError) {
            console.log('Content script not ready. Attempting to inject...');
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            }).then(() => {
                chrome.scripting.insertCSS({
                    target: { tabId: tabId },
                    files: ['content.css']
                });
            }).then(() => {
                setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_SCAN' });
                }, 100);
            }).catch((err) => {
                console.error('Script injection failed:', err);
            });
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CAPTURE_AREA') {
        // Capture the visible tab in the window where the request came from
        chrome.tabs.captureVisibleTab(
            sender.tab?.windowId || chrome.windows.WINDOW_ID_CURRENT,
            { format: 'png' },
            (dataUrl) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    sendResponse({ error: chrome.runtime.lastError.message });
                } else {
                    sendResponse({ dataUrl });
                }
            }
        );
        return true; // Keep the message channel open for async response
    }
});
