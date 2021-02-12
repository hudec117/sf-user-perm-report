const USER_PERM_REPORT_PAGE = 'public/report-page.html';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.operation == 'open-report') {
        // Get server host
        const serverUrl = new URL(sender.url);
        const serverHost = serverUrl.hostname;

        // Get user record ID from URL
        const path = serverUrl.pathname.substring(1);
        const userId = /[a-zA-Z0-9]{18}|[a-zA-Z0-9]{15}/.exec(path);
        if (userId === null) {
            // TODO: handle if ID not found
        }

        // Construct report page URL with server host
        let reportUrl = chrome.runtime.getURL(USER_PERM_REPORT_PAGE);
        reportUrl += `?host=${serverHost}&user=${userId}`;

        chrome.tabs.create({ url: reportUrl });
    } else if (request.operation == 'get-session') {
        const serverUrl = `https://${request.host}`;

        // TODO: error handling
        chrome.cookies.get({ name: 'sid', url: serverUrl }, function (cookie) {
            const sessionId = cookie.value;

            sendResponse({ id: sessionId });
        });
    }

    return true;
});