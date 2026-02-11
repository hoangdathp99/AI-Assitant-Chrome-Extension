// Background Service Worker for AI Chatbot Extension

console.log('AI Chatbot Extension - Background Service Worker loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed for the first time');
    
    // Set default settings
    chrome.storage.sync.set({
      chatbotEnabled: true
    });
    
    // Open welcome page or settings
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup/popup.html')
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'getApiKey') {
    // Content script requesting API key
    chrome.storage.sync.get(['geminiApiKey', 'chatbotEnabled'], (result) => {
      sendResponse({
        apiKey: result.geminiApiKey,
        enabled: result.chatbotEnabled !== false
      });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'logError') {
    // Log errors from content scripts
    console.error('Content script error:', request.error);
  }
  
  if (request.action === 'chatbotReady') {
    console.log('Chatbot initialized on tab:', sender.tab?.id);
  }
});

// Handle extension icon click (optional - already using popup)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
});

// Monitor storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Storage changed in', namespace);
  
  if (changes.geminiApiKey) {
    console.log('API key updated');
  }
  
  if (changes.chatbotEnabled) {
    console.log('Chatbot enabled status:', changes.chatbotEnabled.newValue);
  }
});
