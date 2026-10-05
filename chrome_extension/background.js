console.log("this is running?");

chrome.action.onClicked.addListener(widgetClick);

function widgetClick(tab) {
	console.log("widget clicked");
	// let msg = {
	// 	txt:"hello"
	// }
	// chrome.tabs.sendMessage(tab.id, msg);
	console.log(tab.url);
	// let tweet_url = {
	// 	txt:tab.url
	// }
	var tweet_url = tab.url
	chrome.tabs.sendMessage(tab.id, tweet_url+'&');

}

var SENTISTRENGTH_SERVER_URL = 'http://localhost:5050/analyze';

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (!message || message.type !== 'AMI_ANALYZE_SENTISTRENGTH') return false;

	fetch(SENTISTRENGTH_SERVER_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ texts: message.texts })
	})
		.then(function(res) {
			if (!res.ok) throw new Error('Server responded ' + res.status);
			return res.json();
		})
		.then(function(data) {
			sendResponse({ ok: true, results: data.results });
		})
		.catch(function(err) {
			sendResponse({ ok: false, error: String(err) });
		});

	return true; // keep the message channel open for the async fetch
});