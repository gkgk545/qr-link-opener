chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;

    const tabId = tab.id;

    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
        await chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ['content.css']
        });
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_SCAN' });
        }, 100);
    } catch (err) {
        console.error('Script injection failed:', err);
    }
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
