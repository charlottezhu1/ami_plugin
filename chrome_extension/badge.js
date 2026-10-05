chrome.browserAction.setBadgeText({text: "ON"}); //tabId: twitterid here, text: "ON" whenever you can figure it out
chrome.browserAction.setBadgeBackgroundColor({color: '#4688F1'});

// Check for tabid and how to get it only for twitter so that we can see when the extension is active and when it isn't
// Test pageAction and browserAction to see which one works 
// The aim right now is that it should show ON only when twitter is working else it should nopt show any text onb the extension badge