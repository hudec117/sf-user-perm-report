const USER_PERM_REPORT_PAGE = 'report-page.html';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.operation == 'open-report') {
        chrome.tabs.create({ url: chrome.runtime.getURL(USER_PERM_REPORT_PAGE) });
    }
});